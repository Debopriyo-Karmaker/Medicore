from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.schemas.doctor_profile import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    AvailabilityUpdate,
    DoctorProfileResponse,
)
from app.models.doctor_profile import DoctorProfile
from app.models.user import User, UserRole
from app.models.appointment import Appointment
from app.api.routes.auth import get_current_user
from datetime import datetime
import base64

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_doctor_profile(
    profile_data: DoctorProfileCreate,
    current_user: User = Depends(get_current_user),
):
    """Create doctor profile (doctors only)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create profiles",
        )

    existing = await DoctorProfile.find_one(
        DoctorProfile.user_id == str(current_user.id)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists",
        )

    # Convert nested models to plain data so Beanie/Pydantic v2 is happy
    degrees_data = [d.model_dump() for d in (profile_data.degrees or [])]
    clinic_info_data = (
        profile_data.clinic_info.model_dump()
        if profile_data.clinic_info is not None
        else None
    )

    profile = DoctorProfile(
        user_id=str(current_user.id),
        # Basic
        profile_picture=profile_data.profile_picture,
        about=profile_data.about,
        # Professional
        qualifications=profile_data.qualifications,
        degrees=degrees_data,
        experience_years=profile_data.experience_years,
        consultation_fee=profile_data.consultation_fee,
        languages=profile_data.languages,
        # Clinic
        clinic_info=clinic_info_data,
        # Availability & stats
        availability=[],
        total_consultations=0,
        average_rating=0.0,
    )

    await profile.insert()
    return {"message": "Profile created", "profile_id": str(profile.id)}


@router.get("/me", response_model=DoctorProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get my doctor profile"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors"
        )

    profile = await DoctorProfile.find_one(
        DoctorProfile.user_id == str(current_user.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Convert nested models to plain data for the response schema
    degrees_data = [d.model_dump() for d in (profile.degrees or [])]
    clinic_info_data = (
        profile.clinic_info.model_dump()
        if profile.clinic_info is not None
        else None
    )

    return DoctorProfileResponse(
        id=str(profile.id),
        user_id=profile.user_id,
        profile_picture=profile.profile_picture,
        qualifications=profile.qualifications,
        degrees=degrees_data,
        experience_years=profile.experience_years,
        consultation_fee=profile.consultation_fee,
        languages=profile.languages,
        about=profile.about,
        clinic_info=clinic_info_data,
        availability=profile.availability,
        total_consultations=profile.total_consultations,
        average_rating=profile.average_rating,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.put("/me")
async def update_my_profile(
    profile_data: DoctorProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update my doctor profile (partial update)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors"
        )

    profile = await DoctorProfile.find_one(
        DoctorProfile.user_id == str(current_user.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    update_data = profile_data.model_dump(exclude_unset=True)

    # Convert nested models, if present
    if "degrees" in update_data and update_data["degrees"] is not None:
        update_data["degrees"] = [d.model_dump() for d in update_data["degrees"]]
    if "clinic_info" in update_data and update_data["clinic_info"] is not None:
        update_data["clinic_info"] = update_data["clinic_info"].model_dump()

    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()
    await profile.save()
    return {"message": "Profile updated"}


@router.put("/availability")
async def update_availability(
    availability_data: AvailabilityUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update availability schedule (max 3 days)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors"
        )

    if len(availability_data.availability) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 3 days allowed",
        )

    profile = await DoctorProfile.find_one(
        DoctorProfile.user_id == str(current_user.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    profile.availability = availability_data.availability
    profile.updated_at = datetime.utcnow()
    await profile.save()

    return {"message": "Availability updated"}


@router.post("/upload-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload profile picture"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors"
        )

    file_content = await file.read()
    file_base64 = base64.b64encode(file_content).decode("utf-8")
    file_url = f"data:{file.content_type};base64,{file_base64}"

    profile = await DoctorProfile.find_one(
        DoctorProfile.user_id == str(current_user.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    profile.profile_picture = file_url
    profile.updated_at = datetime.utcnow()
    await profile.save()

    return {"message": "Picture uploaded"}


@router.get("/{doctor_id}/available-slots")
async def get_available_slots(
    doctor_id: str,
    date: str,  # YYYY-MM-DD
    current_user: User = Depends(get_current_user),
):
    """Get available time slots for booking a specific date"""
    try:
        profile = await DoctorProfile.find_one(DoctorProfile.user_id == doctor_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found",
            )

        target_date = datetime.strptime(date, "%Y-%m-%d")
        day_name = target_date.strftime("%A")

        # Find day availability
        day_availability = None
        for avail in profile.availability:
            if avail.get("day") == day_name:
                day_availability = avail
                break

        if not day_availability:
            return {"available_slots": []}

        # Get booked appointments
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        booked_appointments = await Appointment.find(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date >= start_of_day,
            Appointment.appointment_date <= end_of_day,
            Appointment.status != "rejected",
        ).to_list()

        # Extract booked slots
        booked_slots: list[str] = []
        for apt in booked_appointments:
            time_str = apt.appointment_date.strftime("%H:%M")
            for slot in day_availability.get("time_slots", []):
                if slot.startswith(time_str):
                    booked_slots.append(slot)

        all_slots = day_availability.get("time_slots", [])
        available_slots = [s for s in all_slots if s not in booked_slots]

        return {
            "date": date,
            "day": day_name,
            "available_slots": available_slots,
            "booked_slots": booked_slots,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}",
        )


@router.delete("/admin/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_doctor_profile(
    doctor_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a doctor's profile (admins only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete doctor profiles",
        )

    profile = await DoctorProfile.find_one(DoctorProfile.user_id == doctor_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found",
        )

    await profile.delete()
    return
