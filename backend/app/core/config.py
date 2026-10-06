import os
from typing import List

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AI Vastu Planner")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vastu_planner.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins_str = os.getenv("CORS_ORIGINS", "")
        if origins_str:
            return [origin.strip() for origin in origins_str.split(",") if origin.strip()]
        # Default safe development origins
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        ]

settings = Settings()

