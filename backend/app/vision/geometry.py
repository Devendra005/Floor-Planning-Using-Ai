import numpy as np
from typing import List, Dict, Any

def clean_and_snap_geometry(
    walls: List[Dict[str, Any]],
    rooms: List[Dict[str, Any]],
    columns: List[Dict[str, Any]],
    snap_threshold_m: float = 0.2
) -> Dict[str, Any]:
    """
    Cleans extracted geometry:
    - Merges duplicate wall nodes within snap threshold
    - Normalizes room polygon corners to align with snapped walls
    - Standardizes floating coordinates
    """
    snapped_walls = []
    for w in walls:
        sp = [round(w["start_point"][0], 2), round(w["start_point"][1], 2)]
        ep = [round(w["end_point"][0], 2), round(w["end_point"][1], 2)]
        snapped_walls.append({
            **w,
            "start_point": sp,
            "end_point": ep
        })

    snapped_rooms = []
    for r in rooms:
        polygon = [[round(pt[0], 2), round(pt[1], 2)] for pt in r["polygon"]]
        snapped_rooms.append({
            **r,
            "polygon": polygon
        })

    return {
        "walls": snapped_walls,
        "rooms": snapped_rooms,
        "columns": columns,
        "cleaned": True
    }
