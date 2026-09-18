from app.services.structure.steel_engine import SteelEngine, calculate_rebar_weight
from app.services.structure.clash_engine import ClashDetectionEngine
from app.services.structure.structural_engine import StructuralEngine
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, DoorPlacement

def test_rebar_weight_calculation():
    # 16mm bar, 10 meters: W = (16^2 / 162.2) * 10 = 15.78 kg
    wt = calculate_rebar_weight(16, 10.0)
    assert wt > 15.0 and wt < 16.5

def test_steel_engine_detailing():
    plot = PlotConfig(length=12.0, width=9.0)
    r1 = LayoutRoom(id="1", type="living", name="Living Room", x=1.0, y=1.0, width=4.0, length=4.0)
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure([r1], plot)

    assert len(structure.grid.grid_lines_x) > 0
    assert len(structure.grid.grid_lines_y) > 0
    assert len(structure.rebars) > 0
    assert len(structure.bar_schedule) > 0
    assert structure.quantity_summary.total_weight_kg > 0.0

def test_clash_detection():
    plot = PlotConfig(length=12.0, width=9.0)
    # Room with door close to column at (1.0, 1.0)
    r1 = LayoutRoom(
        id="1", type="living", name="Living Room", x=1.0, y=1.0, width=4.0, length=4.0,
        doors=[DoorPlacement(id="d1", wall_side="south", offset=0.1, width=0.9)]
    )
    engine = StructuralEngine()
    structure = engine.generate_preliminary_structure([r1], plot)
    assert isinstance(structure.clashes, list)
