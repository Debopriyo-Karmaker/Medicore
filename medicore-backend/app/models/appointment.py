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
    # References
    patient_id: str  # Reference to Patient
    doctor_id: str   # Reference to Doctor (User)

    # Appointment Details
    appointment_date: datetime  # This will be updated when admin reschedules
    reason: str
    notes: Optional[str] = None

    # Status (admin/doctor can change this)
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING)

    # Doctor's response
    doctor_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

    # Admin management fields (optional but useful)
    admin_notes: Optional[str] = None  # Why admin changed status/time

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "appointments"
        indexes = [
            "patient_id",
            "doctor_id",
            "appointment_date",
            "status",
        ]

    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "patient123",
                "doctor_id": "doctor456",
                "appointment_date": "2024-12-15T10:00:00",
                "reason": "Regular checkup",
                "notes": "Patient requested morning slot",
                "status": "pending",
                "doctor_notes": None,
                "rejection_reason": None,
                "admin_notes": "Rescheduled due to doctor request",
            }
        }
