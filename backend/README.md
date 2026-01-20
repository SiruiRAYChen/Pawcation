# Pawcation Backend API 🐾

Python FastAPI backend for the Pawcation pet travel planning application.

## Features

- **User Management**: Create and manage user accounts
- **Pet Profiles**: Store detailed pet information including health records and behavioral traits
- **Travel Plans**: Create and manage pet-friendly travel itineraries

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Local database storage
- **Pydantic**: Data validation and settings management

## Database Models

### User
- `user_id`: Unique identifier
- `email`: User email (unique)
- `password`: User password (should be hashed in production)

### Pet
- Basic info: name, breed, birthday, weight
- Health: rabies vaccination status and expiration, microchip ID
- Behavioral traits: separation anxiety, flight comfort, exercise needs
- Preferences: environment preference, personality archetype

### Plan
- Trip dates: start_date, end_date
- Trip details: type, destination, places, itinerary
- Travel party: number of humans, adults, children
- Budget and origin information

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/{user_id}` - Get user with pets and plans
- `GET /api/users` - List all users
- `DELETE /api/users/{user_id}` - Delete a user

### Pets
- `POST /api/pets` - Create a new pet
- `GET /api/pets/{pet_id}` - Get a specific pet
- `GET /api/users/{user_id}/pets` - Get all pets for a user
- `PUT /api/pets/{pet_id}` - Update a pet
- `DELETE /api/pets/{pet_id}` - Delete a pet

### Plans
- `POST /api/plans` - Create a new plan
- `GET /api/plans/{plan_id}` - Get a specific plan
- `GET /api/users/{user_id}/plans` - Get all plans for a user
- `PUT /api/plans/{plan_id}` - Update a plan
- `DELETE /api/plans/{plan_id}` - Delete a plan

## Development Notes

- Database file will be created automatically as `pawcation.db`
- CORS is configured for `localhost:5173` (Vite default) and `localhost:3000`
- Password hashing should be implemented before production use
- Consider adding authentication/authorization middleware
