from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import FloorPlanDB
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, ElectricalReportData, ElectricalFixture
)
from app.services.electrical.electrical_engine import ElectricalEngine

router = APIRouter(prefix="/electrical", tags=["Electrical Planning & Layout Engine"])

class ElectricalGenerateRequest(BaseModel):
    rooms: List[LayoutRoom]
    plot: PlotConfig

@router.post("/generate", response_model=ElectricalReportData)
def generate_electrical_plan(payload: ElectricalGenerateRequest):
    engine = ElectricalEngine()
    return engine.generate_electrical_plan(payload.rooms, payload.plot)

@router.post("/analyze", response_model=ElectricalReportData)
def analyze_electrical_plan(payload: ElectricalGenerateRequest):
    engine = ElectricalEngine()
    return engine.generate_electrical_plan(payload.rooms, payload.plot)

@router.get("/report/{plan_id}")
def get_electrical_report_by_plan_id(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(FloorPlanDB).filter(FloorPlanDB.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Floor plan not found.")
    return {
        "plan_id": plan.id,
        "plan_name": plan.name,
        "electrical_data": getattr(plan, "electrical_data", None)
    }
