import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

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

@app.get("/")
def read_root():
    return {"message": "Welcome to Pawcation API"}

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
