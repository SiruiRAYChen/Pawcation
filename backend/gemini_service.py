
import base64
import json
import os

import requests
from dotenv import load_dotenv

# Load .env from project root - handle both running from root and from backend/
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
env_path = os.path.join(project_root, ".env")
load_dotenv(env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
# Using the correct model name from your example
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"

def analyze_pet_image(image_bytes: bytes, mime_type: str = "image/jpeg"):
    """Analyze a pet image via Gemini API and return structured JSON in English."""
    if not API_KEY:
        return {"error": "Missing GEMINI_API_KEY in environment."}
    
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        "Analyze the pet in the image and return ONLY a JSON object with these fields: "
        "breed, age, size, personality (array of tags), health, appearance. "
        "Use English for all values. Be concise."
    )

    # Using the same structure as the SDK but via REST API
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": img_b64,
                        }
                    },
                ]
            }
        ]
    }

    try:
        resp = requests.post(
            f"{GEMINI_ENDPOINT}?key={API_KEY}",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=30,
        )
        if resp.status_code != 200:
            return {"error": f"Gemini API error: {resp.status_code} {resp.text}"}

        data = resp.json()
        # Extract text from first candidate
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        if not text:
            return {"error": "Empty response from Gemini."}

        # Attempt to parse JSON out of text
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                result = json.loads(text[start : end + 1])
                # Normalize personality to list
                personality = result.get("personality")
                if personality and not isinstance(personality, list):
                    result["personality"] = [str(personality)]
                return result
            except json.JSONDecodeError:
                pass
        return {"error": "Could not parse JSON from Gemini output.", "raw": text}
    except Exception as e:
        return {"error": f"Gemini request failed: {str(e)}"}


def generate_travel_itinerary(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    pet_info: dict,
    num_adults: int = 2,
    num_children: int = 0,
):
    """
    Generate a detailed, pet-friendly travel itinerary using Gemini AI.
    
    Note: We avoid asking for specific flight details due to Gemini's limitations
    with real-time data. Instead, we request general airline information and time windows.
    """
    if not API_KEY:
        return {"error": "Missing GEMINI_API_KEY in environment."}
    
    # Build pet description
    pet_name = pet_info.get("name", "your pet")
    pet_breed = pet_info.get("breed", "unknown breed")
    pet_size = pet_info.get("size", "medium")
    pet_age = pet_info.get("age", "unknown age")
    pet_personality = pet_info.get("personality", [])
    pet_health = pet_info.get("health", "")
    
    personality_str = ", ".join(pet_personality) if pet_personality else "friendly"
    
    prompt = f"""You are a pet-first travel planning expert. Generate a detailed travel itinerary for a trip from {origin} to {destination}, from {start_date} to {end_date}.

TRAVELING PARTY:
- {num_adults} adult(s)
- {num_children} child(ren)
- Pet: {pet_name}, a {pet_age} {pet_breed} ({pet_size} size, {personality_str})
{f"- Health considerations: {pet_health}" if pet_health else ""}

CRITICAL INSTRUCTIONS:
1. **DO NOT provide specific flight numbers, departure times, or airline booking details.** Instead, suggest which airlines generally allow pets in-cabin or cargo for this route, and what time windows (morning/afternoon/evening) are typically available.
2. Pet considerations are TOP PRIORITY. Every activity, accommodation, and transportation option MUST be pet-friendly.
3. Consider the pet's size, age, personality, and health when making recommendations.
4. For small pets (<20 lbs), prioritize in-cabin airline travel. For larger pets, mention cargo requirements and alternatives.
5. Include specific pet amenities (water bowls, pet beds, outdoor spaces, etc.)
6. Suggest pet-friendly activities appropriate for the pet's energy level and size.
7. Include alerts for weather conditions that might affect the pet.

Return a JSON object with this EXACT structure:
{{
  "days": [
    {{
      "date": "Sat, Feb 15",
      "dayLabel": "Travel Day",
      "alerts": [
        {{
          "type": "weather",
          "message": "🌡️ High of 85°F — Pack extra water for {pet_name}!"
        }}
      ],
      "items": [
        {{
          "id": "1",
          "time": "morning",
          "type": "transport",
          "title": "Airline Recommendation",
          "subtitle": "Airlines like United, Delta allow in-cabin pets (<20 lbs) • Book directly with airline",
          "compliance": "approved",
          "complianceNote": "In-cabin travel available for small pets"
        }},
        {{
          "id": "2",
          "time": "afternoon",
          "type": "accommodation",
          "title": "Pet-Friendly Hotel Name",
          "subtitle": "Check-in time",
          "compliance": "approved",
          "complianceNote": "No pet fee, amenities provided"
        }},
        {{
          "id": "3",
          "time": "evening",
          "type": "dining",
          "title": "Restaurant name",
          "subtitle": "Description",
          "compliance": "conditional",
          "complianceNote": "Outdoor seating only"
        }}
      ]
    }}
  ]
}}

Valid values for fields:
- time: "morning", "afternoon", "evening"
- type: "transport", "accommodation", "dining", "activity"
- compliance: "approved", "conditional", "notAllowed"

Make sure all recommendations are realistic for {destination} and appropriate for a {pet_breed}. Return ONLY valid JSON."""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 4096,
        }
    }

    try:
        resp = requests.post(
            f"{GEMINI_ENDPOINT}?key={API_KEY}",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=60,  # Longer timeout for itinerary generation
        )
        if resp.status_code != 200:
            return {"error": f"Gemini API error: {resp.status_code} {resp.text}"}

        data = resp.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        if not text:
            return {"error": "Empty response from Gemini."}

        # Extract JSON from response
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                result = json.loads(text[start : end + 1])
                return result
            except json.JSONDecodeError as e:
                return {"error": f"Could not parse JSON from Gemini output: {str(e)}", "raw": text}
        return {"error": "Could not find JSON in Gemini output.", "raw": text}
    except Exception as e:
        return {"error": f"Gemini request failed: {str(e)}"}


