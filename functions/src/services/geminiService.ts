import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface PetInfo {
  name: string;
  breed?: string;
  age?: string;
  size?: string;
  personality?: string[];
  health?: string;
}

export async function analyzePetImage(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<any> {
  if (!GEMINI_API_KEY) {
    return { error: 'Missing GEMINI_API_KEY in environment.' };
  }

  const imageBase64 = imageBuffer.toString('base64');

  const prompt = 
    'Analyze the pet in the image and return ONLY a JSON object with these fields: ' +
    'breed, age, size, personality (array of tags), health, appearance. ' +
    'Use English for all values. Be concise.';

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return { error: 'Empty response from Gemini.' };
    }

    // Extract JSON from text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const result = JSON.parse(text.substring(start, end + 1));
      // Normalize personality to list
      if (result.personality && !Array.isArray(result.personality)) {
        result.personality = [String(result.personality)];
      }
      return result;
    }

    return { error: 'Could not parse JSON from Gemini output.', raw: text };
  } catch (error: any) {
    return { error: `Gemini request failed: ${error.message}` };
  }
}

export async function generateTravelItinerary(params: {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  petInfo: PetInfo;
  numAdults: number;
  numChildren: number;
  budget?: number;
}): Promise<any> {
  if (!GEMINI_API_KEY) {
    return { error: 'Missing GEMINI_API_KEY in environment.' };
  }

  const { origin, destination, startDate, endDate, petInfo, numAdults, numChildren, budget } = params;

  const prompt = `Create a detailed pet-friendly travel itinerary from ${origin} to ${destination} 
from ${startDate} to ${endDate} for ${numAdults} adult(s)${numChildren > 0 ? ` and ${numChildren} child(ren)` : ''}.

Pet Details:
- Name: ${petInfo.name}
- Breed: ${petInfo.breed || 'Unknown'}
- Age: ${petInfo.age || 'Unknown'}
- Size: ${petInfo.size || 'Unknown'}
- Personality: ${petInfo.personality?.join(', ') || 'Unknown'}
- Health: ${petInfo.health || 'Good'}

${budget ? `Budget: $${budget}` : 'Budget: Moderate'}

Return ONLY a JSON object with this structure:
{
  "days": [
    {
      "date": "2024-01-01",
      "dayLabel": "Day 1 - Arrival",
      "alerts": [{"type": "weather", "message": "Sunny, 75°F"}],
      "items": [
        {
          "id": "1",
          "time": "morning",
          "type": "transport",
          "title": "Flight to destination",
          "subtitle": "Airlines, Flight #",
          "compliance": "approved",
          "complianceNote": "Pet-friendly airline",
          "estimated_cost": 200
        }
      ]
    }
  ],
  "total_estimated_cost": 1000,
  "budget": ${budget || 2000}
}

Include:
- Pet-friendly accommodations
- Transportation options that allow pets
- Pet-friendly activities and restaurants
- Walking/exercise breaks for the pet
- compliance field: "approved" (pet-friendly), "conditional" (restrictions apply), or "notAllowed"
`;

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return { error: 'Empty response from Gemini.' };
    }

    // Extract JSON from text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }

    return { error: 'Could not parse JSON from Gemini output.', raw: text };
  } catch (error: any) {
    return { error: `Gemini request failed: ${error.message}` };
  }
}

export async function generateRoadTripItinerary(params: {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  petInfo: PetInfo;
  numAdults: number;
  numChildren: number;
  isRoundTrip: boolean;
  budget?: number;
}): Promise<any> {
  if (!GEMINI_API_KEY) {
    return { error: 'Missing GEMINI_API_KEY in environment.' };
  }

  const { origin, destination, startDate, endDate, petInfo, numAdults, numChildren, isRoundTrip, budget } = params;

  const prompt = `Create a detailed pet-friendly ROAD TRIP itinerary from ${origin} to ${destination}${isRoundTrip ? ' (round trip)' : ''} 
from ${startDate} to ${endDate} for ${numAdults} adult(s)${numChildren > 0 ? ` and ${numChildren} child(ren)` : ''}.

Pet Details:
- Name: ${petInfo.name}
- Breed: ${petInfo.breed || 'Unknown'}
- Age: ${petInfo.age || 'Unknown'}
- Size: ${petInfo.size || 'Unknown'}
- Personality: ${petInfo.personality?.join(', ') || 'Unknown'}
- Health: ${petInfo.health || 'Good'}

${budget ? `Budget: $${budget}` : 'Budget: Moderate'}

This is a ROAD TRIP, so include:
- Driving segments with rest stops
- Pet-friendly hotels/motels along the route
- Scenic stops and points of interest
- Dog parks and pet exercise areas
- Pet-friendly restaurants
- Maximum 6-8 hours of driving per day
- Regular breaks every 2-3 hours for pet needs

Return ONLY a JSON object with this structure:
{
  "days": [
    {
      "date": "2024-01-01",
      "dayLabel": "Day 1 - [Origin] to [Stop]",
      "alerts": [{"type": "weather", "message": "Clear skies"}],
      "items": [
        {
          "id": "1",
          "time": "morning",
          "type": "transport",
          "title": "Drive to next stop",
          "subtitle": "200 miles, 3.5 hours",
          "compliance": "approved",
          "estimated_cost": 30
        }
      ]
    }
  ],
  "total_estimated_cost": 1500,
  "budget": ${budget || 2000}
}
`;

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return { error: 'Empty response from Gemini.' };
    }

    // Extract JSON from text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }

    return { error: 'Could not parse JSON from Gemini output.', raw: text };
  } catch (error: any) {
    return { error: `Gemini request failed: ${error.message}` };
  }
}
