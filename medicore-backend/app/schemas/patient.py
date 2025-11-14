from pydantic import BaseModel, field_validator
from typing import Optional, Union, List
from datetime import datetime, date
from app.models.patient import BloodGroup, Gender


class PatientCreate(BaseModel):
    date_of_birth: Union[str, datetime, date]
    gender: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    allergies: Optional[Union[List[str], str]] = None
    chronic_conditions: Optional[Union[List[str], str]] = None
    current_medications: Optional[Union[List[str], str]] = None
    
    @field_validator('date_of_birth', mode='before')
    @classmethod
    def parse_date_of_birth(cls, v):
        if v is None:
            raise ValueError("date_of_birth is required")
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            # Try parsing with different formats
            for fmt in ["%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%m/%d/%Y", "%d-%m-%Y"]:
                try:
                    dt = datetime.strptime(v.strip(), fmt)
                    return dt
                except (ValueError, AttributeError):
                    continue
            raise ValueError(f"Invalid date format: {v}. Use YYYY-MM-DD or MM/DD/YYYY")
        raise ValueError(f"Invalid date type: {type(v)}")
    
    @field_validator('gender', mode='before')
    @classmethod
    def validate_gender(cls, v):
        if isinstance(v, str):
            v_lower = v.lower().strip()
            if v_lower in ['male', 'female', 'other']:
                return v_lower
            raise ValueError(f"Gender must be one of: male, female, other. Got: {v}")
        return v
    
    @field_validator('blood_group', mode='before')
    @classmethod
    def validate_blood_group(cls, v):
        if v is None or v == '' or v == 'None':
            return None
        valid_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        if str(v).upper() in valid_groups:
            return str(v).upper()
        return None
    
    @field_validator('allergies', 'chronic_conditions', 'current_medications', mode='before')
    @classmethod
    def parse_lists(cls, v):
        if v is None or v == '' or v == 'None':
            return []
        if isinstance(v, list):
            return [str(x).strip() for x in v if x and str(x).strip() != 'None']
        if isinstance(v, str):
            if v.lower() == 'none' or v == '':
                return []
            return [x.strip() for x in v.split(',') if x.strip()]
        return []


class PatientUpdate(BaseModel):
    date_of_birth: Optional[Union[str, datetime, date]] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    allergies: Optional[Union[List[str], str]] = None
    chronic_conditions: Optional[Union[List[str], str]] = None
    current_medications: Optional[Union[List[str], str]] = None
    
    @field_validator('date_of_birth', mode='before')
    @classmethod
    def parse_date_of_birth(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            for fmt in ["%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%m/%d/%Y", "%d-%m-%Y"]:
                try:
                    return datetime.strptime(v.strip(), fmt)
                except (ValueError, AttributeError):
                    continue
        return None
    
    @field_validator('gender', mode='before')
    @classmethod
    def validate_gender(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v_lower = v.lower().strip()
            if v_lower in ['male', 'female', 'other']:
                return v_lower
        return v
    
    @field_validator('blood_group', mode='before')
    @classmethod
    def validate_blood_group(cls, v):
        if v is None or v == '' or v == 'None':
            return None
        valid_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        if str(v).upper() in valid_groups:
            return str(v).upper()
        return None
    
    @field_validator('allergies', 'chronic_conditions', 'current_medications', mode='before')
    @classmethod
    def parse_lists(cls, v):
        if v is None or v == '' or v == 'None':
            return None
        if isinstance(v, list):
            return [str(x).strip() for x in v if x and str(x).strip() != 'None']
        if isinstance(v, str):
            if v.lower() == 'none' or v == '':
                return None
            return [x.strip() for x in v.split(',') if x.strip()]
        return None


class PatientResponse(BaseModel):
    id: str
    patient_id: str
    user_id: str
    date_of_birth: datetime
    gender: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    past_operations: List[dict] = []
    current_medications: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
