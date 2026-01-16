# 🐾 Pawcation - Pet Travel Planning App

A full-stack application for planning pet-friendly travel with your furry companions!

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Python 3.9+**

### Installation

1. **Clone and install dependencies:**
```bash
npm install
cd backend && python3 -m pip install -r requirements.txt && cd ..
```

2. **Set up environment:**
```bash
cp .env.example .env
```

3. **Start the application:**

**Terminal 1 - Backend:**
```bash
cd backend && python3 main.py
```
API runs on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
App runs on `http://localhost:5173`

## 📊 Database Models

### User
- `user_id`, `email`, `password`

### Pet (linked to User)
- Basic: name, breed, birthday, weight
- Health: rabies vaccination, microchip
- Behavior: separation anxiety (1-5), flight comfort (1-5), exercise needs (1-5)
- Preferences: environment, personality archetype

### Plan (linked to User)
- Dates, trip type, destination, itinerary
- Travel party details, budget

## 🔌 API Endpoints

**Users:** `/api/users` - CRUD operations  
**Pets:** `/api/pets`, `/api/users/{id}/pets` - CRUD operations  
**Plans:** `/api/plans`, `/api/users/{id}/plans` - CRUD operations

**API Docs:** http://localhost:8000/docs

## 🧪 Testing

```bash
cd backend && python3 test_api.py
```

## 💻 Frontend API Usage

```typescript
import { api } from '@/lib/api';

// Create user
const user = await api.createUser('email@example.com', 'password');

// Get pets
const pets = await api.getUserPets(userId);
```

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui  
**Backend:** Python, FastAPI, SQLAlchemy, SQLite

## 📝 Development with Lovable

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

Changes via Lovable are committed automatically. You can also edit locally and push changes
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
