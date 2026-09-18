from typing import Dict, List, Any
from app.models.pydantic_schemas import VastuProfileEnum

DEFAULT_CATEGORY_WEIGHTS = {
    "entrance": 0.15,
    "kitchen": 0.15,
    "master_bedroom": 0.10,
    "other_bedrooms": 0.10,
    "puja": 0.10,
    "living": 0.10,
    "bathroom": 0.05,
    "staircase": 0.05,
    "brahmasthan": 0.10,
    "elements": 0.05,
    "open_space": 0.05
}

def calculate_overall_vastu_score(
    room_analyses: List[Dict[str, Any]],
    entrance_analysis: Dict[str, Any],
    brahmasthan_analysis: Dict[str, Any],
    element_analysis: Dict[str, Any],
    custom_weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Calculates unified 0-100 Vastu score and maps to official rating tier.
    """
    weights = dict(DEFAULT_CATEGORY_WEIGHTS)
    if custom_weights:
        weights.update(custom_weights)

    # Normalize weights to sum to 1.0
    total_w = sum(weights.values())
    if total_w > 0:
        weights = {k: v / total_w for k, v in weights.items()}

    # Extract individual component scores
    entrance_score = entrance_analysis.get("entrance_score", 75.0)

    # Kitchen score
    kitchen_rooms = [r for r in room_analyses if r["room_type"] == "kitchen"]
    kitchen_score = kitchen_rooms[0]["vastu_score"] if kitchen_rooms else 75.0

    # Master Bedroom score
    mbed_rooms = [r for r in room_analyses if r["room_type"] == "master_bedroom"]
    mbed_score = mbed_rooms[0]["vastu_score"] if mbed_rooms else 75.0

    # Other Bedrooms score
    other_beds = [r for r in room_analyses if r["room_type"] in ["bedroom", "guest_bedroom", "childrens_bedroom"]]
    other_bed_score = (sum(r["vastu_score"] for r in other_beds) / max(1, len(other_beds))) if other_beds else 75.0

    # Puja score
    puja_rooms = [r for r in room_analyses if r["room_type"] == "puja"]
    puja_score = puja_rooms[0]["vastu_score"] if puja_rooms else 80.0

    # Living & Dining score
    living_rooms = [r for r in room_analyses if r["room_type"] in ["living", "dining"]]
    living_score = (sum(r["vastu_score"] for r in living_rooms) / max(1, len(living_rooms))) if living_rooms else 75.0

    # Bathroom / Toilet score
    bath_rooms = [r for r in room_analyses if r["room_type"] == "toilet"]
    bath_score = (sum(r["vastu_score"] for r in bath_rooms) / max(1, len(bath_rooms))) if bath_rooms else 70.0

    # Staircase score
    stair_rooms = [r for r in room_analyses if r["room_type"] in ["staircase", "stair"]]
    stair_score = stair_rooms[0]["vastu_score"] if stair_rooms else 75.0

    # Brahmasthan score
    brahmasthan_score = brahmasthan_analysis.get("brahmasthan_score", 80.0)

    # Elements score
    elements_score = element_analysis.get("overall_element_score", 75.0)

    # Open space / Daylight
    open_space_score = brahmasthan_analysis.get("openness_percentage", 80.0)

    cat_scores = {
        "entrance": round(entrance_score, 1),
        "kitchen": round(kitchen_score, 1),
        "master_bedroom": round(mbed_score, 1),
        "other_bedrooms": round(other_bed_score, 1),
        "puja": round(puja_score, 1),
        "living": round(living_score, 1),
        "bathroom": round(bath_score, 1),
        "staircase": round(stair_score, 1),
        "brahmasthan": round(brahmasthan_score, 1),
        "elements": round(elements_score, 1),
        "open_space": round(open_space_score, 1)
    }

    # Filter active categories: include entrance, brahmasthan, elements, open_space, plus any room types present
    active_categories = ["entrance", "brahmasthan", "elements", "open_space"]
    if kitchen_rooms: active_categories.append("kitchen")
    if mbed_rooms: active_categories.append("master_bedroom")
    if other_beds: active_categories.append("other_bedrooms")
    if puja_rooms: active_categories.append("puja")
    if living_rooms: active_categories.append("living")
    if bath_rooms: active_categories.append("bathroom")
    if stair_rooms: active_categories.append("staircase")

    active_weights = {k: weights[k] for k in active_categories if k in weights}
    active_total_w = sum(active_weights.values())
    if active_total_w > 0:
        norm_weights = {k: v / active_total_w for k, v in active_weights.items()}
    else:
        norm_weights = weights

    final_total_score = sum(cat_scores[k] * norm_weights[k] for k in cat_scores if k in norm_weights)
    final_total_score = round(min(100.0, max(0.0, final_total_score)), 1)

    # Vastu Rating Tiers
    if final_total_score >= 90.0:
        rating_label = "Excellent Vastu Alignment"
    elif final_total_score >= 75.0:
        rating_label = "Very Good"
    elif final_total_score >= 60.0:
        rating_label = "Good"
    elif final_total_score >= 45.0:
        rating_label = "Moderate"
    else:
        rating_label = "Needs Improvement"

    return {
        "total_score": final_total_score,
        "rating_label": rating_label,
        "category_scores": cat_scores,
        "category_weights": {k: round(v * 100, 1) for k, v in weights.items()},
        "disclaimer": "Application-defined rating based on configurable traditional Vastu scoring parameters."
    }
