from typing import List, Dict, Any, Optional
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, PlumbingReportData, PlumbingFixture, PlumbingShaft, PipeSegment
)
from app.services.plumbing.fixture_detector import detect_all_layout_fixtures, classify_room_plumbing_requirement
from app.services.plumbing.plumbing_shaft import find_optimal_plumbing_shaft
from app.services.plumbing.pipe_router import route_plumbing_systems
from app.services.plumbing.plumbing_cost import estimate_plumbing_cost
from app.services.plumbing.plumbing_validator import validate_plumbing_system
from app.services.plumbing.plumbing_optimizer import calculate_plumbing_scores, generate_plumbing_recommendations

class PlumbingEngine:
    def __init__(self):
        pass

    def analyze_layout_plumbing(
        self, rooms: List[LayoutRoom], plot: PlotConfig, existing_shafts: Optional[List[PlumbingShaft]] = None
    ) -> PlumbingReportData:
        """
        Master analysis pipeline for floor plan layout plumbing:
        1. Classifies wet rooms & detects water-use fixtures (x, y, z).
        2. Calculates optimal vertical plumbing shaft VP-01 location.
        3. Routes Water Supply, Wastewater, Soil Drain & Main Sewer connection lines.
        4. Calculates itemized plumbing cost estimate.
        5. Performs plumbing validation checks.
        6. Computes Plumbing Efficiency Score (0-100) & rating.
        """
        # 1. Detect Fixtures
        fixtures = detect_all_layout_fixtures(rooms)

        # 2. Identify Shafts
        shaft_loc = (existing_shafts[0].x, existing_shafts[0].y) if existing_shafts else None
        shafts = find_optimal_plumbing_shaft(rooms, plot, shaft_loc)

        # 3. Route Piping Networks
        pipe_routes = route_plumbing_systems(rooms, fixtures, shafts, plot)

        # 4. Estimate Cost
        cost_estimate = estimate_plumbing_cost(pipe_routes, fixtures)

        # 5. Validate System
        validation_issues = validate_plumbing_system(rooms, fixtures, shafts, pipe_routes, plot)

        # 6. Score & Recommend
        scores = calculate_plumbing_scores(pipe_routes, fixtures, shafts, cost_estimate)
        positives, recs = generate_plumbing_recommendations(scores, fixtures, shafts)

        water_len = sum(p.length_m for p in pipe_routes if p.system_type == "WATER_SUPPLY")
        waste_len = sum(p.length_m for p in pipe_routes if p.system_type == "WASTEWATER")
        soil_len = sum(p.length_m for p in pipe_routes if p.system_type in ["SOIL_DRAIN", "MAIN_CONNECTION"])

        return PlumbingReportData(
            total_score=scores["total_score"],
            rating_label=scores["rating_label"],
            pipe_efficiency_score=scores["pipe_efficiency_score"],
            bend_efficiency_score=scores["bend_efficiency_score"],
            shaft_efficiency_score=scores["shaft_efficiency_score"],
            cost_efficiency_score=scores["cost_efficiency_score"],
            maintenance_score=scores["maintenance_score"],
            total_pipe_length_m=scores["total_pipe_length_m"],
            water_pipe_length_m=round(water_len, 2),
            waste_pipe_length_m=round(waste_len, 2),
            soil_pipe_length_m=round(soil_len, 2),
            total_bends=scores["total_bends"],
            total_junctions=scores["total_junctions"],
            fixtures=fixtures,
            shafts=shafts,
            pipe_routes=pipe_routes,
            cost_estimate=cost_estimate,
            validation_issues=validation_issues,
            positive_observations=positives,
            recommendations=recs
        )
