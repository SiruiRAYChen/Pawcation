# Python Backend Setup Guide

## Quick Start

### 1. Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv
```

### 2. Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Verify Environment File

Make sure `backend/.env` contains your Gemini API key:
```
GEMINI_API_KEY=YOUR GEMINI KEY
PORT=5001
```

### 5. Run the Backend Server

```bash
python app.py
```

You should see:
```
🐾 Pawcation Backend starting on port 5001...
📡 Frontend should connect to: http://localhost:5001
```

### 6. Test the Backend (Optional)

In another terminal:
```bash
curl http://localhost:5001/health
```

Should return:
```json
{"status": "healthy", "service": "Pawcation Backend"}
```

## Running the Full Application

You need **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# or
bun run dev
```

Then open your browser to the frontend URL (usually `http://localhost:8080`)

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Dog Image
```
POST /api/analyze-dog
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### Test Gemini Connection
```
GET /api/test
```

## Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│         Port: 8080                      │
│                                         │
│  - Upload dog image                     │
│  - Display analysis results             │
│  - Create pet profiles                  │
│  - Store data in localStorage           │
└──────────────┬──────────────────────────┘
               │ HTTP POST
               │ /api/analyze-dog
               ▼
┌─────────────────────────────────────────┐
│       Python Flask Backend              │
│       Port: 5000                        │
│                                         │
│  - Receive base64 image                 │
│  - Decode and validate image            │
│  - Call Google GenAI SDK                │
│  - Parse and return JSON                │
└──────────────┬──────────────────────────┘
               │ Google GenAI SDK
               │ genai.Client()
               ▼
┌─────────────────────────────────────────┐
│          Gemini 2.0 API                 │
│     (gemini-2.0-flash-exp)              │
│                                         │
│  - Image analysis                       │
│  - Breed detection                      │
│  - Personality assessment               │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Backend won't start

**Error: `No module named 'flask'`**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: `GEMINI_API_KEY not found`**
```bash
# Check backend/.env file exists and contains:
GEMINI_API_KEY=your_key_here
```

### Frontend can't connect to backend

**Error: `Failed to fetch` or `CORS error`**
- Make sure backend is running on port 5000
- Check `VITE_BACKEND_URL` in frontend `.env` file
- CORS is enabled in Flask app

### Image analysis fails

**Error: `AI analysis failed`**
- Check backend console for detailed error
- Test Gemini connection: `curl http://localhost:5001/api/test`
- Verify API key has access to Gemini 2.0

## Development Notes

- **API Key Security**: The API key is now stored only in the backend `.env` file, not exposed to the frontend
- **Model**: Currently using `gemini-3-flash-preview` (experimental model with latest features)
- **Image Processing**: Images are sent as base64, decoded in Python, and uploaded to Gemini
- **Error Handling**: Comprehensive error handling for invalid images, API failures, and parsing errors

## Production Deployment

For production deployment:

1. **Backend**:
   - Deploy to a cloud service (Heroku, Railway, Render, AWS, etc.)
   - Set `GEMINI_API_KEY` as environment variable
   - Use a production WSGI server (gunicorn):
     ```bash
     pip install gunicorn
     gunicorn -w 4 app:app
     ```

2. **Frontend**:
   - Update `VITE_BACKEND_URL` to your deployed backend URL
   - Build for production: `npm run build`
   - Deploy to Vercel, Netlify, or similar

3. **Security**:
   - Enable HTTPS
   - Add rate limiting
   - Implement proper authentication
   - Add request validation
