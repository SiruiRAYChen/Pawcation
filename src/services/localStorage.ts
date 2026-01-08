// Local storage service to replace Supabase database

export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  created_at: string;
}

export interface PetProfile {
  id: string;
  user_id: string;
  name: string;
  breed?: string;
  age_estimate?: string;
  weight_estimate?: string;
  weight_unit: string;
  rabies_vaccinated: string;
  separation_anxiety: string;
  flight_comfort: string;
  daily_exercise_need: string;
  environment_preference: string;
  personality_archetype: string;
  image_url?: string;
  gemini_raw_response?: any;
  created_at: string;
  updated_at: string;
}

const USERS_KEY = 'pawcation_users';
const PROFILES_KEY = 'pawcation_profiles';
const CURRENT_USER_KEY = 'pawcation_current_user';

// Helper to generate UUIDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// User management
export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function createUser(email: string, password: string): User {
  const users = getUsers();
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }

  const newUser: User = {
    id: generateUUID(),
    email,
    password, // WARNING: In production, hash this!
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  
  return newUser;
}

export function loginUser(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    setCurrentUser(user);
  }
  
  return user || null;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Pet profile management
export function getProfiles(): PetProfile[] {
  const data = localStorage.getItem(PROFILES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveProfiles(profiles: PetProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getUserProfiles(userId: string): PetProfile[] {
  const profiles = getProfiles();
  return profiles.filter(p => p.user_id === userId);
}

export function createProfile(data: Omit<PetProfile, 'id' | 'created_at' | 'updated_at'>): PetProfile {
  const profiles = getProfiles();
  
  const newProfile: PetProfile = {
    ...data,
    id: generateUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  profiles.push(newProfile);
  saveProfiles(profiles);
  
  return newProfile;
}

export function updateProfile(id: string, data: Partial<PetProfile>): PetProfile | null {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === id);
  
  if (index === -1) return null;

  profiles[index] = {
    ...profiles[index],
    ...data,
    updated_at: new Date().toISOString(),
  };

  saveProfiles(profiles);
  return profiles[index];
}

export function deleteProfile(id: string): boolean {
  const profiles = getProfiles();
  const filteredProfiles = profiles.filter(p => p.id !== id);
  
  if (filteredProfiles.length === profiles.length) {
    return false; // Profile not found
  }

  saveProfiles(filteredProfiles);
  return true;
}

// Image storage (base64 encoded in localStorage)
export function saveImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
