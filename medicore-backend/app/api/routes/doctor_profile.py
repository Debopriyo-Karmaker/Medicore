from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.schemas.doctor_profile import (
    DoctorProfileCreate, DoctorProfileUpdate, 
    AvailabilityUpdate, DoctorProfileResponse
)
from app.models.doctor_profile import DoctorProfile
from app.models.user import User, UserRole
from app.models.appointment import Appointment
from app.api.routes.auth import get_current_user
from datetime import datetime
import base64
import traceback

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_doctor_profile(
    profile_data: DoctorProfileCreate,
    current_user: User = Depends(get_current_user)
):
    """Create doctor profile"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can create profiles")
    
    existing = await DoctorProfile.find_one(DoctorProfile.user_id == str(current_user.id))
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = DoctorProfile(
        user_id=str(current_user.id),
        qualifications=profile_data.qualifications,
        experience_years=profile_data.experience_years,
        consultation_fee=profile_data.consultation_fee,
        languages=profile_data.languages,
        about=profile_data.about,
        profile_picture=profile_data.profile_picture,
        availability=[]
    )
    await profile.insert()
    
    return {"message": "Profile created", "profile_id": str(profile.id)}


@router.get("/me", response_model=DoctorProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get my doctor profile"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors")
    
    profile = await DoctorProfile.find_one(DoctorProfile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return DoctorProfileResponse(
        id=str(profile.id),
        user_id=profile.user_id,
        profile_picture=profile.profile_picture,
        qualifications=profile.qualifications,
        experience_years=profile.experience_years,
        consultation_fee=profile.consultation_fee,
        languages=profile.languages,
        about=profile.about,
        availability=profile.availability,
        total_consultations=profile.total_consultations,
        average_rating=profile.average_rating,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/me")
async def update_my_profile(
    profile_data: DoctorProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update profile"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors")
    
    profile = await DoctorProfile.find_one(DoctorProfile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(profile, field, value)
    
    profile.updated_at = datetime.utcnow()
    await profile.save()
    return {"message": "Profile updated"}


@router.put("/availability")
async def update_availability(
    availability_data: AvailabilityUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update availability schedule (max 3 days)"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors")
    
    if len(availability_data.availability) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 days allowed")
    
    profile = await DoctorProfile.find_one(DoctorProfile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.availability = availability_data.availability
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return {"message": "Availability updated"}


@router.post("/upload-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload profile picture"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors")
    
    try:
        file_content = await file.read()
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_url = f"data:{file.content_type};base64,{file_base64}"
        
        profile = await DoctorProfile.find_one(DoctorProfile.user_id == str(current_user.id))
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile.profile_picture = file_url
        profile.updated_at = datetime.utcnow()
        await profile.save()
        
        return {"message": "Picture uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{doctor_id}/available-slots")
async def get_available_slots(
    doctor_id: str,
    date: str,  # YYYY-MM-DD
    current_user: User = Depends(get_current_user)
):
    """Get available time slots for booking"""
    try:
        profile = await DoctorProfile.find_one(DoctorProfile.user_id == doctor_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        
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
        start_of_day = target_date.replace(hour=0, minute=0, second=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59)
        
        booked_appointments = await Appointment.find(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date >= start_of_day,
            Appointment.appointment_date <= end_of_day,
            Appointment.status != "rejected"
        ).to_list()
        
        # Extract booked slots
        booked_slots = []
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
            "booked_slots": booked_slots
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
