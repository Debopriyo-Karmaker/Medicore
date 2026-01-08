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


async def register_and_login_lab_assistant(client: AsyncClient) -> dict:
    register_payload = {
        "email": "lab1@example.com",
        "password": "labpass123",
        "full_name": "Lab Assistant One",
        "role": "lab_assistant",
    }

    # Ignore if already exists; registration may return 400 on duplicate
    await client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "lab1@example.com",
        "password": "labpass123",
    }
    login_res = await client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def register_patient_and_profile(client: AsyncClient) -> tuple[str, dict]:
    """Create a patient user + patient profile and return (patient_id_beanie_id, auth_headers)."""
    user_payload = {
        "email": "lab_patient_test@example.com",
        "password": "patientpass123",
        "full_name": "Lab Patient Test",
        "role": "patient",
    }
    await client.post("/api/auth/register", json=user_payload)

    # Login as patient
    login_payload = {
        "email": user_payload["email"],
        "password": user_payload["password"],
    }
    res_login = await client.post("/api/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    patient_headers = {"Authorization": f"Bearer {token}"}

    # Create patient profile
    profile_payload = {
        "date_of_birth": "1999-01-01",
        "gender": "male",
        "blood_group": "O+",
        "address": "Dhaka",
        "emergency_contact": "01711111111",
        "emergency_contact_name": "Guardian",
        "allergies": ["pollen"],
        "chronic_conditions": ["hypertension"],
        "current_medications": ["med1"],
    }
    res_profile = await client.post(
        "/api/patients/", json=profile_payload, headers=patient_headers
    )
    assert res_profile.status_code in (200, 201)
    patient_profile = res_profile.json()
    patient_id_beanie = patient_profile["id"]
    return patient_id_beanie, patient_headers


@pytest.mark.anyio
async def test_lab_assistant_profile_crud(init_db):
    """Create (or reuse), view, and update lab assistant profile."""
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await register_and_login_lab_assistant(client)

        # Try to create lab assistant profile (may already exist)
        create_payload = {
            "date_of_birth": "1998-05-10",
            "gender": "female",
            "blood_group": "B+",
            "contact_no": "01720000000",
            "hospital": "Test Hospital",
            "department": "Pathology",
        }
        res_create = await client.post(
            "/api/lab/profile", json=create_payload, headers=headers
        )

        if res_create.status_code in (200, 201):
            lab_profile = res_create.json()
            lab_id = lab_profile["id"]
        elif res_create.status_code == 400:
            # Profile already exists; fetch it
            res_me_existing = await client.get("/api/lab/profile/me", headers=headers)
            assert res_me_existing.status_code == 200
            lab_id = res_me_existing.json()["id"]
        else:
            assert False, f"Unexpected status for create profile: {res_create.status_code}"

        # Get own lab profile
        res_me = await client.get("/api/lab/profile/me", headers=headers)
        assert res_me.status_code == 200
        assert res_me.json()["id"] == lab_id

        # Update lab profile
        update_payload = {
            "department": "Biochemistry",
            "contact_no": "01729999999",
        }
        res_update = await client.put(
            "/api/lab/profile/me", json=update_payload, headers=headers
        )
        assert res_update.status_code == 200

        # Verify update
        res_me_updated = await client.get("/api/lab/profile/me", headers=headers)
        assert res_me_updated.status_code == 200
        updated = res_me_updated.json()
        assert updated["department"] == "Biochemistry"
        assert updated["contact_no"] == "01729999999"


@pytest.mark.anyio
async def test_lab_assistant_can_see_patients_and_upload_report(init_db):
    """
    Lab assistant:
    - sees patient in /api/lab/patients
    - uploads diagnostic report for patient
    - sees patient reports and detailed info
    """
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        lab_headers = await register_and_login_lab_assistant(client)

        # Create patient user + profile
        patient_id_beanie, patient_headers = await register_patient_and_profile(client)

        # Lab assistant: get patients list
        res_patients = await client.get("/api/lab/patients", headers=lab_headers)
        assert res_patients.status_code == 200
        patients_list = res_patients.json()
        assert isinstance(patients_list, list)
        assert any(p["id"] == patient_id_beanie for p in patients_list)

        # Upload diagnostic report for that patient.
        # Route expects path param patient_id that is BSON ObjectId string,
        # but tests can pass the Beanie id; backend converts using ObjectId().
        file_content = b"fake pdf bytes for test"
        files = {
            "file": ("test_report.pdf", file_content, "application/pdf"),
        }
        # report_type and notes are query/FORM fields, so we keep them in "data"
        data = {
            "report_type": "Blood Test",
            "notes": "Normal values",
        }
        res_upload = await client.post(
            f"/api/lab/upload-report/{patient_id_beanie}",
            headers=lab_headers,
            data=data,
            files=files,
        )
        assert res_upload.status_code == 200
        upload_body = res_upload.json()
        assert upload_body["message"] == "Report uploaded successfully"
        report_id = upload_body["report_id"]

        # Get patient reports via /api/lab/reports/{patient_id}
        res_reports = await client.get(
            f"/api/lab/reports/{patient_id_beanie}", headers=lab_headers
        )
        assert res_reports.status_code == 200
        reports = res_reports.json()
        assert isinstance(reports, list)
        assert any(r["report_id"] == report_id for r in reports)

        # Get patient details for lab (full profile + history)
        res_details = await client.get(
            f"/api/lab/patients/{patient_id_beanie}/details", headers=lab_headers
        )
        assert res_details.status_code == 200
        details = res_details.json()
        assert details["success"] is True
        assert details["patient"]["id"] == patient_id_beanie
        assert details["report_count"] >= 1
        assert any(
            r["report_id"] == report_id for r in details["medical_history"]
        )
