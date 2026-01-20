from datetime import date
from typing import List, Optional

from pydantic import BaseModel, EmailStr


# User Schemas
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    user_id: int

    class Config:
        from_attributes = True


# Pet Schemas
class PetBase(BaseModel):
    name: str
    breed: Optional[str] = None
    age: Optional[str] = None
    size: Optional[str] = None
    personality: Optional[List[str]] = None
    health: Optional[str] = None
    appearance: Optional[str] = None
    rabies_expiration: Optional[str] = None
    microchip_id: Optional[str] = None
    image_url: Optional[str] = None  # Full image for AI analysis
    avatar_url: Optional[str] = None  # Cropped circular avatar


class PetCreate(PetBase):
    user_id: int


class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[str] = None
    size: Optional[str] = None
    personality: Optional[List[str]] = None
    health: Optional[str] = None
    appearance: Optional[str] = None
    rabies_expiration: Optional[str] = None
    microchip_id: Optional[str] = None
    image_url: Optional[str] = None
    avatar_url: Optional[str] = None


class PetResponse(PetBase):
    pet_id: int
    user_id: int

    class Config:
        from_attributes = True


# Plan Schemas
class PlanBase(BaseModel):
    start_date: date
    end_date: date
    trip_type: Optional[str] = None
    destination: Optional[str] = None
    places_passing_by: Optional[str] = None
    detailed_itinerary: Optional[str] = None
    num_humans: int = 1
    num_adults: int = 1
    num_children: int = 0
    budget: Optional[float] = None
    origin: Optional[str] = None
    pet_ids: Optional[str] = None


class PlanCreate(PlanBase):
    user_id: int


class PlanUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trip_type: Optional[str] = None
    destination: Optional[str] = None
    places_passing_by: Optional[str] = None
    detailed_itinerary: Optional[str] = None
    num_humans: Optional[int] = None
    num_adults: Optional[int] = None
    num_children: Optional[int] = None
    budget: Optional[float] = None
    origin: Optional[str] = None
    pet_ids: Optional[str] = None


class PlanResponse(PlanBase):
    plan_id: int
    user_id: int

    class Config:
        from_attributes = True


# Combined Response Schemas
class UserWithPets(UserResponse):
    pets: List[PetResponse] = []

    class Config:
        from_attributes = True


class UserWithPlans(UserResponse):
    plans: List[PlanResponse] = []

    class Config:
        from_attributes = True


class UserFull(UserResponse):
    pets: List[PetResponse] = []
    plans: List[PlanResponse] = []

    class Config:
        from_attributes = True
