import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, functions, storage } from './firebase';

// Types (keeping existing types from api.ts)
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
  date_of_birth?: string;
  is_dob_estimated?: boolean;
  gotcha_day?: string;
  age?: string;
  size?: string;
  gender?: string;
  personality?: string[];
  health?: string;
  appearance?: string;
  rabies_expiration?: string;
  microchip_id?: string;
  image_url?: string;
  avatar_url?: string;
}

export interface Plan {
  plan_id?: string;
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
}

export interface UserFull extends User {
  pets: Pet[];
  plans: Plan[];
}

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
  total_estimated_cost?: number;
  budget?: number;
}

export interface ItineraryGenerateRequest {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  pet_id: string;
  num_adults: number;
  num_children: number;
  budget?: number;
}

// Helper function to convert Firestore data
function convertPetFromFirestore(id: string, data: any): Pet {
  return {
    pet_id: id,
    user_id: data.userId,
    name: data.name,
    breed: data.breed,
    gender: data.gender,
    date_of_birth: data.dateOfBirth,
    is_dob_estimated: data.isDobEstimated,
    gotcha_day: data.gotchaDay,
    size: data.size,
    personality: data.personality,
    health: data.health,
    appearance: data.appearance,
    rabies_expiration: data.rabiesExpiration,
    microchip_id: data.microchipId,
    image_url: data.imageUrl,
    avatar_url: data.avatarUrl,
  };
}

function convertPlanFromFirestore(id: string, data: any): Plan {
  return {
    plan_id: id,
    user_id: data.userId,
    start_date: data.startDate,
    end_date: data.endDate,
    trip_type: data.tripType,
    is_round_trip: data.isRoundTrip,
    destination: data.destination,
    places_passing_by: data.placesPassingBy,
    detailed_itinerary: data.detailedItinerary,
    num_humans: data.numHumans,
    num_adults: data.numAdults,
    num_children: data.numChildren,
    budget: data.budget,
    origin: data.origin,
    pet_ids: data.petIds,
  };
}

// ========== USER API ==========
export async function getUser(userId: string): Promise<UserFull> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  
  // Get pets
  const petsQuery = query(collection(db, 'pets'), where('userId', '==', userId));
  const petsSnapshot = await getDocs(petsQuery);
  const pets = petsSnapshot.docs.map(doc => convertPetFromFirestore(doc.id, doc.data()));

  // Get plans
  const plansQuery = query(collection(db, 'plans'), where('userId', '==', userId));
  const plansSnapshot = await getDocs(plansQuery);
  const plans = plansSnapshot.docs.map(doc => convertPlanFromFirestore(doc.id, doc.data()));

  return {
    user_id: userDoc.id,
    email: userData.email,
    name: userData.name,
    avatar_url: userData.avatar_url,
    pets,
    plans,
  };
}

export async function updateUser(userId: string, updates: UserUpdate): Promise<User> {
  const userRef = doc(db, 'users', userId);
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
  
  await updateDoc(userRef, updateData);
  
  const updatedDoc = await getDoc(userRef);
  const data = updatedDoc.data();
  
  return {
    user_id: updatedDoc.id,
    email: data?.email || '',
    name: data?.name,
    avatar_url: data?.avatar_url,
  };
}

// ========== PET API ==========
export async function createPet(pet: Pet): Promise<Pet> {
  const petData = {
    userId: pet.user_id,
    name: pet.name,
    breed: pet.breed || null,
    gender: pet.gender || null,
    dateOfBirth: pet.date_of_birth || null,
    isDobEstimated: pet.is_dob_estimated || false,
    gotchaDay: pet.gotcha_day || null,
    size: pet.size || null,
    personality: pet.personality || [],
    health: pet.health || null,
    appearance: pet.appearance || null,
    rabiesExpiration: pet.rabies_expiration || null,
    microchipId: pet.microchip_id || null,
    imageUrl: pet.image_url || null,
    avatarUrl: pet.avatar_url || null,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'pets'), petData);
  return convertPetFromFirestore(docRef.id, petData);
}

export async function getPet(petId: string): Promise<Pet> {
  const petDoc = await getDoc(doc(db, 'pets', petId));
  if (!petDoc.exists()) {
    throw new Error('Pet not found');
  }
  return convertPetFromFirestore(petDoc.id, petDoc.data());
}

export async function getUserPets(userId: string): Promise<Pet[]> {
  const q = query(collection(db, 'pets'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertPetFromFirestore(doc.id, doc.data()));
}

export async function updatePet(petId: string, updates: Partial<Pet>): Promise<Pet> {
  const petRef = doc(db, 'pets', petId);
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.breed !== undefined) updateData.breed = updates.breed;
  if (updates.gender !== undefined) updateData.gender = updates.gender;
  if (updates.date_of_birth !== undefined) updateData.dateOfBirth = updates.date_of_birth;
  if (updates.is_dob_estimated !== undefined) updateData.isDobEstimated = updates.is_dob_estimated;
  if (updates.gotcha_day !== undefined) updateData.gotchaDay = updates.gotcha_day;
  if (updates.size !== undefined) updateData.size = updates.size;
  if (updates.personality !== undefined) updateData.personality = updates.personality;
  if (updates.health !== undefined) updateData.health = updates.health;
  if (updates.appearance !== undefined) updateData.appearance = updates.appearance;
  if (updates.rabies_expiration !== undefined) updateData.rabiesExpiration = updates.rabies_expiration;
  if (updates.microchip_id !== undefined) updateData.microchipId = updates.microchip_id;
  if (updates.image_url !== undefined) updateData.imageUrl = updates.image_url;
  if (updates.avatar_url !== undefined) updateData.avatarUrl = updates.avatar_url;

  await updateDoc(petRef, updateData);
  
  const updatedDoc = await getDoc(petRef);
  return convertPetFromFirestore(updatedDoc.id, updatedDoc.data());
}

export async function deletePet(petId: string): Promise<void> {
  await deleteDoc(doc(db, 'pets', petId));
}

export async function analyzePetImage(imageFile: File): Promise<any> {
  const analyzePetImageFn = httpsCallable(functions, 'api');
  
  // Convert file to base64
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzePetImageFn({
          path: '/api/pets/analyze-image',
          method: 'POST',
          body: {
            image: base64,
            mimeType: imageFile.type,
          },
        });
        resolve(result.data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

// ========== STORAGE API ==========
export async function uploadPetImage(userId: string, petId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `pets/${userId}/${petId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadPetAvatar(userId: string, petId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `pets/${userId}/${petId}/avatar_${Date.now()}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `avatars/${userId}/avatar_${Date.now()}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ========== PLAN API ==========
export async function createPlan(plan: Plan): Promise<Plan> {
  const planData = {
    userId: plan.user_id,
    startDate: plan.start_date,
    endDate: plan.end_date,
    tripType: plan.trip_type || null,
    isRoundTrip: plan.is_round_trip || false,
    destination: plan.destination || null,
    placesPassingBy: plan.places_passing_by || null,
    detailedItinerary: plan.detailed_itinerary || null,
    numHumans: plan.num_humans,
    numAdults: plan.num_adults,
    numChildren: plan.num_children,
    budget: plan.budget || null,
    origin: plan.origin || null,
    petIds: plan.pet_ids || null,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'plans'), planData);
  return convertPlanFromFirestore(docRef.id, planData);
}

export async function getUserPlans(userId: string): Promise<Plan[]> {
  const q = query(collection(db, 'plans'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertPlanFromFirestore(doc.id, doc.data()));
}

export async function updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan> {
  const planRef = doc(db, 'plans', planId);
  const updateData: any = {};
  
  if (updates.start_date !== undefined) updateData.startDate = updates.start_date;
  if (updates.end_date !== undefined) updateData.endDate = updates.end_date;
  if (updates.trip_type !== undefined) updateData.tripType = updates.trip_type;
  if (updates.is_round_trip !== undefined) updateData.isRoundTrip = updates.is_round_trip;
  if (updates.destination !== undefined) updateData.destination = updates.destination;
  if (updates.places_passing_by !== undefined) updateData.placesPassingBy = updates.places_passing_by;
  if (updates.detailed_itinerary !== undefined) updateData.detailedItinerary = updates.detailed_itinerary;
  if (updates.num_humans !== undefined) updateData.numHumans = updates.num_humans;
  if (updates.num_adults !== undefined) updateData.numAdults = updates.num_adults;
  if (updates.num_children !== undefined) updateData.numChildren = updates.num_children;
  if (updates.budget !== undefined) updateData.budget = updates.budget;
  if (updates.origin !== undefined) updateData.origin = updates.origin;
  if (updates.pet_ids !== undefined) updateData.petIds = updates.pet_ids;

  await updateDoc(planRef, updateData);
  
  const updatedDoc = await getDoc(planRef);
  return convertPlanFromFirestore(updatedDoc.id, updatedDoc.data());
}

export async function deletePlan(planId: string): Promise<void> {
  await deleteDoc(doc(db, 'plans', planId));
}

export async function generateItinerary(request: ItineraryGenerateRequest): Promise<ItineraryResponse> {
  const generateItineraryFn = httpsCallable(functions, 'api');
  const result = await generateItineraryFn({
    path: '/api/plans/generate-itinerary',
    method: 'POST',
    body: request,
  });
  return result.data as ItineraryResponse;
}

// ========== PLACES API ==========
export async function getPlacesAutocomplete(input: string): Promise<any> {
  const API_URL = import.meta.env.VITE_API_URL || 'https://us-central1-pawcation-c45d6.cloudfunctions.net/api';
  
  const response = await fetch(
    `${API_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch autocomplete: ${response.statusText}`);
  }
  
  return response.json();
}

// Re-export all types and functions
export * from './firebase';
