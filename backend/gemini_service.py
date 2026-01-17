
import os
import base64
import json
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



