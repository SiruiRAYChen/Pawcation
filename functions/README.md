# Firebase Cloud Functions for Pawcation

This directory contains the backend Cloud Functions for the Pawcation app.

## Structure

```
functions/
├── src/
│   ├── index.ts              # Main entry point
│   ├── services/
│   │   └── geminiService.ts  # Gemini AI integration
│   ├── routes/
│   │   ├── users.ts          # User management
│   │   ├── pets.ts           # Pet CRUD & analysis
│   │   ├── plans.ts          # Travel planning
│   │   ├── memories.ts       # Trip memories
│   │   └── places.ts         # Google Places API
│   └── triggers/
│       └── userTriggers.ts   # Firestore triggers
├── package.json
├── tsconfig.json
└── .env                      # Environment variables
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```bash
GEMINI_API_KEY=your-key
GOOGLE_MAPS_API_KEY=your-key
```

3. Build:
```bash
npm run build
```

4. Test with emulators:
```bash
cd ..
firebase emulators:start
```

## Deployment

From the root directory:
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## API Endpoints

All endpoints are under `/api`:

### Users
- `POST /api/users` - Create user (handled by Auth)
- `GET /api/users/:userId` - Get user with pets/plans
- `PUT /api/users/:userId` - Update user
- `POST /api/users/login` - Login (compatibility)

### Pets
- `POST /api/pets` - Create pet
- `GET /api/pets/:petId` - Get pet
- `GET /api/pets/user/:userId/pets` - Get user's pets
- `PUT /api/pets/:petId` - Update pet
- `DELETE /api/pets/:petId` - Delete pet
- `POST /api/pets/analyze-image` - Analyze pet image with AI

### Plans
- `POST /api/plans` - Create plan
- `GET /api/plans/:planId` - Get plan
- `GET /api/plans/user/:userId/plans` - Get user's plans
- `PUT /api/plans/:planId` - Update plan
- `DELETE /api/plans/:planId` - Delete plan
- `POST /api/plans/generate-itinerary` - Generate itinerary
- `POST /api/plans/generate-road-trip-itinerary` - Generate road trip
- `POST /api/plans/save` - Save generated itinerary

### Memories
- `GET /api/memories/past-trips/:userId` - Get past trips
- `GET /api/memories/photos/:tripId` - Get trip photos
- `POST /api/memories/photos` - Add memory photo
- `DELETE /api/memories/photos/:photoId` - Delete photo
- `GET /api/memories/visited-cities/:userId` - Get visited cities
- `DELETE /api/memories/trips/:tripId` - Delete trip

### Places
- `GET /api/places/autocomplete?input=...` - Google Places autocomplete

## Environment Variables

Required in `.env`:
- `GEMINI_API_KEY` - For AI features
- `GOOGLE_MAPS_API_KEY` - For places autocomplete

## Firestore Collections

- `users` - User profiles
- `pets` - Pet information
- `plans` - Travel plans
- `memoryPhotos` - Trip photos

## Firebase Triggers

- `onUserDeleted` - Cleanup user data when account is deleted
