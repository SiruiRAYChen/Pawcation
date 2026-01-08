# Pawcation 🐾

A pet travel planning app with AI-powered dog profile analysis.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python Flask + Google GenAI SDK
- **AI Model**: Gemini 2.0 Flash (Experimental)
- **Storage**: localStorage (development)

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Python 3.8+
- Gemini API key

### Easy Start (Recommended)

```bash
./start-dev.sh
```

This starts both backend (port 5001) and frontend (port 8080).

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

## Features

- 🖼️ **Upload dog photos** - Drag & drop or click to upload
- 🤖 **AI Analysis** - Gemini 2.0 analyzes breed, age, personality
- 📝 **Pet Profiles** - Create detailed profiles with travel preferences
- 💾 **Local Storage** - All data stored in browser (development mode)
- 🎨 **Beautiful UI** - Modern design with Tailwind CSS + shadcn/ui

## Project Structure

```
pawcation/
├── backend/                 # Python Flask API
│   ├── app.py              # Main backend server
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Backend environment variables
│   └── README.md           # Backend documentation
├── src/                     # React frontend
│   ├── components/         # UI components
│   ├── services/           # API services
│   │   ├── geminiService.ts    # Backend API calls
│   │   └── localStorage.ts     # Local data storage
│   ├── hooks/              # React hooks
│   └── pages/              # Page components
├── .env                     # Frontend environment variables
├── start-dev.sh            # Development startup script
└── LOCAL_SETUP.md          # Detailed setup guide
```

## Documentation

- [Local Setup Guide](./LOCAL_SETUP.md) - Detailed setup instructions
- [Backend README](./backend/README.md) - Backend API documentation

## Environment Variables

### Frontend (`.env`)
```
VITE_BACKEND_URL=http://localhost:5001
```

### Backend (`backend/.env`)
```
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
```

## Development

The app uses a client-server architecture:

1. **Frontend** handles UI and user interactions
2. **Backend** processes images and calls Gemini AI
3. **localStorage** stores user data locally

## Important Notes

⚠️ **Development Only**:
- Passwords stored in plain text
- Data in localStorage (cleared when browser cache is cleared)
- API calls from local backend

For production deployment, implement:
- Proper authentication
- Real database (PostgreSQL, MongoDB, etc.)
- Cloud storage for images
- Rate limiting and security measures

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Python Flask
- Google GenAI SDK
- Gemini 2.0 Flash

## License

MIT

---

Made with ❤️ and 🐾
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
