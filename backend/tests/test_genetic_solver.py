from app.services.planning.genetic_solver import GeneticLayoutSolver
from app.models.pydantic_schemas import PlotConfig, RoomRequirement

def test_genetic_solver_run():
    plot = PlotConfig(length=12.0, width=9.0)
    reqs = [
        RoomRequirement(id="1", name="Master Bedroom", room_type="master_bedroom", min_width=3.0, min_length=3.0),
        RoomRequirement(id="2", name="Kitchen", room_type="kitchen", min_width=2.5, min_length=2.5),
        RoomRequirement(id="3", name="Living Room", room_type="living", min_width=3.5, min_length=4.0)
    ]
    
    solver = GeneticLayoutSolver(
        plot=plot,
        requirements=reqs,
        population_size=10,
        generations=5
    )
    candidates = solver.solve(num_candidates=2)
    assert len(candidates) == 2
    assert candidates[0].fitness_score >= 0.0
    assert len(candidates[0].rooms) == 4  # 3 requested rooms + 1 mandatory staircase
