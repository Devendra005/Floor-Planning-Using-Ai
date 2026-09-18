from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import FloorPlanDB
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, PlumbingReportData, PlumbingCostEstimate, PipeSegment, PlumbingFixture
)
from app.services.plumbing.plumbing_engine import PlumbingEngine
from app.services.plumbing.pipe_router import route_plumbing_systems
from app.services.plumbing.plumbing_cost import estimate_plumbing_cost

router = APIRouter(prefix="/plumbing", tags=["Plumbing Planning & Optimization Engine"])

class PlumbingAnalyzeRequest(BaseModel):
    rooms: List[LayoutRoom]
    plot: PlotConfig

class PlumbingRouteRequest(BaseModel):
    rooms: List[LayoutRoom]
    fixtures: List[PlumbingFixture]
    plot: PlotConfig

class PlumbingCostRequest(BaseModel):
    pipe_routes: List[PipeSegment]
    fixtures: List[PlumbingFixture]
    custom_rates: Optional[Dict[str, float]] = None

@router.post("/analyze", response_model=PlumbingReportData)
def analyze_plumbing(payload: PlumbingAnalyzeRequest):
    engine = PlumbingEngine()
    return engine.analyze_layout_plumbing(payload.rooms, payload.plot)

@router.post("/optimize", response_model=PlumbingReportData)
def optimize_plumbing(payload: PlumbingAnalyzeRequest):
    engine = PlumbingEngine()
    return engine.analyze_layout_plumbing(payload.rooms, payload.plot)

@router.post("/route", response_model=List[PipeSegment])
def route_pipes(payload: PlumbingRouteRequest):
    engine = PlumbingEngine()
    report = engine.analyze_layout_plumbing(payload.rooms, payload.plot)
    return report.pipe_routes

@router.post("/cost", response_model=PlumbingCostEstimate)
def compute_plumbing_cost(payload: PlumbingCostRequest):
    return estimate_plumbing_cost(payload.pipe_routes, payload.fixtures, payload.custom_rates)

@router.get("/report/{plan_id}")
def get_plumbing_report_by_plan_id(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(FloorPlanDB).filter(FloorPlanDB.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Floor plan not found.")
    return {
        "plan_id": plan.id,
        "plan_name": plan.name,
        "plumbing_score": getattr(plan, "plumbing_score", 85.0),
        "plumbing_report": getattr(plan, "plumbing_data", None)
    }
