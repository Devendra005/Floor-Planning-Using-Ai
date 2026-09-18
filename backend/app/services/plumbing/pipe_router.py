import math
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, PlumbingFixture, PlumbingShaft, PipeSegment

def compute_manhattan_path(
    p1: Tuple[float, float, float], p2: Tuple[float, float, float], system_type: str
) -> Tuple[List[List[float]], float, int]:
    """
    Computes orthogonal pipe route between p1 and p2 using wall perimeter alignment.
    Returns (path_points, total_length_m, bends_count).
    """
    x1, y1, z1 = p1
    x2, y2, z2 = p2

    path_points = [[round(x1, 2), round(y1, 2), round(z1, 2)]]

    # Orthogonal bend point
    mid_x = x2
    mid_y = y1

    if abs(x1 - x2) > 0.05 and abs(y1 - y2) > 0.05:
        bends = 1
        path_points.append([round(mid_x, 2), round(mid_y, 2), round(z1, 2)])
    else:
        bends = 0

    path_points.append([round(x2, 2), round(y2, 2), round(z2, 2)])

    length = abs(x2 - x1) + abs(y2 - y1) + abs(z2 - z1)
    return path_points, round(length, 2), bends

def route_plumbing_systems(
    rooms: List[LayoutRoom],
    fixtures: List[PlumbingFixture],
    shafts: List[PlumbingShaft],
    plot: PlotConfig
) -> List[PipeSegment]:
    """
    Generates preliminary pipe routes for:
    1. Water Supply Network (potable water)
    2. Wastewater Network (greywater)
    3. Soil Drainage Network (blackwater)
    4. Shaft to Sewer Connection / Inspection Chamber
    """
    segments: List[PipeSegment] = []

    # Map shafts by floor
    shaft_by_floor: Dict[int, PlumbingShaft] = {}
    for s in shafts:
        shaft_by_floor[s.floor_level] = s

    # Main Municipal Water Connection at plot front setback
    main_water_conn = (
        round(plot.setbacks.left + 1.0, 2),
        round(plot.setbacks.rear, 2),
        0.0
    )

    # Main Sewer Inspection Chamber at plot rear/front corner
    main_sewer_chamber = (
        round(plot.width - plot.setbacks.right - 1.0, 2),
        round(plot.setbacks.rear, 2),
        -0.5
    )

    # 1. Main Water Inlet to Shaft Stack
    if 0 in shaft_by_floor:
        gf_shaft = shaft_by_floor[0]
        shaft_pt = (gf_shaft.x + gf_shaft.width / 2.0, gf_shaft.y + gf_shaft.length / 2.0, 0.0)
        pts, length, bends = compute_manhattan_path(main_water_conn, shaft_pt, "WATER_SUPPLY")

        segments.append(
            PipeSegment(
                id="PIPE-WATER-MAIN-01",
                system_type="WATER_SUPPLY",
                path_points=pts,
                diameter_mm=32,
                length_m=length,
                bends_count=bends,
                junctions_count=1,
                connects_from="MUNICIPAL_WATER_METER",
                connects_to=gf_shaft.id
            )
        )

        # 2. Main Shaft Drain to Sewer Inspection Chamber
        sewer_pts, sewer_len, sewer_bends = compute_manhattan_path(shaft_pt, main_sewer_chamber, "MAIN_CONNECTION")
        segments.append(
            PipeSegment(
                id="PIPE-SEWER-MAIN-01",
                system_type="MAIN_CONNECTION",
                path_points=sewer_pts,
                diameter_mm=110,
                length_m=sewer_len,
                bends_count=sewer_bends,
                junctions_count=1,
                connects_from=gf_shaft.id,
                connects_to="SEWER_INSPECTION_CHAMBER"
            )
        )

    # 3. Fixture Connection Routes to Shaft per floor
    for fix in fixtures:
        fl = 0
        matching_room = next((r for r in rooms if r.id == fix.room_id), None)
        if matching_room and hasattr(matching_room, 'floor_level'):
            fl = matching_room.floor_level or 0

        target_shaft = shaft_by_floor.get(fl, shafts[0] if shafts else None)
        if not target_shaft:
            continue

        fix_pt = (fix.x, fix.y, fix.z)
        shaft_pt = (target_shaft.x + target_shaft.width / 2.0, target_shaft.y + target_shaft.length / 2.0, fix.z)

        sys_type = "WATER_SUPPLY" if fix.connection_type == "WATER_INLET" else "SOIL_DRAIN" if fix.connection_type == "SOIL_DRAIN" else "WASTEWATER"
        pipe_dia = 110 if sys_type == "SOIL_DRAIN" else 75 if sys_type == "WASTEWATER" else 20

        pts, length, bends = compute_manhattan_path(fix_pt, shaft_pt, sys_type)

        segments.append(
            PipeSegment(
                id=f"PIPE-{fix.fixture_id}",
                system_type=sys_type,
                path_points=pts,
                diameter_mm=pipe_dia,
                length_m=length,
                bends_count=bends,
                junctions_count=1,
                connects_from=fix.fixture_id,
                connects_to=target_shaft.id
            )
        )

    return segments
