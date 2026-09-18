from typing import List, Dict, Any
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, OrientationEnum
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle
from app.services.vastu.vastu_zone_detection import get_room_zone_overlap

def analyze_brahmasthan(
    rooms: List[LayoutRoom], plot: PlotConfig
) -> Dict[str, Any]:
    """
    Evaluates the central Brahmasthan core (central 1/9th zone of the plot):
    Checks for:
    - Bedrooms in center
    - Kitchen in center
    - Toilet/Bathroom in center
    - Staircase in center
    - Heavy storage in center
    
    If conflicts exist in compact plots, applies soft score penalties and neutral explanations
    WITHOUT rejecting the layout.
    """
    north_angle = get_plot_north_angle(plot)
    plot_w, plot_l = plot.width, plot.length

    # Central boundary coordinates
    center_min_x = plot_w / 3.0
    center_max_x = (2.0 * plot_w) / 3.0
    center_min_y = plot_l / 3.0
    center_max_y = (2.0 * plot_l) / 3.0

    center_area = (center_max_x - center_min_x) * (center_max_y - center_min_y)

    overlapping_rooms = []
    heavy_service_rooms = []
    total_center_occupied_area = 0.0

    for room in rooms:
        overlaps = get_room_zone_overlap(room, plot)
        center_overlap_pct = overlaps.get(OrientationEnum.CENTER.value, 0.0)

        if center_overlap_pct > 15.0:
            room_area = room.width * room.length
            occupied = (center_overlap_pct / 100.0) * room_area
            total_center_occupied_area += occupied

            item_info = {
                "room_id": room.id,
                "room_name": room.name,
                "room_type": room.type,
                "overlap_percentage": center_overlap_pct,
                "occupied_area": round(occupied, 2)
            }
            overlapping_rooms.append(item_info)

            if room.type.lower() in ["toilet", "staircase", "kitchen", "master_bedroom", "store"]:
                heavy_service_rooms.append(item_info)

    openness_percentage = round(max(0.0, 100.0 - ((total_center_occupied_area / max(0.1, center_area)) * 100.0)), 1)

    brahmasthan_score = 100.0
    status = "Optimal"
    conflicts = []
    recommendations = []

    if heavy_service_rooms:
        severe_count = len(heavy_service_rooms)
        penalty = min(50.0, severe_count * 20.0)
        brahmasthan_score = round(max(30.0, 100.0 - penalty), 1)

        names = ", ".join([r["room_name"] for r in heavy_service_rooms])
        status = "Encumbered"
        conflicts.append(f"Central Brahmasthan zone contains heavy or service spaces: {names}.")

        if any(r["room_type"] == "toilet" for r in heavy_service_rooms):
            recommendations.append("Toilets in the central core affect indoor hygiene; ensure dedicated exhaust ventilation and plumbing shafts.")
        if any(r["room_type"] == "staircase" for r in heavy_service_rooms):
            recommendations.append("Central staircases add structural mass; consider open riser designs or skylights above to maintain natural illumination.")
        if any(r["room_type"] == "kitchen" for r in heavy_service_rooms):
            recommendations.append("Central kitchen placement generates internal heat; ensure powerful hood extraction.")
    elif total_center_occupied_area > 0:
        brahmasthan_score = round(max(70.0, 100.0 - (100.0 - openness_percentage) * 0.3), 1)
        status = "Lightly Occupied"
        recommendations.append("Keep central corridors and hall spaces clear of heavy furniture for unrestricted circulation.")
    else:
        status = "Optimal Open Core"
        recommendations.append("Brahmasthan core is completely open, facilitating cross ventilation and daylight.")

    return {
        "brahmasthan_score": brahmasthan_score,
        "openness_percentage": openness_percentage,
        "status": status,
        "occupied_rooms": overlapping_rooms,
        "heavy_service_rooms": heavy_service_rooms,
        "conflicts": conflicts,
        "recommendations": recommendations,
        "is_acceptable": True  # Never reject plan automatically
    }
