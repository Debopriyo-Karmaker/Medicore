from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.api.routes.auth import get_current_user
import sys

router = APIRouter()

@router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users (admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this"
        )
    
    try:
        users = await User.find().to_list()
        print(f"✅ Retrieved {len(users)} users", file=sys.stderr)
        
        return [
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "created_at": user.created_at,
                "hospital_email": user.hospital_email if user.role == UserRole.DOCTOR else None,
                "specialization": user.specialization if user.role == UserRole.DOCTOR else None
            }
            for user in users
        ]
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/admin/patients")
async def get_all_patients(current_user: User = Depends(get_current_user)):
    """Get all patient profiles (admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this"
        )
    
    try:
        patients = await Patient.find().to_list()
        result = []
        
        for patient in patients:
            user = await User.get(patient.user_id)
            result.append({
                "id": str(patient.id),
                "patient_id": patient.patient_id,
                "user_email": user.email if user else "N/A",
                "user_name": user.full_name if user else "N/A",
                "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "address": patient.address,
                "allergies": patient.allergies,
                "chronic_conditions": patient.chronic_conditions,
                "created_at": patient.created_at
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patients: {str(e)}"
        )

@router.get("/admin/doctors")
async def get_all_doctors(current_user: User = Depends(get_current_user)):
    """Get all doctors (admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this"
        )
    
    try:
        doctors = await User.find(User.role == UserRole.DOCTOR).to_list()
        
        return [
            {
                "id": str(doctor.id),
                "email": doctor.email,
                "full_name": doctor.full_name,
                "hospital_email": doctor.hospital_email,
                "specialization": doctor.specialization,
                "phone": doctor.phone,
                "created_at": doctor.created_at
            }
            for doctor in doctors
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching doctors: {str(e)}"
        )

@router.get("/admin/appointments")
async def get_all_appointments(current_user: User = Depends(get_current_user)):
    """Get all appointments (admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this"
        )
    
    try:
        appointments = await Appointment.find().to_list()
        result = []
        
        for apt in appointments:
            patient = await Patient.get(apt.patient_id)
            doctor = await User.get(apt.doctor_id)
            patient_user = await User.get(patient.user_id) if patient else None
            
            result.append({
                "id": str(apt.id),
                "appointment_date": apt.appointment_date.isoformat(),
                "reason": apt.reason,
                "status": apt.status,
                "patient_name": patient_user.full_name if patient_user else "N/A",
                "patient_email": patient_user.email if patient_user else "N/A",
                "doctor_name": doctor.full_name if doctor else "N/A",
                "doctor_email": doctor.email if doctor else "N/A",
                "doctor_specialization": doctor.specialization if doctor else "N/A",
                "created_at": apt.created_at
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching appointments: {str(e)}"
        )

@router.get("/admin/statistics")
async def get_statistics(current_user: User = Depends(get_current_user)):
    """Get system statistics (admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this"
        )
    
    try:
        total_users = len(await User.find().to_list())
        total_patients = len(await Patient.find().to_list())
        total_doctors = len(await User.find(User.role == UserRole.DOCTOR).to_list())
        total_appointments = len(await Appointment.find().to_list())
        
        appointments = await Appointment.find().to_list()
        pending = len([a for a in appointments if a.status == "pending"])
        confirmed = len([a for a in appointments if a.status == "confirmed"])
        rejected = len([a for a in appointments if a.status == "rejected"])
        
        return {
            "total_users": total_users,
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_appointments": total_appointments,
            "appointments_by_status": {
                "pending": pending,
                "confirmed": confirmed,
                "rejected": rejected
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching statistics: {str(e)}"
        )
