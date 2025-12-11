from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime


class DoctorProfile(Document):
    user_id: str  # Reference to User
    profile_picture: Optional[str] = None  # Base64 encoded
    qualifications: List[str] = Field(default_factory=list)
    experience_years: int = 0
    consultation_fee: float = 0.0
    languages: List[str] = Field(default_factory=list)
    about: Optional[str] = None
    
    # Availability (max 3 days)
    availability: List[dict] = Field(default_factory=list)
    # Format: [{"day": "Monday", "time_slots": ["09:00-10:00", "10:00-11:00"]}]
    
    # Statistics
    total_consultations: int = 0
    average_rating: float = 0.0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "doctor_profiles"
