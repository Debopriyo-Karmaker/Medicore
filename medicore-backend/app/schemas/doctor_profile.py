from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Degree(BaseModel):
    title: str
    institution: str
    year: Optional[int] = None


class ClinicInfo(BaseModel):
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    contact_number: Optional[str] = None


class DoctorProfileCreate(BaseModel):
    qualifications: List[str]
    experience_years: int
    consultation_fee: float
    languages: List[str]
    about: Optional[str] = None
    profile_picture: Optional[str] = None
    degrees: List[Degree] = []
    clinic_info: Optional[ClinicInfo] = None


class DoctorProfileUpdate(BaseModel):
    qualifications: Optional[List[str]] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    languages: Optional[List[str]] = None
    about: Optional[str] = None
    profile_picture: Optional[str] = None
    degrees: Optional[List[Degree]] = None
    clinic_info: Optional[ClinicInfo] = None


class AvailabilityUpdate(BaseModel):
    availability: List[dict]


class DoctorProfileResponse(BaseModel):
    id: str
    user_id: str
    profile_picture: Optional[str]
    qualifications: List[str]
    degrees: List[Degree]
    experience_years: int
    consultation_fee: float
    languages: List[str]
    about: Optional[str]
    clinic_info: Optional[ClinicInfo]
    availability: List[dict]
    total_consultations: int
    average_rating: float
    created_at: datetime
    updated_at: datetime
