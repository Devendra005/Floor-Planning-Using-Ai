from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, PreliminaryStructure, StructuralGridData,
    StructuralColumn, StructuralBeam, StructuralSlab, StructuralFooting,
    RebarSpec, BarBendingScheduleItem, QuantityTakeoffSummary, StructuralClash
)
from app.services.structure.structural_engine import StructuralEngine
from app.services.structure.steel_engine import SteelEngine
from app.services.structure.clash_engine import ClashDetectionEngine

router = APIRouter(prefix="/steel", tags=["Steel & Reinforcement Planning"])

class SteelSetupRequest(BaseModel):
    rooms: List[LayoutRoom]
    plot: PlotConfig

@router.post("/setup", response_model=PreliminaryStructure)
def setup_steel_structure(payload: SteelSetupRequest):
    engine = StructuralEngine()
    return engine.generate_preliminary_structure(payload.rooms, payload.plot)

@router.post("/grid/generate", response_model=StructuralGridData)
def generate_grid(payload: SteelSetupRequest):
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure(payload.rooms, payload.plot)
    return structure.grid

@router.post("/reinforcement/generate", response_model=List[RebarSpec])
def generate_reinforcement(payload: SteelSetupRequest):
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure(payload.rooms, payload.plot)
    return structure.rebars

@router.post("/quantity", response_model=QuantityTakeoffSummary)
def get_quantity_takeoff(payload: SteelSetupRequest):
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure(payload.rooms, payload.plot)
    return structure.quantity_summary

@router.post("/schedule", response_model=List[BarBendingScheduleItem])
def get_bar_schedule(payload: SteelSetupRequest):
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure(payload.rooms, payload.plot)
    return structure.bar_schedule

@router.post("/clashes", response_model=List[StructuralClash])
def run_clash_detection(payload: SteelSetupRequest):
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure(payload.rooms, payload.plot)
    return structure.clashes
