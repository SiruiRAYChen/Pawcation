# Pawcation - Local Development Guide

## Migration from Lovable

This project has been migrated from Lovable to run entirely locally with a Python backend. Here's what changed:

### Architecture Changes

**Old (Lovable):**
- Frontend calls Lovable AI Gateway
- Supabase for database and auth
- Cloud storage for images

**New (Local):**
- **Frontend**: React/Vite with localStorage
- **Backend**: Python Flask + Google GenAI SDK
- **AI Model**: Gemini 2.0 Flash (experimental)
- **Storage**: Browser localStorage (development only)

### Changes Made

1. **Backend Migration**: 
   - Created Python Flask backend (`backend/app.py`)
   - Uses Google GenAI SDK with `gemini-2.0-flash-exp` model
   - Secure API key handling (backend only)

2. **Database**: Replaced Supabase database with localStorage
   - All user accounts and pet profiles stored in browser localStorage
   - See `src/services/localStorage.ts` for implementation

3. **Authentication**: Simple local authentication
   - User credentials stored locally (development only)
   - No email verification required

4. **Image Storage**: Images stored as base64 in localStorage
   - No external storage bucket needed
   - Images stored directly with pet profiles

5. **AI Analysis**: Direct Gemini integration via Python
   - Backend processes image uploads
   - Calls Gemini API using official SDK
   - See `backend/app.py`

## Quick Start (Easy Way)

Use the startup script to run both frontend and backend:

```bash
./start-dev.sh
```

This will:
- Set up Python virtual environment (if needed)
- Install dependencies (if needed)
- Start backend on port 5000
- Start frontend on port 8080

Press `Ctrl+C` to stop both services.

## Manual Setup

If you prefer to run services separately:

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Make sure .env file exists with your API key
# backend/.env should contain:
# GEMINI_API_KEY=your_key_here
# PORT=5001

# Start backend
python app.py
```

Backend will run on `http://localhost:5001`

### 2. Frontend Setup

In a **new terminal**:

```bash
# Install dependencies
npm install
# or
bun install

# Make sure .env file exists
# .env should contain:
# VITE_BACKEND_URL=http://localhost:5000

# Start frontend
npm run dev
# or
bun run dev
```

Frontend will run on `http://localhost:8080` (or another port if 8080 is busy)

## Environment Variables

### Frontend (`.env`):
```bash
VITE_BACKEND_URL=http://localhost:5001
```

### Backend (`backend/.env`):
```bash
GEMINI_API_KEY=AIzaSyBQgcSlOx974g3prPSEmZxcpQQe-4fkMVM
PORT=5001
```

### Features

- ✅ Upload dog photos
- ✅ AI-powered breed & personality analysis using Gemini
- ✅ Create pet profiles with detailed information
- ✅ User registration (stored locally)
- ✅ All data persists in browser localStorage

### Important Notes

⚠️ **Data Storage**:
- All data is stored in your browser's localStorage
- Clearing browser data will delete all profiles
- This is suitable for development/testing only

⚠️ **Security**:
- Passwords are stored in plain text (NOT production-ready)
- API key is in frontend code (suitable for development only)
- For production, implement proper backend authentication

⚠️ **API Key**:
- Your Gemini API key is currently exposed in the `.env` file
- For production, move sensitive operations to a backend service
- Consider implementing rate limiting

### Data Structure

**User Object**:
```typescript
{
  id: string;
  email: string;
  password: string;
  created_at: string;
}
```

**Pet Profile Object**:
```typescript
{
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
```

### Clearing Data

To reset the application and clear all data:
```javascript
// Open browser console and run:
localStorage.clear();
```

### Next Steps for Production

If you want to deploy this to production, consider:

1. **Backend API**:
   - Implement a proper backend (Node.js, Python, etc.)
   - Move Gemini API calls to backend
   - Implement secure password hashing (bcrypt, etc.)

2. **Database**:
   - Use a real database (PostgreSQL, MongoDB, etc.)
   - Implement proper data validation
   - Add data backup/export features

3. **Authentication**:
   - Use a proper auth service (Supabase Auth, Auth0, Firebase Auth, etc.)
   - Implement JWT tokens
   - Add email verification

4. **File Storage**:
   - Use cloud storage (AWS S3, Cloudinary, etc.)
   - Implement image optimization
   - Add file size/type validation

5. **Security**:
   - Move API keys to backend
   - Implement rate limiting
   - Add CORS configuration
   - Use HTTPS

### File Structure

```
src/
├── services/
│   ├── localStorage.ts      # Local storage utilities
│   └── geminiService.ts     # Gemini AI integration
├── hooks/
│   └── useSignupFlow.ts     # Updated signup logic
├── components/
│   └── signup/              # Signup form components
├── pages/
│   └── Signup.tsx           # Signup page
└── types/
    └── petProfile.ts        # TypeScript types
```

### Troubleshooting

**Issue**: Gemini API returns 403 error
- Check that your API key is valid
- Ensure you have enabled the Generative Language API in Google Cloud Console

**Issue**: Data not persisting
- Check browser console for localStorage errors
- Ensure you're not in incognito/private mode
- Check if localStorage is full (max ~5-10MB)

**Issue**: Image upload fails
- Check file size (localStorage has size limits)
- Try with smaller images
- Consider implementing image compression

### Development Tips

- Use browser DevTools to inspect localStorage
- Check Network tab to debug Gemini API calls
- The app creates test data on first run
- Each "account" is isolated by email

---

**Happy coding! 🐾**
