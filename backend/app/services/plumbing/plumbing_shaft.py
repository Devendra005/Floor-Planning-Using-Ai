import math
from typing import List, Dict, Any, Tuple, Optional
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, PlumbingShaft
from app.services.plumbing.fixture_detector import classify_room_plumbing_requirement

def calculate_wet_rooms_centroid(rooms: List[LayoutRoom]) -> Tuple[float, float]:
    """Calculates weighted center of mass for all wet rooms in layout."""
    wet_rooms = [r for r in rooms if classify_room_plumbing_requirement(r)["required"]]
    if not wet_rooms:
        # Fallback to plot center
        return 6.0, 6.0

    sum_x, sum_y, count = 0.0, 0.0, 0
    for r in wet_rooms:
        cx = r.x + r.width / 2.0
        cy = r.y + r.length / 2.0
        sum_x += cx
        sum_y += cy
        count += 1

    return sum_x / max(1, count), sum_y / max(1, count)

def find_optimal_plumbing_shaft(
    rooms: List[LayoutRoom], plot: PlotConfig, existing_shaft_location: Optional[Tuple[float, float]] = None
) -> List[PlumbingShaft]:
    """
    Identifies or creates vertical plumbing shaft VP-01.
    If existing_shaft_location is provided (e.g. from Ground Floor), preserves vertical alignment across multi-floor buildings.
    """
    wet_rooms = [r for r in rooms if classify_room_plumbing_requirement(r)["required"]]
    wet_room_ids = [r.id for r in wet_rooms]

    if existing_shaft_location:
        sx, sy = existing_shaft_location
    else:
        # Place shaft on perimeter wall of primary wet room cluster nearest wet centroid
        cx, cy = calculate_wet_rooms_centroid(rooms)

        best_x, best_y = cx, cy
        min_dist = float('inf')

        for r in wet_rooms:
            # Test 4 corner/edge points of wet room for shaft placement
            candidates = [
                (r.x - 0.6, r.y + r.length / 2.0),           # West wall
                (r.x + r.width + 0.6, r.y + r.length / 2.0), # East wall
                (r.x + r.width / 2.0, r.y - 0.6),           # South wall
                (r.x + r.width / 2.0, r.y + r.length + 0.6)  # North wall
            ]

            for cand_x, cand_y in candidates:
                # Clamp within plot setbacks
                cand_x = max(plot.setbacks.left + 0.3, min(cand_x, plot.width - plot.setbacks.right - 0.6))
                cand_y = max(plot.setbacks.rear + 0.3, min(cand_y, plot.length - plot.setbacks.front - 0.6))

                d = math.hypot(cand_x - cx, cand_y - cy)
                if d < min_dist:
                    min_dist = d
                    best_x, best_y = cand_x, cand_y

        sx, sy = round(best_x, 2), round(best_y, 2)

    # Multi-floor shaft generation
    num_floors = max(1, min(10, getattr(plot, 'floors_count', 3)))
    shafts: List[PlumbingShaft] = []

    for fl in range(num_floors):
        shafts.append(
            PlumbingShaft(
                id=f"VP-01-F{fl}",
                x=sx,
                y=sy,
                width=0.6,
                length=0.6,
                floor_level=fl,
                is_vertical_stack=True,
                wet_rooms_served=wet_room_ids
            )
        )

    return shafts
