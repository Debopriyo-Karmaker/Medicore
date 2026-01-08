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


async def register_and_login_patient(client: AsyncClient) -> str:
    # Fixed test user
    reg_payload = {
        "email": "patient@test.com",
        "password": "password123",
        "full_name": "Test Patient",
        "role": "patient",
        "phone": "0123456789",
        "hospital_email": None,
        "specialization": None,
        "license_number": None,
    }

    # Try register
    res = await client.post("/api/auth/register", json=reg_payload)
    print("REGISTER:", res.status_code, res.json())

    if res.status_code == 201:
        # New user created
        return res.json()["access_token"]

    # If already exists, fall back to login
    assert res.status_code == 400
    assert res.json().get("detail") == "Email already registered"

    login_payload = {
        "email": reg_payload["email"],
        "password": reg_payload["password"],
    }
    login_res = await client.post("/api/auth/login", json=login_payload)
    print("LOGIN:", login_res.status_code, login_res.json())
    assert login_res.status_code == 200
    return login_res.json()["access_token"]


@pytest.mark.anyio
async def test_create_patient_profile(client: AsyncClient):
    token = await register_and_login_patient(client)

    payload = {
        "date_of_birth": "2000-01-01",
        "gender": "male",
        "blood_group": "A+",
        "address": "Test Address",
        "emergency_contact": "0123456789",
        "emergency_contact_name": "Guardian",
        "allergies": [],
        "chronic_conditions": [],
        "current_medications": [],
    }

    res = await client.post(
        "/api/patients/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    print("CREATE PATIENT:", res.status_code, res.json())
    # Accept both first-time create and "already exists"
    assert res.status_code in (201, 400)
    if res.status_code == 201:
        data = res.json()
        assert data["patient_id"]
        assert data["user_id"]


@pytest.mark.anyio
async def test_get_my_patient_profile(client: AsyncClient):
    token = await register_and_login_patient(client)

    # Ensure profile exists
    payload = {
        "date_of_birth": "2000-01-01",
        "gender": "male",
        "blood_group": "A+",
        "address": "Test Address",
        "emergency_contact": "0123456789",
        "emergency_contact_name": "Guardian",
        "allergies": [],
        "chronic_conditions": [],
        "current_medications": [],
    }
    res_create = await client.post(
        "/api/patients/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    print("CREATE FOR GET /me:", res_create.status_code, res_create.json())
    assert res_create.status_code in (200, 201, 400)

    res = await client.get(
        "/api/patients/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    print("GET /me:", res.status_code, res.json())
    assert res.status_code == 200
    data = res.json()
    assert data["patient_id"]
    assert data["user_id"]
