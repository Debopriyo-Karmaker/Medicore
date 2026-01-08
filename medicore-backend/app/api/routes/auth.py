from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.models.user import User, UserRole
from app.models.doctor_profile import DoctorProfile
from app.core.security import get_password_hash, verify_password, create_access_token, verify_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    print(f"🔍 Received registration data: {user_data}")

    # Check if user already exists
    existing_user = await User.find_one({"email": user_data.email})

    if existing_user:
        print(f"❌ Email already registered: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate doctor registration
    if user_data.role == UserRole.DOCTOR:
        if not user_data.hospital_email:
            print(f"❌ Hospital email missing for doctor")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hospital email is required for doctor registration"
            )

        # Clean and validate hospital email domain
        hospital_email_clean = user_data.hospital_email.strip().lower()
        print(f"🏥 Validating hospital email: {hospital_email_clean}")

        # Check if email domain is valid (use @ not .)
        valid_domains = ['@hospital.com', '@med.com', '@clinic.com']
        if not any(hospital_email_clean.endswith(domain) for domain in valid_domains):
            print(f"❌ Invalid hospital email domain: {hospital_email_clean}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please use a valid hospital email address"
            )

        print(f"✅ Hospital email validated successfully")

    # Create user with hashed password
    try:
        hashed_password = get_password_hash(user_data.password)
        print(f"✅ Password hashed successfully")
    except Exception as e:
        print(f"❌ Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password hashing failed"
        )

    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        hospital_email=user_data.hospital_email,
        specialization=user_data.specialization,
        license_number=user_data.license_number,
        is_verified=True if user_data.role == UserRole.PATIENT else False
    )

    try:
        await user.insert()
        print(f"✅ User created successfully: {user.email}")
    except Exception as e:
        print(f"❌ Database error during user insertion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

    # ✅ AUTO-CREATE DOCTOR PROFILE IF DOCTOR
    if user_data.role == UserRole.DOCTOR:
        try:
            doctor_profile = DoctorProfile(
                user_id=str(user.id),
                qualifications=[user_data.specialization] if user_data.specialization else [],
                experience_years=0,
                consultation_fee=0,
                languages=["English"],
                about="",
                profile_picture=None,
                availability=[]
            )
            await doctor_profile.insert()
            print(f"✅ Doctor profile auto-created for: {user.email}")
        except Exception as e:
            print(f"⚠️  Warning: Could not create doctor profile: {e}")
            # Don't fail registration if profile creation fails

    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "role": user.role}
    )

    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        hospital_email=user.hospital_email,
        specialization=user.specialization,
        created_at=user.created_at
    )

    return TokenResponse(access_token=access_token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    # Find user
    user = await User.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "role": user.role}
    )

    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        hospital_email=user.hospital_email,
        specialization=user.specialization,
        created_at=user.created_at
    )

    return TokenResponse(access_token=access_token, user=user_response)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("user_id")
    user = await User.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        hospital_email=current_user.hospital_email,
        specialization=current_user.specialization,
        created_at=current_user.created_at
    )