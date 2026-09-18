from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/export", tags=["Project Export"])

class ExportPayload(BaseModel):
    project_name: str
    plan_name: str
    vastu_score: float
    report: Dict[str, Any]
    structure: Dict[str, Any]

@router.post("/summary")
def export_summary(payload: ExportPayload):
    return {
        "status": "success",
        "export_timestamp": "2026-08-18T19:55:00Z",
        "data": payload.model_dump(),
        "disclaimer": (
            "Exported report contains traditional Vastu preferences and preliminary "
            "structural geometry visualization. Not for construction certification."
        )
    }
