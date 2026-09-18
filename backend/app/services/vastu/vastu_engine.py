import json
import os
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, VastuProfileEnum, VastuEvaluationReport, RuleEvaluationDetail
)
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle
from app.services.vastu.vastu_zone_detection import get_room_zone_overlap, get_primary_zone_for_room
from app.services.vastu.room_direction_analysis import analyze_all_rooms
from app.services.vastu.entrance_analysis import analyze_main_entrance
from app.services.vastu.element_analysis import analyze_panchamahabhuta
from app.services.vastu.brahmasthan_analysis import analyze_brahmasthan
from app.services.vastu.vastu_scoring import calculate_overall_vastu_score
from app.services.vastu.vastu_recommendation import generate_vastu_recommendations
from app.services.vastu.vastu_optimizer import optimize_layout_for_vastu

class VastuEngine:
    def __init__(self, rules_file_path: str = None):
        if rules_file_path is None:
            dir_path = os.path.dirname(os.path.realpath(__file__))
            rules_file_path = os.path.join(dir_path, "vastu_rules.json")

        self.rules: List[Dict[str, Any]] = []
        if os.path.exists(rules_file_path):
            with open(rules_file_path, "r", encoding="utf-8") as f:
                self.rules = json.load(f)

    def evaluate_layout(
        self, rooms: List[LayoutRoom], plot: PlotConfig, profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    ) -> VastuEvaluationReport:
        """Evaluates layout and produces unified VastuEvaluationReport."""
        room_analyses = analyze_all_rooms(rooms, plot, self.rules)
        entrance_analysis = analyze_main_entrance(rooms, plot, self.rules)
        brahmasthan_analysis = analyze_brahmasthan(rooms, plot)
        element_analysis = analyze_panchamahabhuta(rooms, plot)

        score_res = calculate_overall_vastu_score(
            room_analyses, entrance_analysis, brahmasthan_analysis, element_analysis
        )
        recs = generate_vastu_recommendations(
            room_analyses, entrance_analysis, brahmasthan_analysis, element_analysis
        )

        rule_details: List[RuleEvaluationDetail] = []
        for r in room_analyses:
            rule_details.append(
                RuleEvaluationDetail(
                    rule_id=f"ROOM-{r['room_id']}",
                    category=r['room_name'],
                    subject=r['room_type'],
                    result="preferred" if r['vastu_score'] >= 85 else "acceptable" if r['vastu_score'] >= 60 else "violation",
                    score_delta=r['vastu_score'],
                    severity="high" if r['vastu_score'] < 50 else "medium",
                    message=f"Room '{r['room_name']}' placed in {r['zone']} zone ({r['direction']} direction).",
                    recommendation=r['observations'][0] if r['observations'] else None,
                    explanation=f"Area: {r['area']} sq.m | Vastu Zone Overlap: {r['zone_overlap']}"
                )
            )

        return VastuEvaluationReport(
            total_score=score_res["total_score"],
            profile_used=profile.value if hasattr(profile, 'value') else str(profile),
            category_scores=score_res["category_scores"],
            positive_observations=recs["positive_observations"],
            warnings=recs["warnings"],
            recommendations=recs["recommendations"],
            rule_details=rule_details
        )

    def evaluate_layout_detailed(
        self, rooms: List[LayoutRoom], plot: PlotConfig, profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    ) -> Dict[str, Any]:
        """Provides full structured Vastu diagnostic analysis dict."""
        room_analyses = analyze_all_rooms(rooms, plot, self.rules)
        entrance_analysis = analyze_main_entrance(rooms, plot, self.rules)
        brahmasthan_analysis = analyze_brahmasthan(rooms, plot)
        element_analysis = analyze_panchamahabhuta(rooms, plot)

        score_res = calculate_overall_vastu_score(
            room_analyses, entrance_analysis, brahmasthan_analysis, element_analysis
        )
        recs = generate_vastu_recommendations(
            room_analyses, entrance_analysis, brahmasthan_analysis, element_analysis
        )

        return {
            "overall_vastu_score": score_res["total_score"],
            "rating_label": score_res["rating_label"],
            "category_scores": score_res["category_scores"],
            "category_weights": score_res["category_weights"],
            "north_angle": get_plot_north_angle(plot),
            "entrance_analysis": entrance_analysis,
            "brahmasthan_analysis": brahmasthan_analysis,
            "panchamahabhuta_analysis": element_analysis,
            "room_analyses": room_analyses,
            "positive_observations": recs["positive_observations"],
            "warnings": recs["warnings"],
            "recommendations": recs["recommendations"]
        }

    def optimize_layout(
        self, rooms: List[LayoutRoom], plot: PlotConfig, profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    ) -> Tuple[List[LayoutRoom], Dict[str, Any]]:
        """Runs automatic Vastu optimization pass."""
        return optimize_layout_for_vastu(
            rooms, plot, lambda r_list, p_config: self.evaluate_layout(r_list, p_config, profile)
        )
