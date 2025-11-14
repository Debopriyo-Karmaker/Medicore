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
    appointment_date: Optional[datetime] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None

class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    doctor_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

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
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AppointmentWithDetails(AppointmentResponse):
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None