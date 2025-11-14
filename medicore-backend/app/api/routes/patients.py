from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.api.routes.auth import get_current_user
from datetime import datetime
import random
import string
import traceback

router = APIRouter()


def generate_patient_id() -> str:
    """Generate unique patient ID"""
    year = datetime.now().year
    random_num = ''.join(random.choices(string.digits, k=6))
    return f"MED{year}{random_num}"


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patient_profile(
    patient_data: PatientCreate,
    current_user: User = Depends(get_current_user)
):
    """Create patient profile (patients only)"""
    
    try:
        print(f"\n{'='*100}")
        print(f"🔍 CREATING PATIENT PROFILE")
        print(f"{'='*100}")
        print(f"User: {current_user.email}")
        print(f"User ID: {current_user.id}")
        print(f"Role: {current_user.role}")
        
        # 1. Validate role
        if current_user.role != UserRole.PATIENT:
            print(f"❌ REJECTED: Not a patient")
            return JSONResponse(status_code=403, content={"detail": "Only patients can create profiles"})
        
        print(f"✅ 1. Role validated")
        
        # 2. Check existing profile
        existing = await Patient.find_one(Patient.user_id == str(current_user.id))
        if existing:
            print(f"❌ REJECTED: Profile already exists")
            return JSONResponse(status_code=400, content={"detail": "Patient profile already exists"})
        
        print(f"✅ 2. No existing profile")
        
        # 3. Generate patient ID
        patient_id = generate_patient_id()
        print(f"✅ 3. Generated patient ID: {patient_id}")
        
        # 4. Create patient object
        print(f"📋 Data being saved:")
        print(f"   DOB: {patient_data.date_of_birth} (type: {type(patient_data.date_of_birth)})")
        print(f"   Gender: {patient_data.gender}")
        print(f"   Allergies: {patient_data.allergies}")
        print(f"   Conditions: {patient_data.chronic_conditions}")
        print(f"   Medications: {patient_data.current_medications}")
        
        patient = Patient(
            patient_id=patient_id,
            user_id=str(current_user.id),
            date_of_birth=patient_data.date_of_birth,
            gender=patient_data.gender,
            blood_group=patient_data.blood_group,
            address=patient_data.address,
            emergency_contact=patient_data.emergency_contact,
            emergency_contact_name=patient_data.emergency_contact_name,
            allergies=patient_data.allergies or [],
            chronic_conditions=patient_data.chronic_conditions or [],
            current_medications=patient_data.current_medications or [],
            past_operations=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        print(f"✅ 4. Patient object created")
        
        # 5. Insert to database
        await patient.insert()
        print(f"✅✅✅ 5. SAVED TO DATABASE: {patient.id}")
        print(f"{'='*100}\n")
        
        # Return response
        return JSONResponse(
            status_code=201,
            content={
                "id": str(patient.id),
                "patient_id": patient.patient_id,
                "user_id": patient.user_id,
                "date_of_birth": patient.date_of_birth.isoformat(),
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "address": patient.address,
                "emergency_contact": patient.emergency_contact,
                "emergency_contact_name": patient.emergency_contact_name,
                "allergies": patient.allergies,
                "chronic_conditions": patient.chronic_conditions,
                "past_operations": patient.past_operations,
                "current_medications": patient.current_medications,
                "created_at": patient.created_at.isoformat(),
                "updated_at": patient.updated_at.isoformat()
            }
        )
    
    except Exception as e:
        print(f"❌ ERROR: {e}")
        traceback.print_exc()
        print(f"{'='*100}\n")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error: {str(e)}"}
        )


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get my patient profile"""
    
    patient = await Patient.find_one(Patient.user_id == str(current_user.id))
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    return PatientResponse(
        id=str(patient.id),
        patient_id=patient.patient_id,
        user_id=patient.user_id,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        blood_group=patient.blood_group,
        address=patient.address,
        emergency_contact=patient.emergency_contact,
        emergency_contact_name=patient.emergency_contact_name,
        allergies=patient.allergies,
        chronic_conditions=patient.chronic_conditions,
        past_operations=patient.past_operations,
        current_medications=patient.current_medications,
        created_at=patient.created_at,
        updated_at=patient.updated_at
    )


@router.put("/me")
async def update_my_profile(
    patient_data: PatientUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update my patient profile"""
    
    patient = await Patient.find_one(Patient.user_id == str(current_user.id))
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(patient, field, value)
    
    patient.updated_at = datetime.utcnow()
    await patient.save()
    
    return PatientResponse(
        id=str(patient.id),
        patient_id=patient.patient_id,
        user_id=patient.user_id,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        blood_group=patient.blood_group,
        address=patient.address,
        emergency_contact=patient.emergency_contact,
        emergency_contact_name=patient.emergency_contact_name,
        allergies=patient.allergies,
        chronic_conditions=patient.chronic_conditions,
        past_operations=patient.past_operations,
        current_medications=patient.current_medications,
        created_at=patient.created_at,
        updated_at=patient.updated_at
    )
