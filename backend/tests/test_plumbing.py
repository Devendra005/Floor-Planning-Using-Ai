import pytest
from app.models.pydantic_schemas import LayoutRoom, PlotConfig
from app.services.plumbing.fixture_detector import classify_room_plumbing_requirement, detect_all_layout_fixtures
from app.services.plumbing.plumbing_shaft import find_optimal_plumbing_shaft
from app.services.plumbing.pipe_router import route_plumbing_systems
from app.services.plumbing.plumbing_cost import estimate_plumbing_cost
from app.services.plumbing.plumbing_validator import validate_plumbing_system
from app.services.plumbing.plumbing_engine import PlumbingEngine

def test_wet_area_classification():
    kitchen = LayoutRoom(id="r1", type="kitchen", name="Kitchen", x=6.0, y=1.0, width=2.5, length=2.5)
    bath = LayoutRoom(id="r2", type="toilet", name="Master Bathroom", x=1.0, y=1.0, width=2.0, length=2.5)
    bed = LayoutRoom(id="r3", type="bedroom", name="Bedroom 2", x=1.0, y=5.0, width=3.5, length=3.5)

    assert classify_room_plumbing_requirement(kitchen)["required"] is True
    assert classify_room_plumbing_requirement(bath)["required"] is True
    assert classify_room_plumbing_requirement(bed)["required"] is False

def test_fixture_detection():
    kitchen = LayoutRoom(id="r1", type="kitchen", name="Kitchen", x=6.0, y=1.0, width=2.5, length=2.5)
    bath = LayoutRoom(id="r2", type="toilet", name="Bathroom", x=1.0, y=1.0, width=2.0, length=2.5)

    fixtures = detect_all_layout_fixtures([kitchen, bath])
    assert len(fixtures) >= 5
    types = [f.fixture_type for f in fixtures]
    assert "kitchen_sink" in types
    assert "wc" in types
    assert "wash_basin" in types

def test_plumbing_shaft_calculation():
    plot = PlotConfig(width=10.0, length=12.0)
    kitchen = LayoutRoom(id="r1", type="kitchen", name="Kitchen", x=6.0, y=1.0, width=2.5, length=2.5)
    bath = LayoutRoom(id="r2", type="toilet", name="Bathroom", x=1.0, y=1.0, width=2.0, length=2.5)

    shafts = find_optimal_plumbing_shaft([kitchen, bath], plot)
    assert len(shafts) == plot.floors_count
    assert shafts[0].id == "VP-01-F0"
    assert shafts[1].id == "VP-01-F1"

def test_plumbing_engine_pipeline():
    engine = PlumbingEngine()
    plot = PlotConfig(width=10.0, length=12.0)
    kitchen = LayoutRoom(id="r1", type="kitchen", name="Kitchen", x=6.0, y=1.0, width=2.5, length=2.5)
    bath = LayoutRoom(id="r2", type="toilet", name="Bathroom", x=1.0, y=1.0, width=2.0, length=2.5)
    util = LayoutRoom(id="r3", type="utility", name="Utility", x=6.0, y=4.0, width=2.0, length=2.0)

    report = engine.analyze_layout_plumbing([kitchen, bath, util], plot)
    assert report.total_score >= 60.0
    assert len(report.fixtures) >= 6
    assert len(report.pipe_routes) >= 6
    assert report.cost_estimate.total_estimated_cost > 0
    assert len(report.positive_observations) >= 1
