import axios from 'axios';
import { defineSecret } from 'firebase-functions/params';

// Define secret - this will be automatically loaded when accessed
const geminiApiKeySecret = defineSecret('GEMINI_API_KEY');

// Fallback to process.env for local testing
function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

// Export the secret so it can be referenced in function configuration
export { geminiApiKeySecret };

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface PetInfo {
  name: string;
  breed?: string;
  age?: string;
  size?: string;
  personality?: string[];
  health?: string;
}

export async function analyzePetImage(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<any> {
  const GEMINI_API_KEY = getGeminiApiKey();
  
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment');
    return { error: 'Missing GEMINI_API_KEY in environment.' };
  }
  
  console.log('Analyzing pet image, buffer size:', imageBuffer.length, 'mimeType:', mimeType);

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
    console.error('Gemini API Error:', error.response?.data || error.message);
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
  const GEMINI_API_KEY = getGeminiApiKey();
  
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment');
    return { error: 'Missing GEMINI_API_KEY in environment.' };
  }
  
  console.log('Generating travel itinerary from', params.origin, 'to', params.destination);

  const { origin, destination, startDate, endDate, petInfo, numAdults, numChildren, budget } = params;

  const personalityStr = petInfo.personality && petInfo.personality.length > 0 
    ? petInfo.personality.join(', ') 
    : 'friendly';
  
  const budgetInstruction = budget ? `
BUDGET CONSTRAINT:
- Total trip budget: $${budget.toFixed(2)}
- You MUST keep the total estimated cost within this budget
- Include realistic cost estimates for each item (flights, hotels, meals, activities)
- Provide a mix of budget-friendly and quality options that respect the budget
- Each item should have an "estimated_cost" field with a reasonable dollar amount
- The sum of all estimated costs should NOT exceed $${budget.toFixed(2)}
` : '';

  const prompt = `You are a pet-first travel planning expert. Generate a detailed travel itinerary for a trip from ${origin} to ${destination}, from ${startDate} to ${endDate}.

TRAVELING PARTY:
- ${numAdults} adult(s)
- ${numChildren} child(ren)
- Pet: ${petInfo.name}, a ${petInfo.age || 'unknown age'} ${petInfo.breed || 'unknown breed'} (${petInfo.size || 'medium'} size, ${personalityStr})
${petInfo.health ? `- Health considerations: ${petInfo.health}` : ''}

CRITICAL INSTRUCTIONS:
1. **DO NOT provide specific flight numbers, departure times, or airline booking details.** Instead, suggest which airlines generally allow pets in-cabin or cargo for this route, and what time windows (morning/afternoon/evening) are typically available.
2. Pet considerations are TOP PRIORITY. Every activity, accommodation, and transportation option MUST be pet-friendly.
3. Consider the pet's size, age, personality, and health when making recommendations.
4. For small pets (<20 lbs), prioritize in-cabin airline travel. For larger pets, mention cargo requirements and alternatives.
5. Include specific pet amenities (water bowls, pet beds, outdoor spaces, etc.)
6. Suggest pet-friendly activities appropriate for the pet's energy level and size.
7. Include alerts for weather conditions that might affect the pet.
8. **LOCATION FORMAT REQUIREMENT: ALL city names in "subtitle" fields MUST use the format "City, State" (e.g., "Boston, Massachusetts", "Los Angeles, California"). This is critical for map functionality.**
${budgetInstruction}
9. **IMPORTANT: Include realistic estimated costs for each item.** Add an "estimated_cost" field to every item with a dollar amount.

Return a JSON object with this EXACT structure:
{
  "days": [
    {
      "date": "Sat, Feb 15",
      "dayLabel": "Travel Day",
      "alerts": [
        {
          "type": "weather",
          "message": "🌡️ High of 85°F — Pack extra water for ${petInfo.name}!"
        }
      ],
      "items": [
        {
          "id": "1",
          "time": "morning",
          "type": "transport",
          "title": "Airline Recommendation",
          "subtitle": "Airlines like United, Delta allow in-cabin pets (<20 lbs) • Book directly with airline",
          "compliance": "approved",
          "complianceNote": "In-cabin travel available for small pets",
          "estimated_cost": 350.00
        },
        {
          "id": "2",
          "time": "afternoon",
          "type": "accommodation",
          "title": "Pet-Friendly Hotel Name",
          "subtitle": "Los Angeles, California • Check-in time",
          "compliance": "approved",
          "complianceNote": "No pet fee, amenities provided",
          "estimated_cost": 180.00
        },
        {
          "id": "3",
          "time": "evening",
          "type": "dining",
          "title": "Restaurant name",
          "subtitle": "Los Angeles, California • Description",
          "compliance": "conditional",
          "complianceNote": "Outdoor seating only",
          "estimated_cost": 75.00
        }
      ]
    }
  ]
}

Valid values for fields:
- time: "morning", "afternoon", "evening"
- type: "transport", "accommodation", "dining", "activity"
- compliance: "approved", "conditional", "notAllowed"

Make sure all recommendations are realistic for ${destination} and appropriate for a ${petInfo.breed || 'pet'}. REMEMBER: All city references in subtitles must include the state (e.g., "Boston, Massachusetts", not just "Boston"). Return ONLY valid JSON.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    }
  };

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      payload,
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
      const result = JSON.parse(text.substring(start, end + 1));
      
      // Calculate total estimated cost
      let totalCost = 0;
      if (result.days) {
        for (const day of result.days) {
          for (const item of day.items || []) {
            if (item.estimated_cost) {
              totalCost += item.estimated_cost;
            }
          }
        }
      }
      
      result.total_estimated_cost = Math.round(totalCost * 100) / 100;
      if (budget) {
        result.budget = budget;
      }
      
      return result;
    }

    return { error: 'Could not parse JSON from Gemini output.', raw: text };
  } catch (error: any) {
    console.error('Gemini API Error (travel):', error.response?.data || error.message);
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
  const GEMINI_API_KEY = getGeminiApiKey();
  
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment');
    return { error: 'Missing GEMINI_API_KEY in environment.' };
  }
  
  console.log('Generating road trip itinerary from', params.origin, 'to', params.destination);

  const { origin, destination, startDate, endDate, petInfo, numAdults, numChildren, isRoundTrip, budget } = params;

  const personalityStr = petInfo.personality && petInfo.personality.length > 0 
    ? petInfo.personality.join(', ') 
    : 'friendly';
  
  const tripTypeNote = isRoundTrip ? 'round trip' : 'one-way';
  
  const roundTripInstruction = isRoundTrip ? `
IMPORTANT FOR ROUND TRIP:
- On the return journey, take a DIFFERENT scenic route back to avoid repetition
- Suggest different pet-friendly stops, restaurants, and activities on the way back
- The return route should offer new experiences, not duplicate the outbound journey
- Consider alternative highways, different national/state parks, or coastal vs inland routes
` : '';
  
  const budgetInstruction = budget ? `
BUDGET CONSTRAINT:
- Total trip budget: $${budget.toFixed(2)}
- You MUST keep the total estimated cost within this budget
- Include realistic cost estimates for gas, tolls, hotels, meals, and activities
- Each item should have an "estimated_cost" field with a reasonable dollar amount
- The sum of all estimated costs should NOT exceed $${budget.toFixed(2)}
` : '';

  const prompt = `You are a pet-first road trip planning expert. Generate a detailed ${tripTypeNote} road trip itinerary from ${origin} to ${destination}, from ${startDate} to ${endDate}.

TRAVELING PARTY:
- ${numAdults} adult(s)
- ${numChildren} child(ren)
- Pet: ${petInfo.name}, a ${petInfo.age || 'unknown age'} ${petInfo.breed || 'unknown breed'} (${petInfo.size || 'medium'} size, ${personalityStr})
${petInfo.health ? `- Health considerations: ${petInfo.health}` : ''}

CRITICAL INSTRUCTIONS FOR ROAD TRIPS:
1. **FOCUS ON THE JOURNEY, NOT JUST THE DESTINATION** - This is a road trip, so emphasize scenic routes, interesting waypoints, and experiences along the way.
2. **Pet considerations are TOP PRIORITY** - Every stop, accommodation, and activity MUST be pet-friendly.
3. **Include strategic rest stops** - Every 2-3 hours of driving, suggest pet-friendly rest areas, parks, or scenic viewpoints where ${petInfo.name} can stretch, play, and relieve themselves.
4. **Suggest driving routes** - Recommend specific highways or scenic byways (e.g., "Take Highway 101 along the coast" or "I-90 through mountain passes").
5. **Pet-friendly accommodations** - Hotels/motels that welcome pets, with outdoor spaces. Mention pet fees if typical for the area.
6. **Roadside attractions** - Pet-friendly attractions, hiking trails, dog parks, beaches, or outdoor cafes along the route.
7. **Pack list reminders** - Occasionally remind about essentials: water bowls, leash, waste bags, pet first aid kit, comfort items.
8. **Weather and safety** - Alert about temperature concerns (hot car warnings), road conditions, or elevation changes that might affect pets.
9. **Meal and water breaks** - Regular stops for ${petInfo.name} to eat, drink, and rest.
10. **LOCATION FORMAT REQUIREMENT: ALL city names in "subtitle" and "dayLabel" fields MUST use the format "City, State" (e.g., "Boston, Massachusetts", "Chicago, Illinois"). This is CRITICAL for map functionality. When mentioning cities along the route, always include the state.**
${roundTripInstruction}
${budgetInstruction}
11. **IMPORTANT: Include realistic estimated costs for each item.** Add an "estimated_cost" field to every item (gas, tolls, hotels, meals, activities).

Return a JSON object with this EXACT structure:
{
  "days": [
    {
      "date": "Sat, Feb 15",
      "dayLabel": "Day 1: ${origin} → City/Waypoint",
      "alerts": [
        {
          "type": "weather",
          "message": "🌡️ High of 85°F — Keep ${petInfo.name} hydrated! Bring extra water."
        }
      ],
      "items": [
        {
          "id": "1",
          "time": "morning",
          "type": "transport",
          "title": "Depart ${origin} via Highway 1",
          "subtitle": "Scenic coastal route • 120 miles • ~2.5 hours",
          "compliance": "approved",
          "complianceNote": "Pet-friendly route with rest stops",
          "estimated_cost": 25.00
        },
        {
          "id": "2",
          "time": "morning",
          "type": "activity",
          "title": "Dog-Friendly Beach Stop",
          "subtitle": "Santa Barbara, California • 30-minute break for ${petInfo.name} to run and play",
          "compliance": "approved",
          "complianceNote": "Off-leash area available",
          "estimated_cost": 0.00
        },
        {
          "id": "3",
          "time": "afternoon",
          "type": "dining",
          "title": "Pet-Friendly Roadside Cafe",
          "subtitle": "San Luis Obispo, California • Outdoor patio with water bowls",
          "compliance": "approved",
          "complianceNote": "Dogs welcome on patio",
          "estimated_cost": 45.00
        },
        {
          "id": "4",
          "time": "afternoon",
          "type": "transport",
          "title": "Continue to Destination City",
          "subtitle": "Highway 101 North • 95 miles • ~2 hours",
          "compliance": "approved",
          "estimated_cost": 20.00
        },
        {
          "id": "5",
          "time": "evening",
          "type": "accommodation",
          "title": "Pet-Friendly Hotel Name",
          "subtitle": "San Francisco, California • No pet fee • Dog park on-site • Pet welcome kit",
          "compliance": "approved",
          "complianceNote": "Pets up to 50 lbs welcome",
          "estimated_cost": 150.00
        }
      ]
    }
  ]
}

Valid values for fields:
- time: "morning", "afternoon", "evening"
- type: "transport", "accommodation", "dining", "activity"
- compliance: "approved", "conditional", "notAllowed"

Make sure:
- Each driving segment shows the route (highway numbers or scenic byway names)
- Include mileage and estimated driving time for each segment
- Suggest actual rest stops every 2-3 hours of driving
- All recommendations are realistic for the route from ${origin} to ${destination}
- Activities and stops are appropriate for a ${petInfo.breed || 'pet'}
- For round trips, the return journey uses a different route with different stops

Return ONLY valid JSON.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
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
      
      // Calculate total estimated cost
      let totalCost = 0;
      if (result.days) {
        for (const day of result.days) {
          for (const item of day.items || []) {
            if (item.estimated_cost) {
              totalCost += item.estimated_cost;
            }
          }
        }
      }
      
      result.total_estimated_cost = Math.round(totalCost * 100) / 100;
      if (budget) {
        result.budget = budget;
      }
      
      return result;
    }

    return { error: 'Could not parse JSON from Gemini output.', raw: text };
  } catch (error: any) {
    console.error('Gemini API Error (road trip):', error.response?.data || error.message);
    return { error: `Gemini request failed: ${error.message}` };
  }
}
