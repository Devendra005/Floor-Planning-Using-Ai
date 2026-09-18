import pytest
from app.models.pydantic_schemas import PlotConfig, RoomRequirement
from app.services.planning.layout_strategies import LayoutStrategyBuilder, STRATEGY_REGISTRY
from app.services.planning.adjacency_engine import AdjacencyEngine
from app.services.planning.furniture_validator import FurnitureValidator
from app.services.planning.plan_signature import PlanSignature
from app.services.planning.similarity_engine import SimilarityEngine
from app.services.planning.diversity_solver import LayoutDiversitySolver
from app.services.geometry.constraint_solver import check_rect_overlap

@pytest.fixture
def sample_plot():
    return PlotConfig(length=12.192, width=9.144) # 30x40 ft

@pytest.fixture
def sample_requirements():
    return [
        RoomRequirement(id="1", name="Master Bedroom", room_type="master_bedroom", min_width=3.0, min_length=3.6),
        RoomRequirement(id="2", name="Second Bedroom", room_type="bedroom", min_width=3.0, min_length=3.0),
        RoomRequirement(id="3", name="Living Room", room_type="living", min_width=3.6, min_length=4.2),
        RoomRequirement(id="4", name="Kitchen", room_type="kitchen", min_width=2.4, min_length=2.7),
        RoomRequirement(id="5", name="Dining Room", room_type="dining", min_width=2.7, min_length=3.0),
        RoomRequirement(id="6", name="Bathroom 1", room_type="toilet", min_width=1.5, min_length=2.1),
        RoomRequirement(id="7", name="Parking", room_type="parking", min_width=3.0, min_length=4.5),
    ]

def test_all_ten_layout_strategies(sample_plot, sample_requirements):
    """Verifies that each of the 10 strategies generates valid rooms without crashes."""
    strategy_keys = list(STRATEGY_REGISTRY.keys())
    assert len(strategy_keys) == 10

    for key in strategy_keys:
        rooms = LayoutStrategyBuilder.build_layout(
            strategy_id=key,
            plot=sample_plot,
            requirements=sample_requirements
        )
        assert len(rooms) >= len(sample_requirements)
        for r in rooms:
            assert r.width >= 1.5
            assert r.length >= 1.5
            # Must fit in plot bounds with setbacks
            assert r.x >= sample_plot.setbacks.left - 0.05
            assert r.y >= sample_plot.setbacks.rear - 0.05

def test_furniture_validator(sample_plot, sample_requirements):
    """Verifies furniture evaluation calculates positive fit scores."""
    rooms = LayoutStrategyBuilder.build_layout(
        strategy_id="central_corridor",
        plot=sample_plot,
        requirements=sample_requirements
    )
    valid, score, details = FurnitureValidator.validate_layout_furniture(rooms)
    assert score >= 60.0
    assert len(details) == len(rooms)

def test_plan_signature_and_hashing(sample_plot, sample_requirements):
    """Verifies deterministic plan signatures."""
    rooms = LayoutStrategyBuilder.build_layout(
        strategy_id="central_corridor",
        plot=sample_plot,
        requirements=sample_requirements
    )
    sig1 = PlanSignature.extract_signature(rooms, sample_plot, "Central Corridor")
    sig2 = PlanSignature.extract_signature(rooms, sample_plot, "Central Corridor")

    assert sig1["hash"] == sig2["hash"]
    assert "entrance_zone" in sig1
    assert "adjacency" in sig1

def test_similarity_engine_identical_vs_different(sample_plot, sample_requirements):
    """Verifies identical plans score ~100% and distinct strategies score <= 70%."""
    rooms_a = LayoutStrategyBuilder.build_layout("central_corridor", sample_plot, sample_requirements)
    rooms_b = LayoutStrategyBuilder.build_layout("central_corridor", sample_plot, sample_requirements)
    rooms_c = LayoutStrategyBuilder.build_layout("open_plan", sample_plot, sample_requirements)

    # Identical
    sim_identical = SimilarityEngine.calculate_similarity(rooms_a, rooms_b, sample_plot)
    assert sim_identical["overall_similarity"] >= 95.0

    # Different architectural topologies
    sim_diff = SimilarityEngine.calculate_similarity(rooms_a, rooms_c, sample_plot)
    assert sim_diff["overall_similarity"] < 70.0

def test_diversity_solver_multiple_unique_plans(sample_plot, sample_requirements):
    """Verifies LayoutDiversitySolver produces 5 genuinely distinct floor plans."""
    solver = LayoutDiversitySolver(
        plot=sample_plot,
        requirements=sample_requirements,
        max_similarity_threshold=75.0
    )
    candidates = solver.generate_multiple_unique_plans(num_candidates=5)

    assert len(candidates) >= 3 # At least 3 distinct plans produced
    # Verify pairwise diversity
    for i in range(len(candidates)):
        assert candidates[i].layout_strategy is not None
        assert candidates[i].plan_signature is not None
        for j in range(i + 1, len(candidates)):
            sim = SimilarityEngine.calculate_similarity(candidates[i].rooms, candidates[j].rooms, sample_plot)
            assert sim["overall_similarity"] <= 75.0

def test_diversity_solver_generate_different(sample_plot, sample_requirements):
    """Verifies generate_different produces a plan distinct from excluded signatures."""
    solver = LayoutDiversitySolver(
        plot=sample_plot,
        requirements=sample_requirements,
        max_similarity_threshold=70.0
    )
    cand1 = solver.generate_multiple_unique_plans(num_candidates=1)[0]
    excluded = [cand1.plan_signature]

    cand_diff = solver.generate_different_plan(exclude_signatures=excluded)
    assert cand_diff.plan_signature not in excluded

def test_multi_floor_layout_generation(sample_requirements):
    """Verifies that multi-story projects distribute rooms across floor levels 0, 1, 2."""
    multi_plot = PlotConfig(length=12.192, width=9.144, floors_count=3)
    solver = LayoutDiversitySolver(
        plot=multi_plot,
        requirements=sample_requirements
    )
    candidates = solver.generate_multiple_unique_plans(num_candidates=1)
    assert len(candidates) == 1
    cand = candidates[0]
    
    # Check floor distribution
    floors = set(r.floor_level for r in cand.rooms)
    assert 0 in floors
    assert 1 in floors
    
    # Check staircase replication
    stair_floors = [r.floor_level for r in cand.rooms if 'stair' in r.type.lower()]
    assert 0 in stair_floors
    assert 1 in stair_floors
    assert 2 in stair_floors

    # Check structural engine multi-floor elements
    assert len(cand.structure.columns) > 0
    col_floors = set(c.floor for c in cand.structure.columns)
    assert col_floors == {0, 1, 2}

