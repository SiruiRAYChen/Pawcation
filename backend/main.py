import io
import os

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
    age: str
    weight: str
    breed: str
    vaccination_status: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Pawcation API"}

@app.post("/api/analyze-pet-image")
async def analyze_pet_image(file: UploadFile = File(...)):
    if not GEMINI_API_KEY:
        return {"breed": "Mock Breed (No API Key)"}

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = "Identify the dog breed in this picture. Return ONLY the breed name. If it's mixed, say 'Mixed Breed' or the dominant breeds."
        
        response = model.generate_content([prompt, image])
        return {"breed": response.text.strip()}
    except Exception as e:
        print(f"Error analyzing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
