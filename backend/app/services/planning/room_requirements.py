from typing import List, Tuple, Dict, Any, Optional
from app.models.pydantic_schemas import PlotConfig, RoomRequirement
from app.services.geometry.constraint_solver import ROOM_MIN_SPEC

class RequirementValidationError(Exception):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

def validate_user_requirements(
    plot: PlotConfig,
    requirements: List[RoomRequirement]
) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates user plot and room requirements before floor plan generation.
    Returns (is_valid, error_messages, summary_stats).
    If requirements are impossible for the plot geometry, provides descriptive details.
    """
    errors: List[str] = []
    sb = plot.setbacks

    net_w = plot.width - sb.left - sb.right
    net_l = plot.length - sb.rear - sb.front

    if net_w <= 3.0:
        errors.append(f"Plot width ({plot.width:.1f}m) after setbacks (Left: {sb.left:.1f}m, Right: {sb.right:.1f}m) is too narrow ({net_w:.1f}m) for residential construction.")
    if net_l <= 3.0:
        errors.append(f"Plot length ({plot.length:.1f}m) after setbacks (Front: {sb.front:.1f}m, Rear: {sb.rear:.1f}m) is too short ({net_l:.1f}m) for residential construction.")

    net_area_per_floor = max(0.0, net_w * net_l)
    floors_count = max(1, min(10, getattr(plot, 'floors_count', 1)))
    total_usable_area = net_area_per_floor * floors_count

    # Calculate total minimum required area
    total_min_req_area = 0.0
    for req in requirements:
        spec = ROOM_MIN_SPEC.get(req.room_type.lower(), {})
        min_w = req.min_width or spec.get("min_w", 2.0)
        min_l = req.min_length or spec.get("min_l", 2.0)
        min_area = max(min_w * min_l, spec.get("min_area", 4.0))
        total_min_req_area += min_area

    # Account for circulation space (15%)
    required_area_with_circulation = total_min_req_area * 1.15

    if total_usable_area > 0 and required_area_with_circulation > total_usable_area * 1.2:
        errors.append(
            f"Requested rooms require approximately {required_area_with_circulation:.1f} sq.m total area, "
            f"which exceeds the total usable plot area ({total_usable_area:.1f} sq.m across {floors_count} floor(s)). "
            "Consider reducing room sizes, reducing room counts, or increasing floor count."
        )

    summary = {
        "plot_gross_area": round(plot.width * plot.length, 2),
        "plot_net_area_per_floor": round(net_area_per_floor, 2),
        "floors_count": floors_count,
        "total_usable_area": round(total_usable_area, 2),
        "total_min_required_area": round(total_min_req_area, 2),
        "required_with_circulation": round(required_area_with_circulation, 2),
        "is_feasible": len(errors) == 0
    }

    return len(errors) == 0, errors, summary
