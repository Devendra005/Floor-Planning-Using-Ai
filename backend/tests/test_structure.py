from app.services.structure.structural_engine import StructuralEngine
from app.models.pydantic_schemas import LayoutRoom, PlotConfig

def test_structural_generation():
    engine = StructuralEngine()
    plot = PlotConfig(length=12.0, width=9.0)
    r1 = LayoutRoom(id="1", type="living", name="Living Room", x=1.0, y=1.0, width=4.0, length=4.0)
    r2 = LayoutRoom(id="2", type="kitchen", name="Kitchen", x=5.0, y=1.0, width=3.0, length=4.0)

    structure = engine.generate_preliminary_structure([r1, r2], plot)
    assert len(structure.columns) > 0
    assert len(structure.beams) > 0
    assert len(structure.slabs) > 0
    assert len(structure.rebars) > 0
    assert "PRELIMINARY ENGINEERING" in structure.disclaimer
