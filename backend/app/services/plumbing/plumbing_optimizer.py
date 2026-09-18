from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import PipeSegment, PlumbingFixture, PlumbingShaft, PlumbingCostEstimate

DEFAULT_PLUMBING_WEIGHTS = {
    "pipe_efficiency": 0.40,
    "bend_efficiency": 0.20,
    "shaft_efficiency": 0.15,
    "cost_efficiency": 0.15,
    "maintenance_efficiency": 0.10
}

def calculate_plumbing_scores(
    pipe_routes: List[PipeSegment],
    fixtures: List[PlumbingFixture],
    shafts: List[PlumbingShaft],
    cost_estimate: PlumbingCostEstimate,
    custom_weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Computes weighted Plumbing Efficiency Score (0-100) and component sub-scores.
    """
    weights = dict(DEFAULT_PLUMBING_WEIGHTS)
    if custom_weights:
        weights.update(custom_weights)

    total_len = sum(p.length_m for p in pipe_routes)
    total_bends = sum(p.bends_count for p in pipe_routes)
    total_junctions = sum(p.junctions_count for p in pipe_routes)

    # Sub-score heuristics
    # Pipe Efficiency: Baseline ~20m ideal run
    pipe_eff = max(30.0, min(100.0, 100.0 - max(0.0, total_len - 15.0) * 2.0))

    # Bend Efficiency: Baseline <=6 bends ideal
    bend_eff = max(30.0, min(100.0, 100.0 - max(0.0, total_bends - 4.0) * 5.0))

    # Shaft Efficiency: Serves multiple wet rooms
    shaft_eff = 90.0 if shafts else 40.0

    # Cost Efficiency: Relative to baseline ₹25,000
    cost_eff = max(30.0, min(100.0, 100.0 - max(0.0, cost_estimate.total_estimated_cost - 15000.0) / 500.0))

    # Maintenance Efficiency
    maint_eff = max(40.0, min(100.0, (bend_eff + shaft_eff) / 2.0))

    total_score = (
        pipe_eff * weights["pipe_efficiency"] +
        bend_eff * weights["bend_efficiency"] +
        shaft_eff * weights["shaft_efficiency"] +
        cost_eff * weights["cost_efficiency"] +
        maint_eff * weights["maintenance_efficiency"]
    )

    total_score = round(min(100.0, max(0.0, total_score)), 1)

    if total_score >= 90.0:
        rating_label = "Optimal Plumbing Layout"
    elif total_score >= 75.0:
        rating_label = "Very Good Plumbing Efficiency"
    elif total_score >= 60.0:
        rating_label = "Good Plumbing Efficiency"
    elif total_score >= 45.0:
        rating_label = "Moderate Efficiency"
    else:
        rating_label = "High Plumbing Complexity"

    return {
        "total_score": total_score,
        "rating_label": rating_label,
        "pipe_efficiency_score": round(pipe_eff, 1),
        "bend_efficiency_score": round(bend_eff, 1),
        "shaft_efficiency_score": round(shaft_eff, 1),
        "cost_efficiency_score": round(cost_eff, 1),
        "maintenance_score": round(maint_eff, 1),
        "total_pipe_length_m": round(total_len, 2),
        "total_bends": total_bends,
        "total_junctions": total_junctions
    }

def generate_plumbing_recommendations(
    scores: Dict[str, Any], fixtures: List[PlumbingFixture], shafts: List[PlumbingShaft]
) -> Tuple[List[str], List[str]]:
    """Generates positive observations and actionable recommendations for plumbing layout."""
    positives = []
    recs = []

    if scores["total_score"] >= 80.0:
        positives.append("Plumbing-intensive wet rooms (Kitchen, Bathrooms, Utility) are efficiently clustered near shaft VP-01.")
    if scores["total_bends"] <= 8:
        positives.append("Low pipe bend count minimizes hydraulic friction loss.")
    if shafts:
        positives.append("Vertical shaft VP-01 provides accessible service access for future maintenance.")

    if scores["total_pipe_length_m"] > 30.0:
        recs.append("Consider clustering the Utility area closer to the primary Bathroom to reduce total pipe run length by ~5-8 meters.")
    if scores["total_bends"] > 8:
        recs.append("Route waste lines along main wall perimeters to eliminate unnecessary 90° elbows.")

    if not recs:
        recs.append("Maintain clear access hatches at shaft VP-01 for periodic pipe inspection.")

    return positives, recs
