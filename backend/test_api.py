#!/usr/bin/env python3
"""
Test script for Pawcation API
Creates sample data and tests all endpoints
"""

import json
from datetime import date, timedelta

import requests

BASE_URL = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_api():
    print_section("🐾 Testing Pawcation API")
    
    # Test 1: Create a user
    print("1️⃣  Creating a test user...")
    user_data = {
        "email": "john@example.com",
        "password": "securepassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        if response.status_code == 201:
            user = response.json()
            user_id = user["user_id"]
            print(f"✅ User created successfully! ID: {user_id}")
            print(f"   Email: {user['email']}")
        else:
            print(f"⚠️  User might already exist (status: {response.status_code})")
            # Try to get existing users
            response = requests.get(f"{BASE_URL}/api/users")
            users = response.json()
            if users:
                user_id = users[0]["user_id"]
                print(f"   Using existing user ID: {user_id}")
            else:
                print("❌ No users found")
                return
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return
    
    # Test 2: Create pets
    print_section("2️⃣  Creating pets")
    
    pet1_data = {
        "user_id": user_id,
        "name": "Buddy",
        "breed": "Pembroke Welsh Corgi",
        "weight": 28,
        "rabies_vaccinated": True,
        "rabies_expiration": str(date.today() + timedelta(days=365)),
        "microchip_id": "985112345678901",
        "separation_anxiety_level": 2,
        "flight_comfort_level": 4,
        "daily_exercise_need": 4,
        "environment_preference": "Urban",
        "personality_archetype": "Energetic Explorer",
        "image_url": "/assets/sample-pet-corgi.png"
    }
    
    pet2_data = {
        "user_id": user_id,
        "name": "Whiskers",
        "breed": "Orange Tabby Cat",
        "weight": 11,
        "rabies_vaccinated": True,
        "rabies_expiration": str(date.today() + timedelta(days=200)),
        "separation_anxiety_level": 3,
        "flight_comfort_level": 2,
        "daily_exercise_need": 2,
        "environment_preference": "Indoor",
        "personality_archetype": "Couch Potato"
    }
    
    try:
        response1 = requests.post(f"{BASE_URL}/api/pets", json=pet1_data)
        pet1 = response1.json()
        print(f"✅ Created pet: {pet1['name']} ({pet1['breed']})")
        
        response2 = requests.post(f"{BASE_URL}/api/pets", json=pet2_data)
        pet2 = response2.json()
        print(f"✅ Created pet: {pet2['name']} ({pet2['breed']})")
    except Exception as e:
        print(f"❌ Error creating pets: {e}")
        return
    
    # Test 3: Create a travel plan
    print_section("3️⃣  Creating a travel plan")
    
    plan_data = {
        "user_id": user_id,
        "start_date": str(date.today() + timedelta(days=30)),
        "end_date": str(date.today() + timedelta(days=37)),
        "trip_type": "Road Trip",
        "origin": "San Francisco, CA",
        "destination": "Los Angeles, CA",
        "places_passing_by": "Santa Barbara, Malibu",
        "detailed_itinerary": json.dumps({
            "day1": "Drive to Santa Barbara, beach visit",
            "day2": "Continue to Malibu, pet-friendly restaurant",
            "day3-7": "Los Angeles pet activities"
        }),
        "num_humans": 2,
        "num_adults": 2,
        "num_children": 0,
        "budget": 2500.00,
        "pet_ids": f"{pet1['pet_id']},{pet2['pet_id']}"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/plans", json=plan_data)
        plan = response.json()
        print(f"✅ Created plan: {plan['origin']} → {plan['destination']}")
        print(f"   Dates: {plan['start_date']} to {plan['end_date']}")
        print(f"   Budget: ${plan['budget']}")
    except Exception as e:
        print(f"❌ Error creating plan: {e}")
        return
    
    # Test 4: Get user with all data
    print_section("4️⃣  Fetching complete user profile")
    
    try:
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        user_full = response.json()
        
        print(f"👤 User: {user_full['email']}")
        print(f"   🐾 Pets: {len(user_full['pets'])}")
        for pet in user_full['pets']:
            print(f"      - {pet['name']} ({pet['breed']})")
        
        print(f"   ✈️  Plans: {len(user_full['plans'])}")
        for plan in user_full['plans']:
            print(f"      - {plan['destination']} ({plan['start_date']})")
    except Exception as e:
        print(f"❌ Error fetching user: {e}")
        return
    
    # Test 5: Update a pet
    print_section("5️⃣  Updating pet information")
    
    try:
        update_data = {
            "weight": 29,
            "personality_archetype": "Energetic Explorer & Treat Lover"
        }
        response = requests.put(f"{BASE_URL}/api/pets/{pet1['pet_id']}", json=update_data)
        updated_pet = response.json()
        print(f"✅ Updated {updated_pet['name']}'s weight to {updated_pet['weight']} lbs")
        print(f"   New personality: {updated_pet['personality_archetype']}")
    except Exception as e:
        print(f"❌ Error updating pet: {e}")
    
    print_section("✅ All tests completed successfully!")
    print("\n🔗 API Documentation: http://localhost:8000/docs")
    print("🔗 Alternative docs: http://localhost:8000/redoc\n")

if __name__ == "__main__":
    try:
        # Check if server is running
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Server is running: {response.json()['message']}")
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Backend server is not running!")
        print("   Please start the server: cd backend && python3 main.py")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
