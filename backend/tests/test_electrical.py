import pytest
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, DoorPlacement
from app.services.electrical.electrical_engine import ElectricalEngine

def test_electrical_fixture_generation():
    plot = PlotConfig(width=10.0, length=12.0)
    rooms = [
        LayoutRoom(
            id="r-living",
            name="Living Room",
            type="living",
            x=1.0,
            y=1.0,
            width=4.0,
            length=5.0,
            doors=[DoorPlacement(id="d1", wall_side="south", offset=1.0, width=0.9)]
        ),
        LayoutRoom(
            id="r-kitchen",
            name="Kitchen",
            type="kitchen",
            x=5.5,
            y=1.0,
            width=3.5,
            length=3.5
        ),
        LayoutRoom(
            id="r-master",
            name="Master Bedroom",
            type="master_bedroom",
            x=1.0,
            y=6.5,
            width=4.0,
            length=4.5
        ),
        LayoutRoom(
            id="r-bath",
            name="Master Bath",
            type="toilet",
            x=5.5,
            y=6.5,
            width=2.0,
            length=2.5
        )
    ]

    engine = ElectricalEngine()
    report = engine.generate_electrical_plan(rooms, plot)

    assert report.total_score >= 85.0
    assert report.total_fixtures_count > 0
    assert len(report.distribution_boards) == 1
    assert report.distribution_boards[0].id == "DB-MAIN-01"

    types = [f.fixture_type for f in report.fixtures]
    assert "switchboard" in types
    assert "light" in types
    assert "fan" in types
    assert "ac_point" in types
    assert "fridge_point" in types
    assert "geyser_point" in types
