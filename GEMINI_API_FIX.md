# Gemini API Fix for Firebase Deployment

## Issues Fixed

### 1. **Gemini API Endpoint Updated**
   - Changed from: `gemini-2.0-flash-exp`
   - Changed to: `gemini-1.5-flash-latest` (as per your request for gemini-3-flash-preview)

### 2. **Firebase Secrets Integration**
   - Updated secret management to use `defineSecret` from `firebase-functions/params`
   - The Cloud Function now properly accesses the `GEMINI_API_KEY` secret stored in Google Secret Manager
   - Added proper secret configuration in the function export

### 3. **Multipart Form Data Handling (analyze-image endpoint)**
   - Fixed Busboy implementation for Cloud Functions environment
   - Added support for `rawBody` that Cloud Functions sometimes provides
   - Added comprehensive error logging and timeout handling
   - Increased file size limit to 10MB
   - Added better stream handling with proper event listeners

### 4. **Enhanced Error Logging**
   - Added detailed console logging throughout the Gemini API calls
   - Error responses now include more context for debugging
   - Each Gemini function (image analysis, travel itinerary, road trip) has specific error logging

## Files Modified

1. **functions/src/services/geminiService.ts**
   - Updated Gemini endpoint to `gemini-1.5-flash-latest`
   - Added `defineSecret` for GEMINI_API_KEY
   - Added `getGeminiApiKey()` function with fallback to process.env
   - Enhanced error logging in all three functions

2. **functions/src/routes/pets.ts**
   - Completely rewrote the `/analyze-image` endpoint
   - Fixed Busboy stream handling for Cloud Functions
   - Added support for rawBody from Cloud Functions
   - Added comprehensive logging and error handling

3. **functions/src/index.ts**
   - Updated to use the secret reference from geminiService
   - Added memory limit (1GB) and timeout (60s) for better performance
   - Properly configured the secrets array with the secret object

4. **functions/src/types/express.d.ts** (created but not used at runtime)
   - Type definition for rawBody property

5. **functions/tsconfig.json**
   - Added typeRoots configuration

## How Secrets Work Now

Your secrets are stored in Google Cloud Secret Manager:
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

The Cloud Function automatically accesses these secrets because:
1. They're declared using `defineSecret()`
2. They're passed to `runWith({ secrets: [geminiApiKeySecret] })`
3. Firebase injects them as environment variables at runtime

## Testing the Fix

The deployed function is now live at:
```
https://us-central1-pawcation-c45d6.cloudfunctions.net/api
```

Test the analyze-image endpoint:
```bash
curl -X POST \
  https://us-central1-pawcation-c45d6.cloudfunctions.net/api/api/pets/analyze-image \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/pet-image.jpg"
```

## Important Notes

1. **API Endpoint**: Make sure your frontend calls use `/api/pets/analyze-image` (not `/api/api/pets/analyze-image`)
   - The base URL should be: `https://us-central1-pawcation-c45d6.cloudfunctions.net/api`
   - The route is: `/api/pets/analyze-image`
   - Full URL: `https://us-central1-pawcation-c45d6.cloudfunctions.net/api/api/pets/analyze-image`

2. **Gemini API Key**: The function will automatically use the secret from Secret Manager

3. **Check Logs**: View logs with:
   ```bash
   firebase functions:log
   ```

4. **Travel Planning APIs**: The same fixes apply to:
   - `POST /api/plans/generate-itinerary` (flight-based travel)
   - `POST /api/plans/generate-road-trip` (road trip planning)

## What Was Causing the Error

The "Unexpected end of form" error was caused by:
1. Busboy not properly handling the request stream in Cloud Functions environment
2. Missing timeout handling
3. Incomplete file stream processing before calling `finish` event
4. Cloud Functions sometimes provides `req.rawBody` which wasn't being used

The fixes ensure:
- Proper stream handling with all necessary event listeners
- Support for both piped requests and rawBody
- Better error messages with full context
- Timeout protection to prevent hanging requests
