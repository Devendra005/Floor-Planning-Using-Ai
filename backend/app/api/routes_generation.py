import random
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pydantic_schemas import (
    PlotConfig, RoomRequirement, OptimizationWeights, VastuProfileEnum, FloorPlanCandidate,
    LayoutStrategyInfo, PlanSimilarityDetail, DifferentPlanRequest, LayoutRoom
)
from app.services.planning.genetic_solver import GeneticLayoutSolver
from app.services.planning.diversity_solver import LayoutDiversitySolver
from app.services.planning.layout_strategies import get_all_strategy_infos, STRATEGY_REGISTRY
from app.services.planning.similarity_engine import SimilarityEngine
from app.services.planning.room_requirements import validate_user_requirements

router = APIRouter(prefix="/generate", tags=["AI Floor Plan Generation"])

class GenerationRequest(BaseModel):
    plot: PlotConfig
    requirements: List[RoomRequirement]
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)
    vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    num_candidates: int = Field(default=1, ge=1, le=10)
    population_size: int = Field(default=40, ge=10, le=200)
    generations: int = Field(default=25, ge=5, le=100)
    vastu_strictness: str = "BALANCED" # STRICT, BALANCED, FLEXIBLE
    max_similarity_threshold: float = Field(default=70.0, ge=0.0, le=100.0)
    diversity_mode: bool = True
    exclude_signatures: List[str] = Field(default_factory=list)
    strategies: Optional[List[str]] = None
    seed: Optional[int] = None

class SimilarityCheckRequest(BaseModel):
    plan_a_rooms: List[LayoutRoom]
    plan_b_rooms: List[LayoutRoom]
    plot: PlotConfig

@router.get("/strategies", response_model=List[LayoutStrategyInfo])
def list_layout_strategies():
    """Returns available architectural layout generation strategies."""
    return get_all_strategy_infos()

@router.post("", response_model=List[FloorPlanCandidate])
def generate_layouts(payload: GenerationRequest):
    """
    Main floor plan generation endpoint.
    Utilizes the Layout Diversity Engine to generate distinct, non-repetitive architectural floor plan options.
    Validates input feasibility before generating candidates.
    """
    if not payload.requirements:
        raise HTTPException(status_code=400, detail="At least one room requirement must be provided.")

    is_valid, errors, summary = validate_user_requirements(payload.plot, payload.requirements)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Infeasible floor plan requirement: {'; '.join(errors)}"
        )

    seed_val = payload.seed if payload.seed is not None else random.randint(1000, 999999)

    if payload.num_candidates > 1 or payload.diversity_mode:
        diversity_solver = LayoutDiversitySolver(
            plot=payload.plot,
            requirements=payload.requirements,
            weights=payload.weights,
            vastu_profile=payload.vastu_profile,
            vastu_strictness=payload.vastu_strictness,
            max_similarity_threshold=payload.max_similarity_threshold,
            seed=seed_val
        )
        candidates = diversity_solver.generate_multiple_unique_plans(
            num_candidates=payload.num_candidates,
            target_strategies=payload.strategies,
            exclude_signatures=payload.exclude_signatures
        )
        return candidates

    # Single-candidate standard solver
    solver = GeneticLayoutSolver(
        plot=payload.plot,
        requirements=payload.requirements,
        weights=payload.weights,
        vastu_profile=payload.vastu_profile,
        population_size=payload.population_size,
        generations=payload.generations
    )
    candidates = solver.solve(num_candidates=1)
    return candidates

@router.post("/multiple", response_model=List[FloorPlanCandidate])
def generate_multiple_unique_layouts(payload: GenerationRequest):
    """
    Generates multiple genuinely distinct residential floor plans across
    different spatial typologies (Central Corridor, Side Corridor, Open Plan, etc.).
    """
    if not payload.requirements:
        raise HTTPException(status_code=400, detail="At least one room requirement must be provided.")

    is_valid, errors, summary = validate_user_requirements(payload.plot, payload.requirements)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Infeasible floor plan requirement: {'; '.join(errors)}"
        )

    seed_val = payload.seed if payload.seed is not None else random.randint(1000, 999999)

    solver = LayoutDiversitySolver(
        plot=payload.plot,
        requirements=payload.requirements,
        weights=payload.weights,
        vastu_profile=payload.vastu_profile,
        vastu_strictness=payload.vastu_strictness,
        max_similarity_threshold=payload.max_similarity_threshold,
        seed=seed_val
    )
    candidates = solver.generate_multiple_unique_plans(
        num_candidates=max(2, payload.num_candidates),
        target_strategies=payload.strategies,
        exclude_signatures=payload.exclude_signatures
    )
    return candidates

@router.post("/regenerate", response_model=List[FloorPlanCandidate])
def regenerate_layouts(payload: GenerationRequest):
    """
    Regenerates floor plans with a fresh random seed and excludes previously generated plan signatures.
    """
    if not payload.requirements:
        raise HTTPException(status_code=400, detail="At least one room requirement must be provided.")

    seed_val = random.randint(100000, 999999) if payload.seed is None else payload.seed

    solver = LayoutDiversitySolver(
        plot=payload.plot,
        requirements=payload.requirements,
        weights=payload.weights,
        vastu_profile=payload.vastu_profile,
        vastu_strictness=payload.vastu_strictness,
        max_similarity_threshold=payload.max_similarity_threshold,
        seed=seed_val
    )
    candidates = solver.generate_multiple_unique_plans(
        num_candidates=max(2, payload.num_candidates),
        target_strategies=payload.strategies,
        exclude_signatures=payload.exclude_signatures
    )
    return candidates

@router.post("/different", response_model=FloorPlanCandidate)
def generate_different_layout(payload: DifferentPlanRequest):
    """
    Generates a single layout guaranteed to be architecturally different
    from the provided exclusion signatures (< max_similarity_threshold).
    """
    if not payload.requirements:
        raise HTTPException(status_code=400, detail="At least one room requirement must be provided.")

    seed_val = random.randint(100000, 999999)

    solver = LayoutDiversitySolver(
        plot=payload.plot,
        requirements=payload.requirements,
        weights=payload.weights,
        vastu_profile=payload.vastu_profile,
        vastu_strictness=payload.vastu_strictness,
        max_similarity_threshold=payload.max_similarity_threshold,
        seed=seed_val
    )
    candidate = solver.generate_different_plan(
        exclude_signatures=payload.exclude_signatures,
        preferred_strategy=payload.target_strategy
    )
    return candidate

@router.post("/similarity", response_model=PlanSimilarityDetail)
def compare_plans_similarity(payload: SimilarityCheckRequest):
    """
    Calculates detailed geometric and OpenCV visual similarity between two floor plans.
    """
    res = SimilarityEngine.calculate_similarity(
        rooms_a=payload.plan_a_rooms,
        rooms_b=payload.plan_b_rooms,
        plot=payload.plot
    )
    return PlanSimilarityDetail(**res)
