from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import chats, health

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="REST API backend for AI Chatbot powered by FastAPI, SQLAlchemy and Google Gemini API."
)

# CORS Configuration
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, prefix="/api")
app.include_router(chats.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "AI Chatbot Backend API is running.",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
