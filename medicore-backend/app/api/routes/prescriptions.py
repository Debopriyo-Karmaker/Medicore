from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.models.prescription import Prescription, Medicine
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor_profile import DoctorProfile
from app.api.routes.auth import get_current_user
from app.core.database import get_database
from datetime import datetime
from typing import List
from bson import ObjectId
import uuid
import traceback

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create prescription (doctors only)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors")
    
    try:
        patient = await Patient.get(ObjectId(prescription_data.patient_id))
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        prescription = Prescription(
            prescription_id=f"RX{str(uuid.uuid4())[:8].upper()}",
            patient_id=prescription_data.patient_id,
            doctor_id=str(current_user.id),
            appointment_id=prescription_data.appointment_id,
            diagnosis=prescription_data.diagnosis,
            symptoms=prescription_data.symptoms,
            vital_signs=prescription_data.vital_signs,
            medicines=[Medicine(**m.model_dump()) for m in prescription_data.medicines],
            lab_tests_ordered=prescription_data.lab_tests_ordered or [],
            advice=prescription_data.advice,
            follow_up_date=prescription_data.follow_up_date,
            created_at=datetime.utcnow()
        )
        
        await prescription.insert()
        
        # Update doctor consultation count
        doctor_profile = await DoctorProfile.find_one(
            DoctorProfile.user_id == str(current_user.id)
        )
        
        if doctor_profile:
            doctor_profile.total_consultations += 1
            await doctor_profile.save()
        
        return {
            "message": "Prescription created",
            "prescription_id": prescription.prescription_id,
            "id": str(prescription.id)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[dict])
async def get_patient_prescriptions(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all prescriptions for a patient"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.PATIENT]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Find patient by patient_id
        patient = await Patient.find_one(
            Patient.patient_id == patient_id
        )
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Use get_database() to get db instance
        db = get_database()
        prescriptions_collection = db["prescriptions"]
        
        prescriptions_data = await prescriptions_collection.find(
            {"patient_id": str(patient.id)}
        ).sort("created_at", -1).to_list(None)
        
        result = []
        for presc_data in prescriptions_data:
            try:
                doctor = await User.get(ObjectId(presc_data.get("doctor_id")))
                result.append({
                    "id": str(presc_data.get("_id")),
                    "prescription_id": presc_data.get("prescription_id"),
                    "doctor_name": doctor.full_name if doctor else "Unknown",
                    "diagnosis": presc_data.get("diagnosis"),
                    "medicines": presc_data.get("medicines", []),
                    "lab_tests_ordered": presc_data.get("lab_tests_ordered", []),
                    "advice": presc_data.get("advice"),
                    "follow_up_date": presc_data.get("follow_up_date").isoformat() if presc_data.get("follow_up_date") else None,
                    "created_at": presc_data.get("created_at").isoformat() if presc_data.get("created_at") else None
                })
            except Exception as e:
                print(f"Error processing prescription: {str(e)}")
                continue
        
        return result
        
    except Exception as e:
        print(f"Error fetching prescriptions: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{prescription_id}")
async def get_prescription_details(
    prescription_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed prescription"""
    try:
        prescription = await Prescription.get(ObjectId(prescription_id))
        if not prescription:
            raise HTTPException(status_code=404, detail="Not found")
        
        doctor = await User.get(ObjectId(prescription.doctor_id))
        patient = await Patient.get(ObjectId(prescription.patient_id))
        patient_user = await User.get(patient.user_id) if patient else None
        
        return {
            "id": str(prescription.id),
            "prescription_id": prescription.prescription_id,
            "doctor_name": doctor.full_name if doctor else "Unknown",
            "patient_name": patient_user.full_name if patient_user else "Unknown",
            "diagnosis": prescription.diagnosis,
            "symptoms": prescription.symptoms,
            "vital_signs": prescription.vital_signs,
            "medicines": [m.model_dump() for m in prescription.medicines],
            "lab_tests_ordered": prescription.lab_tests_ordered,
            "advice": prescription.advice,
            "follow_up_date": prescription.follow_up_date.isoformat() if prescription.follow_up_date else None,
            "created_at": prescription.created_at.isoformat()
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/my/all", response_model=List[dict])
async def get_my_prescriptions(
    current_user: User = Depends(get_current_user)
):
    """Get all prescriptions written by current doctor"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors")
    
    try:
        db = get_database()
        prescriptions_collection = db["prescriptions"]
        
        prescriptions_data = await prescriptions_collection.find(
            {"doctor_id": str(current_user.id)}
        ).sort("created_at", -1).to_list(None)
        
        result = []
        for presc_data in prescriptions_data:
            try:
                patient = await Patient.get(ObjectId(presc_data.get("patient_id")))
                patient_user = await User.get(patient.user_id) if patient else None
                result.append({
                    "id": str(presc_data.get("_id")),
                    "prescription_id": presc_data.get("prescription_id"),
                    "patient_name": patient_user.full_name if patient_user else "Unknown",
                    "diagnosis": presc_data.get("diagnosis"),
                    "medicines_count": len(presc_data.get("medicines", [])),
                    "created_at": presc_data.get("created_at").isoformat() if presc_data.get("created_at") else None
                })
            except Exception as e:
                print(f"Error processing prescription: {str(e)}")
                continue
        
        return result
        
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
