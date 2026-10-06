import math
from typing import List, Dict, Tuple, Optional, Any
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, OrientationEnum

# Room-specific minimum dimensional requirements (meters & sq.m)
ROOM_MIN_SPEC = {
    "master_bedroom": {"min_w": 2.5, "min_l": 2.5, "min_area": 6.25},
    "bedroom": {"min_w": 2.4, "min_l": 2.4, "min_area": 5.76},
    "kitchen": {"min_w": 2.0, "min_l": 2.0, "min_area": 4.0},
    "living": {"min_w": 2.5, "min_l": 2.5, "min_area": 6.25},
    "dining": {"min_w": 2.2, "min_l": 2.2, "min_area": 4.84},
    "puja": {"min_w": 1.5, "min_l": 1.5, "min_area": 2.25},
    "toilet": {"min_w": 1.2, "min_l": 1.5, "min_area": 1.8},
    "parking": {"min_w": 2.4, "min_l": 2.4, "min_area": 5.76},
    "staircase": {"min_w": 1.8, "min_l": 2.4, "min_area": 4.32}
}

def check_rect_overlap(
    x1: float, y1: float, w1: float, l1: float,
    x2: float, y2: float, w2: float, l2: float
) -> bool:
    """Returns True only when the rectangles have a positive-area intersection."""
    return (
        x1 < x2 + w2
        and x1 + w1 > x2
        and y1 < y2 + l2
        and y1 + l1 > y2
    )

def check_within_boundary(
    x: float, y: float, w: float, l: float,
    plot_w: float, plot_l: float,
    setback_front: float = 1.0, setback_rear: float = 1.0,
    setback_left: float = 1.0, setback_right: float = 1.0
) -> bool:
    """
    Checks if a room fits within the plot boundary after applying setbacks.
    Plot origin (0,0) is bottom-left.
    x is along width (East/West axis), y is along length (North/South axis).
    """
    min_x = setback_left
    max_x = plot_w - setback_right
    min_y = setback_rear
    max_y = plot_l - setback_front

    if x < min_x or (x + w) > max_x:
        return False
    if y < min_y or (y + l) > max_y:
        return False
    return True

def get_zone_from_coordinate(
    cx: float, cy: float, plot_w: float, plot_l: float, north_angle: float = 0.0
) -> OrientationEnum:
    """
    Divides the plot into a 9-zone model, accounting for plot north_angle.
    """
    if north_angle != 0.0:
        from app.services.vastu.direction_detection import coordinate_to_direction
        return coordinate_to_direction(cx, cy, plot_w, plot_l, north_angle)

    grid_x = min(2, max(0, int((cx / max(0.1, plot_w)) * 3)))
    grid_y = min(2, max(0, int((cy / max(0.1, plot_l)) * 3)))

    mapping = {
        (2, 0): OrientationEnum.NW,
        (2, 1): OrientationEnum.N,
        (2, 2): OrientationEnum.NE,
        (1, 0): OrientationEnum.W,
        (1, 1): OrientationEnum.CENTER,
        (1, 2): OrientationEnum.E,
        (0, 0): OrientationEnum.SW,
        (0, 1): OrientationEnum.S,
        (0, 2): OrientationEnum.SE,
    }

    return mapping.get((grid_y, grid_x), OrientationEnum.CENTER)

def get_81pad_mandala_cell(
    cx: float, cy: float, plot_w: float, plot_l: float
) -> Dict[str, Any]:
    """Calculates cell index in an 81-pad Vastu Purusha Mandala layout."""
    col = min(8, max(0, int((cx / plot_w) * 9)))
    row = min(8, max(0, int((cy / plot_l) * 9)))

    is_brahmasthan = (2 <= row <= 6) and (2 <= col <= 6)

    if is_brahmasthan:
        pad_zone = "Brahmasthan (Center)"
    elif row >= 6 and col >= 6:
        pad_zone = "Ishanya (NE Devas)"
    elif row >= 6 and col <= 2:
        pad_zone = "Vayu (NW Air)"
    elif row <= 2 and col >= 6:
        pad_zone = "Agni (SE Fire)"
    elif row <= 2 and col <= 2:
        pad_zone = "Nairrutya (SW Earth)"
    elif row >= 6:
        pad_zone = "Kubera (North Wealth)"
    elif col >= 6:
        pad_zone = "Aditya (East Sun)"
    elif row <= 2:
        pad_zone = "Yama (South Stability)"
    else:
        pad_zone = "Varuna (West Water)"

    return {
        "row": row,
        "col": col,
        "pad_index": row * 9 + col + 1,
        "zone_name": pad_zone
    }

def calculate_room_adjacencies(rooms: List[LayoutRoom]) -> Dict[str, List[str]]:
    """Determines which rooms share a boundary/wall segment."""
    adjacencies: Dict[str, List[str]] = {r.id: [] for r in rooms}
    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            r1, r2 = rooms[i], rooms[j]
            fl1 = r1.floor_level if r1.floor_level is not None else 0
            fl2 = r2.floor_level if r2.floor_level is not None else 0
            if fl1 != fl2:
                continue

            h_overlap = max(0, min(r1.x + r1.width, r2.x + r2.width) - max(r1.x, r2.x))
            v_overlap = max(0, min(r1.y + r1.length, r2.y + r2.length) - max(r1.y, r2.y))

            if (r1.x + r1.width == r2.x or r2.x + r2.width == r1.x) and v_overlap > 0.4:
                adjacencies[r1.id].append(r2.id)
                adjacencies[r2.id].append(r1.id)
            elif (r1.y + r1.length == r2.y or r2.y + r2.length == r1.y) and h_overlap > 0.4:
                adjacencies[r1.id].append(r2.id)
                adjacencies[r2.id].append(r1.id)

    return adjacencies

def validate_room_connectivity(rooms: List[LayoutRoom]) -> bool:
    """Verifies rooms are connected within each floor's adjacency graph."""
    if not rooms:
        return True

    floor_groups: Dict[int, List[LayoutRoom]] = {}
    for room in rooms:
        floor = room.floor_level if room.floor_level is not None else 0
        floor_groups.setdefault(floor, []).append(room)

    for floor_rooms in floor_groups.values():
        adj = calculate_room_adjacencies(floor_rooms)
        visited = set()
        stack = [floor_rooms[0].id]

        while stack:
            curr = stack.pop()
            if curr not in visited:
                visited.add(curr)
                stack.extend(
                    neighbor for neighbor in adj.get(curr, [])
                    if neighbor not in visited
                )

        if len(visited) != len(floor_rooms):
            return False

    return True

def validate_layout_geometry(
    rooms: List[LayoutRoom], plot: PlotConfig
) -> Tuple[bool, List[str]]:
    """
    Validates all geometric constraints:
    1. Plot boundary & setback compliance
    2. Strict zero room overlap (Room A ∩ Room B = ∅)
    3. Room-specific minimum dimensions (Bed >= 3.0m, Kit >= 2.4m, Bath >= 1.5m)
    4. Room connectivity graph
    """
    errors = []
    plot_w, plot_l = plot.width, plot.length
    sb = plot.setbacks

    # 1. Overlap check per floor level
    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            r1, r2 = rooms[i], rooms[j]
            fl1 = r1.floor_level if r1.floor_level is not None else 0
            fl2 = r2.floor_level if r2.floor_level is not None else 0
            if fl1 == fl2 and check_rect_overlap(r1.x, r1.y, r1.width, r1.length, r2.x, r2.y, r2.width, r2.length):
                errors.append(f"INVALID LAYOUT: Room '{r1.name}' overlaps with '{r2.name}' on Floor {fl1}.")

    # 2. Boundary check
    for r in rooms:
        if not check_within_boundary(r.x, r.y, r.width, r.length, plot_w, plot_l, sb.front, sb.rear, sb.left, sb.right):
            errors.append(f"INVALID LAYOUT: Room '{r.name}' extends outside allowable plot setback area.")

    # 3. Room-specific minimum dimension check
    for r in rooms:
        room_type = r.type.lower()
        if room_type == "stair":
            room_type = "staircase"
        spec = ROOM_MIN_SPEC.get(room_type, {"min_w": 1.5, "min_l": 1.5, "min_area": 2.25})
        if not all(math.isfinite(value) for value in (r.x, r.y, r.width, r.length)):
            errors.append(f"INVALID LAYOUT: Room '{r.name}' has non-finite geometry.")
        elif (
            r.width < spec["min_w"] - 0.05
            or r.length < spec["min_l"] - 0.05
            or r.width <= 0
            or r.length <= 0
        ):
            errors.append(f"INVALID LAYOUT: Room '{r.name}' ({r.width:.1f}m x {r.length:.1f}m) below minimum allowable dimensions for {r.type}.")

    # 4. Room connectivity check
    if len(rooms) > 1 and not validate_room_connectivity(rooms):
        errors.append("INVALID LAYOUT: Disconnected room detected — every room must be reachable via door/corridor connection.")

    return (len(errors) == 0, errors)
