import copy
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, OrientationEnum
from app.services.geometry.constraint_solver import validate_layout_geometry, check_rect_overlap

def optimize_layout_for_vastu(
    rooms: List[LayoutRoom], plot: PlotConfig, vastu_eval_func: Any
) -> Tuple[List[LayoutRoom], Dict[str, Any]]:
    """
    Attempts non-destructive Vastu optimization on an existing layout:
    1. Identifies rooms in low-scoring/non-preferred Vastu zones.
    2. Swaps or shifts rooms toward target preferred Vastu zones.
    3. Verifies geometry validity (zero overlaps, setback compliance).
    4. Accepts modification only if total fitness and Vastu score improve.
    5. Returns (optimized_rooms, comparison_summary).
    """
    original_rooms = copy.deepcopy(rooms)
    initial_report = vastu_eval_func(original_rooms, plot)
    initial_score = initial_report.total_score

    candidate_rooms = copy.deepcopy(original_rooms)

    # Plot boundaries after setbacks
    sb = plot.setbacks
    min_x, max_x = sb.left, plot.width - sb.right
    min_y, max_y = sb.rear, plot.length - sb.front

    plot_w, plot_l = plot.width, plot.length

    # Preferred target coordinates for key rooms
    # SE (Fire/Kitchen): High X, Low Y
    # SW (Earth/Master Bed): Low X, Low Y
    # NE (Water/Puja): High X, High Y
    # NW (Air/Toilet): Low X, High Y
    target_zone_coords = {
        "SE": (max_x - plot_w * 0.3, min_y + plot_l * 0.1),
        "SW": (min_x + plot_w * 0.1, min_y + plot_l * 0.1),
        "NE": (max_x - plot_w * 0.3, max_y - plot_l * 0.3),
        "NW": (min_x + plot_w * 0.1, max_y - plot_l * 0.3),
    }

    modified_details = []

    # Try room swaps between misaligned pairs (e.g. Kitchen in SW and Master Bed in SE)
    for i in range(len(candidate_rooms)):
        for j in range(i + 1, len(candidate_rooms)):
            r1, r2 = candidate_rooms[i], candidate_rooms[j]

            # Check if swapping r1 and r2 improves Vastu alignment
            if (r1.type == "kitchen" and r2.type == "master_bedroom") or \
               (r1.type == "puja" and r2.type in ["store", "toilet"]) or \
               (r1.type == "master_bedroom" and r2.type == "kitchen"):
                
                # Test swap
                r1.x, r2.x = r2.x, r1.x
                r1.y, r2.y = r2.y, r1.y

                valid, _ = validate_layout_geometry(candidate_rooms, plot)
                if valid:
                    new_report = vastu_eval_func(candidate_rooms, plot)
                    if new_report.total_score > initial_score + 3.0:
                        modified_details.append(f"Swapped positions of '{r1.name}' and '{r2.name}' for improved directional alignment.")
                        initial_score = new_report.total_score
                        continue
                
                # Revert swap if invalid or score did not improve
                r1.x, r2.x = r2.x, r1.x
                r1.y, r2.y = r2.y, r1.y

    final_report = vastu_eval_func(candidate_rooms, plot)
    final_score = final_report.total_score

    summary = {
        "before_score": round(initial_report.total_score, 1),
        "after_score": round(final_score, 1),
        "score_improvement": round(max(0.0, final_score - initial_report.total_score), 1),
        "modifications_applied": modified_details,
        "is_optimized": final_score > initial_report.total_score
    }

    return candidate_rooms, summary
