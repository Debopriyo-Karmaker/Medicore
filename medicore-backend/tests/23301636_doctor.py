import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import connect_to_mongo, close_mongo_connection


@pytest.fixture
async def db():
    await connect_to_mongo()
    try:
        yield
    finally:
        await close_mongo_connection()


@pytest.fixture
async def client(db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def get_doctor_token(client: AsyncClient) -> str:
    reg_payload = {
        "email": "doctor@test.com",
        "password": "doctor12345",
        "full_name": "Test Doctor",
        "role": "doctor",
        "phone": "0123456789",
        "hospital_email": "doc@hospital.com",  # valid domain per auth logic
        "specialization": "Cardiology",
        "license_number": "LIC-12345",
    }

    res = await client.post("/api/auth/register", json=reg_payload)
    print("DOCTOR REGISTER:", res.status_code, res.json())

    if res.status_code == 201:
        return res.json()["access_token"]

    # If already exists, login
    assert res.status_code == 400
    assert res.json().get("detail") == "Email already registered"

    login_payload = {
        "email": reg_payload["email"],
        "password": reg_payload["password"],
    }
    login_res = await client.post("/api/auth/login", json=login_payload)
    print("DOCTOR LOGIN:", login_res.status_code, login_res.json())
    assert login_res.status_code == 200
    return login_res.json()["access_token"]


@pytest.mark.anyio
async def test_create_doctor_profile(client: AsyncClient):
    token = await get_doctor_token(client)

    profile_payload = {
        "profile_picture": None,
        "about": "Test doctor profile",
        "qualifications": ["MBBS", "FCPS"],
        "degrees": [
            {
                "title": "MBBS",
                "institution": "Test Medical College",
                "year": 2015
            }
        ],
        "experience_years": 5,
        "consultation_fee": 500.0,
        "languages": ["English", "Bangla"],
        "clinic_info": {
            "clinic_name": "Test Clinic",
            "clinic_address": "Dhaka",
            "city": "Dhaka",
            "country": "Bangladesh",
            "contact_number": "0123456789"
        },
        "availability": []
    }

    res = await client.post(
        "/api/doctor-profile/",
        json=profile_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    print("CREATE DOCTOR PROFILE:", res.status_code, res.json())
    # 201 on first create, 400 "Profile already exists" on later runs
    assert res.status_code in (201, 400)


@pytest.mark.anyio
async def test_get_my_doctor_profile(client: AsyncClient):
    token = await get_doctor_token(client)

    # Ensure profile exists (ignore 400 if already created)
    profile_payload = {
        "profile_picture": None,
        "about": "Test doctor profile",
        "qualifications": ["MBBS", "FCPS"],
        "degrees": [
            {
                "title": "MBBS",
                "institution": "Test Medical College",
                "year": 2015
            }
        ],
        "experience_years": 5,
        "consultation_fee": 500.0,
        "languages": ["English", "Bangla"],
        "clinic_info": {
            "clinic_name": "Test Clinic",
            "clinic_address": "Dhaka",
            "city": "Dhaka",
            "country": "Bangladesh",
            "contact_number": "0123456789"
        },
        "availability": []
    }
    res_create = await client.post(
        "/api/doctor-profile/",
        json=profile_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    print("CREATE FOR GET /me:", res_create.status_code, res_create.text)

    res = await client.get(
        "/api/doctor-profile/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    print("GET DOCTOR PROFILE /me:", res.status_code, res.json())
    assert res.status_code == 200

    data = res.json()
    assert data["id"]
    assert data["user_id"]
    assert data["qualifications"]