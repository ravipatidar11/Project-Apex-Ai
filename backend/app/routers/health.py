from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "online",
        "database": db_status,
        "service": "AI Chatbot Backend API",
        "ai_provider": settings.AI_PROVIDER.strip().lower(),
        "ai_model": settings.GROQ_MODEL if settings.AI_PROVIDER.strip().lower() == "groq" else settings.GEMINI_MODEL,
    }
