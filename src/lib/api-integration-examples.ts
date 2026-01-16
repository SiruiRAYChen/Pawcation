/**
 * Example: How to integrate the backend API with your existing components
 * 
 * This file demonstrates how to fetch and create data using the API client
 * Copy these hooks to your components folder to use them
 */


// ============================================
// Example 1: Fetch User's Pets
// ============================================

/**
 * Copy this hook to your components folder:
 * 
 * import { useState, useEffect } from 'react';
 * import { api, Pet } from '@/lib/api';
 * 
 * export const usePets = (userId: number) => {
 *   const [pets, setPets] = useState<Pet[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 * 
 *   useEffect(() => {
 *     const fetchPets = async () => {
 *       try {
 *         setLoading(true);
 *         const data = await api.getUserPets(userId);
 *         setPets(data);
 *       } catch (err) {
 *         setError(err instanceof Error ? err.message : 'Failed to fetch pets');
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 * 
 *     fetchPets();
 *   }, [userId]);
 * 
 *   return { pets, loading, error };
 * };
 */

// ============================================
// Example 2: Create a New Pet
// ============================================

/**
 * Copy this hook to your components folder:
 * 
 * import { useState } from 'react';
 * import { api, Pet } from '@/lib/api';
 * 
 * export const useCreatePet = () => {
 *   const [creating, setCreating] = useState(false);
 * 
 *   const createPet = async (petData: Omit<Pet, 'pet_id'>) => {
 *     try {
 *       setCreating(true);
 *       const newPet = await api.createPet(petData);
 *       return newPet;
 *     } catch (err) {
 *       throw new Error(err instanceof Error ? err.message : 'Failed to create pet');
 *     } finally {
 *       setCreating(false);
 *     }
 *   };
 * 
 *   return { createPet, creating };
 * };
 */

// ============================================
// Example 3: Update Existing Pet
// ============================================

/**
 * Copy this hook to your components folder:
 * 
 * import { useState } from 'react';
 * import { api, Pet } from '@/lib/api';
 * 
 * export const useUpdatePet = () => {
 *   const [updating, setUpdating] = useState(false);
 * 
 *   const updatePet = async (petId: number, updates: Partial<Pet>) => {
 *     try {
 *       setUpdating(true);
 *       const updatedPet = await api.updatePet(petId, updates);
 *       return updatedPet;
 *     } catch (err) {
 *       throw new Error(err instanceof Error ? err.message : 'Failed to update pet');
 *     } finally {
 *       setUpdating(false);
 *     }
 *   };
 * 
 *   return { updatePet, updating };
 * };
 */

// ============================================
// Example 4: Component Integration
// ============================================

/**
 * Example of how to integrate with ProfileTab component
 * 
 * import { api } from '@/lib/api';
 * import { useState, useEffect } from 'react';
 * 
 * export const ProfileTab = () => {
 *   const userId = 1; // Get from auth context
 *   const [pets, setPets] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     const fetchPets = async () => {
 *       try {
 *         const data = await api.getUserPets(userId);
 *         setPets(data);
 *       } catch (error) {
 *         console.error('Failed to fetch pets:', error);
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 *     fetchPets();
 *   }, [userId]);
 * 
 *   const handleAddPet = async () => {
 *     try {
 *       const newPet = await api.createPet({
 *         user_id: userId,
 *         name: 'Max',
 *         breed: 'Golden Retriever',
 *         weight: 65,
 *         rabies_vaccinated: true,
 *         separation_anxiety_level: 2,
 *         flight_comfort_level: 4,
 *         daily_exercise_need: 5,
 *         environment_preference: 'Outdoor',
 *         personality_archetype: 'Energetic Explorer',
 *       });
 *       setPets([...pets, newPet]);
 *     } catch (error) {
 *       console.error('Error creating pet:', error);
 *     }
 *   };
 * 
 *   if (loading) return <div>Loading...</div>;
 * 
 *   return (
 *     <div>
 *       {pets.map(pet => <PetCard key={pet.pet_id} {...pet} />)}
 *       <button onClick={handleAddPet}>Add Pet</button>
 *     </div>
 *   );
 * };
 */

// ============================================
// Example 5: TripSearchForm Integration
// ============================================

/**
 * Example of saving a trip plan:
 * 
 * import { api } from '@/lib/api';
 * 
 * const handleSubmit = async (formData) => {
 *   try {
 *     const plan = await api.createPlan({
 *       user_id: userId,
 *       origin: formData.origin,
 *       destination: formData.destination,
 *       start_date: formData.startDate,
 *       end_date: formData.endDate,
 *       num_adults: formData.adults,
 *       num_children: formData.children,
 *       num_humans: formData.adults + formData.children,
 *       pet_ids: formData.petIds.join(','),
 *       trip_type: 'Direct Trip',
 *     });
 *     console.log('Plan created:', plan);
 *   } catch (error) {
 *     console.error('Failed to create plan:', error);
 *   }
 * };
 */

// ============================================
// Example 6: Fetch User Plans
// ============================================

/**
 * Example of fetching user plans:
 * 
 * import { useState, useEffect } from 'react';
 * import { api } from '@/lib/api';
 * 
 * const PlanTab = () => {
 *   const [plans, setPlans] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const userId = 1; // Get from auth context
 * 
 *   useEffect(() => {
 *     const fetchPlans = async () => {
 *       try {
 *         const data = await api.getUserPlans(userId);
 *         setPlans(data);
 *       } catch (error) {
 *         console.error('Error fetching plans:', error);
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 *     fetchPlans();
 *   }, [userId]);
 * 
 *   return <div>{plans.map(plan => ...)}</div>;
 * };
 */

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
