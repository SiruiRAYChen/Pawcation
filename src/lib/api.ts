// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
export interface User {
  user_id: number;
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
  pet_id?: number;
  user_id: number;
  name: string;
  breed?: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  is_dob_estimated?: boolean; // true if age was estimated, false if actual DOB
  gotcha_day?: string; // ISO date string (YYYY-MM-DD) - adoption date
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
  plan_id?: number;
  user_id: number;
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
}

export interface ItineraryDay {
  date: string;
  dayLabel: string;
  alerts?: ItineraryAlert[];
  items: ItineraryItem[];
}

export interface ItineraryResponse {
  days: ItineraryDay[];
}

export interface ItineraryGenerateRequest {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  pet_id: number;
  num_adults: number;
  num_children: number;
}

export interface RoadTripGenerateRequest {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  pet_id: number;
  num_adults: number;
  num_children: number;
  is_round_trip: boolean;
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

  async getUser(userId: number): Promise<UserFull> {
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

  async updateUser(userId: number, updates: UserUpdate): Promise<User> {
    return this.request<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: number): Promise<void> {
    return this.request<void>(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ========== PET ENDPOINTS ==========

  async getUserPets(userId: number): Promise<Pet[]> {
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

  async getPlan(planId: number): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${planId}`);
  }

  async getUserPlans(userId: number): Promise<Plan[]> {
    return this.request<Plan[]>(`/api/users/${userId}/plans`);
  }

  async updatePlan(planId: number, updates: Partial<Plan>): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePlan(planId: number): Promise<void> {
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
    user_id: number;
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
  }): Promise<Plan> {
    return this.request<Plan>('/api/plans/save', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }
}

// Export singleton instance
export const api = new PawcationAPI();

// Export class for custom instances
export default PawcationAPI;
