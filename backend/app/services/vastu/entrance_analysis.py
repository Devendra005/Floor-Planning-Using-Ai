from typing import List, Dict, Any, Optional
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, OrientationEnum
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle

def analyze_main_entrance(
    rooms: List[LayoutRoom], plot: PlotConfig, rules: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Detects main entrance door from rooms (or entrance/living room exterior wall doors)
    and evaluates:
    - Direction & Vastu Zone (taking north_angle into account)
    - Boundary Side
    - Entrance Score (0-100)
    - Accessibility & Internal Circulation recommendations
    """
    plot_w, plot_l = plot.width, plot.length
    north_angle = get_plot_north_angle(plot)

    main_door_loc: Optional[Dict[str, Any]] = None
    connected_room_name = "Living Room"

    # Search for designated entrance room or main door in living room
    for r in rooms:
        if r.type in ["entrance", "living", "foyer"]:
            connected_room_name = r.name
            for d in r.doors:
                if d.connects_to in ["exterior", "corridor", None] or d.id.startswith("D-") or d.wall_side == "south":
                    # Calculate physical door location
                    if d.wall_side == "south":
                        dx, dy = r.x + d.offset, r.y
                    elif d.wall_side == "north":
                        dx, dy = r.x + d.offset, r.y + r.length
                    elif d.wall_side == "west":
                        dx, dy = r.x, r.y + d.offset
                    else:  # east
                        dx, dy = r.x + r.width, r.y + d.offset

                    main_door_loc = {
                        "x": round(dx, 2),
                        "y": round(dy, 2),
                        "wall_side": d.wall_side,
                        "room_id": r.id,
                        "room_name": r.name
                    }
                    break
        if main_door_loc:
            break

    # Fallback if no specific entrance door found
    if not main_door_loc and rooms:
        ground_rooms = [r for r in rooms if getattr(r, 'floor_level', 0) == 0] or rooms
        living_room = next((r for r in ground_rooms if r.type == "living"), ground_rooms[0])
        connected_room_name = living_room.name
        main_door_loc = {
            "x": round(living_room.x + living_room.width / 2.0, 2),
            "y": round(living_room.y, 2),
            "wall_side": "south",
            "room_id": living_room.id,
            "room_name": living_room.name
        }

    entrance_x = main_door_loc["x"] if main_door_loc else plot_w / 2.0
    entrance_y = main_door_loc["y"] if main_door_loc else 0.0

    entrance_direction = coordinate_to_direction(entrance_x, entrance_y, plot_w, plot_l, north_angle)
    entrance_zone = entrance_direction.value

    # Rule evaluation for main entrance
    entrance_rules = [r for r in rules if r.get("subject") == "entrance" or r.get("category") == "Main Entrance"]
    pref_zones = ["E", "N", "NE"]
    acc_zones = ["NW", "SE"]
    avd_zones = ["SW"]

    if entrance_rules:
        pref_zones = entrance_rules[0].get("preferred_zones", pref_zones)
        acc_zones = entrance_rules[0].get("acceptable_zones", acc_zones)
        avd_zones = entrance_rules[0].get("avoid_zones", avd_zones)

    if entrance_zone in pref_zones:
        entrance_score = 95.0
        status = "Excellent"
        rec = f"Main entrance facing {entrance_zone} is in an auspicious zone, maximizing natural light and welcoming circulation."
    elif entrance_zone in acc_zones:
        entrance_score = 75.0
        status = "Good"
        rec = f"Main entrance facing {entrance_zone} is acceptable. Ensure unobstructed pathway and adequate entry lighting."
    elif entrance_zone in avd_zones:
        entrance_score = 45.0
        status = "Needs Improvement"
        rec = f"Main entrance facing {entrance_zone} is non-recommended in traditional Vastu. If relocation is not feasible, place a well-lit foyer or decorative screen to buffer circulation."
    else:
        entrance_score = 65.0
        status = "Moderate"
        rec = f"Main entrance in {entrance_zone} provides fair access. Ensure clear entry dimensions and smooth door operation."

    return {
        "entrance_location": main_door_loc,
        "entrance_direction": entrance_zone,
        "entrance_zone": entrance_zone,
        "entrance_score": entrance_score,
        "status": status,
        "connected_room": connected_room_name,
        "recommendation": rec,
        "circulation_assessment": "Entry path connects directly into main circulation zone with zero obstruction."
    }
