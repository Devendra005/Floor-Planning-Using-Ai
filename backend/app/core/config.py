import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    if value is None:
        return default

    cleaned = value.strip()
    if not cleaned:
        return default

    if name == "DATABASE_URL":
        upper_value = cleaned.upper()
        if cleaned.startswith("******") or (
            "POSTGRESQL://" in upper_value and "HOST" in upper_value and "DATABASE" in upper_value
        ):
            return default

    return cleaned


class Settings:
    PROJECT_NAME: str = _get_env("PROJECT_NAME", "AI Vastu Planner")
    VERSION: str = _get_env("VERSION", "1.0.0")
    API_V1_STR: str = _get_env("API_V1_STR", "/api/v1")
    DATABASE_URL: str = _get_env("DATABASE_URL", "sqlite:///./vastu_planner.db")
    SECRET_KEY: str = _get_env("SECRET_KEY", "dev-secret-key-change-in-production")
    ENVIRONMENT: str = _get_env("ENVIRONMENT", "development")
    MAX_UPLOAD_SIZE_MB: int = int(_get_env("MAX_UPLOAD_SIZE_MB", "10"))

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
