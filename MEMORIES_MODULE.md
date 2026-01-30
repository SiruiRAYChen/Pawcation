# Memories Module - Implementation Documentation

## Overview

The Memories module is a brand-new feature that displays past trips in a notebook-style interface and visualizes visited locations on a map. This module automatically converts completed travel plans into memories once the trip's end date passes.

## Architecture

### Backend Components

#### 1. Database Models (`backend/models.py`)

**MemoryPhoto Model**
- `photo_id`: Primary key
- `trip_id`: Foreign key to Plan (trip)
- `user_id`: Foreign key to User
- `local_path`: Storage path/URL for photo
- `city_name`: City-level location (e.g., "Boston, Massachusetts")
- `created_at`: Timestamp of photo creation

#### 2. API Schemas (`backend/schemas.py`)

**MemoryPhotoBase, MemoryPhotoCreate, MemoryPhotoResponse**
- Handle photo creation and retrieval

**PastTripResponse**
- Extended Plan response with:
  - `cover_photo`: First photo of the trip
  - `photo_count`: Total number of photos
  - `visited_cities`: List of cities visited

**VisitedCityResponse**
- City-level aggregation for map display:
  - `city_name`: Name of city
  - `trip_ids`: List of trips that visited this city
  - `photo_count`: Total photos for this city
  - `trip_color`: Color for map pin (shared across road trip cities)

#### 3. API Endpoints (`backend/main.py`)

**GET /api/memories/past-trips/{user_id}**
- Returns all trips where `end_date < today`
- Sorted by newest first
- Includes cover photo, photo count, and visited cities

**GET /api/memories/photos/{trip_id}**
- Query param: `city_name` (optional)
- Returns photos for a specific trip
- Can filter by city for road trips

**POST /api/memories/photos**
- Add new photo to a trip
- Body: `{ trip_id, user_id, local_path, city_name? }`

**DELETE /api/memories/photos/{photo_id}**
- Remove a specific photo

**GET /api/memories/visited-cities/{user_id}**
- Returns aggregated city data for map display
- Deduplicates cities visited across multiple trips
- Assigns colors per trip (road trip cities share color)

**DELETE /api/memories/trips/{trip_id}**
- Delete a past trip and all associated photos

### Frontend Components

#### 1. Main Navigation (`src/pages/MemoriesTab.tsx`)

The main Memories tab with two sub-pages:
- **Past Trips** (default): Notebook-style list view
- **Maps**: Interactive map with city pins

Uses tab navigation to switch between views.

#### 2. Past Trips Page (`src/pages/PastTripsPage.tsx`)

**Features:**
- Displays completed trips as cards
- Each card shows:
  - Cover photo (first photo or placeholder)
  - Trip title (destination)
  - Date range (formatted like "Jan 2026")
  - Pet avatars (up to 3 visible, +N indicator)
  - Photo count
  - Trip type badge
- **Swipe-to-delete**: Swipe left on card to reveal delete button
- Click card → navigate to Trip Detail page

**Key Functions:**
- `getPetsForTrip()`: Extracts pets associated with a trip
- `formatTimeLabel()`: Creates readable date range
- Delete confirmation dialog

#### 3. Trip Detail Page (`src/pages/TripDetailPage.tsx`)

**Features:**
- **Itinerary Timeline**: Reuses existing `ItineraryTimeline` component
  - Shows day-by-day structure
  - Displays Gemini tips and alerts
- **Photo Gallery**:
  - Grid layout with photos
  - Add Photo button (file upload)
  - Delete photo on hover
  - Shows city name tag on photos
- Photos default to first city for road trips

**Key Functions:**
- `handleFileChange()`: Uploads photo (creates object URL)
- `parseItinerary()`: Parses JSON itinerary string
- `handleDeletePhoto()`: Removes photo with confirmation

#### 4. Maps Page (`src/pages/MapsPage.tsx`)

**Features:**
- **Google Maps Static API Integration**:
  - Uses API key: `AIzaSyByLgNG16tQrEhJXBf30S6GlQ6OfZ66PT4`
  - Displays city-level pins (no detailed addresses)
  - Geocodes city names to coordinates
- **Pin Coloring**:
  - Each trip has a unique color
  - Road trip cities share the same color
  - Color palette: 8 predefined colors, cycles for more trips
- **Pin Interaction**:
  - Click pin → opens bottom sheet
  - Shows city name, trips, pet avatars
  - Photo gallery for selected trip + city
  - Add/delete photos
- **Multi-trip Support**:
  - If city visited in multiple trips, show trip selector
  - Photos are organized per trip

**Key Functions:**
- `geocodeCities()`: Converts city names to lat/lng using Google Geocoding API
- `getStaticMapUrl()`: Generates map image URL with colored pins
- `handlePinClick()`: Opens city detail sheet
- `getTripsForCity()`: Finds all trips that visited a city
- `getPetsForTrip()`: Gets pets for selected trip

### API Integration (`src/lib/api.ts`)

**New Types:**
- `MemoryPhoto`, `MemoryPhotoCreate`
- `PastTrip` (extends Plan)
- `VisitedCity`

**New Methods:**
- `getPastTrips(userId)`
- `getTripPhotos(tripId, cityName?)`
- `addMemoryPhoto(photo)`
- `deleteMemoryPhoto(photoId)`
- `getVisitedCities(userId)`
- `deletePastTrip(tripId)`

## Data Flow

### Converting Plans to Past Trips

1. Backend endpoint checks `Plan.end_date < today`
2. Automatically filters and returns as past trips
3. Frontend queries `/api/memories/past-trips/{user_id}`

### Photo Management

**Adding Photos:**
1. User clicks "Add Photo" in Trip Detail or Maps
2. File input opens, user selects image
3. Frontend creates object URL (`URL.createObjectURL(file)`)
4. POST to `/api/memories/photos` with:
   - `trip_id`
   - `user_id`
   - `local_path` (object URL)
   - `city_name` (default to first city or destination)
5. Photo appears in gallery and map pin

**Photo-to-City Mapping:**
- **Direct flight trip**: Single city, all photos attached to that city
- **Road trip**: Photos can be attached to specific cities
  - Default: First city in route
  - Can be reassigned from Maps view

### Map Pin Logic

**City Deduplication:**
- Same city visited in multiple trips = ONE pin
- Pin aggregates all trips and photos for that city

**Color Assignment:**
- Deterministic: `trip_id % colors.length`
- Road trip: All cities use same color
- Different trips: Different colors

**Pin Positioning:**
- Geocode city name → (lat, lng)
- Convert to pixel position on static map
- Render interactive overlay button

## User Flows

### Viewing Past Trips
1. Navigate to Memories tab
2. Default view: Past Trips list
3. Scroll through notebook-style cards
4. Tap card → see trip details

### Viewing Trip Details
1. From Past Trips, tap a card
2. See itinerary timeline
3. Browse photo gallery
4. Add or delete photos

### Using the Map
1. Switch to Maps tab
2. See all visited cities as pins
3. Tap pin → see city details
4. If multiple trips, select trip
5. View/add/delete photos for that trip + city

### Deleting a Trip
1. From Past Trips, swipe left on card
2. Confirm deletion
3. Trip and all photos removed

## Technical Decisions

### Why Google Maps Static API?
- Simpler than interactive map libraries
- No complex state management
- Sufficient for city-level display
- Overlay buttons for interactivity

### Why City-Level Only?
- Avoids token overflow in Gemini responses
- Simplifies data structure
- Easier geocoding
- Matches travel planning granularity

### Why Separate Photos by Trip+City?
- Road trips need per-city organization
- Maps view requires city grouping
- Trip Detail shows all trip photos
- Flexible data model supports both views

### Photo Storage
- Currently: Local object URLs (`URL.createObjectURL`)
- Production: Upload to cloud storage (S3, Azure Blob)
- Metadata stored in database
- `local_path` field can store URL or path

## Integration with Existing Features

### Dependencies on Plans
- Uses existing `Plan` model
- Filters by `end_date < today`
- Reuses plan data structure

### Dependencies on Pets
- Uses existing `Pet` model
- Displays pet avatars in trip cards
- Associates photos with pets via trips

### Reusing Components
- `ItineraryTimeline`: Displays trip schedule
- `Avatar`, `Button`, `Sheet`: UI components
- `AlertDialog`: Delete confirmations

## Future Enhancements

1. **Photo Upload to Cloud**
   - Replace object URLs with actual file upload
   - Integrate with AWS S3 or Azure Blob Storage

2. **Photo Location Picker**
   - In Trip Detail, assign photos to specific cities
   - Dropdown or city selector for road trips

3. **Photo Captions**
   - Add notes to photos
   - Display in gallery view

4. **Map Interactivity**
   - Switch to Google Maps JavaScript API
   - Pan, zoom, cluster pins

5. **Share Memories**
   - Export trip as PDF
   - Share album via link

6. **Trip Statistics**
   - Total miles traveled
   - Most visited state/city
   - Photo timeline view

## Testing Checklist

- [ ] Past trips display correctly
- [ ] Trips sort newest first
- [ ] Cover photo shows first uploaded photo
- [ ] Swipe-to-delete works
- [ ] Trip Detail shows itinerary
- [ ] Photo upload works
- [ ] Photo delete works
- [ ] Maps show correct pins
- [ ] Pin colors match trips
- [ ] Pin tap opens city detail
- [ ] Multi-trip city selector works
- [ ] Photo sync between Trip Detail and Maps
- [ ] Delete trip removes all photos

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/memories/past-trips/{user_id}` | Get all past trips |
| GET | `/api/memories/photos/{trip_id}` | Get trip photos (optional city filter) |
| POST | `/api/memories/photos` | Add photo to trip |
| DELETE | `/api/memories/photos/{photo_id}` | Delete photo |
| GET | `/api/memories/visited-cities/{user_id}` | Get city aggregation for map |
| DELETE | `/api/memories/trips/{trip_id}` | Delete trip and photos |

## File Structure

```
backend/
├── models.py          # MemoryPhoto model
├── schemas.py         # Memory schemas
└── main.py            # Memory endpoints

src/
├── pages/
│   ├── MemoriesTab.tsx      # Main tab with navigation
│   ├── PastTripsPage.tsx    # List view
│   ├── TripDetailPage.tsx   # Detail + photos
│   └── MapsPage.tsx         # Map with pins
├── lib/
│   └── api.ts               # API client methods
└── App.tsx                  # Routes
```

## Environment Variables

Google Maps API Key is hardcoded in `MapsPage.tsx`:
```typescript
const GOOGLE_MAPS_API_KEY = "AIzaSyByLgNG16tQrEhJXBf30S6GlQ6OfZ66PT4";
```

For production, move to `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

## Notes

- All times use ISO format (YYYY-MM-DD)
- Photos stored locally (upgrade to cloud storage recommended)
- City names must be geocodable (include state/country)
- Map pins limited by static map URL length (~2000 chars)
- Color palette supports up to 8 trips, cycles after
