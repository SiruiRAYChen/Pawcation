import io
import json
import os
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class TripRequest(BaseModel):
    destination: str
    pet_details: str

class SignupRequest(BaseModel):
    name: str
    breed: str
    age: str
    weight: str
    rabies_vaccinated: bool
    separation_anxiety_level: str
    flight_comfort_level: str
    daily_exercise_need: str
    environment_preference: str
    personality_archetype: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Pawcation API"}

@app.post("/api/analyze-pet-image")
async def analyze_pet_image(file: UploadFile = File(...)):
    if not GEMINI_API_KEY:
        return {
            "breed": "Mock Breed",
            "age": "2 years",
            "weight": "15 kg",
            "daily_exercise_need": "Medium",
            "environment_preference": "House with Yard",
            "personality_archetype": "The Companion",
            "flight_comfort_level": "Medium",
            "separation_anxiety_level": "Low"
        }

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = """
        Analyze this image of a dog and provide a JSON response with the following estimated details based on visual cues and breed characteristics:
        {
            "breed": "identified breed or mixed",
            "age": "estimated age range (e.g. '2 years')",
            "weight": "estimated weight (e.g. '25 kg')",
            "daily_exercise_need": "Low/Medium/High",
            "environment_preference": "Apartment/House with Yard/Farm",
            "personality_archetype": "e.g. The Guardian, The Jester, The Athlete, The Couch Potato",
            "flight_comfort_level": "Low/Medium/High (guess based on size/temperament)",
            "separation_anxiety_level": "Low/Medium/High (guess based on breed)"
        }
        Return ONLY the JSON string, no markdown formatting.
        """
        
        response = model.generate_content([prompt, image])
        text_response = response.text.strip()
        
        # Clean up potential markdown code blocks
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        return json.loads(text_response)
    except Exception as e:
        print(f"Error analyzing image: {e}")
        # Return a fallback structure if parsing fails
        return {
            "breed": "Unknown",
            "age": "",
            "weight": "",
            "daily_exercise_need": "Medium",
            "environment_preference": "House with Yard",
            "personality_archetype": "Unknown",
            "flight_comfort_level": "Medium",
            "separation_anxiety_level": "Medium"
        }

@app.post("/api/signup")
async def signup(profile: SignupRequest):
    # In a real app, save to database
    return {"message": "Profile created successfully", "profile": profile}

@app.post("/api/plan-trip")
async def plan_trip(request: TripRequest):
    if not GEMINI_API_KEY:
        # Mock response if no API key is provided
        return {
            "plan": f"Mock Itinerary for {request.destination} with a {request.pet_details}:\n\n"
                    "1. Morning: Walk in the park.\n"
                    "2. Afternoon: Visit pet-friendly cafe.\n"
                    "3. Evening: Relax at the hotel."
        }

    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""
        Plan a 1-day trip to {request.destination} for a traveler with a pet.
        Pet details: {request.pet_details}.
        Include pet-friendly activities, restaurants, and tips.
        Keep it concise.
        """
        response = model.generate_content(prompt)
        return {"plan": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
