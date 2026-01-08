// Python Backend integration for dog image analysis
// The backend uses Google GenAI SDK with Gemini 2.0

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export interface DogAnalysisResult {
  breed: string;
  age_estimate: string;
  weight_estimate: string;
  rabies_vaccinated: string;
  separation_anxiety: string;
  flight_comfort: string;
  daily_exercise_need: string;
  environment_preference: string;
  personality_archetype: string;
  error?: string;
}

export async function analyzeDogImage(base64Image: string): Promise<DogAnalysisResult> {
  try {
    // Call Python backend API
    const response = await fetch(`${BACKEND_URL}/api/analyze-dog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend API error:', response.status, errorData);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 403 || response.status === 401) {
        throw new Error('API authentication failed. Please check backend configuration.');
      } else if (response.status === 500) {
        throw new Error(errorData?.error || 'Backend server error. Please try again.');
      } else {
        throw new Error(errorData?.error || 'AI analysis failed. Please try again.');
      }
    }

    const data = await response.json();

    if (!data.success || !data.analysis) {
      throw new Error('Invalid response from backend');
    }

    // Check if there's an error in the analysis
    if (data.analysis.error) {
      return {
        breed: 'unknown',
        age_estimate: 'unknown',
        weight_estimate: 'unknown',
        rabies_vaccinated: 'unknown',
        separation_anxiety: 'unknown',
        flight_comfort: 'unknown',
        daily_exercise_need: 'unknown',
        environment_preference: 'unknown',
        personality_archetype: 'unknown',
        error: data.analysis.error,
      };
    }

    return data.analysis;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze image');
  }
}