from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.doctor_profile import DoctorProfile
from app.models.lab_assistant import LabAssistant
from app.api.routes.auth import get_current_user
import sys


router = APIRouter()


class RoleUpdateRequest(BaseModel):
    role: UserRole


# ---------- USERS ----------


@router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
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
                "hospital_email": user.hospital_email
                if user.role == UserRole.DOCTOR
                else None,
                "specialization": user.specialization
                if user.role == UserRole.DOCTOR
                else None,
            }
            for user in users
        ]
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}",
        )


@router.get("/admin/users/{user_id}/profile")
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get full profile for any user (admin only).

    Returns:
    - base user info
    - patient profile (if role == patient)
    - doctor profile (if role == doctor)
    - lab assistant profile (if role == lab_assistant)
    """

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Base user info
    profile = {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "hospital_email": user.hospital_email,
        "specialization": user.specialization,
        "license_number": user.license_number,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

    # Role-specific profiles
    if user.role == UserRole.PATIENT:
        patient = await Patient.find_one(Patient.user_id == str(user.id))
        if patient:
            profile["patient_profile"] = {
                "id": str(patient.id),
                "patient_id": patient.patient_id,
                "date_of_birth": patient.date_of_birth.isoformat()
                if patient.date_of_birth
                else None,
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "address": patient.address,
                "emergency_contact": patient.emergency_contact,
                "emergency_contact_name": patient.emergency_contact_name,
                "allergies": patient.allergies,
                "chronic_conditions": patient.chronic_conditions,
                "current_medications": patient.current_medications,
                "created_at": patient.created_at.isoformat()
                if patient.created_at
                else None,
                "updated_at": patient.updated_at.isoformat()
                if patient.updated_at
                else None,
            }
        else:
            profile["patient_profile"] = None

    elif user.role == UserRole.DOCTOR:
        doctor_profile = await DoctorProfile.find_one(
            DoctorProfile.user_id == str(user.id)
        )
        if doctor_profile:
            profile["doctor_profile"] = {
                "id": str(doctor_profile.id),
                "about": doctor_profile.about,
                "qualifications": doctor_profile.qualifications,
                "degrees": [
                    {
                        "title": d.title,
                        "institution": d.institution,
                        "year": d.year,
                    }
                    for d in (doctor_profile.degrees or [])
                ],
                "experience_years": doctor_profile.experience_years,
                "consultation_fee": doctor_profile.consultation_fee,
                "languages": doctor_profile.languages,
                "clinic_info": doctor_profile.clinic_info.dict()
                if doctor_profile.clinic_info
                else None,
                "availability": doctor_profile.availability,
                "total_consultations": doctor_profile.total_consultations,
                "average_rating": doctor_profile.average_rating,
                "created_at": doctor_profile.created_at.isoformat()
                if doctor_profile.created_at
                else None,
                "updated_at": doctor_profile.updated_at.isoformat()
                if doctor_profile.updated_at
                else None,
            }
        else:
            profile["doctor_profile"] = None

    elif user.role == UserRole.LAB_ASSISTANT:
        lab_profile = await LabAssistant.find_one(
            LabAssistant.user_id == str(user.id)
        )
        if lab_profile:
            profile["lab_assistant_profile"] = {
                "id": str(lab_profile.id),
                "date_of_birth": lab_profile.date_of_birth.isoformat()
                if lab_profile.date_of_birth
                else None,
                "gender": lab_profile.gender,
                "blood_group": lab_profile.blood_group,
                "contact_no": lab_profile.contact_no,
                "hospital": lab_profile.hospital,
                "department": lab_profile.department,
                "created_at": lab_profile.created_at.isoformat()
                if lab_profile.created_at
                else None,
                "updated_at": lab_profile.updated_at.isoformat()
                if lab_profile.updated_at
                else None,
            }
        else:
            profile["lab_assistant_profile"] = None

    return profile


@router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """Change a user's role (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from accidentally removing their own admin access
    if str(user.id) == str(current_user.id) and payload.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot change their own role",
        )

    user.role = payload.role
    await user.save()

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "created_at": user.created_at,
        "hospital_email": user.hospital_email,
        "specialization": user.specialization,
    }


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a user (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Optional: prevent deleting yourself
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account",
        )

    # Optional cleanup: delete related patient record
    if user.role == UserRole.PATIENT:
        patient = await Patient.find_one(Patient.user_id == user.id)
        if patient:
            await patient.delete()

    # Optional: also clean appointments etc. if you want
    await user.delete()
    return


# ---------- PATIENTS ----------


@router.get("/admin/patients")
async def get_all_patients(current_user: User = Depends(get_current_user)):
    """Get all patient profiles (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    try:
        patients = await Patient.find().to_list()
        result = []

        for patient in patients:
            user = await User.get(patient.user_id)
            result.append(
                {
                    "id": str(patient.id),
                    "patient_id": patient.patient_id,
                    "user_email": user.email if user else "N/A",
                    "user_name": user.full_name if user else "N/A",
                    "date_of_birth": patient.date_of_birth.isoformat()
                    if patient.date_of_birth
                    else None,
                    "gender": patient.gender,
                    "blood_group": patient.blood_group,
                    "address": patient.address,
                    "allergies": patient.allergies,
                    "chronic_conditions": patient.chronic_conditions,
                    "created_at": patient.created_at,
                }
            )

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patients: {str(e)}",
        )


@router.delete(
    "/admin/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a patient profile (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # Optional: delete the underlying User as well
    user = await User.get(patient.user_id)
    if user and user.role == UserRole.PATIENT:
        await user.delete()

    # Optional: delete patient appointments
    await Appointment.find(Appointment.patient_id == patient.id).delete()

    await patient.delete()
    return


# ---------- DOCTORS ----------


@router.get("/admin/doctors")
async def get_all_doctors(current_user: User = Depends(get_current_user)):
    """Get all doctors (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
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
                "created_at": doctor.created_at,
            }
            for doctor in doctors
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching doctors: {str(e)}",
        )


@router.delete(
    "/admin/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_doctor(
    doctor_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a doctor user (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    doctor = await User.get(doctor_id)
    if not doctor or doctor.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    # Optional: delete doctor appointments
    await Appointment.find(Appointment.doctor_id == doctor.id).delete()

    await doctor.delete()
    return


# ---------- APPOINTMENTS ----------


@router.get("/admin/appointments")
async def get_all_appointments(current_user: User = Depends(get_current_user)):
    """Get all appointments (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    try:
        appointments = await Appointment.find().to_list()
        result = []

        for apt in appointments:
            patient = await Patient.get(apt.patient_id)
            doctor = await User.get(apt.doctor_id)
            patient_user = await User.get(patient.user_id) if patient else None

            result.append(
                {
                    "id": str(apt.id),
                    "appointment_date": apt.appointment_date.isoformat(),
                    "reason": apt.reason,
                    "status": apt.status,
                    "patient_name": patient_user.full_name
                    if patient_user
                    else "N/A",
                    "patient_email": patient_user.email
                    if patient_user
                    else "N/A",
                    "doctor_name": doctor.full_name if doctor else "N/A",
                    "doctor_email": doctor.email if doctor else "N/A",
                    "doctor_specialization": doctor.specialization
                    if doctor
                    else "N/A",
                    "created_at": apt.created_at,
                }
            )

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching appointments: {str(e)}",
        )


# ---------- STATISTICS ----------


@router.get("/admin/statistics")
async def get_statistics(current_user: User = Depends(get_current_user)):
    """Get system statistics (admin only)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this",
        )

    try:
        users = await User.find().to_list()
        total_users = len(users)
        total_patients = len(await Patient.find().to_list())
        total_doctors = len(
            await User.find(User.role == UserRole.DOCTOR).to_list()
        )
        total_lab_assistants = len(
            [u for u in users if u.role == UserRole.LAB_ASSISTANT]
        )
        total_appointments = len(await Appointment.find().to_list())

        appointments = await Appointment.find().to_list()
        pending = len([a for a in appointments if a.status == "pending"])
        confirmed = len([a for a in appointments if a.status == "confirmed"])
        rejected = len([a for a in appointments if a.status == "rejected"])

        return {
            "total_users": total_users,
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_lab_assistants": total_lab_assistants,
            "total_appointments": total_appointments,
            "appointments_by_status": {
                "pending": pending,
                "confirmed": confirmed,
                "rejected": rejected,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching statistics: {str(e)}",
        )
