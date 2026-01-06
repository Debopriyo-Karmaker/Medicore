from fastapi import (
    APIRouter,
    HTTPException,
    status,
    Depends,
    UploadFile,
    File,
)
from fastapi.responses import JSONResponse, StreamingResponse
from beanie import PydanticObjectId
from datetime import datetime
import base64
import uuid
import sys
import traceback
from io import BytesIO

from app.models.user import User, UserRole
from app.models.patient import Patient, DiagnosticReport
from app.models.lab_assistant import LabAssistant
from app.schemas.lab_assistant import (
    LabAssistantCreate,
    LabAssistantUpdate,
    LabAssistantResponse,
)
from app.api.routes.auth import get_current_user

# PDF generation (ReportLab)
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT


router = APIRouter()


# ============================================================================
# LAB ASSISTANT PROFILE ENDPOINTS (NEW)
# ============================================================================


@router.post("/profile", status_code=status.HTTP_201_CREATED)
async def create_lab_assistant_profile(
    data: LabAssistantCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Create lab assistant profile (lab assistants only).
    """

    try:
        if current_user.role != UserRole.LAB_ASSISTANT:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Only lab assistants can create profiles"},
            )

        existing = await LabAssistant.find_one(
            LabAssistant.user_id == str(current_user.id)
        )
        if existing:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Lab assistant profile already exists"},
            )

        profile = LabAssistant(
            user_id=str(current_user.id),
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            blood_group=data.blood_group,
            contact_no=data.contact_no,
            hospital=data.hospital,
            department=data.department,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        await profile.insert()

        return LabAssistantResponse(
            id=str(profile.id),
            user_id=profile.user_id,
            date_of_birth=profile.date_of_birth,
            gender=profile.gender,
            blood_group=profile.blood_group,
            contact_no=profile.contact_no,
            hospital=profile.hospital,
            department=profile.department,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Error: {str(e)}"},
        )


@router.get("/profile/me", response_model=LabAssistantResponse)
async def get_my_lab_assistant_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current lab assistant's profile.
    """

    profile = await LabAssistant.find_one(
        LabAssistant.user_id == str(current_user.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab assistant profile not found",
        )

    return LabAssistantResponse(
        id=str(profile.id),
        user_id=profile.user_id,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        blood_group=profile.blood_group,
        contact_no=profile.contact_no,
        hospital=profile.hospital,
        department=profile.department,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.put("/profile/me", response_model=LabAssistantResponse)
async def update_my_lab_assistant_profile(
    data: LabAssistantUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update the current lab assistant's profile.
    """

    profile = await LabAssistant.find_one(
        LabAssistant.user_id == str(current_user.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab assistant profile not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()
    await profile.save()

    return LabAssistantResponse(
        id=str(profile.id),
        user_id=profile.user_id,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        blood_group=profile.blood_group,
        contact_no=profile.contact_no,
        hospital=profile.hospital,
        department=profile.department,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


# ============================================================================
# EXISTING LAB FEATURES
# ============================================================================


@router.get("/patients")
async def get_patients_list(current_user: User = Depends(get_current_user)):
    """Get list of all patients for lab work"""

    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
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
                    "name": user.full_name if user else "N/A",
                    "email": user.email if user else "N/A",
                    "blood_group": patient.blood_group,
                    "gender": patient.gender,
                }
            )

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}",
        )


@router.post("/upload-report/{patient_id}")
async def upload_diagnostic_report(
    patient_id: str,
    report_type: str,
    notes: str = "",
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload diagnostic report for a patient"""

    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can upload reports",
        )

    try:
        # Find patient
        from bson import ObjectId

        patient = await Patient.get(ObjectId(patient_id))

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Read file and convert to base64
        file_content = await file.read()
        file_base64 = base64.b64encode(file_content).decode("utf-8")

        # Create report object
        report = DiagnosticReport(
            report_id=str(uuid.uuid4()),
            report_type=report_type,
            uploaded_by=current_user.full_name,
            uploaded_at=datetime.utcnow(),
            file_url=f"data:{file.content_type};base64,{file_base64}",
            notes=notes,
        )

        # Add to patient's reports
        if not patient.diagnostic_reports:
            patient.diagnostic_reports = []

        patient.diagnostic_reports.append(report)
        patient.updated_at = datetime.utcnow()
        await patient.save()

        print(
            f"✅ Report uploaded for patient {patient.patient_id}", file=sys.stderr
        )

        return {
            "message": "Report uploaded successfully",
            "report_id": report.report_id,
        }

    except Exception as e:
        print(f"❌ Error uploading report: {str(e)}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading report: {str(e)}",
        )


@router.get("/reports")
async def get_all_reports(current_user: User = Depends(get_current_user)):
    """Return all diagnostic reports for the hospital."""

    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    patients = await Patient.find().to_list()
    reports = []
    for p in patients:
        for r in (p.diagnostic_reports or []):
            reports.append(
                {
                    "patient_id": p.patient_id,
                    "patient_name": (await User.get(p.user_id)).full_name
                    if p.user_id
                    else "N/A",
                    "report_id": r.report_id,
                    "report_type": r.report_type,
                    "file_url": r.file_url,
                    "created_at": r.uploaded_at,
                }
            )
    return reports


@router.get("/reports/{patient_id}")
async def get_patient_reports(
    patient_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient.diagnostic_reports or []


@router.delete("/reports/{patient_id}/{report_id}")
async def delete_report_for_patient(
    patient_id: PydanticObjectId,
    report_id: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # keep all reports except the one to delete
    original_len = len(patient.diagnostic_reports or [])
    patient.diagnostic_reports = [
        r for r in (patient.diagnostic_reports or []) if str(r.id) != report_id
    ]

    if len(patient.diagnostic_reports) == original_len:
        raise HTTPException(status_code=404, detail="Report not found")

    await patient.save()
    return {"message": "Report deleted"}


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    patients = await Patient.find().to_list()
    found = False

    for p in patients:
        if not p.diagnostic_reports:
            continue

        new_reports = [r for r in p.diagnostic_reports if r.report_id != report_id]

        if len(new_reports) != len(p.diagnostic_reports):
            p.diagnostic_reports = new_reports
            p.updated_at = datetime.utcnow()
            await p.save()
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Report not found")

    return {"message": "Report deleted"}


@router.get("/statistics")
async def get_lab_statistics(current_user: User = Depends(get_current_user)):
    """Get lab assistant statistics"""

    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    try:
        total_patients = len(await Patient.find().to_list())

        # Count total reports uploaded
        patients = await Patient.find().to_list()
        total_reports = sum(len(p.diagnostic_reports or []) for p in patients)

        print(
            f"📊 Statistics: {total_patients} patients, {total_reports} reports",
            file=sys.stderr,
        )

        return {
            "total_patients": total_patients,
            "reports_uploaded": total_reports,
            "pending_tests": 0,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}",
        )


# ============================================================================
# PATIENT DETAILS + PDF EXPORT FOR LAB ASSISTANT
# ============================================================================


@router.get("/patients/{patient_id}/details")
async def get_patient_details_for_lab(
    patient_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """
    Return full patient info + diagnostic history for lab assistant.
    """
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    user = await User.get(patient.user_id) if patient.user_id else None

    patient_data = {
        "id": str(patient.id),
        "patient_id": patient.patient_id,
        "name": user.full_name if user else "N/A",
        "email": user.email if user else "N/A",
        "gender": patient.gender,
        "blood_group": patient.blood_group,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
    }

    history = []
    for r in patient.diagnostic_reports or []:
        history.append(
            {
                "report_id": r.report_id,
                "report_type": r.report_type,
                "uploaded_by": r.uploaded_by,
                "uploaded_at": r.uploaded_at,
                "file_url": r.file_url,
                "notes": r.notes,
            }
        )

    return {
        "success": True,
        "patient": patient_data,
        "medical_history": history,
        "report_count": len(history),
    }


@router.get("/patients/{patient_id}/download-pdf")
async def download_patient_pdf_for_lab(
    patient_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """
    Generate a styled PDF of patient info + diagnostic history for download.
    """
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this",
        )

    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    user = await User.get(patient.user_id) if patient.user_id else None
    reports = patient.diagnostic_reports or []

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#11998e"),
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    heading_style = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#11998e"),
        spaceBefore=12,
        spaceAfter=8,
    )
    normal_style = ParagraphStyle(
        "NormalCustom",
        parent=styles["Normal"],
        fontSize=10,
        alignment=TA_LEFT,
        spaceAfter=4,
    )

    story = []

    story.append(Paragraph("PATIENT MEDICAL RECORD", title_style))
    story.append(
        Paragraph(
            f"Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}",
            normal_style,
        )
    )
    story.append(Spacer(1, 0.3 * inch))

    # Patient info
    story.append(Paragraph("PATIENT INFORMATION", heading_style))

    patient_rows = [
        ["Full Name", user.full_name if user else "N/A"],
        ["Email", user.email if user else "N/A"],
        ["Patient ID", patient.patient_id],
        ["Gender", patient.gender or "N/A"],
        ["Blood Group", patient.blood_group or "N/A"],
    ]

    patient_table = Table(patient_rows, colWidths=[2 * inch, 4 * inch])
    patient_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E8F7F6")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(patient_table)
    story.append(Spacer(1, 0.2 * inch))

    # Diagnostic history
    story.append(
        Paragraph(f"DIAGNOSTIC HISTORY ({len(reports)} reports)", heading_style)
    )

    if reports:
        for idx, r in enumerate(reports, 1):
            story.append(
                Paragraph(
                    f"<b>Report {idx}: {r.report_type}</b> "
                    f"({r.uploaded_at.strftime('%d %B %Y, %H:%M UTC')})",
                    normal_style,
                )
            )
            rows = [
                ["Uploaded By", r.uploaded_by or "N/A"],
            ]
            if r.notes:
                rows.append(["Notes", r.notes])

            report_table = Table(rows, colWidths=[2 * inch, 4 * inch])
            report_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#FFFFFF")),
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            story.append(report_table)
            story.append(Spacer(1, 0.15 * inch))
    else:
        story.append(Paragraph("No diagnostic reports found.", normal_style))

    doc.build(story)
    buffer.seek(0)

    filename = f"patient_{patient.patient_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
