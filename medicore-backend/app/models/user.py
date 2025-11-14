from beanie import Document, Indexed
from pydantic import EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    LAB_ASSISTANT = "lab_assistant"
    ADMIN = "admin"

class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    full_name: str
    role: UserRole = Field(default=UserRole.PATIENT)
    phone: Optional[str] = None
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    
    # Doctor specific fields
    hospital_email: Optional[EmailStr] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        indexes = ["email"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "doctor@hospital.com",
                "full_name": "Dr. John Doe",
                "role": "doctor",
                "phone": "+8801712345678",
                "hospital_email": "john.doe@hospital.com",
                "specialization": "Cardiology"
            }
        }