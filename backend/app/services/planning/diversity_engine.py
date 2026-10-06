from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import FloorPlanCandidate, LayoutRoom, PlotConfig
from app.services.planning.similarity_engine import SimilarityEngine

class DiversityEngine:
    """
    Manages diversity scoring, novelty measurement, and Pareto-diverse
    subset selection to guarantee genuinely unique floor plan options.
    """

    @staticmethod
    def calculate_diversity_score(
        candidate_rooms: List[LayoutRoom],
        existing_plans_rooms: List[List[LayoutRoom]],
        plot: PlotConfig
    ) -> float:
        """
        Computes diversity as 100% minus the maximum similarity to any existing plan.
        If no existing plans, diversity is 100%.
        """
        if not existing_plans_rooms:
            return 98.0

        max_sim = 0.0
        for other in existing_plans_rooms:
            sim_res = SimilarityEngine.calculate_similarity(candidate_rooms, other, plot)
            max_sim = max(max_sim, sim_res["overall_similarity"])

        diversity = max(0.0, 100.0 - max_sim)
        return round(diversity, 1)

    @staticmethod
    def select_diverse_candidates(
        candidates: List[FloorPlanCandidate],
        plot: PlotConfig,
        num_desired: int = 5,
        max_similarity_threshold: float = 70.0,
        exclude_signatures: List[str] = None
    ) -> List[FloorPlanCandidate]:
        """
        Selects up to `num_desired` candidates that maximize both Quality and
        Diversity while strictly respecting `max_similarity_threshold`.
        """
        if not candidates:
            return []

        exclude_set = set(exclude_signatures or [])
        valid_pool = [c for c in candidates if (c.plan_signature or "") not in exclude_set]
        if not valid_pool:
            return []

        selected: List[FloorPlanCandidate] = []

        # Sort candidates initially by composite quality fitness
        valid_pool.sort(key=lambda c: c.fitness_score, reverse=True)

        # 1. Pick the best overall plan as anchor
        first = valid_pool.pop(0)
        first.diversity_score = 98.0
        first.similarity_to_previous = 0.0
        selected.append(first)

        # 2. Greedily pick subsequent plans that maximize novelty distance from all selected
        while len(selected) < num_desired and valid_pool:
            best_candidate = None
            best_composite_score = -999.0
            best_min_diversity = 0.0
            best_max_sim = 100.0

            for cand in valid_pool:
                # Compare cand against all currently selected
                max_similarity_to_selected = 0.0
                for sel in selected:
                    sim_res = SimilarityEngine.calculate_similarity(cand.rooms, sel.rooms, plot)
                    sim_val = sim_res["overall_similarity"]
                    if sim_val > max_similarity_to_selected:
                        max_similarity_to_selected = sim_val

                # Skip if too similar to any already accepted plan
                if max_similarity_to_selected > max_similarity_threshold:
                    continue

                novelty_score = 100.0 - max_similarity_to_selected
                # Multi-objective composite score: 55% quality + 45% novelty
                composite = (0.55 * cand.fitness_score) + (0.45 * novelty_score)

                # Bonus for distinct layout strategy
                selected_strategies = {s.layout_strategy for s in selected if s.layout_strategy}
                if cand.layout_strategy and cand.layout_strategy not in selected_strategies:
                    composite += 15.0

                if composite > best_composite_score:
                    best_composite_score = composite
                    best_candidate = cand
                    best_min_diversity = novelty_score
                    best_max_sim = max_similarity_to_selected

            if best_candidate:
                best_candidate.diversity_score = round(best_min_diversity, 1)
                best_candidate.similarity_to_previous = round(best_max_sim, 1)
                selected.append(best_candidate)
                valid_pool.remove(best_candidate)
            else:
                # No more candidates meet the strict threshold
                break

        return selected
