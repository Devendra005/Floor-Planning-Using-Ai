from typing import List, Dict, Any
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, OrientationEnum
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle

ELEMENT_MAPPING = {
    OrientationEnum.SW: {"name": "Earth", "sanskrit": "Prithvi", "qualities": "Stability, Mass, Heavy Storage"},
    OrientationEnum.NE: {"name": "Water", "sanskrit": "Jala", "qualities": "Purity, Tranquility, Open Flow"},
    OrientationEnum.SE: {"name": "Fire", "sanskrit": "Agni", "qualities": "Energy, Heat, Kitchen/Cooking"},
    OrientationEnum.NW: {"name": "Air", "sanskrit": "Vayu", "qualities": "Movement, Ventilation, Guests"},
    OrientationEnum.CENTER: {"name": "Space", "sanskrit": "Akasha", "qualities": "Openness, Connectivity, Core"}
}

def analyze_panchamahabhuta(
    rooms: List[LayoutRoom], plot: PlotConfig
) -> Dict[str, Any]:
    """
    Analyzes spatial alignment against the traditional Panchamahabhuta (5 Elements):
    - Earth (SW): Preferred for Master Bedroom / Heavy Storage / Stairs
    - Water (NE): Preferred for Puja / Open Lawns / Water features
    - Fire (SE): Preferred for Kitchen / Electrical Distribution
    - Air (NW): Preferred for Guest Room / Toilets / Ventilation
    - Space (Center): Preferred for Brahmasthan / Courtyard / Living Hall
    """
    north_angle = get_plot_north_angle(plot)
    plot_w, plot_l = plot.width, plot.length

    element_scores = {
        "Earth": 70.0,
        "Water": 70.0,
        "Fire": 70.0,
        "Air": 70.0,
        "Space": 70.0
    }
    details = []

    for room in rooms:
        cx = room.x + (room.width / 2.0)
        cy = room.y + (room.length / 2.0)
        direction = coordinate_to_direction(cx, cy, plot_w, plot_l, north_angle)
        rtype = room.type.lower()

        # Fire element check (Kitchen)
        if rtype == "kitchen":
            if direction == OrientationEnum.SE:
                element_scores["Fire"] = 95.0
                details.append("Kitchen aligned with Fire element (Agneya / South-East).")
            elif direction in [OrientationEnum.NE, OrientationEnum.SW]:
                element_scores["Fire"] = 40.0
                details.append("Kitchen conflicts with Water or Earth element zones.")

        # Earth element check (Master Bedroom / Heavy storage)
        if rtype == "master_bedroom":
            if direction in [OrientationEnum.SW, OrientationEnum.S, OrientationEnum.W]:
                element_scores["Earth"] = 95.0
                details.append("Master bedroom aligned with Earth element (Nairrutya / South-West).")
            elif direction == OrientationEnum.NE:
                element_scores["Earth"] = 45.0
                details.append("Master bedroom in Water zone (NE) reduces grounding stability.")

        # Water element check (Puja)
        if rtype == "puja":
            if direction in [OrientationEnum.NE, OrientationEnum.E, OrientationEnum.N]:
                element_scores["Water"] = 95.0
                details.append("Puja room aligned with Water element (Ishanya / North-East).")

        # Air element check (Guest / Toilet)
        if rtype in ["guest_bedroom", "toilet"]:
            if direction in [OrientationEnum.NW, OrientationEnum.W]:
                element_scores["Air"] = 90.0
                details.append(f"{room.name} aligned with Air element (Vayu / North-West).")

        # Space element check (Brahmasthan)
        if direction == OrientationEnum.CENTER:
            if rtype in ["toilet", "staircase"]:
                element_scores["Space"] = 35.0
                details.append("Central Space element encumbered by service fixtures.")
            elif rtype in ["living", "hall", "courtyard"]:
                element_scores["Space"] = 90.0
                details.append("Central Space element open and clear.")

    overall_element_score = round(sum(element_scores.values()) / 5.0, 1)

    return {
        "overall_element_score": overall_element_score,
        "element_scores": element_scores,
        "observations": details,
        "disclaimer": "Panchamahabhuta element associations are traditional design heuristics used to assess environmental zoning."
    }
