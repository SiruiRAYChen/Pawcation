
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
    budget: float = None,
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
    
    budget_instruction = ""
    if budget:
        budget_instruction = f"""
BUDGET CONSTRAINT:
- Total trip budget: ${budget:.2f}
- You MUST keep the total estimated cost within this budget
- Include realistic cost estimates for each item (flights, hotels, meals, activities)
- Provide a mix of budget-friendly and quality options that respect the budget
- Each item should have an "estimated_cost" field with a reasonable dollar amount
- The sum of all estimated costs should NOT exceed ${budget:.2f}
"""
    
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
{budget_instruction}
8. **IMPORTANT: Include realistic estimated costs for each item.** Add an "estimated_cost" field to every item with a dollar amount.

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
          "complianceNote": "In-cabin travel available for small pets",
          "estimated_cost": 350.00
        }},
        {{
          "id": "2",
          "time": "afternoon",
          "type": "accommodation",
          "title": "Pet-Friendly Hotel Name",
          "subtitle": "Check-in time",
          "compliance": "approved",
          "complianceNote": "No pet fee, amenities provided",
          "estimated_cost": 180.00
        }},
        {{
          "id": "3",
          "time": "evening",
          "type": "dining",
          "title": "Restaurant name",
          "subtitle": "Description",
          "compliance": "conditional",
          "complianceNote": "Outdoor seating only",
          "estimated_cost": 75.00
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
                
                # Calculate total estimated cost
                total_cost = 0
                if "days" in result:
                    for day in result["days"]:
                        for item in day.get("items", []):
                            if "estimated_cost" in item:
                                total_cost += item["estimated_cost"]
                
                result["total_estimated_cost"] = round(total_cost, 2)
                if budget:
                    result["budget"] = budget
                
                return result
            except json.JSONDecodeError as e:
                return {"error": f"Could not parse JSON from Gemini output: {str(e)}", "raw": text}
        return {"error": "Could not find JSON in Gemini output.", "raw": text}
    except Exception as e:
        return {"error": f"Gemini request failed: {str(e)}"}


def generate_road_trip_itinerary(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    pet_info: dict,
    num_adults: int = 2,
    num_children: int = 0,
    is_round_trip: bool = False,
    budget: float = None,
):
    """
    Generate a detailed, pet-friendly road trip itinerary using Gemini AI.
    Focuses on scenic routes, rest stops, pet-friendly accommodations, and activities along the way.
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
    
    trip_type_note = "round trip" if is_round_trip else "one-way"
    round_trip_instruction = ""
    if is_round_trip:
        round_trip_instruction = """
IMPORTANT FOR ROUND TRIP:
- On the return journey, take a DIFFERENT scenic route back to avoid repetition
- Suggest different pet-friendly stops, restaurants, and activities on the way back
- The return route should offer new experiences, not duplicate the outbound journey
- Consider alternative highways, different national/state parks, or coastal vs inland routes
"""
    
    budget_instruction = ""
    if budget:
        budget_instruction = f"""
BUDGET CONSTRAINT:
- Total trip budget: ${budget:.2f}
- You MUST keep the total estimated cost within this budget
- Include realistic cost estimates for gas, tolls, hotels, meals, and activities
- Each item should have an "estimated_cost" field with a reasonable dollar amount
- The sum of all estimated costs should NOT exceed ${budget:.2f}
"""
    
    prompt = f"""You are a pet-first road trip planning expert. Generate a detailed {trip_type_note} road trip itinerary from {origin} to {destination}, from {start_date} to {end_date}.

TRAVELING PARTY:
- {num_adults} adult(s)
- {num_children} child(ren)
- Pet: {pet_name}, a {pet_age} {pet_breed} ({pet_size} size, {personality_str})
{f"- Health considerations: {pet_health}" if pet_health else ""}

CRITICAL INSTRUCTIONS FOR ROAD TRIPS:
1. **FOCUS ON THE JOURNEY, NOT JUST THE DESTINATION** - This is a road trip, so emphasize scenic routes, interesting waypoints, and experiences along the way.
2. **Pet considerations are TOP PRIORITY** - Every stop, accommodation, and activity MUST be pet-friendly.
3. **Include strategic rest stops** - Every 2-3 hours of driving, suggest pet-friendly rest areas, parks, or scenic viewpoints where {pet_name} can stretch, play, and relieve themselves.
4. **Suggest driving routes** - Recommend specific highways or scenic byways (e.g., "Take Highway 101 along the coast" or "I-90 through mountain passes").
5. **Pet-friendly accommodations** - Hotels/motels that welcome pets, with outdoor spaces. Mention pet fees if typical for the area.
6. **Roadside attractions** - Pet-friendly attractions, hiking trails, dog parks, beaches, or outdoor cafes along the route.
7. **Pack list reminders** - Occasionally remind about essentials: water bowls, leash, waste bags, pet first aid kit, comfort items.
8. **Weather and safety** - Alert about temperature concerns (hot car warnings), road conditions, or elevation changes that might affect pets.
9. **Meal and water breaks** - Regular stops for {pet_name} to eat, drink, and rest.
{round_trip_instruction}
{budget_instruction}
10. **IMPORTANT: Include realistic estimated costs for each item.** Add an "estimated_cost" field to every item (gas, tolls, hotels, meals, activities).

Return a JSON object with this EXACT structure:
{{
  "days": [
    {{
      "date": "Sat, Feb 15",
      "dayLabel": "Day 1: {origin} → City/Waypoint",
      "alerts": [
        {{
          "type": "weather",
          "message": "🌡️ High of 85°F — Keep {pet_name} hydrated! Bring extra water."
        }}
      ],
      "items": [
        {{
          "id": "1",
          "time": "morning",
          "type": "transport",
          "title": "Depart {origin} via Highway 1",
          "subtitle": "Scenic coastal route • 120 miles • ~2.5 hours",
          "compliance": "approved",
          "complianceNote": "Pet-friendly route with rest stops",
          "estimated_cost": 25.00
        }},
        {{
          "id": "2",
          "time": "morning",
          "type": "activity",
          "title": "Dog-Friendly Beach Stop",
          "subtitle": "30-minute break for {pet_name} to run and play",
          "compliance": "approved",
          "complianceNote": "Off-leash area available",
          "estimated_cost": 0.00
        }},
        {{
          "id": "3",
          "time": "afternoon",
          "type": "dining",
          "title": "Pet-Friendly Roadside Cafe",
          "subtitle": "Outdoor patio with water bowls",
          "compliance": "approved",
          "complianceNote": "Dogs welcome on patio",
          "estimated_cost": 45.00
        }},
        {{
          "id": "4",
          "time": "afternoon",
          "type": "transport",
          "title": "Continue to Destination City",
          "subtitle": "Highway 101 North • 95 miles • ~2 hours",
          "compliance": "approved",
          "estimated_cost": 20.00
        }},
        {{
          "id": "5",
          "time": "evening",
          "type": "accommodation",
          "title": "Pet-Friendly Hotel Name",
          "subtitle": "No pet fee • Dog park on-site • Pet welcome kit",
          "compliance": "approved",
          "complianceNote": "Pets up to 50 lbs welcome",
          "estimated_cost": 150.00
        }}
      ]
    }}
  ]
}}

Valid values for fields:
- time: "morning", "afternoon", "evening"
- type: "transport", "accommodation", "dining", "activity"
- compliance: "approved", "conditional", "notAllowed"

Make sure:
- Each driving segment shows the route (highway numbers or scenic byway names)
- Include mileage and estimated driving time for each segment
- Suggest actual rest stops every 2-3 hours of driving
- All recommendations are realistic for the route from {origin} to {destination}
- Activities and stops are appropriate for a {pet_breed}
- For round trips, the return journey uses a different route with different stops

Return ONLY valid JSON."""

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
            "maxOutputTokens": 8192,  # More tokens for road trip details
        }
    }

    try:
        resp = requests.post(
            f"{GEMINI_ENDPOINT}?key={API_KEY}",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=90,  # Longer timeout for detailed road trip planning
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
                
                # Calculate total estimated cost
                total_cost = 0
                if "days" in result:
                    for day in result["days"]:
                        for item in day.get("items", []):
                            if "estimated_cost" in item:
                                total_cost += item["estimated_cost"]
                
                result["total_estimated_cost"] = round(total_cost, 2)
                if budget:
                    result["budget"] = budget
                
                return result
            except json.JSONDecodeError as e:
                return {"error": f"Could not parse JSON from Gemini output: {str(e)}", "raw": text}
        return {"error": "Could not find JSON in Gemini output.", "raw": text}
    except Exception as e:
        return {"error": f"Gemini request failed: {str(e)}"}
