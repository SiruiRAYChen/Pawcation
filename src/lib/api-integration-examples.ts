/**
 * Example: How to integrate the backend API with your existing components
 * 
 * This file demonstrates how to fetch and create data using the API client
 */

import { useState, useEffect } from 'react';
import { api, Pet, Plan } from '@/lib/api';

// ============================================
// Example 1: Fetch User's Pets
// ============================================

export const usePets = (userId: number) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const data = await api.getUserPets(userId);
        setPets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [userId]);

  return { pets, loading, error };
};

// ============================================
// Example 2: Create a New Pet
// ============================================

export const useCreatePet = () => {
  const [creating, setCreating] = useState(false);

  const createPet = async (petData: Omit<Pet, 'pet_id'>) => {
    try {
      setCreating(true);
      const newPet = await api.createPet(petData);
      return newPet;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create pet');
    } finally {
      setCreating(false);
    }
  };

  return { createPet, creating };
};

// ============================================
// Example 3: Update Existing Pet
// ============================================

export const useUpdatePet = () => {
  const [updating, setUpdating] = useState(false);

  const updatePet = async (petId: number, updates: Partial<Pet>) => {
    try {
      setUpdating(true);
      const updatedPet = await api.updatePet(petId, updates);
      return updatedPet;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update pet');
    } finally {
      setUpdating(false);
    }
  };

  return { updatePet, updating };
};

// ============================================
// Example 4: Component Integration
// ============================================

/**
 * Example of how to integrate with ProfileTab component
 * Replace the sample data with real API calls
 */

export const ExampleProfileIntegration = () => {
  const userId = 1; // In real app, get from auth context
  const { pets, loading, error } = usePets(userId);
  const { createPet, creating } = useCreatePet();

  const handleAddPet = async () => {
    try {
      const newPet = await createPet({
        user_id: userId,
        name: 'Max',
        breed: 'Golden Retriever',
        weight: 65,
        rabies_vaccinated: true,
        separation_anxiety_level: 2,
        flight_comfort_level: 4,
        daily_exercise_need: 5,
        environment_preference: 'Outdoor',
        personality_archetype: 'Energetic Explorer',
      });
      
      console.log('Pet created:', newPet);
      // Refresh pets list or add to state
    } catch (err) {
      console.error('Error creating pet:', err);
    }
  };

  if (loading) return <div>Loading pets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Pets</h2>
      {pets.map((pet) => (
        <div key={pet.pet_id}>
          <h3>{pet.name}</h3>
          <p>{pet.breed}</p>
        </div>
      ))}
      <button onClick={handleAddPet} disabled={creating}>
        {creating ? 'Adding...' : 'Add Pet'}
      </button>
    </div>
  );
};

// ============================================
// Example 5: TripSearchForm Integration
// ============================================

export const usePlanSearch = () => {
  const [searching, setSearching] = useState(false);

  const createPlan = async (planData: {
    userId: number;
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    petIds: number[];
  }) => {
    try {
      setSearching(true);
      
      const plan = await api.createPlan({
        user_id: planData.userId,
        origin: planData.origin,
        destination: planData.destination,
        start_date: planData.startDate,
        end_date: planData.endDate,
        num_adults: planData.adults,
        num_children: planData.children,
        num_humans: planData.adults + planData.children,
        pet_ids: planData.petIds.join(','),
        trip_type: 'Direct Trip',
      });

      return plan;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSearching(false);
    }
  };

  return { createPlan, searching };
};

// ============================================
// Example 6: Fetch User Plans
// ============================================

export const usePlans = (userId: number) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await api.getUserPlans(userId);
        setPlans(data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [userId]);

  return { plans, loading };
};

// ============================================
// Usage Instructions
// ============================================

/**
 * To integrate with existing components:
 * 
 * 1. In ProfileTab.tsx:
 *    - Replace `samplePets` with `usePets(userId)`
 *    - Update the add pet handler to use `createPet()`
 * 
 * 2. In TripSearchForm.tsx:
 *    - Use `usePlanSearch()` hook
 *    - Call `createPlan()` in the form submit handler
 * 
 * 3. In PlanTab.tsx:
 *    - Use `usePlans(userId)` to fetch user's plans
 *    - Display real data instead of placeholders
 * 
 * 4. Add authentication:
 *    - Create a user context to store logged-in user
 *    - Pass userId to all hooks
 * 
 * Example ProfileTab modification:
 * 
 * ```typescript
 * export const ProfileTab = () => {
 *   const userId = 1; // From auth context
 *   const { pets, loading } = usePets(userId);
 *   const { createPet } = useCreatePet();
 *   
 *   // Use pets instead of samplePets
 *   // Use createPet in add handler
 * }
 * ```
 */
