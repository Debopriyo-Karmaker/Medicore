from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class LabAssistantGender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class LabAssistantBloodGroup(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


class LabAssistant(Document):
    """
    Profile information for a lab assistant user.
    Linked to the main User document via user_id.
    """

    # Reference to User
    user_id: str

    # Personal / professional info
    date_of_birth: datetime
    gender: LabAssistantGender
    blood_group: Optional[LabAssistantBloodGroup] = None
    contact_no: Optional[str] = None
    hospital: Optional[str] = None
    department: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lab_assistants"
        indexes = ["user_id"]
