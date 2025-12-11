from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MedicineSchema(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    diagnosis: str
    symptoms: Optional[str] = None
    vital_signs: Optional[dict] = None
    medicines: List[MedicineSchema]
    lab_tests_ordered: Optional[List[str]] = []
    advice: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class PrescriptionResponse(BaseModel):
    id: str
    prescription_id: str
    patient_id: str
    doctor_id: str
    diagnosis: str
    medicines: List[dict]
    lab_tests_ordered: List[str]
    created_at: datetime
