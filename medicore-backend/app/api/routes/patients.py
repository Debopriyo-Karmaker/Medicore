from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.api.routes.auth import get_current_user
from datetime import datetime
from typing import List, Optional
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
            diagnostic_reports=[],
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


@router.get("/me/reports")
async def get_my_reports(current_user: User = Depends(get_current_user)):
    """Get patient's diagnostic reports"""
    
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this"
        )
    
    try:
        patient = await Patient.find_one(Patient.user_id == str(current_user.id))
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        reports = patient.diagnostic_reports or []
        
        return [
            {
                "report_id": r.report_id,
                "report_type": r.report_type,
                "uploaded_by": r.uploaded_by,
                "uploaded_at": r.uploaded_at.isoformat(),
                "file_url": r.file_url,
                "notes": r.notes
            }
            for r in reports
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
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


# ============================================================================
# DOCTOR ACCESS ENDPOINTS - Search & View Patients
# ============================================================================


@router.get("/search", response_model=List[dict])
async def search_patients(
    query: str = "",
    blood_group: Optional[str] = None,
    condition: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Search patients with advanced filters (doctors only)
    
    Filters:
    - query: Search by name or patient ID
    - blood_group: Filter by blood group (A+, B+, O+, etc.)
    - condition: Filter by chronic condition
    - min_age: Minimum age filter
    - max_age: Maximum age filter
    """
    
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can search patients"
        )
    
    try:
        print(f"\n{'='*80}")
        print(f"🔍 PATIENT SEARCH REQUEST")
        print(f"{'='*80}")
        print(f"Doctor: {current_user.full_name}")
        print(f"Query: '{query}'")
        print(f"Blood Group Filter: {blood_group}")
        print(f"Condition Filter: {condition}")
        print(f"Age Range: {min_age}-{max_age}")
        
        patients = await Patient.find().to_list()
        result = []
        
        for patient in patients:
            user = await User.get(patient.user_id)
            if not user:
                continue
            
            # Apply search query filter
            if query:
                query_lower = query.lower()
                if (query_lower not in user.full_name.lower() and 
                    query_lower not in patient.patient_id.lower()):
                    continue
            
            # Apply blood group filter
            if blood_group and patient.blood_group != blood_group:
                continue
            
            # Apply condition filter
            if condition:
                if condition.lower() not in [c.lower() for c in (patient.chronic_conditions or [])]:
                    continue
            
            # Calculate age and apply age filters
            age = None
            if patient.date_of_birth:
                age = (datetime.now() - patient.date_of_birth).days // 365
                
                if min_age and age < min_age:
                    continue
                if max_age and age > max_age:
                    continue
            
            # Format diagnostic reports
            reports = []
            for report in (patient.diagnostic_reports or []):
                reports.append({
                    "report_id": report.report_id,
                    "report_type": report.report_type,
                    "uploaded_by": report.uploaded_by,
                    "uploaded_at": report.uploaded_at.isoformat(),
                    "file_url": report.file_url,
                    "notes": report.notes
                })
            
            result.append({
                "id": str(patient.id),
                "patient_id": patient.patient_id,
                "name": user.full_name,
                "email": user.email,
                "age": age,
                "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "address": patient.address,
                "emergency_contact": patient.emergency_contact,
                "emergency_contact_name": patient.emergency_contact_name,
                "allergies": patient.allergies,
                "chronic_conditions": patient.chronic_conditions,
                "current_medications": patient.current_medications,
                "past_operations": patient.past_operations,
                "diagnostic_reports": reports,
                "created_at": patient.created_at.isoformat(),
                "updated_at": patient.updated_at.isoformat()
            })
        
        print(f"✅ Found {len(result)} matching patients")
        print(f"{'='*80}\n")
        return result
        
    except Exception as e:
        print(f"❌ Error searching patients: {str(e)}")
        traceback.print_exc()
        print(f"{'='*80}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching patients: {str(e)}"
        )


@router.get("/{patient_id}/details", response_model=dict)
async def get_patient_details(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get complete patient details including:
    - Personal information
    - Medical history
    - Diagnostic reports
    - Prescription history
    - Appointment history
    """
    
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view patient details"
        )
    
    try:
        print(f"\n{'='*80}")
        print(f"📋 PATIENT DETAILS REQUEST")
        print(f"{'='*80}")
        print(f"Doctor: {current_user.full_name}")
        print(f"Patient ID: {patient_id}")
        
        from bson import ObjectId
        patient = await Patient.get(ObjectId(patient_id))
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        user = await User.get(patient.user_id)
        
        # Get prescription history
        try:
            from app.models.prescription import Prescription
            prescriptions = await Prescription.find(
                Prescription.patient_id == patient_id
            ).sort(-Prescription.created_at).to_list()
            
            prescription_list = []
            for presc in prescriptions:
                presc_doctor = await User.get(presc.doctor_id)
                prescription_list.append({
                    "id": str(presc.id),
                    "prescription_id": presc.prescription_id,
                    "doctor_name": presc_doctor.full_name if presc_doctor else "Unknown",
                    "diagnosis": presc.diagnosis,
                    "medicines_count": len(presc.medicines),
                    "created_at": presc.created_at.isoformat()
                })
        except Exception as presc_error:
            print(f"⚠️ Could not fetch prescriptions: {presc_error}")
            prescription_list = []
        
        # Get appointment history
        try:
            from app.models.appointment import Appointment
            appointments = await Appointment.find(
                Appointment.patient_id == patient_id
            ).sort(-Appointment.created_at).to_list()
            
            appointment_list = []
            for apt in appointments:
                apt_doctor = await User.get(apt.doctor_id)
                appointment_list.append({
                    "id": str(apt.id),
                    "doctor_name": apt_doctor.full_name if apt_doctor else "Unknown",
                    "appointment_date": apt.appointment_date.isoformat(),
                    "reason": apt.reason,
                    "status": apt.status,
                    "created_at": apt.created_at.isoformat()
                })
        except Exception as apt_error:
            print(f"⚠️ Could not fetch appointments: {apt_error}")
            appointment_list = []
        
        # Format diagnostic reports
        reports = []
        for report in (patient.diagnostic_reports or []):
            reports.append({
                "report_id": report.report_id,
                "report_type": report.report_type,
                "uploaded_by": report.uploaded_by,
                "uploaded_at": report.uploaded_at.isoformat(),
                "file_url": report.file_url,
                "notes": report.notes
            })
        
        # Calculate age
        age = None
        if patient.date_of_birth:
            age = (datetime.now() - patient.date_of_birth).days // 365
        
        result = {
            "id": str(patient.id),
            "patient_id": patient.patient_id,
            "name": user.full_name if user else "N/A",
            "email": user.email if user else "N/A",
            "phone": user.phone if user else "N/A",
            "age": age,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "address": patient.address,
            "emergency_contact": patient.emergency_contact,
            "emergency_contact_name": patient.emergency_contact_name,
            "allergies": patient.allergies,
            "chronic_conditions": patient.chronic_conditions,
            "current_medications": patient.current_medications,
            "past_operations": patient.past_operations,
            "diagnostic_reports": reports,
            "prescriptions": prescription_list,
            "appointments": appointment_list,
            "created_at": patient.created_at.isoformat(),
            "updated_at": patient.updated_at.isoformat()
        }
        
        print(f"✅ Patient details retrieved")
        print(f"   Reports: {len(reports)}")
        print(f"   Prescriptions: {len(prescription_list)}")
        print(f"   Appointments: {len(appointment_list)}")
        print(f"{'='*80}\n")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching patient details: {str(e)}")
        traceback.print_exc()
        print(f"{'='*80}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patient details: {str(e)}"
        )


@router.get("/{patient_id}/prescriptions", response_model=List[dict])
async def get_patient_prescriptions(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all prescriptions for a specific patient (doctors only)"""
    
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view prescriptions"
        )
    
    try:
        from bson import ObjectId
        from app.models.prescription import Prescription
        
        # Verify patient exists
        patient = await Patient.get(ObjectId(patient_id))
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        prescriptions = await Prescription.find(
            Prescription.patient_id == patient_id
        ).sort(-Prescription.created_at).to_list()
        
        result = []
        for presc in prescriptions:
            doctor = await User.get(presc.doctor_id)
            result.append({
                "id": str(presc.id),
                "prescription_id": presc.prescription_id,
                "doctor_name": doctor.full_name if doctor else "Unknown",
                "diagnosis": presc.diagnosis,
                "symptoms": presc.symptoms,
                "medicines": [m.model_dump() for m in presc.medicines],
                "lab_tests_ordered": presc.lab_tests_ordered,
                "advice": presc.advice,
                "follow_up_date": presc.follow_up_date.isoformat() if presc.follow_up_date else None,
                "created_at": presc.created_at.isoformat()
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching prescriptions: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.get("/{patient_id}/appointments", response_model=List[dict])
async def get_patient_appointments(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get appointment history for a specific patient (doctors only)"""
    
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view appointment history"
        )
    
    try:
        from bson import ObjectId
        from app.models.appointment import Appointment
        
        # Verify patient exists
        patient = await Patient.get(ObjectId(patient_id))
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        appointments = await Appointment.find(
            Appointment.patient_id == patient_id
        ).sort(-Appointment.created_at).to_list()
        
        result = []
        for apt in appointments:
            doctor = await User.get(apt.doctor_id)
            result.append({
                "id": str(apt.id),
                "doctor_name": doctor.full_name if doctor else "Unknown",
                "doctor_specialization": doctor.specialization if doctor else "Unknown",
                "appointment_date": apt.appointment_date.isoformat(),
                "reason": apt.reason,
                "notes": apt.notes,
                "status": apt.status,
                "doctor_notes": apt.doctor_notes,
                "created_at": apt.created_at.isoformat()
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching appointments: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )
