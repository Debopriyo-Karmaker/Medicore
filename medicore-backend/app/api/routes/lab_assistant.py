from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.models.user import User, UserRole
from app.models.patient import Patient, DiagnosticReport
from app.api.routes.auth import get_current_user
from datetime import datetime
import base64
import uuid
import sys

router = APIRouter()


@router.get("/patients")
async def get_patients_list(current_user: User = Depends(get_current_user)):
    """Get list of all patients for lab work"""
    
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this"
        )
    
    try:
        patients = await Patient.find().to_list()
        result = []
        
        for patient in patients:
            user = await User.get(patient.user_id)
            result.append({
                "id": str(patient.id),
                "patient_id": patient.patient_id,
                "name": user.full_name if user else "N/A",
                "email": user.email if user else "N/A",
                "blood_group": patient.blood_group,
                "gender": patient.gender
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.post("/upload-report/{patient_id}")
async def upload_diagnostic_report(
    patient_id: str,
    report_type: str,
    notes: str = "",
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload diagnostic report for a patient"""
    
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can upload reports"
        )
    
    try:
        # Find patient
        from bson import ObjectId
        patient = await Patient.get(ObjectId(patient_id))
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Read file and convert to base64
        file_content = await file.read()
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        
        # Create report object
        report = DiagnosticReport(
            report_id=str(uuid.uuid4()),
            report_type=report_type,
            uploaded_by=current_user.full_name,
            uploaded_at=datetime.utcnow(),
            file_url=f"data:{file.content_type};base64,{file_base64}",
            notes=notes
        )
        
        # Add to patient's reports
        if not patient.diagnostic_reports:
            patient.diagnostic_reports = []
        
        patient.diagnostic_reports.append(report)
        patient.updated_at = datetime.utcnow()
        await patient.save()
        
        print(f"✅ Report uploaded for patient {patient.patient_id}", file=sys.stderr)
        
        return {
            "message": "Report uploaded successfully",
            "report_id": report.report_id
        }
        
    except Exception as e:
        print(f"❌ Error uploading report: {str(e)}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading report: {str(e)}"
        )


@router.get("/statistics")
async def get_lab_statistics(current_user: User = Depends(get_current_user)):
    """Get lab assistant statistics"""
    
    if current_user.role != UserRole.LAB_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lab assistants can access this"
        )
    
    try:
        total_patients = len(await Patient.find().to_list())
        
        # Count total reports uploaded
        patients = await Patient.find().to_list()
        total_reports = sum(len(p.diagnostic_reports or []) for p in patients)
        
        print(f"📊 Statistics: {total_patients} patients, {total_reports} reports", file=sys.stderr)
        
        return {
            "total_patients": total_patients,
            "reports_uploaded": total_reports,
            "pending_tests": 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )
