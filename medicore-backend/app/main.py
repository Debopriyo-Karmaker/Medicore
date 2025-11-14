from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, patients, appointments, admin

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

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()

# Include Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(admin.router, prefix="/api", tags=["admin"])

# Health Check Endpoints
@app.get("/")
async def root():
    return {
        "message": "Medicore API - Hospital Management System",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
