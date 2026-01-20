from typing import List

import uvicorn
from database import get_db, init_db
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile
from gemini_service import analyze_pet_image
from fastapi.middleware.cors import CORSMiddleware
from models import Pet, Plan, User
from schemas import (PetCreate, PetResponse, PetUpdate, PlanCreate,
                     PlanResponse, PlanUpdate, UserCreate, UserFull,
                     UserResponse, UserLogin)
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


@app.get("/")
def root():
    return {"message": "Welcome to Pawcation API 🐾"}


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
