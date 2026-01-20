# 🚀 Getting Started with Pawcation Backend

## What's Been Built

I've created a complete Python backend for your Pawcation app with:

### ✅ Database Models
- **User**: email, password authentication
- **Pet**: comprehensive pet profiles with health and behavioral data
- **Plan**: travel plans with dates, destinations, and itineraries

### ✅ API Endpoints
Full CRUD operations for Users, Pets, and Plans with proper relationships

### ✅ Frontend Integration
- TypeScript API client (`src/lib/api.ts`)
- Type-safe interfaces matching backend models
- Ready-to-use integration examples

## 📁 Files Created/Modified

### Backend Files
```
backend/
├── main.py              # FastAPI application with all endpoints
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic validation schemas
├── database.py          # Database configuration
├── requirements.txt     # Python dependencies
├── test_api.py         # API testing script
├── .gitignore          # Python gitignore
└── README.md           # Backend documentation
```

### Frontend Files
```
src/lib/
├── api.ts                          # API client with full type safety
└── api-integration-examples.ts    # Usage examples and hooks
```

### Configuration
```
.env.example    # Environment variables template
.env            # Your environment config (VITE_API_URL)
```

## 🎯 Next Steps

### 1. Start the Backend Server

Open a terminal and run:
```bash
cd backend
python3 main.py
```

You should see:
```
✓ Database initialized successfully!
INFO: Uvicorn running on http://0.0.0.0:8000
```

### 2. Test the API

In a **new terminal**, run:
```bash
cd backend
python3 test_api.py
```

This will create sample data and test all endpoints.

### 3. View API Documentation

Visit http://localhost:8000/docs to see the interactive API documentation (Swagger UI).

### 4. Start the Frontend

In another terminal:
```bash
npm run dev
```

Your app will run on http://localhost:5173

## 🔌 Integrating with Frontend Components

### Current State
Your frontend components have **sample/mock data**:
- ProfileTab: uses `samplePets` array
- TripSearchForm: has form but doesn't save data
- PlanTab: displays mock plans

### Integration Steps

#### Step 1: Add User Authentication Context

Create `src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  userId: number | null;
  setUserId: (id: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  setUserId: () => {},
});

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(1); // Default for testing
  
  return (
    <AuthContext.Provider value={{ userId, setUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### Step 2: Update ProfileTab.tsx

Replace sample data with real API calls:

```typescript
import { useState, useEffect } from 'react';
import { api, Pet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const ProfileTab = () => {
  const { userId } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchPets = async () => {
      try {
        const data = await api.getUserPets(userId);
        setPets(data);
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [userId]);

  const handleAddPet = async (petData: Omit<Pet, 'pet_id'>) => {
    try {
      const newPet = await api.createPet({
        ...petData,
        user_id: userId!,
      });
      setPets([...pets, newPet]);
    } catch (error) {
      console.error('Failed to create pet:', error);
    }
  };

  // Rest of your component...
};
```

#### Step 3: Update TripSearchForm.tsx

Save the plan to the backend:

```typescript
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const TripSearchForm = ({ onSearch }: TripSearchFormProps) => {
  const { userId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const plan = await api.createPlan({
        user_id: userId!,
        origin: formData.origin,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        num_adults: formData.adults,
        num_children: formData.children,
        num_humans: formData.adults + formData.children,
        pet_ids: formData.pets.join(','),
        trip_type: 'Direct Trip',
      });
      
      onSearch(formData); // Keep existing behavior
      console.log('Plan saved:', plan);
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  // Rest of component...
};
```

#### Step 4: Update PlanTab.tsx

Fetch real plans:

```typescript
import { useState, useEffect } from 'react';
import { api, Plan } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const PlanTab = () => {
  const { userId } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchPlans = async () => {
      const data = await api.getUserPlans(userId);
      setPlans(data);
    };

    fetchPlans();
  }, [userId]);

  // Display real plans...
};
```

## 📊 Database Schema Reference

### User Model
```python
user_id: int (primary key)
email: str (unique)
password: str
```

### Pet Model
```python
pet_id: int (primary key)
user_id: int (foreign key)
name: str
breed: str
birthday: date
weight: float
rabies_vaccinated: bool
rabies_expiration: date
microchip_id: str
separation_anxiety_level: int (1-5)
flight_comfort_level: int (1-5)
daily_exercise_need: int (1-5)
environment_preference: str
personality_archetype: str
image_url: str
```

### Plan Model
```python
plan_id: int (primary key)
user_id: int (foreign key)
start_date: date
end_date: date
trip_type: str
destination: str
places_passing_by: str
detailed_itinerary: str (JSON)
num_humans: int
num_adults: int
num_children: int
budget: float
origin: str
pet_ids: str (comma-separated)
```

## 🧪 Testing Your Integration

1. **Start both servers** (backend and frontend)
2. **Open browser console** (F12)
3. **Try the API in console**:

```javascript
// Test creating a user
fetch('http://localhost:8000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(console.log);
```

## 🔒 Security Notes

### Current Setup (Development)
- Passwords stored as plain text
- No authentication required
- CORS enabled for localhost

### Before Production
- [ ] Implement password hashing (bcrypt)
- [ ] Add JWT authentication
- [ ] Validate all inputs
- [ ] Add rate limiting
- [ ] Use environment variables for secrets
- [ ] Set up proper CORS origins
- [ ] Use HTTPS

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **React Query**: Consider adding for better data fetching

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>
```

### Database errors
```bash
# Delete and recreate database
rm backend/pawcation.db
python3 backend/main.py
```

### Frontend can't connect to backend
1. Check `.env` file has `VITE_API_URL=http://localhost:8000`
2. Restart frontend: `npm run dev`
3. Check CORS settings in `backend/main.py`

### Import errors
```bash
# Reinstall backend dependencies
cd backend
pip install -r requirements.txt --force-reinstall
```

## 🎉 You're Ready!

Your Pawcation backend is fully set up and ready to integrate with your frontend. The database will store all user, pet, and plan data locally in SQLite.

Start both servers and begin building amazing pet-friendly travel experiences! 🐾
