# Google Maps Autocomplete & City Format Update

## Summary
Added Google Maps autocomplete functionality to the trip planning form and updated Gemini prompts to ensure all city names use the "City, State" format for proper geocoding in the Maps module.

## Changes Made

### 1. Frontend - PlaceAutocomplete Component
**File**: `src/components/plan/PlaceAutocomplete.tsx` (NEW)
- Created a reusable autocomplete component with dropdown suggestions
- Uses backend proxy API to avoid CORS issues
- Debounced input (300ms) for efficient API calls
- Returns clean "City, State" format (e.g., "Boston, MA")
- Loading state with spinner indicator
- Click-outside-to-close functionality

### 2. Frontend - TripSearchForm Update
**File**: `src/components/plan/TripSearchForm.tsx`
- Replaced basic `Input` components with `PlaceAutocomplete`
- Updated imports to include new component
- Origin and destination fields now have autocomplete
- Maintained existing icons (MapPin, Plane, Car)
- Updated placeholders to show "City, State" format examples

### 3. Backend - Autocomplete Proxy Endpoint
**File**: `backend/main.py`
- Added `/api/places/autocomplete` GET endpoint
- Uses Google Geocoding API to get city suggestions
- Filters to US cities only (`components=country:US`)
- Extracts clean "City, State" format from address components
- Uses short state names (e.g., "CA" not "California")
- Returns up to 5 unique suggestions
- Avoids duplicates with set tracking

### 4. Backend - Gemini Prompt Updates
**File**: `backend/gemini_service.py`

#### `generate_travel_itinerary()` (Flight trips)
- Added instruction #8: "LOCATION FORMAT REQUIREMENT: ALL city names in 'subtitle' fields MUST use the format 'City, State'"
- Updated example JSON to show proper format:
  ```json
  "subtitle": "Los Angeles, California • Check-in time"
  ```
- Added reminder at end of prompt about city format requirement

#### `generate_road_trip_itinerary()` (Road trips)
- Added instruction #10: "LOCATION FORMAT REQUIREMENT: ALL city names in 'subtitle' and 'dayLabel' fields MUST use format 'City, State'"
- Updated all example items to show proper format:
  ```json
  "subtitle": "Santa Barbara, California • 30-minute break"
  "subtitle": "San Luis Obispo, California • Outdoor patio"
  "subtitle": "San Francisco, California • No pet fee"
  ```
- Emphasized this is CRITICAL for map functionality

## Technical Details

### API Flow
1. User types in origin/destination field
2. After 300ms debounce, frontend calls backend proxy
3. Backend hits Google Geocoding API with US country filter
4. Backend extracts city and state from address components
5. Backend returns clean "City, State" format
6. Frontend displays suggestions in dropdown
7. User selects, form gets "City, State" value

### Why This Fixes the Maps Issue
**Before**: Cities stored as just "Boston" → geocoding failed (too ambiguous)
**Now**: 
- Autocomplete ensures proper input: "Boston, MA"
- Gemini outputs proper format: "Boston, Massachusetts"
- Geocoding API can accurately locate cities
- Maps module displays pins correctly

### State Format
- Backend proxy uses **short state names** (CA, MA, NY)
- Gemini uses **full state names** (California, Massachusetts, New York)
- Both formats work with Google Geocoding API

## Testing Instructions

1. **Start Backend** (if not running):
   ```bash
   cd backend
   python start_server.py
   ```

2. **Test Autocomplete**:
   - Go to Plan tab
   - Type in "From" field (e.g., "san fran")
   - Should see dropdown with "San Francisco, CA"
   - Select a city
   - Repeat for "To" field

3. **Test Itinerary Generation**:
   - Generate a new trip with autocomplete-selected cities
   - Check itinerary items in generated plan
   - Verify subtitles show "City, State" format

4. **Test Maps Module**:
   - Add photos to past trips
   - Go to Memories → Maps tab
   - Should see map load successfully
   - All cities should geocode properly
   - No more "No geocoding results" errors

## Environment Variables
Backend uses Google Maps API key from environment:
```python
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyByLgNG16tQrEhJXBf30S6GlQ6OfZ66PT4")
```

Fallback key is hardcoded, but for production should be in `.env` file.

## Benefits

1. **Better UX**: Users don't need to remember exact city names
2. **Data Quality**: Ensures consistent "City, State" format throughout app
3. **Geocoding Reliability**: Proper city format = successful geocoding
4. **Error Prevention**: Autocomplete prevents typos and ambiguous entries
5. **Professional Feel**: Modern autocomplete experience

## Future Enhancements

1. Support international cities (remove US-only filter)
2. Add airport code support for flight mode
3. Show recent/favorite locations
4. Add distance calculation between selected cities
5. Highlight matching text in suggestions
