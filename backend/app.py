"""
Pawcation Backend - Python Flask API
Handles Gemini AI image analysis for dog profiles
"""

import base64
import json
import os
from io import BytesIO

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai
from google.genai import types
from PIL import Image

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize Gemini client
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

client = genai.Client(api_key=GEMINI_API_KEY)

ANALYSIS_PROMPT = """You are an expert pet travel assistant analyzing a dog photo to help plan a "Pawcation".

Analyze this image and return ONLY a JSON object with these exact fields:
{
  "breed": "string (e.g., 'Golden Retriever', 'Mixed', or 'unknown')",
  "age_estimate": "string (e.g., '2 years', '6-8 months', 'puppy', 'senior', or 'unknown')",
  "weight_estimate": "string (number only, e.g., '25', '40-50', or 'unknown')",
  "rabies_vaccinated": "string ('yes', 'no', or 'unknown' - default to 'unknown')",
  "separation_anxiety": "string ('low', 'medium', 'high', or 'unknown')",
  "flight_comfort": "string ('low', 'medium', 'high', or 'unknown' - default to 'unknown')",
  "daily_exercise_need": "string ('low', 'medium', 'high', or 'unknown')",
  "environment_preference": "string ('urban', 'suburban', 'nature', 'mixed', or 'unknown')",
  "personality_archetype": "string ('friendly', 'anxious', 'energetic', 'calm', 'protective', 'playful', 'independent', or 'unknown')"
}

Important:
- If this is NOT a dog image, return: {"error": "This doesn't appear to be a dog photo. Please upload an image of your dog."}
- Be generous with estimates but honest about uncertainty
- Base inferences on breed characteristics and visible cues
- Return ONLY valid JSON, no markdown or extra text
"""


def decode_base64_image(base64_string):
    """
    Decode base64 image string and return image bytes
    """
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64
    image_bytes = base64.b64decode(base64_string)
    return image_bytes


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Pawcation Backend'}), 200


@app.route('/api/analyze-dog', methods=['POST'])
def analyze_dog():
    """
    Analyze dog image using Gemini AI
    Expects JSON body with 'image' field containing base64 encoded image
    """
    try:
        # Get image from request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        base64_image = data['image']
        
        # Call Gemini API directly with base64 image
        try:
            # Prepare image for Gemini - use inline data
            # Extract mime type from base64 string
            mime_type = 'image/jpeg'  # default
            if ',' in base64_image:
                header = base64_image.split(',')[0]
                if 'image/' in header:
                    mime_type = header.split(':')[1].split(';')[0]
            
            # Get just the base64 data without the data URL prefix
            if ',' in base64_image:
                base64_data = base64_image.split(',')[1]
            else:
                base64_data = base64_image
            
            print(f"Processing image with mime_type: {mime_type}")
            print(f"Base64 data length: {len(base64_data)}")
            
            # Decode base64 to bytes for PIL verification (optional)
            image_bytes = base64.b64decode(base64_data)
            
            # Create the image part using types.Part
            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            )
            
            # Generate content using the correct SDK method
            response = client.models.generate_content(
                model='gemini-3-flash-preview',  # Using Gemini 2.0 as you suggested
                contents=[ANALYSIS_PROMPT, image_part]
            )
            
            # Parse response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                # Extract JSON from markdown
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1]) if len(lines) > 2 else response_text
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            # Parse JSON
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"Failed to parse Gemini response: {response_text}")
                # Return default values if parsing fails
                analysis = {
                    'breed': 'unknown',
                    'age_estimate': 'unknown',
                    'weight_estimate': 'unknown',
                    'rabies_vaccinated': 'unknown',
                    'separation_anxiety': 'unknown',
                    'flight_comfort': 'unknown',
                    'daily_exercise_need': 'unknown',
                    'environment_preference': 'unknown',
                    'personality_archetype': 'unknown',
                }
            
            return jsonify({
                'success': True,
                'analysis': analysis
            }), 200
            
        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            return jsonify({
                'error': f'AI analysis failed: {str(e)}'
            }), 500
    
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/test', methods=['GET'])
def test_gemini():
    """Test endpoint to verify Gemini connection"""
    try:
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents='Reply with just "OK" if you can hear me.'
        )
        return jsonify({
            'status': 'success',
            'message': 'Gemini API is working',
            'response': response.text
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"\n🐾 Pawcation Backend starting on port {port}...")
    print(f"📡 Frontend should connect to: http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
