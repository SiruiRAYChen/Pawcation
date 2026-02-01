#!/usr/bin/env python3
"""
Migration script to move data from SQLite (pawcation.db) to Firebase Firestore.
This script reads all data from the local SQLite database and uploads it to Firestore.
"""

import sqlite3
import sys
from datetime import datetime

import firebase_admin
from firebase_admin import auth, credentials, firestore


def init_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Initialize Firebase Admin with default credentials
        # Make sure you've set GOOGLE_APPLICATION_CREDENTIALS environment variable
        # or place the service account key in this directory
        firebase_admin.initialize_app()
        print("✅ Firebase Admin SDK initialized successfully")
        return firestore.client()
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        print("\n💡 To fix this, you need to:")
        print("1. Download your Firebase service account key from:")
        print("   Firebase Console → Project Settings → Service Accounts → Generate new private key")
        print("2. Save it as 'serviceAccountKey.json' in the backend directory")
        print("3. Run: export GOOGLE_APPLICATION_CREDENTIALS='./serviceAccountKey.json'")
        sys.exit(1)

def connect_sqlite():
    """Connect to SQLite database"""
    try:
        conn = sqlite3.connect('pawcation.db')
        conn.row_factory = sqlite3.Row  # Enable column access by name
        print("✅ Connected to SQLite database")
        return conn
    except Exception as e:
        print(f"❌ Error connecting to SQLite: {e}")
        sys.exit(1)

def migrate_users(sqlite_conn, db):
    """Migrate users from SQLite to Firestore"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    
    print(f"\n📋 Migrating {len(users)} users...")
    
    migrated = 0
    errors = 0
    
    for user in users:
        try:
            user_id = str(user['user_id'])
            
            # Check if user exists in Firebase Auth
            try:
                auth_user = auth.get_user(user_id)
                print(f"  ✓ User {user['email']} already exists in Firebase Auth")
            except auth.UserNotFoundError:
                # Create user in Firebase Auth
                auth_user = auth.create_user(
                    uid=user_id,
                    email=user['email'],
                    display_name=user['name']
                )
                print(f"  ✓ Created Firebase Auth user: {user['email']}")
            
            # Create user document in Firestore
            user_data = {
                'email': user['email'],
                'name': user['name'],
                'avatarUrl': user['avatar_url'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('users').document(user_id).set(user_data)
            migrated += 1
            print(f"  ✓ Migrated user: {user['email']}")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error migrating user {user['email']}: {e}")
    
    print(f"✅ Users migration complete: {migrated} migrated, {errors} errors")
    return migrated, errors

def migrate_pets(sqlite_conn, db):
    """Migrate pets from SQLite to Firestore"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM pets")
    pets = cursor.fetchall()
    
    print(f"\n🐾 Migrating {len(pets)} pets...")
    
    migrated = 0
    errors = 0
    
    for pet in pets:
        try:
            pet_data = {
                'userId': str(pet['user_id']),
                'name': pet['name'],
                'breed': pet['breed'],
                'dateOfBirth': pet['date_of_birth'],
                'isDobEstimated': bool(pet['is_dob_estimated']),
                'gotchaDay': pet['gotcha_day'],
                'size': pet['size'],
                'gender': pet['gender'],
                'personality': pet['personality'].split(',') if pet['personality'] else [],
                'health': pet['health'],
                'imageUrl': pet['image_url'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            # Add to Firestore
            pet_ref = db.collection('pets').add(pet_data)
            migrated += 1
            print(f"  ✓ Migrated pet: {pet['name']}")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error migrating pet {pet['name']}: {e}")
    
    print(f"✅ Pets migration complete: {migrated} migrated, {errors} errors")
    return migrated, errors

def migrate_plans(sqlite_conn, db):
    """Migrate travel plans from SQLite to Firestore"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM plans")
    plans = cursor.fetchall()
    
    print(f"\n🗺️  Migrating {len(plans)} travel plans...")
    
    migrated = 0
    errors = 0
    
    for plan in plans:
        try:
            plan_data = {
                'userId': str(plan['user_id']),
                'startDate': plan['start_date'],
                'endDate': plan['end_date'],
                'tripType': plan['trip_type'],
                'isRoundTrip': bool(plan['is_round_trip']),
                'destination': plan['destination'],
                'placesPassingBy': plan['places_passing_by'],
                'detailedItinerary': plan['detailed_itinerary'],
                'numHumans': plan['num_humans'],
                'numAdults': plan['num_adults'],
                'numChildren': plan['num_children'],
                'budget': plan['budget'],
                'origin': plan['origin'],
                'petIds': plan['pet_ids'].split(',') if plan['pet_ids'] else [],
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            # Add to Firestore
            plan_ref = db.collection('plans').add(plan_data)
            migrated += 1
            print(f"  ✓ Migrated plan: {plan['destination']}")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error migrating plan: {e}")
    
    print(f"✅ Plans migration complete: {migrated} migrated, {errors} errors")
    return migrated, errors

def migrate_memory_photos(sqlite_conn, db):
    """Migrate memory photos from SQLite to Firestore"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM memory_photos")
    photos = cursor.fetchall()
    
    print(f"\n📸 Migrating {len(photos)} memory photos...")
    
    migrated = 0
    errors = 0
    
    for photo in photos:
        try:
            photo_data = {
                'tripId': str(photo['trip_id']),
                'userId': str(photo['user_id']),
                'localPath': photo['local_path'],
                'cityName': photo['city_name'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            # Add to Firestore
            photo_ref = db.collection('memoryPhotos').add(photo_data)
            migrated += 1
            print(f"  ✓ Migrated photo: {photo['local_path']}")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error migrating photo: {e}")
    
    print(f"✅ Memory photos migration complete: {migrated} migrated, {errors} errors")
    return migrated, errors

def main():
    print("🚀 Starting Pawcation Database Migration")
    print("=" * 60)
    
    # Initialize connections
    db = init_firebase()
    sqlite_conn = connect_sqlite()
    
    try:
        # Migrate data
        total_migrated = 0
        total_errors = 0
        
        # Migrate in order (users first, then pets, plans, photos)
        users_migrated, users_errors = migrate_users(sqlite_conn, db)
        total_migrated += users_migrated
        total_errors += users_errors
        
        pets_migrated, pets_errors = migrate_pets(sqlite_conn, db)
        total_migrated += pets_migrated
        total_errors += pets_errors
        
        plans_migrated, plans_errors = migrate_plans(sqlite_conn, db)
        total_migrated += plans_migrated
        total_errors += plans_errors
        
        photos_migrated, photos_errors = migrate_memory_photos(sqlite_conn, db)
        total_migrated += photos_migrated
        total_errors += photos_errors
        
        # Summary
        print("\n" + "=" * 60)
        print("🎉 Migration Complete!")
        print(f"   Total records migrated: {total_migrated}")
        print(f"   Total errors: {total_errors}")
        print("=" * 60)
        
        if total_errors == 0:
            print("\n✅ All data migrated successfully!")
        else:
            print(f"\n⚠️  Migration completed with {total_errors} errors. Please review the logs above.")
        
    finally:
        sqlite_conn.close()
        print("\n🔒 Database connections closed")

if __name__ == "__main__":
    main()
