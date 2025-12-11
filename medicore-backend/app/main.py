from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.routes import (
    auth, 
    patients, 
    appointments, 
    admin, 
    lab_assistant,
    doctor_profile,
    prescriptions
)


app = FastAPI(
    title="Medicore API",
    description="Hospital Management System API",
    version="1.0.0"
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup and Shutdown Events
@app.on_event("startup")
async def startup():
    await connect_to_mongo()
    print("✅ MongoDB Connected")
    print("🚀 Medicore API Started")
    print("📚 API Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()
    print("👋 MongoDB Connection Closed")


# Include Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(lab_assistant.router, prefix="/api/lab", tags=["Lab Assistant"])
app.include_router(doctor_profile.router, prefix="/api/doctor-profile", tags=["Doctor Profile"])
app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Prescriptions"])


# Health Check Endpoints
@app.get("/")
async def root():
    return {
        "message": "Medicore API - Hospital Management System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "patients": "/api/patients",
            "appointments": "/api/appointments",
            "doctor_profile": "/api/doctor-profile",
            "prescriptions": "/api/prescriptions",
            "lab": "/api/lab",
            "admin": "/api"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api": "running",
        "database": "connected"
    }
