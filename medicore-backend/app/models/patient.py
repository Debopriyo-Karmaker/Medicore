from beanie import Document, Indexed
from pydantic import Field, BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BloodGroup(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class DiagnosticReport(BaseModel):
    """Embedded document for diagnostic reports"""
    report_id: str
    report_type: str
    uploaded_by: str  # Lab assistant name
    uploaded_at: datetime
    file_url: str  # Base64 encoded file data
    notes: Optional[str] = None


class Patient(Document):
    patient_id: Indexed(str, unique=True)
    user_id: str  # Reference to User
    
    # Personal Information
    date_of_birth: datetime  # Changed from date to datetime
    gender: Gender
    blood_group: Optional[BloodGroup] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    
    # Medical Profile
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    past_operations: List[dict] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)
    
    # Diagnostic Reports - NEW FIELD
    diagnostic_reports: List[DiagnosticReport] = Field(default_factory=list)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "patients"
        indexes = ["patient_id", "user_id"]
