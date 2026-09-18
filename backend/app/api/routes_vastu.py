from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import FloorPlanDB
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, VastuProfileEnum, VastuEvaluationReport, VastuModeEnum
)
from app.services.vastu.vastu_engine import VastuEngine

router = APIRouter(prefix="/vastu", tags=["Vastu Evaluation & Optimization"])

class VastuEvaluateRequest(BaseModel):
    rooms: List[LayoutRoom]
    plot: PlotConfig
    profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC

class VastuOptimizeRequest(BaseModel):
    rooms: List[LayoutRoom]
    plot: PlotConfig
    profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC

@router.post("/evaluate", response_model=VastuEvaluationReport)
def evaluate_vastu(payload: VastuEvaluateRequest):
    engine = VastuEngine()
    report = engine.evaluate_layout(payload.rooms, payload.plot, payload.profile)
    return report

@router.post("/detailed-analysis")
def detailed_vastu_analysis(payload: VastuEvaluateRequest):
    engine = VastuEngine()
    return engine.evaluate_layout_detailed(payload.rooms, payload.plot, payload.profile)

@router.post("/optimize")
def optimize_vastu(payload: VastuOptimizeRequest):
    engine = VastuEngine()
    optimized_rooms, summary = engine.optimize_layout(payload.rooms, payload.plot, payload.profile)
    detailed_report = engine.evaluate_layout(optimized_rooms, payload.plot, payload.profile)
    return {
        "optimized_rooms": optimized_rooms,
        "optimization_summary": summary,
        "vastu_report": detailed_report
    }

@router.get("/report/{plan_id}")
def get_vastu_report_by_plan_id(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(FloorPlanDB).filter(FloorPlanDB.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Floor plan not found.")
    return {
        "plan_id": plan.id,
        "plan_name": plan.name,
        "vastu_score": plan.vastu_score,
        "vastu_report": plan.vastu_report_data
    }

@router.get("/rules")
def get_vastu_rules():
    engine = VastuEngine()
    return engine.rules

@router.get("/modes")
def get_vastu_modes():
    return [
        {
            "mode": "STRICT",
            "name": "Strict Vastu",
            "vastu_weight": "60%",
            "description": "Vastu principles carry primary fitness weight. High adherence required."
        },
        {
            "mode": "BALANCED",
            "name": "Balanced (Default)",
            "vastu_weight": "35%",
            "description": "Vastu alignment and spatial efficiency have equal priority."
        },
        {
            "mode": "FLEXIBLE",
            "name": "Flexible",
            "vastu_weight": "15%",
            "description": "Architectural functionality dominates; Vastu used for recommendations."
        }
    ]

@router.get("/profiles")
def get_vastu_profiles():
    return [
        {"id": "traditional-basic", "name": "Traditional Basic", "description": "Standard 9-zone rule set based on traditional classical Vastu texts."},
        {"id": "traditional-detailed", "name": "Traditional Detailed", "description": "Extended 81-pad mandala grid rules with strict directional priorities."},
        {"id": "custom-expert", "name": "Custom Expert", "description": "Advanced consultant rules prioritizing primary room placements."},
        {"id": "user-defined", "name": "User Defined", "description": "Custom user-configurable rule weighting."}
    ]
