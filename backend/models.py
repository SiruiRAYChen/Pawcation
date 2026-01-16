from datetime import date

from sqlalchemy import (Boolean, Column, Date, Float, ForeignKey, Integer,
                        String, Text)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Should be hashed in production
    
    # Relationships
    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="owner", cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"

    pet_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    # Basic Info
    name = Column(String, nullable=False)
    breed = Column(String)  # Can be "Mixed" or specific breed
    birthday = Column(Date, nullable=True)
    weight = Column(Float)  # Weight in pounds
    
    # Health & Vaccination
    rabies_vaccinated = Column(Boolean, default=False)
    rabies_expiration = Column(Date, nullable=True)
    microchip_id = Column(String, nullable=True)
    
    # Behavioral Traits (scale of 1-5)
    separation_anxiety_level = Column(Integer, default=3)  # 1=Low, 5=High
    flight_comfort_level = Column(Integer, default=3)  # 1=Uncomfortable, 5=Very Comfortable
    daily_exercise_need = Column(Integer, default=3)  # 1=Low, 5=High
    
    # Preferences
    environment_preference = Column(String)  # e.g., "Urban", "Rural", "Beach", "Mountains"
    personality_archetype = Column(String)  # e.g., "Energetic Explorer", "Couch Potato"
    
    # Image
    image_url = Column(String, nullable=True)
    
    # Relationship
    owner = relationship("User", back_populates="pets")


class Plan(Base):
    __tablename__ = "plans"

    plan_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    # Trip Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Trip Type & Details
    trip_type = Column(String)  # "Direct Trip" or "Road Trip"
    destination = Column(String)  # Main destination
    places_passing_by = Column(Text, nullable=True)  # JSON string or comma-separated
    detailed_itinerary = Column(Text, nullable=True)  # JSON string with full itinerary
    
    # Travel Party
    num_humans = Column(Integer, default=1)
    num_adults = Column(Integer, default=1)
    num_children = Column(Integer, default=0)
    
    # Budget
    budget = Column(Float, nullable=True)  # Budget in dollars
    
    # Additional Info
    origin = Column(String, nullable=True)
    pet_ids = Column(String, nullable=True)  # Comma-separated pet IDs
    
    # Relationship
    owner = relationship("User", back_populates="plans")
