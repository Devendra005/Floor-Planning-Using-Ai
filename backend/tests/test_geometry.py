from app.services.geometry.constraint_solver import (
    check_rect_overlap, check_within_boundary, get_zone_from_coordinate, get_81pad_mandala_cell
)
from app.models.pydantic_schemas import OrientationEnum

def test_rect_overlap():
    assert check_rect_overlap(0, 0, 4, 4, 2, 2, 4, 4) is True
    assert check_rect_overlap(0, 0, 4, 4, 5, 5, 4, 4) is False

def test_within_boundary():
    assert check_within_boundary(1, 1, 3, 3, 10, 10, 1, 1, 1, 1) is True
    assert check_within_boundary(0.5, 1, 3, 3, 10, 10, 1, 1, 1, 1) is False

def test_zone_from_coordinate():
    # 3x3 plot (10x10)
    # SW is low X, low Y
    assert get_zone_from_coordinate(1, 1, 10, 10) == OrientationEnum.SW
    # NE is high X, high Y
    assert get_zone_from_coordinate(9, 9, 10, 10) == OrientationEnum.NE
    # Center
    assert get_zone_from_coordinate(5, 5, 10, 10) == OrientationEnum.CENTER

def test_81pad_mandala_cell():
    cell = get_81pad_mandala_cell(5, 5, 10, 10)
    assert "pad_index" in cell
    assert cell["zone_name"] == "Brahmasthan (Center)"
