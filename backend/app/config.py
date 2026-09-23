import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Chatbot API"
    VERSION: str = "1.0.0"
    
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS setup
    CORS_ORIGINS: Union[str, List[str]] = "*"
    
    # Database configuration
    DATABASE_URL: str = "sqlite:///./chatbot.db"
    
    # AI configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def formatted_database_url(self) -> str:
        url = self.DATABASE_URL
        # Supabase / Heroku / Render fix: convert postgres:// to postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

settings = Settings()
