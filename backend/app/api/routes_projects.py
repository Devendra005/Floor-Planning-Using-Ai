import uuid
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import ProjectDB, FloorPlanDB
from app.models.pydantic_schemas import ProjectCreate, ProjectResponse, FloorPlanCandidate
from app.services.planning.genetic_solver import GeneticLayoutSolver
from app.services.planning.diversity_solver import LayoutDiversitySolver

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    proj_id = str(uuid.uuid4())
    
    # Run initial diverse layout generation
    try:
        diversity_solver = LayoutDiversitySolver(
            plot=payload.plot,
            requirements=payload.requirements,
            weights=payload.weights,
            vastu_profile=payload.vastu_profile,
            vastu_strictness=getattr(payload.plot, 'vastu_mode', 'BALANCED'),
            max_similarity_threshold=70.0
        )
        generated_plans = diversity_solver.generate_multiple_unique_plans(num_candidates=3)
    except Exception as e:
        solver = GeneticLayoutSolver(
            plot=payload.plot,
            requirements=payload.requirements,
            weights=payload.weights,
            vastu_profile=payload.vastu_profile,
            population_size=30,
            generations=20
        )
        generated_plans = solver.solve(num_candidates=1)


    proj_db = ProjectDB(
        id=proj_id,
        name=payload.name,
        description=payload.description or "",
        project_type=payload.project_type,
        location=payload.location or "",
        plot_data=payload.plot.model_dump(),
        requirements_data=[r.model_dump() for r in payload.requirements],
        vastu_profile=payload.vastu_profile.value,
        weights_data=payload.weights.model_dump()
    )
    db.add(proj_db)
    
    for plan in generated_plans:
        fp_db = FloorPlanDB(
            id=plan.id,
            project_id=proj_id,
            name=plan.name,
            fitness_score=plan.fitness_score,
            vastu_score=plan.vastu_score,
            plumbing_score=plan.plumbing_score or 85.0,
            rooms_data=[r.model_dump() for r in plan.rooms],
            vastu_report_data=plan.vastu_report.model_dump(),
            structure_data=plan.structure.model_dump(),
            plumbing_data=plan.plumbing.model_dump() if plan.plumbing else None,
            electrical_data=plan.electrical.model_dump() if plan.electrical else None
        )
        db.add(fp_db)

    db.commit()
    db.refresh(proj_db)

    return ProjectResponse(
        id=proj_db.id,
        name=proj_db.name,
        description=proj_db.description,
        project_type=proj_db.project_type,
        location=proj_db.location,
        plot=payload.plot,
        requirements=payload.requirements,
        vastu_profile=payload.vastu_profile,
        weights=payload.weights,
        plans=generated_plans,
        created_at=proj_db.created_at.isoformat(),
        updated_at=proj_db.updated_at.isoformat()
    )

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(ProjectDB).all()
    results = []
    for p in projects:
        plans = []
        for fp in p.plans:
            cand = FloorPlanCandidate(
                id=fp.id,
                name=fp.name,
                rooms=fp.rooms_data,
                fitness_score=fp.fitness_score,
                vastu_score=fp.vastu_score,
                plumbing_score=getattr(fp, 'plumbing_score', 85.0),
                requirement_score=90.0,
                space_utilization_score=85.0,
                circulation_score=88.0,
                adjacency_score=85.0,
                structural_score=90.0,
                daylight_score=90.0,
                vastu_report=fp.vastu_report_data,
                structure=fp.structure_data
            )
            if fp.plumbing_data:
                cand.plumbing = fp.plumbing_data
            if fp.electrical_data:
                cand.electrical = fp.electrical_data
            plans.append(cand)

        results.append(
            ProjectResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                project_type=p.project_type,
                location=p.location,
                plot=p.plot_data,
                requirements=p.requirements_data,
                vastu_profile=p.vastu_profile,
                weights=p.weights_data,
                plans=plans,
                created_at=p.created_at.isoformat(),
                updated_at=p.updated_at.isoformat()
            )
        )
    return results

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    plans = []
    for fp in p.plans:
        cand = FloorPlanCandidate(
            id=fp.id,
            name=fp.name,
            rooms=fp.rooms_data,
            fitness_score=fp.fitness_score,
            vastu_score=fp.vastu_score,
            plumbing_score=getattr(fp, 'plumbing_score', 85.0),
            requirement_score=90.0,
            space_utilization_score=85.0,
            circulation_score=88.0,
            adjacency_score=85.0,
            structural_score=90.0,
            daylight_score=90.0,
            vastu_report=fp.vastu_report_data,
            structure=fp.structure_data
        )
        if fp.plumbing_data:
            cand.plumbing = fp.plumbing_data
        if fp.electrical_data:
            cand.electrical = fp.electrical_data
        plans.append(cand)

    return ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        project_type=p.project_type,
        location=p.location,
        plot=p.plot_data,
        requirements=p.requirements_data,
        vastu_profile=p.vastu_profile,
        weights=p.weights_data,
        plans=plans,
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat()
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(p)
    db.commit()
    return None
