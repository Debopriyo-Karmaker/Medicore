from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Appointment(Document):
    patient_id: str  # Reference to Patient
    doctor_id: str  # Reference to Doctor (User)
    
    # Appointment Details
    appointment_date: datetime
    reason: str
    notes: Optional[str] = None
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING)
    
    # Doctor's response
    doctor_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "appointments"
        indexes = ["patient_id", "doctor_id", "appointment_date", "status"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient123",
                "doctor_id": "doctor456",
                "appointment_date": "2024-12-15T10:00:00",
                "reason": "Regular checkup",
                "status": "pending"
            }
        }