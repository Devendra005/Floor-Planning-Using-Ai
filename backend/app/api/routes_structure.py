from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, PreliminaryStructure
from app.services.structure.structural_engine import StructuralEngine

router = APIRouter(prefix="/structure", tags=["Structural Visualization"])

class StructureGenerateRequest(BaseModel):
    rooms: List[LayoutRoom]
    plot: PlotConfig

@router.post("/generate", response_model=PreliminaryStructure)
def generate_structure(payload: StructureGenerateRequest):
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure(payload.rooms, payload.plot)
    return structure
