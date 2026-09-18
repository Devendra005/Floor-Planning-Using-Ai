class Settings:
    PROJECT_NAME: str = "AI Vastu Planner"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./vastu_planner.db"
    CORS_ORIGINS: list = ["*"]

settings = Settings()
