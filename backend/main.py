import os
from datetime import date
from typing import List

import requests
import uvicorn
from database import get_db, init_db
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from gemini_service import (analyze_pet_image, generate_road_trip_itinerary,
                            generate_travel_itinerary)
from models import MemoryPhoto, Pet, Plan, User
from schemas import (ItineraryGenerateRequest, ItineraryResponse,
                     MemoryPhotoCreate, MemoryPhotoResponse, PastTripResponse,
                     PetCreate, PetResponse, PetUpdate, PlanCreate,
                     PlanResponse, PlanSaveRequest, PlanUpdate,
                     RoadTripGenerateRequest, UserCreate, UserFull, UserLogin,
                     UserResponse, UserUpdate, VisitedCityResponse)
from sqlalchemy.orm import Session

app = FastAPI(title="Pawcation API", version="1.0.0")

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()


def calculate_pet_age(date_of_birth: date) -> str:
    """Calculate pet age from date of birth and return as string"""
    if not date_of_birth:
        return "unknown age"
    
    today = date.today()
    age_years = today.year - date_of_birth.year
    
    # Adjust if birthday hasn't occurred yet this year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age_years -= 1
    
    if age_years < 1:
        age_months = (today.year - date_of_birth.year) * 12 + today.month - date_of_birth.month
        if age_months < 1:
            return "puppy/kitten"
        return f"{age_months} months old"
    elif age_years == 1:
        return "1 year old"
    else:
        return f"{age_years} years old"


@app.get("/")
def root():
    return {"message": "Welcome to Pawcation API 🐾"}


@app.get("/api/places/autocomplete")
def places_autocomplete(input: str):
    """
    Proxy endpoint for Google Places Autocomplete API to avoid CORS issues.
    Returns city suggestions based on user input.
    """
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyByLgNG16tQrEhJXBf30S6GlQ6OfZ66PT4")
    
    if not input or len(input) < 2:
        return {"predictions": []}
    
    # Fallback suggestions for common cities (when API fails)
    fallback_cities = [
        "San Francisco, CA", "Los Angeles, CA", "San Diego, CA", "Sacramento, CA",
        "New York, NY", "Boston, MA", "Chicago, IL", "Seattle, WA",
        "Portland, OR", "Austin, TX", "Dallas, TX", "Houston, TX",
        "Miami, FL", "Orlando, FL", "Las Vegas, NV", "Phoenix, AZ",
        "Denver, CO", "Atlanta, GA", "Nashville, TN", "New Orleans, LA"
    ]
    
    try:
        # Use Geocoding API to get city suggestions
        url = f"https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": input,
            "components": "country:US",
            "key": GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        print(f"Google API Status: {data.get('status')} for input '{input}'")
        
        if data.get("status") == "OK" and data.get("results"):
            # Extract city and state from results
            predictions = []
            seen = set()  # Avoid duplicates
            
            for result in data["results"][:5]:  # Limit to 5 results
                formatted_address = result.get("formatted_address", "")
                place_id = result.get("place_id", "")
                
                # Extract city, state from address components
                city = None
                state = None
                for component in result.get("address_components", []):
                    if "locality" in component.get("types", []):
                        city = component.get("long_name")
                    if "administrative_area_level_1" in component.get("types", []):
                        state = component.get("short_name")
                
                # Create clean "City, State" format
                if city and state:
                    description = f"{city}, {state}"
                    if description not in seen:
                        predictions.append({
                            "place_id": place_id,
                            "description": description,
                            "full_address": formatted_address
                        })
                        seen.add(description)
            
            if predictions:
                print(f"Returning {len(predictions)} predictions from Google API")
                return {"predictions": predictions}
        
        # Fallback to hardcoded suggestions if API fails
        print(f"Using fallback suggestions for '{input}'")
        input_lower = input.lower()
        filtered = [
            {"place_id": f"fallback-{i}", "description": city, "full_address": city}
            for i, city in enumerate(fallback_cities)
            if input_lower in city.lower()
        ][:5]
        
        return {"predictions": filtered}
    
    except Exception as e:
        print(f"Error in places autocomplete: {e}")
        # Return filtered fallback suggestions
        input_lower = input.lower()
        filtered = [
            {"place_id": f"fallback-{i}", "description": city, "full_address": city}
            for i, city in enumerate(fallback_cities)
            if input_lower in city.lower()
        ][:5]
        return {"predictions": filtered}


# ========== USER ENDPOINTS ==========

@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In production, hash the password!
    db_user = User(email=user.email, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/users/{user_id}", response_model=UserFull)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user with all their pets and plans"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/users", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if user_update.name is not None:
        user.name = user_update.name
    if user_update.avatar_url is not None:
        user.avatar_url = user_update.avatar_url
    if user_update.password is not None:
        # In production, hash the password!
        user.password = user_update.password
    
    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return None


@app.post("/api/users/login", response_model=UserResponse)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user with email and password"""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # In production, use proper password hashing!
    if user.password != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return user


# ========== PET ENDPOINTS ==========

@app.post("/api/pets", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
def create_pet(pet: PetCreate, db: Session = Depends(get_db)):
    """Create a new pet"""
    # Verify user exists
    user = db.query(User).filter(User.user_id == pet.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_pet = Pet(**pet.dict())
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return db_pet


@app.get("/api/pets/{pet_id}", response_model=PetResponse)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    """Get a specific pet"""
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@app.get("/api/users/{user_id}/pets", response_model=List[PetResponse])
def get_user_pets(user_id: int, db: Session = Depends(get_db)):
    """Get all pets for a user"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    pets = db.query(Pet).filter(Pet.user_id == user_id).all()
    return pets


@app.put("/api/pets/{pet_id}", response_model=PetResponse)
def update_pet(pet_id: int, pet_update: PetUpdate, db: Session = Depends(get_db)):
    """Update a pet"""
    db_pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not db_pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Update only provided fields
    update_data = pet_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_pet, field, value)
    
    db.commit()
    db.refresh(db_pet)
    return db_pet


@app.delete("/api/pets/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    """Delete a pet"""
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    db.delete(pet)
    db.commit()
    return None


@app.post("/api/pets/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze a pet image and return structured data"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    image_bytes = await file.read()
    mime = file.content_type or "image/jpeg"
    try:
        analysis_result = analyze_pet_image(image_bytes, mime)
        if "error" in analysis_result:
            raise HTTPException(status_code=500, detail=analysis_result["error"])
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during image analysis: {str(e)}")


# ========== PLAN ENDPOINTS ==========

@app.post("/api/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db)):
    """Create a new travel plan"""
    # Verify user exists
    user = db.query(User).filter(User.user_id == plan.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_plan = Plan(**plan.dict())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.get("/api/plans/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get a specific plan"""
    plan = db.query(Plan).filter(Plan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@app.get("/api/users/{user_id}/plans", response_model=List[PlanResponse])
def get_user_plans(user_id: int, db: Session = Depends(get_db)):
    """Get all plans for a user"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    plans = db.query(Plan).filter(Plan.user_id == user_id).all()
    return plans


@app.put("/api/plans/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, plan_update: PlanUpdate, db: Session = Depends(get_db)):
    """Update a plan"""
    db_plan = db.query(Plan).filter(Plan.plan_id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Update only provided fields
    update_data = plan_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plan, field, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.delete("/api/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a plan"""
    plan = db.query(Plan).filter(Plan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return None


@app.post("/api/plans/generate-itinerary", response_model=ItineraryResponse)
def generate_itinerary(request: ItineraryGenerateRequest, db: Session = Depends(get_db)):
    """Generate a pet-friendly travel itinerary using Gemini AI"""
    # Get pet information from database
    pet = db.query(Pet).filter(Pet.pet_id == request.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Prepare pet info for Gemini
    pet_info = {
        "name": pet.name,
        "breed": pet.breed,
        "age": calculate_pet_age(pet.date_of_birth),
        "size": pet.size,
        "personality": pet.personality or [],
        "health": pet.health,
    }
    
    # Generate itinerary using Gemini
    result = generate_travel_itinerary(
        origin=request.origin,
        destination=request.destination,
        start_date=request.start_date,
        end_date=request.end_date,
        pet_info=pet_info,
        num_adults=request.num_adults,
        num_children=request.num_children,
        budget=request.budget,
    )
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result


@app.post("/api/plans/generate-road-trip-itinerary", response_model=ItineraryResponse)
def generate_road_trip(request: RoadTripGenerateRequest, db: Session = Depends(get_db)):
    """Generate a pet-friendly road trip itinerary using Gemini AI"""
    # Get pet information from database
    pet = db.query(Pet).filter(Pet.pet_id == request.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Prepare pet info for Gemini
    pet_info = {
        "name": pet.name,
        "breed": pet.breed,
        "age": calculate_pet_age(pet.date_of_birth),
        "size": pet.size,
        "personality": pet.personality or [],
        "health": pet.health,
    }
    
    # Generate road trip itinerary using Gemini
    result = generate_road_trip_itinerary(
        origin=request.origin,
        destination=request.destination,
        start_date=request.start_date,
        end_date=request.end_date,
        pet_info=pet_info,
        num_adults=request.num_adults,
        num_children=request.num_children,
        is_round_trip=request.is_round_trip,
        budget=request.budget,
    )
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result


@app.post("/api/plans/save", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def save_plan(plan: PlanSaveRequest, db: Session = Depends(get_db)):
    """Save a generated itinerary as a plan"""
    # Verify user exists
    user = db.query(User).filter(User.user_id == plan.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create plan from request
    db_plan = Plan(
        user_id=plan.user_id,
        origin=plan.origin,
        destination=plan.destination,
        start_date=plan.start_date,
        end_date=plan.end_date,
        pet_ids=plan.pet_ids,
        num_adults=plan.num_adults,
        num_children=plan.num_children,
        trip_type=plan.trip_type,
        is_round_trip=1 if plan.is_round_trip else 0,
        detailed_itinerary=plan.detailed_itinerary,
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


# ========== MEMORY ENDPOINTS ==========

@app.get("/api/memories/past-trips/{user_id}", response_model=List[PastTripResponse])
def get_past_trips(user_id: int, db: Session = Depends(get_db)):
    """Get all past trips for a user (trips with end_date < today)"""
    import json
    from datetime import date
    
    today = date.today()
    
    # Get all plans where end_date < today
    plans = db.query(Plan).filter(
        Plan.user_id == user_id,
        Plan.end_date < today
    ).order_by(Plan.end_date.desc()).all()
    
    result = []
    for plan in plans:
        # Get photos for this trip
        photos = db.query(MemoryPhoto).filter(MemoryPhoto.trip_id == plan.plan_id).all()
        
        # Get cover photo (first photo)
        cover_photo = photos[0].local_path if photos else None
        
        # Get visited cities from itinerary or places_passing_by
        visited_cities = []
        if plan.detailed_itinerary:
            try:
                itinerary = json.loads(plan.detailed_itinerary)
                # Extract cities from itinerary
                if plan.destination:
                    visited_cities.append(plan.destination)
            except:
                pass
        
        if plan.places_passing_by and plan.trip_type == "Road Trip":
            try:
                cities = json.loads(plan.places_passing_by) if plan.places_passing_by.startswith('[') else [c.strip() for c in plan.places_passing_by.split(',')]
                visited_cities.extend(cities)
            except:
                if plan.places_passing_by:
                    visited_cities.extend([c.strip() for c in plan.places_passing_by.split(',')])
        
        # Remove duplicates while preserving order
        visited_cities = list(dict.fromkeys(visited_cities))
        
        past_trip = PastTripResponse(
            plan_id=plan.plan_id,
            user_id=plan.user_id,
            start_date=plan.start_date,
            end_date=plan.end_date,
            trip_type=plan.trip_type,
            is_round_trip=bool(plan.is_round_trip),
            destination=plan.destination,
            places_passing_by=plan.places_passing_by,
            detailed_itinerary=plan.detailed_itinerary,
            num_humans=plan.num_humans,
            num_adults=plan.num_adults,
            num_children=plan.num_children,
            budget=plan.budget,
            origin=plan.origin,
            pet_ids=plan.pet_ids,
            cover_photo=cover_photo,
            photo_count=len(photos),
            visited_cities=visited_cities
        )
        result.append(past_trip)
    
    return result


@app.get("/api/memories/photos/{trip_id}", response_model=List[MemoryPhotoResponse])
def get_trip_photos(trip_id: int, city_name: str = None, db: Session = Depends(get_db)):
    """Get all photos for a specific trip, optionally filtered by city"""
    query = db.query(MemoryPhoto).filter(MemoryPhoto.trip_id == trip_id)
    
    if city_name:
        query = query.filter(MemoryPhoto.city_name == city_name)
    
    photos = query.order_by(MemoryPhoto.created_at.desc()).all()
    
    # Convert to response format
    return [
        MemoryPhotoResponse(
            photo_id=p.photo_id,
            trip_id=p.trip_id,
            user_id=p.user_id,
            local_path=p.local_path,
            city_name=p.city_name,
            created_at=p.created_at.isoformat()
        ) for p in photos
    ]


@app.post("/api/memories/photos", response_model=MemoryPhotoResponse, status_code=status.HTTP_201_CREATED)
def add_memory_photo(photo: MemoryPhotoCreate, db: Session = Depends(get_db)):
    """Add a new photo to a trip"""
    # Verify trip exists
    trip = db.query(Plan).filter(Plan.plan_id == photo.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Create photo record
    db_photo = MemoryPhoto(
        trip_id=photo.trip_id,
        user_id=photo.user_id,
        local_path=photo.local_path,
        city_name=photo.city_name
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    
    return MemoryPhotoResponse(
        photo_id=db_photo.photo_id,
        trip_id=db_photo.trip_id,
        user_id=db_photo.user_id,
        local_path=db_photo.local_path,
        city_name=db_photo.city_name,
        created_at=db_photo.created_at.isoformat()
    )


@app.delete("/api/memories/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_photo(photo_id: int, db: Session = Depends(get_db)):
    """Delete a memory photo"""
    photo = db.query(MemoryPhoto).filter(MemoryPhoto.photo_id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    db.delete(photo)
    db.commit()
    return None


@app.get("/api/memories/visited-cities/{user_id}", response_model=List[VisitedCityResponse])
def get_visited_cities(user_id: int, db: Session = Depends(get_db)):
    """Get all visited cities with aggregated trip information for map display"""
    import json
    from datetime import date
    
    today = date.today()
    
    # Get all past trips
    plans = db.query(Plan).filter(
        Plan.user_id == user_id,
        Plan.end_date < today
    ).all()
    
    # Aggregate cities across all trips
    city_trips = {}  # {city_name: [trip_ids]}
    trip_colors = {}  # {trip_id: color}
    
    # Generate colors for trips
    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"]
    
    for idx, plan in enumerate(plans):
        trip_colors[plan.plan_id] = colors[idx % len(colors)]
        
        # Extract cities
        cities = []
        if plan.trip_type == "Direct Trip" or plan.trip_type == "Direct Flight":
            if plan.destination:
                cities = [plan.destination]
        elif plan.trip_type == "Road Trip":
            if plan.places_passing_by:
                try:
                    cities = json.loads(plan.places_passing_by) if plan.places_passing_by.startswith('[') else [c.strip() for c in plan.places_passing_by.split(',')]
                except:
                    cities = [c.strip() for c in plan.places_passing_by.split(',')]
        
        # Add cities to aggregation
        for city in cities:
            if city not in city_trips:
                city_trips[city] = []
            city_trips[city].append(plan.plan_id)
    
    # Build response
    result = []
    for city_name, trip_ids in city_trips.items():
        # Count photos for this city across all trips
        photo_count = db.query(MemoryPhoto).filter(
            MemoryPhoto.city_name == city_name,
            MemoryPhoto.trip_id.in_(trip_ids)
        ).count()
        
        # Use color of the first trip for this city
        trip_color = trip_colors.get(trip_ids[0], "#4ECDC4")
        
        result.append(VisitedCityResponse(
            city_name=city_name,
            trip_ids=trip_ids,
            photo_count=photo_count,
            trip_color=trip_color
        ))
    
    return result


@app.delete("/api/memories/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_past_trip(trip_id: int, db: Session = Depends(get_db)):
    """Delete a past trip and all its associated photos"""
    trip = db.query(Plan).filter(Plan.plan_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Delete all photos for this trip
    db.query(MemoryPhoto).filter(MemoryPhoto.trip_id == trip_id).delete()
    
    # Delete the trip
    db.delete(trip)
    db.commit()
    return None


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
