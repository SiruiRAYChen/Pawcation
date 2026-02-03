// API Configuration
const getApiBaseUrl = () => {
  const explicitUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (explicitUrl) return explicitUrl;

  const useEmulators = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS) === 'true';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

  if (useEmulators && projectId) {
    return `http://localhost:5001/${projectId}/us-central1/api`;
  }

  if (projectId) {
    return `https://us-central1-${projectId}.cloudfunctions.net/api`;
  }

  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// Types
export interface User {
  user_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface UserUpdate {
  name?: string;
  avatar_url?: string;
  password?: string;
}

export interface Pet {
  pet_id?: string;
  user_id: string;
  name: string;
  breed?: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  is_dob_estimated?: boolean; // true if age was estimated, false if actual DOB
  gotcha_day?: string; // ISO date string (YYYY-MM-DD) - adoption date
  age?: string; // Human-readable age string (e.g., "2 years 3 months")
  size?: string; // Changed from weight
  gender?: string;
  personality?: string[];
  health?: string;
  appearance?: string;
  rabies_expiration?: string;
  microchip_id?: string;
  image_url?: string; // Full image for AI analysis
  avatar_url?: string; // Cropped circular avatar for display
}

export interface Plan {
  plan_id?: number | string;
  user_id: string;
  start_date: string;
  end_date: string;
  trip_type?: string;
  is_round_trip?: boolean;
  destination?: string;
  places_passing_by?: string;
  detailed_itinerary?: string;
  num_humans: number;
  num_adults: number;
  num_children: number;
  budget?: number;
  origin?: string;
  pet_ids?: string;
  memo_items?: Array<{ item: string; checked: boolean }>;
}

export interface UserFull extends User {
  pets: Pet[];
  plans: Plan[];
}

// Itinerary types
export interface ItineraryAlert {
  type: "weather" | "warning";
  message: string;
}

export interface ItineraryItem {
  id: string;
  time: "morning" | "afternoon" | "evening";
  type: "transport" | "accommodation" | "dining" | "activity";
  title: string;
  subtitle: string;
  compliance: "approved" | "conditional" | "notAllowed";
  complianceNote?: string;
  estimated_cost?: number;
}

export interface ItineraryDay {
  date: string;
  dayLabel: string;
  alerts?: ItineraryAlert[];
  items: ItineraryItem[];
}

export interface ItineraryResponse {
  days: ItineraryDay[];
  packing_memo?: string[];
  total_estimated_cost?: number;
  budget?: number;
}

export interface ItineraryGenerateRequest {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  pet_ids: string[];
  num_adults: number;
  num_children: number;
  budget?: number;
}

export interface RoadTripGenerateRequest {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  pet_ids: string[];
  num_adults: number;
  num_children: number;
  is_round_trip?: boolean;
  budget?: number;
}

// Memory types
export interface MemoryPhoto {
  photo_id: string;
  trip_id: number | string;
  user_id: string;
  local_path: string;
  city_name?: string;
  created_at: string;
}

export interface MemoryPhotoCreate {
  trip_id: number | string;
  user_id: string;
  local_path: string;
  city_name?: string;
}

export interface PastTrip extends Plan {
  cover_photo?: string;
  photo_count: number;
  visited_cities?: string[];
}

export interface VisitedCity {
  city_name: string;
  trip_ids: Array<string | number>;
  photo_count: number;
  trip_color: string;
}

// API Client
class PawcationAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ========== USER ENDPOINTS ==========

  async createUser(email: string, password: string): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getUser(userId: string): Promise<UserFull> {
    return this.request<UserFull>(`/api/users/${userId}`);
  }

  async listUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  async loginUser(email: string, password: string): Promise<User> {
    return this.request<User>('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
  }

  async updateUser(userId: string, updates: UserUpdate): Promise<User> {
    return this.request<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request<void>(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ========== PET ENDPOINTS ==========

  async getUserPets(userId: string): Promise<Pet[]> {
    return this.request<Pet[]>(`/api/users/${userId}/pets`);
  }

  async createPet(petData: Omit<Pet, 'pet_id'>): Promise<Pet> {
    return this.request<Pet>('/api/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
  }

  async getPet(petId: number): Promise<Pet> {
    return this.request<Pet>(`/api/pets/${petId}`);
  }

  async updatePet(petId: number, updates: Partial<Pet>): Promise<Pet> {
    return this.request<Pet>(`/api/pets/${petId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePet(petId: number): Promise<void> {
    return this.request<void>(`/api/pets/${petId}`, {
      method: 'DELETE',
    });
  }

  async analyzePetImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/pets/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // ========== PLAN ENDPOINTS ==========

  async createPlan(plan: Omit<Plan, 'plan_id'>): Promise<Plan> {
    return this.request<Plan>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async getPlan(planId: number | string): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${planId}`);
  }

  async getUserPlans(userId: string): Promise<Plan[]> {
    return this.request<Plan[]>(`/api/users/${userId}/plans`);
  }

  async updatePlan(planId: number | string, updates: Partial<Plan>): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePlan(planId: number | string): Promise<void> {
    return this.request<void>(`/api/plans/${planId}`, {
      method: 'DELETE',
    });
  }

  async generateItinerary(request: ItineraryGenerateRequest): Promise<ItineraryResponse> {
    return this.request<ItineraryResponse>('/api/plans/generate-itinerary', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateRoadTripItinerary(request: RoadTripGenerateRequest): Promise<ItineraryResponse> {
    return this.request<ItineraryResponse>('/api/plans/generate-road-trip-itinerary', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async savePlan(planData: {
    user_id: string;
    origin: string;
    destination: string;
    start_date: string;
    end_date: string;
    pet_ids: string;
    num_adults: number;
    num_children: number;
    trip_type?: string;
    is_round_trip?: boolean;
    detailed_itinerary: string;
    memo_items?: Array<{ item: string; checked: boolean }>;
  }): Promise<Plan> {
    return this.request<Plan>('/api/plans/save', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  // ========== MEMORY ENDPOINTS ==========

  async getPastTrips(userId: string): Promise<PastTrip[]> {
    return this.request<PastTrip[]>(`/api/memories/past-trips/${userId}`);
  }

  async getTripPhotos(tripId: number | string, cityName?: string): Promise<MemoryPhoto[]> {
    const params = cityName ? `?city_name=${encodeURIComponent(cityName)}` : '';
    return this.request<MemoryPhoto[]>(`/api/memories/photos/${tripId}${params}`);
  }

  async addMemoryPhoto(photo: MemoryPhotoCreate): Promise<MemoryPhoto> {
    return this.request<MemoryPhoto>('/api/memories/photos', {
      method: 'POST',
      body: JSON.stringify(photo),
    });
  }

  async deleteMemoryPhoto(photoId: string): Promise<void> {
    return this.request<void>(`/api/memories/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  async getVisitedCities(userId: string): Promise<VisitedCity[]> {
    return this.request<VisitedCity[]>(`/api/memories/visited-cities/${userId}`);
  }

  async deletePastTrip(tripId: number): Promise<void> {
    return this.request<void>(`/api/memories/trips/${tripId}`, {
      method: 'DELETE',
    });
  }

  async updateMemoItems(planId: string, memoItems: Array<{ item: string; checked: boolean }>): Promise<{ plan_id: string; memo_items: Array<{ item: string; checked: boolean }> }> {
    return this.request<{ plan_id: string; memo_items: Array<{ item: string; checked: boolean }> }>(`/api/plans/${planId}/memo-items`, {
      method: 'PATCH',
      body: JSON.stringify({ memo_items: memoItems }),
    });
  }
}

// Export singleton instance
export const api = new PawcationAPI();

// Export class for custom instances
export default PawcationAPI;
