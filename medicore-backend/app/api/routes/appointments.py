from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentStatusUpdate,
    AppointmentResponse, AppointmentWithDetails
)
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.api.routes.auth import get_current_user
from typing import List
from datetime import datetime
import traceback
import sys

router = APIRouter()


@router.get("/doctors", response_model=List[dict])
async def get_all_doctors():
    """Get list of all doctors"""
    print(f"\n🔍 Fetching all doctors", file=sys.stderr)
    
    try:
        doctors = await User.find(User.role == UserRole.DOCTOR).to_list()
        print(f"✅ Found {len(doctors)} doctors", file=sys.stderr)
        sys.stderr.flush()
        
        result = []
        for doctor in doctors:
            result.append({
                "id": str(doctor.id),
                "full_name": doctor.full_name,
                "specialization": doctor.specialization,
                "hospital_email": doctor.hospital_email,
                "phone": doctor.phone
            })
        
        return result
    
    except Exception as e:
        print(f"❌ Error fetching doctors: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch doctors: {str(e)}"
        )


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create appointment (patients only)"""
    
    print(f"\n{'='*100}", file=sys.stderr)
    print(f"🔍 CREATING APPOINTMENT", file=sys.stderr)
    print(f"{'='*100}", file=sys.stderr)
    print(f"Patient User: {current_user.email}", file=sys.stderr)
    print(f"Doctor ID: {appointment_data.doctor_id}", file=sys.stderr)
    print(f"Appointment Date: {appointment_data.appointment_date}", file=sys.stderr)
    print(f"Reason: {appointment_data.reason}", file=sys.stderr)
    sys.stderr.flush()
    
    try:
        # Check if user is patient
        if current_user.role != UserRole.PATIENT:
            print(f"❌ 1. User role check failed: {current_user.role}", file=sys.stderr)
            sys.stderr.flush()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can book appointments"
            )
        
        print(f"✅ 1. User role verified (PATIENT)", file=sys.stderr)
        sys.stderr.flush()
        
        # Get patient profile
        patient = await Patient.find_one(Patient.user_id == str(current_user.id))
        if not patient:
            print(f"❌ 2. Patient profile not found", file=sys.stderr)
            sys.stderr.flush()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please create your patient profile first"
            )
        
        print(f"✅ 2. Patient profile found: {patient.patient_id}", file=sys.stderr)
        sys.stderr.flush()
        
        # Verify doctor exists
        doctor = await User.get(appointment_data.doctor_id)
        if not doctor:
            print(f"❌ 3. Doctor not found with ID: {appointment_data.doctor_id}", file=sys.stderr)
            sys.stderr.flush()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        if doctor.role != UserRole.DOCTOR:
            print(f"❌ 3. User is not a doctor, role: {doctor.role}", file=sys.stderr)
            sys.stderr.flush()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected user is not a doctor"
            )
        
        print(f"✅ 3. Doctor verified: {doctor.full_name} ({doctor.specialization})", file=sys.stderr)
        sys.stderr.flush()
        
        # Create appointment
        appointment = Appointment(
            patient_id=str(patient.id),
            doctor_id=str(doctor.id),
            appointment_date=appointment_data.appointment_date,
            reason=appointment_data.reason,
            notes=appointment_data.notes or ""
        )
        
        print(f"✅ 4. Appointment object created", file=sys.stderr)
        sys.stderr.flush()
        
        # Insert into database
        await appointment.insert()
        
        print(f"✅✅✅ 5. APPOINTMENT CREATED SUCCESSFULLY", file=sys.stderr)
        print(f"   Appointment ID: {appointment.id}", file=sys.stderr)
        print(f"{'='*100}\n", file=sys.stderr)
        sys.stderr.flush()
        
        return AppointmentResponse(
            id=str(appointment.id),
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            appointment_date=appointment.appointment_date,
            reason=appointment.reason,
            notes=appointment.notes,
            status=appointment.status,
            doctor_notes=appointment.doctor_notes,
            rejection_reason=appointment.rejection_reason,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print(f"{'='*100}\n", file=sys.stderr)
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {str(e)}"
        )


@router.get("/my-appointments", response_model=List[AppointmentWithDetails])
async def get_my_appointments(current_user: User = Depends(get_current_user)):
    """Get my appointments (patient view)"""
    
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view their appointments"
        )
    
    patient = await Patient.find_one(Patient.user_id == str(current_user.id))
    if not patient:
        return []
    
    appointments = await Appointment.find(
        Appointment.patient_id == str(patient.id)
    ).sort(-Appointment.created_at).to_list()
    
    result = []
    for apt in appointments:
        doctor = await User.get(apt.doctor_id)
        result.append(AppointmentWithDetails(
            id=str(apt.id),
            patient_id=apt.patient_id,
            doctor_id=apt.doctor_id,
            appointment_date=apt.appointment_date,
            reason=apt.reason,
            notes=apt.notes,
            status=apt.status,
            doctor_notes=apt.doctor_notes,
            rejection_reason=apt.rejection_reason,
            created_at=apt.created_at,
            updated_at=apt.updated_at,
            doctor_name=doctor.full_name if doctor else "Unknown",
            doctor_specialization=doctor.specialization if doctor else "Unknown"
        ))
    
    return result


@router.get("/doctor-appointments", response_model=List[AppointmentWithDetails])
async def get_doctor_appointments(current_user: User = Depends(get_current_user)):
    """Get appointments for doctor"""
    
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view their appointments"
        )
    
    appointments = await Appointment.find(
        Appointment.doctor_id == str(current_user.id)
    ).sort(-Appointment.created_at).to_list()
    
    result = []
    for apt in appointments:
        patient = await Patient.get(apt.patient_id)
        patient_user = await User.get(patient.user_id) if patient else None
        result.append(AppointmentWithDetails(
            id=str(apt.id),
            patient_id=apt.patient_id,
            doctor_id=apt.doctor_id,
            appointment_date=apt.appointment_date,
            reason=apt.reason,
            notes=apt.notes,
            status=apt.status,
            doctor_notes=apt.doctor_notes,
            rejection_reason=apt.rejection_reason,
            created_at=apt.created_at,
            updated_at=apt.updated_at,
            patient_name=patient_user.full_name if patient_user else "Unknown"
        ))
    
    return result


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: str,
    status_data: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update appointment status (doctors only)"""
    
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update appointment status"
        )
    
    appointment = await Appointment.get(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if appointment.doctor_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own appointments"
        )
    
    # Update status
    appointment.status = status_data.status
    if status_data.doctor_notes:
        appointment.doctor_notes = status_data.doctor_notes
    if status_data.rejection_reason:
        appointment.rejection_reason = status_data.rejection_reason
    appointment.updated_at = datetime.utcnow()
    
    await appointment.save()
    
    return AppointmentResponse(
        id=str(appointment.id),
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        reason=appointment.reason,
        notes=appointment.notes,
        status=appointment.status,
        doctor_notes=appointment.doctor_notes,
        rejection_reason=appointment.rejection_reason,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at
    )


@router.get("/{appointment_id}", response_model=AppointmentWithDetails)
async def get_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get appointment details"""
    
    appointment = await Appointment.get(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check authorization
    patient = await Patient.find_one(Patient.user_id == str(current_user.id))
    is_patient = patient and str(patient.id) == appointment.patient_id
    is_doctor = current_user.role == UserRole.DOCTOR and appointment.doctor_id == str(current_user.id)
    
    if not (is_patient or is_doctor or current_user.role == UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this appointment"
        )
    
    # Get related data
    doctor = await User.get(appointment.doctor_id)
    patient_obj = await Patient.get(appointment.patient_id)
    patient_user = await User.get(patient_obj.user_id) if patient_obj else None
    
    return AppointmentWithDetails(
        id=str(appointment.id),
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        reason=appointment.reason,
        notes=appointment.notes,
        status=appointment.status,
        doctor_notes=appointment.doctor_notes,
        rejection_reason=appointment.rejection_reason,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
        patient_name=patient_user.full_name if patient_user else "Unknown",
        doctor_name=doctor.full_name if doctor else "Unknown",
        doctor_specialization=doctor.specialization if doctor else "Unknown"
    )
