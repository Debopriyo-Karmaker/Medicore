from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DoctorProfileCreate(BaseModel):
    qualifications: List[str]
    experience_years: int
    consultation_fee: float
    languages: List[str]
    about: Optional[str] = None
    profile_picture: Optional[str] = None


class DoctorProfileUpdate(BaseModel):
    qualifications: Optional[List[str]] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    languages: Optional[List[str]] = None
    about: Optional[str] = None
    profile_picture: Optional[str] = None


class AvailabilityUpdate(BaseModel):
    availability: List[dict]


class DoctorProfileResponse(BaseModel):
    id: str
    user_id: str
    profile_picture: Optional[str]
    qualifications: List[str]
    experience_years: int
    consultation_fee: float
    languages: List[str]
    about: Optional[str]
    availability: List[dict]
    total_consultations: int
    average_rating: float
    created_at: datetime
    updated_at: datetime
