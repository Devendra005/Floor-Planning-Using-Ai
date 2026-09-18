from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api import (
    routes_projects, routes_generation, routes_vastu, routes_structure,
    routes_export, routes_steel, routes_vision, routes_plumbing
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VASTUCRAFT AI API",
    version=settings.VERSION,
    description="VASTUCRAFT AI — Intelligent Floor Planning, Vastu Insight, Structural Detailing & AI Plumbing Optimization API"
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(routes_projects.router, prefix=settings.API_V1_STR)
app.include_router(routes_generation.router, prefix=settings.API_V1_STR)
app.include_router(routes_vastu.router, prefix=settings.API_V1_STR)
app.include_router(routes_structure.router, prefix=settings.API_V1_STR)
app.include_router(routes_steel.router, prefix=settings.API_V1_STR)
app.include_router(routes_plumbing.router, prefix=settings.API_V1_STR)
app.include_router(routes_vision.router, prefix=settings.API_V1_STR)
app.include_router(routes_export.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }
