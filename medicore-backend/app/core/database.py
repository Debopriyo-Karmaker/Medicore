from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.doctor_profile import DoctorProfile

client: AsyncIOMotorClient = None
db = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Initialize beanie with all document models
    await init_beanie(
        database=db,
        document_models=[User, Patient, Appointment, Prescription, DoctorProfile]
    )
    
    print("✅ Connected to MongoDB")

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
    print("❌ Closed MongoDB connection")

def get_database():
    """Get database instance"""
    return db
