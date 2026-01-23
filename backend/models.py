from datetime import date

from sqlalchemy import (JSON, Column, Date, Float, ForeignKey, Integer, String,
                        Text)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Should be hashed in production
    name = Column(String, nullable=True)  # User display name
    avatar_url = Column(String, nullable=True)  # User profile avatar
    
    # Relationships
    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="owner", cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"

    pet_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    # Basic Info from Gemini
    name = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    gender = Column(String, nullable=True)  # 'male' or 'female'
    date_of_birth = Column(Date, nullable=True)  # ISO date
    is_dob_estimated = Column(Integer, nullable=True, default=0)  # 0 or 1 (boolean as int)
    gotcha_day = Column(Date, nullable=True)  # Adoption date
    size = Column(String, nullable=True)
    personality = Column(JSON, nullable=True)
    health = Column(String, nullable=True)
    appearance = Column(String, nullable=True)
    
    # Medical Info
    rabies_expiration = Column(String, nullable=True)
    microchip_id = Column(String, nullable=True)
    
    # Image
    image_url = Column(String, nullable=True)  # Full image for AI analysis
    avatar_url = Column(String, nullable=True)  # Cropped circular avatar
    
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
    is_round_trip = Column(Integer, default=0)  # 0 for one-way, 1 for round trip
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
