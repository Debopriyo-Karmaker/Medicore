from beanie import Document
from pydantic import Field, BaseModel
from typing import Optional, List
from datetime import datetime


class Degree(BaseModel):
    """Structured representation of a medical degree or certification."""
    title: str = Field(..., description="Degree title, e.g. MBBS, FCPS (Cardiology)")
    institution: str = Field(..., description="Issuing university or college")
    year: Optional[int] = Field(None, description="Year of completion (e.g. 2020)")


class ClinicInfo(BaseModel):
    """Information about the doctor’s primary clinic or practice."""
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    contact_number: Optional[str] = None


class DoctorProfile(Document):
    user_id: str  # Reference to User

    # Basic profile
    profile_picture: Optional[str] = None  # Base64 encoded
    about: Optional[str] = None

    # Professional details
    qualifications: List[str] = Field(default_factory=list)
    degrees: List[Degree] = Field(default_factory=list)
    experience_years: int = 0
    consultation_fee: float = 0.0
    languages: List[str] = Field(default_factory=list)

    # Clinic / practice details
    clinic_info: Optional[ClinicInfo] = None

    # Availability (max 3 days)
    # Format: [{"day": "Monday", "time_slots": ["09:00-10:00", "10:00-11:00"]}]
    availability: List[dict] = Field(default_factory=list)

    # Statistics
    total_consultations: int = 0
    average_rating: float = 0.0

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "doctor_profiles"
