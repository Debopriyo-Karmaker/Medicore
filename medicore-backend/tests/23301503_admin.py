import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport

# Ensure backend root is on sys.path so `app` package is importable
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app
from app.core.database import connect_to_mongo, close_mongo_connection

pytestmark = pytest.mark.anyio


@pytest.fixture(scope="session")
def anyio_backend():
    # Tell pytest-anyio to use asyncio
    return "asyncio"


@pytest.fixture(scope="session")
async def init_db():
    # Initialize Mongo/Beanie once per test session
    await connect_to_mongo()
    yield
    await close_mongo_connection()


async def register_and_login_admin(client: AsyncClient) -> dict:
    register_payload = {
        "email": "admin1@example.com",
        "password": "adminpass123",
        "full_name": "Admin User",
        "role": "admin",
    }

    # Ignore conflict if already created
    await client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "admin1@example.com",
        "password": "adminpass123",
    }

    login_res = await client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def register_normal_user(client: AsyncClient) -> str | None:
    payload = {
        "email": "user_to_promote@example.com",
        "password": "userpass123",
        "full_name": "User To Promote",
        "role": "patient",
    }

    res = await client.post("/api/auth/register", json=payload)
    # 200/201 on first time, 400 on duplicate – both acceptable for test setup
    assert res.status_code in (200, 201, 400)
    body = (
        res.json()
        if res.headers.get("content-type", "").startswith("application/json")
        else {}
    )
    return body.get("id")


@pytest.mark.anyio
async def test_admin_can_view_users_and_change_role(init_db):
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_headers = await register_and_login_admin(client)
        _ = await register_normal_user(client)

        # Admin: get all users
        res_users = await client.get("/api/admin/users", headers=admin_headers)
        assert res_users.status_code == 200
        users = res_users.json()
        assert isinstance(users, list)
        assert len(users) >= 1

        # Pick a non-admin user from list to change role
        target_user = next((u for u in users if u["role"] != "admin"), None)
        assert target_user is not None
        target_id = target_user["id"]

        # Admin: get user profile
        res_profile = await client.get(
            f"/api/admin/users/{target_id}/profile", headers=admin_headers
        )
        assert res_profile.status_code == 200
        profile = res_profile.json()
        assert profile["id"] == target_id

        # Admin: update user role to doctor
        role_payload = {"role": "doctor"}
        res_role = await client.put(
            f"/api/admin/users/{target_id}/role",
            json=role_payload,
            headers=admin_headers,
        )
        assert res_role.status_code == 200

        # Verify role updated
        res_profile2 = await client.get(
            f"/api/admin/users/{target_id}/profile", headers=admin_headers
        )
        assert res_profile2.status_code == 200
        assert res_profile2.json()["role"] == "doctor"


@pytest.mark.anyio
async def test_admin_can_delete_user(init_db):
    """
    Admin deletes a user using DELETE /api/admin/users/{user_id}.
    """
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_headers = await register_and_login_admin(client)

        # Create a user to delete
        payload = {
            "email": "user_to_delete@example.com",
            "password": "deletepass123",
            "full_name": "User To Delete",
            "role": "patient",
        }
        res_create = await client.post("/api/auth/register", json=payload)
        assert res_create.status_code in (200, 201, 400)
        body = (
            res_create.json()
            if res_create.headers.get("content-type", "").startswith("application/json")
            else {}
        )
        user_id = body.get("id")

        # If backend doesn't return id on duplicate, find the user via /api/admin/users
        if not user_id:
            res_users = await client.get("/api/admin/users", headers=admin_headers)
            assert res_users.status_code == 200
            users = res_users.json()
            target = next(
                (u for u in users if u["email"] == payload["email"]), None
            )
            assert target is not None
            user_id = target["id"]

        # Admin: delete user
        res_delete = await client.delete(
            f"/api/admin/users/{user_id}", headers=admin_headers
        )
        assert res_delete.status_code == 204

        # Verify user no longer appears in list
        res_users_after = await client.get("/api/admin/users", headers=admin_headers)
        assert res_users_after.status_code == 200
        users_after = res_users_after.json()
        assert all(u["id"] != user_id for u in users_after)


@pytest.mark.anyio
async def test_admin_can_edit_and_delete_appointment(init_db):
    """
    Admin edits and then deletes an appointment via appointments routes:
    - create appointment as patient
    - admin updates it (PUT /api/appointments/{id})
    - admin deletes it (DELETE /api/appointments/admin/{id})
    """
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create an admin and get headers
        admin_headers = await register_and_login_admin(client)

        # --- Create a DOCTOR user (with required fields) ---
        doctor_payload = {
            "email": "doctor_for_admin_test@example.com",
            "password": "doctorpass123",
            "full_name": "Doctor For Admin Test",
            "role": "doctor",
            "hospital_email": "doctor.for.admin@testhospital.com",
            "specialization": "Cardiology",
        }
        res_doctor_reg = await client.post("/api/auth/register", json=doctor_payload)
        assert res_doctor_reg.status_code in (200, 201, 400)

        # Ensure doctor has role DOCTOR (if created as patient earlier / in previous runs)
        res_users = await client.get("/api/admin/users", headers=admin_headers)
        assert res_users.status_code == 200
        users = res_users.json()
        doctor_user = next(
            (u for u in users if u["email"] == doctor_payload["email"]), None
        )
        assert doctor_user is not None
        doctor_id = doctor_user["id"]

        if doctor_user["role"] != "doctor":
            res_role = await client.put(
                f"/api/admin/users/{doctor_id}/role",
                json={"role": "doctor"},
                headers=admin_headers,
            )
            assert res_role.status_code == 200

        # --- Create a PATIENT user and profile, then login as patient ---
        patient_reg_payload = {
            "email": "patient_for_admin_apt@example.com",
            "password": "patientpass123",
            "full_name": "Patient For Admin Apt",
            "role": "patient",
        }
        await client.post("/api/auth/register", json=patient_reg_payload)

        patient_login_payload = {
            "email": patient_reg_payload["email"],
            "password": patient_reg_payload["password"],
        }
        res_patient_login = await client.post(
            "/api/auth/login", json=patient_login_payload
        )
        assert res_patient_login.status_code == 200
        patient_token = res_patient_login.json()["access_token"]
        patient_headers = {"Authorization": f"Bearer {patient_token}"}

        # Create patient profile required by appointments
        patient_profile_payload = {
            "date_of_birth": "2000-01-01",
            "gender": "male",
            "blood_group": "A+",
            "address": "Dhaka",
            "emergency_contact": "01700000000",
            "emergency_contact_name": "Guardian",
            "allergies": ["dust"],
            "chronic_conditions": ["asthma"],
            "current_medications": ["inhaler"],
        }
        res_patient_profile = await client.post(
            "/api/patients/", json=patient_profile_payload, headers=patient_headers
        )
        assert res_patient_profile.status_code in (200, 201)

        # --- Patient creates an appointment ---
        appointment_create_payload = {
            "doctor_id": doctor_id,
            "appointment_date": "2030-01-01T10:00:00",
            "reason": "Test visit",
            "notes": "Initial notes",
        }
        res_create_apt = await client.post(
            "/api/appointments/",
            json=appointment_create_payload,
            headers=patient_headers,
        )
        assert res_create_apt.status_code in (200, 201)
        apt = res_create_apt.json()
        appointment_id = apt["id"]

        # --- Admin edits the appointment (reschedule / change reason/notes) ---
        appointment_update_payload = {
            "appointment_date": "2030-01-02T11:30:00",
            "reason": "Updated reason",
            "notes": "Updated notes",
            "status": "approved",
            "admin_notes": "Admin updated this",
        }
        res_update_apt = await client.put(
            f"/api/appointments/{appointment_id}",
            json=appointment_update_payload,
            headers=admin_headers,
        )
        assert res_update_apt.status_code == 200
        updated = res_update_apt.json()
        assert updated["reason"] == "Updated reason"
        assert updated["notes"] == "Updated notes"
        assert updated["status"].lower() == "approved"
        assert updated["admin_notes"] == "Admin updated this"

        # --- Admin deletes the appointment ---
        res_delete_apt = await client.delete(
            f"/api/appointments/admin/{appointment_id}", headers=admin_headers
        )
        assert res_delete_apt.status_code == 204

        # Verify appointment no longer retrievable
        res_get_apt = await client.get(
            f"/api/appointments/{appointment_id}", headers=admin_headers
        )
        assert res_get_apt.status_code == 404
