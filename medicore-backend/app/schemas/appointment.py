from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_date: datetime
    reason: str
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    # Used for general updates (including admin reschedule)
    appointment_date: Optional[datetime] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    admin_notes: Optional[str] = None  # why the admin changed it (optional)


class AppointmentStatusUpdate(BaseModel):
    # Used when only status is being changed
    status: AppointmentStatus
    doctor_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None  # optional admin comment


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    appointment_date: datetime
    reason: str
    notes: Optional[str] = None
    status: AppointmentStatus
    doctor_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentWithDetails(AppointmentResponse):
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
