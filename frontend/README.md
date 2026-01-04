# Pawcation 🐾

Pawcation is a pet travel planning application powered by Google's Gemini 3 API. It helps you generate pet-friendly travel itineraries for your furry friends.

## Prerequisites

- Python 3.8+
- Node.js 16+
- A Google Gemini API Key

## Project Structure

```
Pawcation/
├── backend/         # FastAPI Backend
└── frontend/        # React + Vite Frontend
```

## Setup Instructions

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure Environment Variables:
1. Open `.env` file in the `backend` folder.
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

Start the Backend Server:

```bash
uvicorn main:app --reload
```
The backend will run at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Development Server:

```bash
npm run dev
```
The frontend will run at `http://localhost:5173`.

## Usage

1. Open your browser to `http://localhost:5173`.
2. Enter a destination (e.g., "Paris").
3. Enter your pet details (e.g., "Golden Retriever, loves parks").
4. Click "Generate Plan" to get a custom itinerary from Gemini!
