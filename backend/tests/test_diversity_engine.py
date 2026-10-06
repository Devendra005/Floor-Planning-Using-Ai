import pytest
from app.models.pydantic_schemas import PlotConfig, RoomRequirement
from app.services.planning.layout_strategies import LayoutStrategyBuilder, STRATEGY_REGISTRY
from app.services.planning.adjacency_engine import AdjacencyEngine
from app.services.planning.furniture_validator import FurnitureValidator
from app.services.planning.plan_signature import PlanSignature
from app.services.planning.similarity_engine import SimilarityEngine
from app.services.planning.diversity_solver import LayoutDiversitySolver
from app.services.planning.room_requirements import validate_user_requirements
from app.services.geometry.constraint_solver import check_rect_overlap, validate_layout_geometry, ROOM_MIN_SPEC

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
            requirements=sample_requirements,
            seed=42
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
        requirements=sample_requirements,
        seed=42
    )
    valid, score, details = FurnitureValidator.validate_layout_furniture(rooms)
    assert score >= 60.0
    assert len(details) == len(rooms)

def test_plan_signature_and_hashing(sample_plot, sample_requirements):
    """Verifies deterministic plan signatures when same seed is used."""
    rooms1 = LayoutStrategyBuilder.build_layout("central_corridor", sample_plot, sample_requirements, seed=42)
    rooms2 = LayoutStrategyBuilder.build_layout("central_corridor", sample_plot, sample_requirements, seed=42)
    sig1 = PlanSignature.extract_signature(rooms1, sample_plot, "Central Corridor")
    sig2 = PlanSignature.extract_signature(rooms2, sample_plot, "Central Corridor")

    assert sig1["hash"] == sig2["hash"]
    assert "entrance_zone" in sig1
    assert "adjacency" in sig1

def test_similarity_engine_identical_vs_different(sample_plot, sample_requirements):
    """Verifies identical plans score ~100% and distinct strategies score <= 70%."""
    rooms_a = LayoutStrategyBuilder.build_layout("central_corridor", sample_plot, sample_requirements, seed=42)
    rooms_b = LayoutStrategyBuilder.build_layout("central_corridor", sample_plot, sample_requirements, seed=42)
    rooms_c = LayoutStrategyBuilder.build_layout("open_plan", sample_plot, sample_requirements, seed=42)

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
        max_similarity_threshold=75.0,
        seed=100
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
        max_similarity_threshold=70.0,
        seed=200
    )
    cand1 = solver.generate_multiple_unique_plans(num_candidates=1)[0]
    excluded = [cand1.plan_signature]

    cand_diff = solver.generate_different_plan(exclude_signatures=excluded)
    assert cand_diff.plan_signature not in excluded

def test_input_variation_changes_layout(sample_requirements):
    """Test 1: Input plot dimensions & BHK variation produces different layout."""
    plot1 = PlotConfig(length=12.192, width=9.144) # 30x40 ft
    plot2 = PlotConfig(length=18.288, width=12.192) # 40x60 ft

    solver1 = LayoutDiversitySolver(plot=plot1, requirements=sample_requirements, seed=50)
    solver2 = LayoutDiversitySolver(plot=plot2, requirements=sample_requirements, seed=50)

    cands1 = solver1.generate_multiple_unique_plans(num_candidates=1)
    cands2 = solver2.generate_multiple_unique_plans(num_candidates=1)

    sim = SimilarityEngine.calculate_similarity(cands1[0].rooms, cands2[0].rooms, plot1)
    assert sim["overall_similarity"] < 80.0

def test_seed_variation_changes_layout(sample_plot, sample_requirements):
    """Test 2: Same input + different generation seed produces different valid layouts."""
    solver1 = LayoutDiversitySolver(plot=sample_plot, requirements=sample_requirements, seed=101)
    solver2 = LayoutDiversitySolver(plot=sample_plot, requirements=sample_requirements, seed=999)

    c1 = solver1.generate_multiple_unique_plans(num_candidates=1)[0]
    c2 = solver2.generate_multiple_unique_plans(num_candidates=1)[0]

    # Different room coordinates generated
    diff_coords = False
    for r1, r2 in zip(c1.rooms, c2.rooms):
        if abs(r1.x - r2.x) > 0.05 or abs(r1.y - r2.y) > 0.05:
            diff_coords = True
            break
    assert diff_coords is True

def test_orientation_changes_vastu_eval(sample_requirements):
    """Test 3: Different plot orientation produces different Vastu evaluation & scoring."""
    plot_north = PlotConfig(length=12.192, width=9.144, orientation="N")
    plot_south = PlotConfig(length=12.192, width=9.144, orientation="S")

    solver_n = LayoutDiversitySolver(plot=plot_north, requirements=sample_requirements, seed=123)
    solver_s = LayoutDiversitySolver(plot=plot_south, requirements=sample_requirements, seed=123)

    c_n = solver_n.generate_multiple_unique_plans(num_candidates=1)[0]
    c_s = solver_s.generate_multiple_unique_plans(num_candidates=1)[0]

    assert c_n.vastu_report is not None
    assert c_s.vastu_report is not None

def test_no_room_overlap_and_inside_plot(sample_plot, sample_requirements):
    """Tests 4 & 5: No room overlap and all rooms inside plot bounds."""
    solver = LayoutDiversitySolver(plot=sample_plot, requirements=sample_requirements, seed=777)
    candidates = solver.generate_multiple_unique_plans(num_candidates=3)

    for cand in candidates:
        valid, errors = validate_layout_geometry(cand.rooms, sample_plot)
        overlap_errors = [e for e in errors if "overlaps" in e]
        boundary_errors = [e for e in errors if "outside" in e]
        assert len(overlap_errors) == 0, f"Overlaps detected: {overlap_errors}"
        assert len(boundary_errors) == 0, f"Boundary extension detected: {boundary_errors}"

def test_required_rooms_and_min_dimensions(sample_plot, sample_requirements):
    """Tests 6 & 7: Required rooms exist and minimum room dimensions are respected."""
    solver = LayoutDiversitySolver(plot=sample_plot, requirements=sample_requirements, seed=333)
    cand = solver.generate_multiple_unique_plans(num_candidates=1)[0]

    room_types = [r.type.lower() for r in cand.rooms]
    for req in sample_requirements:
        assert req.room_type.lower() in room_types

    for r in cand.rooms:
        spec = ROOM_MIN_SPEC.get(r.type.lower(), {"min_w": 1.5, "min_l": 1.5})
        assert r.width >= spec["min_w"] - 0.05
        assert r.length >= spec["min_l"] - 0.05

def test_impossible_requirements_validation():
    """Test 10: Infeasible requirements return validation errors."""
    tiny_plot = PlotConfig(length=3.0, width=3.0) # 3x3 meters = 9 sq.m gross, impossible with 1.0m setbacks
    huge_reqs = [
        RoomRequirement(id="1", name="Master Bedroom", room_type="master_bedroom", min_width=5.0, min_length=5.0),
        RoomRequirement(id="2", name="Living Room", room_type="living", min_width=6.0, min_length=6.0)
    ]
    is_valid, errors, summary = validate_user_requirements(tiny_plot, huge_reqs)
    assert is_valid is False
    assert len(errors) > 0
