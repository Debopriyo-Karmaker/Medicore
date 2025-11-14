from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment

client: AsyncIOMotorClient = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # Initialize beanie with the User document model
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[User, Patient, Appointment]
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
    return client[settings.DATABASE_NAME]