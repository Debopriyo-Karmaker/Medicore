from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Medicine(BaseModel):
    name: str
    dosage: str  # "500mg"
    frequency: str  # "Twice daily"
    duration: str  # "7 days"
    instructions: Optional[str] = None


class Prescription(Document):
    prescription_id: str
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    
    # Clinical Details
    diagnosis: str
    symptoms: Optional[str] = None
    vital_signs: Optional[dict] = None  # {"bp": "120/80", "temp": "98.6"}
    
    # Prescription
    medicines: List[Medicine] = Field(default_factory=list)
    lab_tests_ordered: List[str] = Field(default_factory=list)
    advice: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    follow_up_reminder_sent: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "prescriptions"
