import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api import (
    routes_projects, routes_generation, routes_vastu, routes_structure,
    routes_export, routes_steel, routes_vision, routes_plumbing, routes_electrical
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vastucraft_api")

# Initialize DB tables
Base.metadata.create_all(bind=engine)

is_prod = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title="VASTUCRAFT AI API",
    version=settings.VERSION,
    description="VASTUCRAFT AI — Intelligent Floor Planning, Vastu Insight, Structural Detailing & AI Plumbing Optimization API",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc"
)

# CORS Config
cors_origins = settings.CORS_ORIGINS
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not allow_all,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handler for unhandled internal server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    if is_prod:
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Include API Routers
app.include_router(routes_projects.router, prefix=settings.API_V1_STR)
app.include_router(routes_generation.router, prefix=settings.API_V1_STR)
app.include_router(routes_vastu.router, prefix=settings.API_V1_STR)
app.include_router(routes_structure.router, prefix=settings.API_V1_STR)
app.include_router(routes_steel.router, prefix=settings.API_V1_STR)
app.include_router(routes_plumbing.router, prefix=settings.API_V1_STR)
app.include_router(routes_electrical.router, prefix=settings.API_V1_STR)
app.include_router(routes_vision.router, prefix=settings.API_V1_STR)
app.include_router(routes_export.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "docs_url": None if is_prod else "/docs"
    }

