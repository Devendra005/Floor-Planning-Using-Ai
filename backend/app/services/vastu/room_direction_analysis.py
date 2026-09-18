from typing import List, Dict, Any
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, OrientationEnum
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle
from app.services.vastu.vastu_zone_detection import get_room_zone_overlap, get_primary_zone_for_room, get_9x9_mandala_analysis

def analyze_room_direction_and_zone(
    room: LayoutRoom, plot: PlotConfig, rules: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyzes single room placement against Vastu guidelines:
    - Room center (cx, cy)
    - True room direction (accounting for north_angle)
    - Primary Vastu zone and multi-zone overlap percentages
    - Room area
    - Room Vastu score (0-100)
    """
    plot_w, plot_l = plot.width, plot.length
    north_angle = get_plot_north_angle(plot)

    cx = room.x + (room.width / 2.0)
    cy = room.y + (room.length / 2.0)
    area = round(room.width * room.length, 2)

    primary_zone, overlap_pct = get_primary_zone_for_room(room, plot)
    mandala_pad = get_9x9_mandala_analysis(cx, cy, plot_w, plot_l)
    direction = coordinate_to_direction(cx, cy, plot_w, plot_l, north_angle)

    # Match rules for room type or name
    room_type_lower = room.type.lower()
    room_name_lower = room.name.lower()

    matching_rules = [
        r for r in rules
        if r.get("enabled", True) and (
            r.get("subject") == room_type_lower or
            r.get("subject") in room_name_lower or
            r.get("subject") in room_type_lower
        )
    ]

    vastu_score = 60.0
    status_label = "Good"
    observations = []

    if matching_rules:
        rule = matching_rules[0]
        pref = rule.get("preferred_zones", [])
        acc = rule.get("acceptable_zones", [])
        avd = rule.get("avoid_zones", [])

        # Calculate weighted score based on overlap percentages
        weighted_score = 0.0
        for z_val, pct in overlap_pct.items():
            frac = pct / 100.0
            if z_val in pref:
                weighted_score += 100.0 * frac
            elif z_val in acc:
                weighted_score += 70.0 * frac
            elif z_val in avd:
                weighted_score += 20.0 * frac
            else:
                weighted_score += 55.0 * frac

        vastu_score = round(weighted_score, 1)

        if vastu_score >= 85.0:
            status_label = "Excellent"
        elif vastu_score >= 70.0:
            status_label = "Good"
        elif vastu_score >= 50.0:
            status_label = "Moderate"
        else:
            status_label = "Needs Improvement"

        if primary_zone.value in pref:
            observations.append(f"Optimal location in preferred {primary_zone.value} zone.")
        elif primary_zone.value in avd:
            observations.append(f"Sub-optimal location in non-recommended {primary_zone.value} zone.")
        else:
            observations.append(f"Acceptable placement in {primary_zone.value} zone.")
    else:
        observations.append(f"Placed in {primary_zone.value} zone.")

    # Assign vastu_score to room model
    room.zone = primary_zone.value
    room.vastu_score = vastu_score

    return {
        "room_id": room.id,
        "room_name": room.name,
        "room_type": room.type,
        "center": {"x": round(cx, 2), "y": round(cy, 2)},
        "direction": direction.value,
        "zone": primary_zone.value,
        "area": area,
        "zone_overlap": overlap_pct,
        "vastu_score": vastu_score,
        "status_label": status_label,
        "mandala_pad": mandala_pad,
        "observations": observations
    }

def analyze_all_rooms(
    rooms: List[LayoutRoom], plot: PlotConfig, rules: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    return [analyze_room_direction_and_zone(r, plot, rules) for r in rooms]
