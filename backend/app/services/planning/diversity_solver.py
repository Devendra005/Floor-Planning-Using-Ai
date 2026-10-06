import copy
import uuid
import random
import logging
import math
from typing import List, Dict, Any, Optional
from app.models.pydantic_schemas import (
    PlotConfig, RoomRequirement, LayoutRoom, FloorPlanCandidate,
    OptimizationWeights, VastuProfileEnum
)
from app.services.geometry.constraint_solver import (
    check_rect_overlap, validate_layout_geometry, ROOM_MIN_SPEC
)
from app.services.planning.layout_strategies import LayoutStrategyBuilder, STRATEGY_REGISTRY
from app.services.planning.adjacency_engine import AdjacencyEngine
from app.services.planning.furniture_validator import FurnitureValidator
from app.services.planning.plan_signature import PlanSignature
from app.services.planning.similarity_engine import SimilarityEngine
from app.services.planning.diversity_engine import DiversityEngine
from app.services.planning.room_requirements import validate_user_requirements, RequirementValidationError
from app.services.vastu.vastu_engine import VastuEngine
from app.services.structure.structural_engine import StructuralEngine
from app.services.plumbing.plumbing_engine import PlumbingEngine
from app.services.electrical.electrical_engine import ElectricalEngine

logger = logging.getLogger("vastucraft_api.diversity_solver")

class LayoutDiversitySolver:
    """
    AI Multiple Unique Floor Plan Generation & Layout Diversity Engine.
    Generates genuinely distinct residential architectural layouts using controlled
    typologies, seed variations, adjacency graphs, furniture validation, and similarity filtering.
    """

    def __init__(
        self,
        plot: PlotConfig,
        requirements: List[RoomRequirement],
        weights: OptimizationWeights = OptimizationWeights(),
        vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC,
        vastu_strictness: str = "BALANCED",
        max_similarity_threshold: float = 70.0,
        seed: Optional[int] = None
    ):
        self.plot = plot
        self.requirements = list(requirements)
        self.weights = weights
        self.vastu_profile = vastu_profile
        self.vastu_strictness = vastu_strictness.upper()
        self.max_similarity_threshold = max_similarity_threshold
        self.base_seed = seed if seed is not None else random.randint(1000, 999999)

        self.vastu_engine = VastuEngine()
        self.structural_engine = StructuralEngine()
        self.plumbing_engine = PlumbingEngine()
        self.electrical_engine = ElectricalEngine()

        # Input Validation & Feasibility Check
        is_valid, errors, summary = validate_user_requirements(self.plot, self.requirements)
        if not is_valid:
            logger.warning(f"Feasibility warning for layout request: {errors}")

        # Ensure mandatory Staircase is present
        has_stair = any(r.room_type in ['staircase', 'stair'] for r in self.requirements)
        if not has_stair:
            self.requirements.append(
                RoomRequirement(
                    id="req-mandatory-stair",
                    name="Main Staircase",
                    room_type="staircase",
                    min_width=2.2,
                    min_length=3.0,
                    preferred_width=2.4,
                    preferred_length=3.5,
                    priority=1,
                    quantity=1,
                    privacy_level="low",
                    preferred_direction="S",
                    adjacent_to=["living"]
                )
            )

    def repair_individual(self, rooms: List[LayoutRoom]) -> List[LayoutRoom]:
        """Move colliding rooms to the nearest available position without resizing them."""
        sb = self.plot.setbacks
        min_x, max_x = sb.left, self.plot.width - sb.right
        min_y, max_y = sb.rear, self.plot.length - sb.front
        net_w, net_l = max_x - min_x, max_y - min_y

        for r in rooms:
            dimensions = (r.x, r.y, r.width, r.length)
            if not all(math.isfinite(value) for value in dimensions):
                continue
            if r.width <= 0 or r.length <= 0 or r.width > net_w or r.length > net_l:
                continue
            r.x = max(min_x, min(r.x, max_x - r.width))
            r.y = max(min_y, min(r.y, max_y - r.length))

        floor_groups: Dict[int, List[LayoutRoom]] = {}
        for r in rooms:
            fl = r.floor_level if r.floor_level is not None else 0
            floor_groups.setdefault(fl, []).append(r)

        for fl_rooms in floor_groups.values():
            stairs = [r for r in fl_rooms if r.type.lower() in {"stair", "staircase"}]
            non_stairs = [r for r in fl_rooms if r.type.lower() not in {"stair", "staircase"}]
            if any(
                check_rect_overlap(
                    first.x, first.y, first.width, first.length,
                    second.x, second.y, second.width, second.length
                )
                for i, first in enumerate(stairs)
                for second in stairs[i + 1:]
            ):
                continue

            remaining = sorted(
                non_stairs,
                key=lambda room: room.width * room.length,
                reverse=True,
            )
            search_nodes = 0

            def touching_positions(
                room: LayoutRoom,
                placed: List[LayoutRoom],
            ) -> List[tuple[float, float]]:
                positions = {(room.x, room.y)}
                for other in placed:
                    aligned_y = {
                        other.y,
                        other.y + other.length - room.length,
                        other.y + (other.length - room.length) / 2.0,
                    }
                    aligned_x = {
                        other.x,
                        other.x + other.width - room.width,
                        other.x + (other.width - room.width) / 2.0,
                    }
                    positions.update(
                        (x, y)
                        for x in (other.x - room.width, other.x + other.width)
                        for y in aligned_y
                    )
                    positions.update(
                        (x, y)
                        for x in aligned_x
                        for y in (other.y - room.length, other.y + other.length)
                    )

                legal_positions = []
                for x, y in positions:
                    if x < min_x or y < min_y or x + room.width > max_x or y + room.length > max_y:
                        continue
                    if any(check_rect_overlap(
                        x, y, room.width, room.length,
                        other.x, other.y, other.width, other.length
                    ) for other in placed):
                        continue

                    adjacent = any(
                        (
                            (x + room.width == other.x or other.x + other.width == x)
                            and min(y + room.length, other.y + other.length) - max(y, other.y) > 0.4
                        )
                        or (
                            (y + room.length == other.y or other.y + other.length == y)
                            and min(x + room.width, other.x + other.width) - max(x, other.x) > 0.4
                        )
                        for other in placed
                    )
                    if adjacent:
                        distance = abs(x - room.x) + abs(y - room.y)
                        legal_positions.append((distance, x, y))

                legal_positions.sort()
                return [(x, y) for _, x, y in legal_positions[:18]]

            def place_remaining(
                unplaced: List[LayoutRoom],
                placed: List[LayoutRoom],
            ) -> bool:
                nonlocal search_nodes
                if not unplaced:
                    return True
                if search_nodes >= 5000:
                    return False

                room = unplaced[0]
                original_x, original_y = room.x, room.y
                for x, y in touching_positions(room, placed):
                    search_nodes += 1
                    room.x, room.y = x, y
                    if place_remaining(unplaced[1:], placed + [room]):
                        return True
                    room.x, room.y = original_x, original_y
                    if search_nodes >= 5000:
                        break
                return False

            place_remaining(remaining, list(stairs))

        return rooms

    def _candidate_geometry_errors(self, rooms: List[LayoutRoom]) -> List[str]:
        _, errors = validate_layout_geometry(rooms, self.plot)
        stair_rooms = [r for r in rooms if r.type.lower() in {"stair", "staircase"}]
        if not stair_rooms:
            errors.append("INVALID LAYOUT: Missing required staircase.")
            return errors

        expected_floors = set(range(max(1, self.plot.floors_count)))
        stair_floors = {
            room.floor_level if room.floor_level is not None else 0
            for room in stair_rooms
        }
        if stair_floors != expected_floors:
            errors.append("INVALID LAYOUT: Staircase is missing from one or more floors.")

        stair_families: Dict[str, List[LayoutRoom]] = {}
        for room in stair_rooms:
            base_id, separator, floor_suffix = room.id.rpartition("-F")
            family_id = (
                base_id
                if separator and floor_suffix.isdigit()
                else room.id
            )
            stair_families.setdefault(family_id, []).append(room)

        for family in stair_families.values():
            footprint = (family[0].x, family[0].y, family[0].width, family[0].length)
            if any(
                (room.x, room.y, room.width, room.length) != footprint
                for room in family[1:]
            ):
                errors.append(
                    f"INVALID LAYOUT: Staircase '{family[0].name}' is not vertically aligned."
                )

        return errors

    def _generate_candidate_for_strategy(
        self,
        strategy_id: str,
        index: int,
        seed: int
    ) -> Optional[FloorPlanCandidate]:
        strategy_info = STRATEGY_REGISTRY.get(strategy_id, STRATEGY_REGISTRY["central_corridor"])
        raw_rooms = LayoutStrategyBuilder.build_layout(
            strategy_id=strategy_id,
            plot=self.plot,
            requirements=self.requirements,
            vastu_profile=self.vastu_profile,
            vastu_strictness=self.vastu_strictness,
            seed=seed,
            orientation=getattr(self.plot, 'orientation', 'E')
        )

        clean_rooms = self.repair_individual(raw_rooms)
        geometry_errors = self._candidate_geometry_errors(clean_rooms)
        if geometry_errors:
            logger.debug(
                "Rejecting invalid candidate for strategy %s: %s",
                strategy_id,
                geometry_errors,
            )
            return None

        # Apply Vastu optimization only if STRICT mode is chosen
        if self.vastu_strictness == "STRICT":
            opt_rooms, opt_summary = self.vastu_engine.optimize_layout(clean_rooms, self.plot, self.vastu_profile)
            if opt_summary.get("is_optimized", False):
                clean_rooms = self.repair_individual(opt_rooms)
                geometry_errors = self._candidate_geometry_errors(clean_rooms)
                if geometry_errors:
                    logger.debug(
                        "Rejecting optimized candidate for strategy %s: %s",
                        strategy_id,
                        geometry_errors,
                    )
                    return None

        # Multi-domain analytics
        vastu_rep = self.vastu_engine.evaluate_layout(clean_rooms, self.plot, self.vastu_profile)
        structure = self.structural_engine.generate_preliminary_structure(clean_rooms, self.plot)
        plumbing_rep = self.plumbing_engine.analyze_layout_plumbing(clean_rooms, self.plot)
        electrical_rep = self.electrical_engine.generate_electrical_plan(clean_rooms, self.plot)

        # Furniture Validation
        furn_valid, furn_score, furn_details = FurnitureValidator.validate_layout_furniture(clean_rooms)

        # Adjacency Validation
        desired_adj = AdjacencyEngine.generate_strategy_adjacency_graph(strategy_id, self.requirements)
        adj_score, adj_pos, adj_viols = AdjacencyEngine.evaluate_adjacency_score(clean_rooms, desired_adj)

        # Space utilization / plot utilization
        total_area = sum(r.width * r.length for r in clean_rooms)
        plot_net_area = (self.plot.width - self.plot.setbacks.left - self.plot.setbacks.right) * \
                        (self.plot.length - self.plot.setbacks.front - self.plot.setbacks.rear)
        space_ratio = min(1.0, total_area / max(1.0, plot_net_area))
        space_score = round(space_ratio * 100.0, 1)

        # Circulation score
        cx_avg = sum(r.x + r.width/2 for r in clean_rooms) / max(1, len(clean_rooms))
        cy_avg = sum(r.y + r.length/2 for r in clean_rooms) / max(1, len(clean_rooms))
        avg_dist = sum(abs((r.x + r.width/2) - cx_avg) + abs((r.y + r.length/2) - cy_avg) for r in clean_rooms) / max(1, len(clean_rooms))
        circulation_score = round(max(50.0, min(98.0, 100.0 - (avg_dist * 4.5))), 1)

        # Structural score
        x_coords = set(r.x for r in clean_rooms)
        y_coords = set(r.y for r in clean_rooms)
        structural_score = round(min(98.0, 60.0 + (len(x_coords) + len(y_coords)) * 2.5), 1)
        daylight_score = round(min(96.0, 75.0 + (len(clean_rooms) * 2.0)), 1)

        # Multi-objective composite fitness:
        # 0.30 Vastu, 0.15 Space, 0.15 Circulation, 0.10 Adjacency, 0.10 Plumbing, 0.10 Electrical, 0.10 Utilization
        w_vastu = 0.50 if self.vastu_strictness == "STRICT" else (0.15 if self.vastu_strictness == "FLEXIBLE" else 0.30)
        fitness = (
            w_vastu * vastu_rep.total_score +
            0.15 * space_score +
            0.15 * circulation_score +
            0.10 * adj_score +
            0.10 * furn_score +
            0.10 * plumbing_rep.total_score +
            0.10 * electrical_rep.total_score
        )

        sig_data = PlanSignature.extract_signature(clean_rooms, self.plot, strategy_info["name"])

        # Smart plan naming
        plan_letter = chr(65 + (index % 26))
        plan_name = f"Plan {plan_letter} — {strategy_info['name']}"

        candidate = FloorPlanCandidate(
            id=f"PLAN-{plan_letter}-{uuid.uuid4().hex[:6]}",
            name=plan_name,
            fitness_score=round(fitness, 1),
            vastu_score=round(vastu_rep.total_score, 1),
            plumbing_score=round(plumbing_rep.total_score, 1),
            electrical_score=round(electrical_rep.total_score, 1),
            requirement_score=100.0,
            space_utilization_score=space_score,
            circulation_score=circulation_score,
            adjacency_score=adj_score,
            structural_score=structural_score,
            daylight_score=daylight_score,
            rooms=clean_rooms,
            vastu_report=vastu_rep,
            structure=structure,
            plumbing=plumbing_rep,
            electrical=electrical_rep,
            layout_strategy=strategy_info["name"],
            diversity_score=92.0,
            plan_signature=sig_data["hash"],
            furniture_valid=furn_valid,
            furniture_fit_score=furn_score,
            adjacency_graph=sig_data["adjacency"],
            entrance_zone=sig_data["entrance_zone"]
        )
        return candidate

    def generate_multiple_unique_plans(
        self,
        num_candidates: int = 5,
        target_strategies: Optional[List[str]] = None,
        exclude_signatures: Optional[List[str]] = None,
        num_internal_pool: int = 30
    ) -> List[FloorPlanCandidate]:
        """
        Generates 20–50 candidate layouts internally per user request across multiple seeds
        and distinct layout strategies, and selects Top 3-5 distinct floor plans.
        """
        strat_keys = target_strategies or list(STRATEGY_REGISTRY.keys())
        raw_candidates: List[FloorPlanCandidate] = []

        total_generated = 0
        invalid_count = 0

        # Replenish rejected candidates so geometry filtering does not collapse diversity.
        target_pool_size = max(1, num_candidates, num_internal_pool)
        seeds_per_strategy = max(1, math.ceil(target_pool_size / len(strat_keys)))
        max_rounds = seeds_per_strategy * 3

        for seed_offset in range(max_rounds):
            for s_idx, key in enumerate(strat_keys):
                if len(raw_candidates) >= target_pool_size:
                    break
                cand_seed = self.base_seed + (s_idx * 100) + seed_offset
                total_generated += 1
                try:
                    cand = self._generate_candidate_for_strategy(key, len(raw_candidates), cand_seed)
                    if cand:
                        raw_candidates.append(cand)
                    else:
                        invalid_count += 1
                except Exception as e:
                    logger.warning(
                        "Candidate generation error on strategy %s: %s",
                        key,
                        e,
                        exc_info=True,
                    )
                    invalid_count += 1
            if len(raw_candidates) >= target_pool_size:
                break

        if not raw_candidates:
            return []

        # Sort raw candidates by fitness score descending
        raw_candidates.sort(key=lambda c: c.fitness_score, reverse=True)

        # Apply diversity selection filter
        selected = DiversityEngine.select_diverse_candidates(
            candidates=raw_candidates,
            plot=self.plot,
            num_desired=num_candidates,
            max_similarity_threshold=self.max_similarity_threshold,
            exclude_signatures=exclude_signatures
        )

        duplicate_count = len(raw_candidates) - len(selected)

        logger.info(
            f"FLOOR PLAN GENERATION LOG: seed={self.base_seed} | "
            f"Generated: {total_generated} | Invalid: {invalid_count} | "
            f"Duplicate: {duplicate_count} | Valid unique: {len(raw_candidates)} | "
            f"Returned: {len(selected)}"
        )

        return selected

    def generate_different_plan(
        self,
        exclude_signatures: List[str],
        preferred_strategy: Optional[str] = None
    ) -> FloorPlanCandidate:
        """
        Generates a new plan guaranteed to be distinct from all previous signatures using fresh seed.
        """
        all_strategies = list(STRATEGY_REGISTRY.keys())
        random.shuffle(all_strategies)

        if preferred_strategy and preferred_strategy in STRATEGY_REGISTRY:
            all_strategies.insert(0, preferred_strategy)

        new_seed = random.randint(100000, 999999)

        # Retry invalid geometries before reporting that no new plan can be generated.
        for seed_offset in range(3):
            for idx, strat in enumerate(all_strategies):
                cand = self._generate_candidate_for_strategy(
                    strat,
                    len(exclude_signatures),
                    new_seed + (seed_offset * len(all_strategies) + idx) * 17,
                )
                if not cand or cand.plan_signature in exclude_signatures:
                    continue

                cand.diversity_score = 96.0
                cand.name = f"Plan Option {len(exclude_signatures)+1} — {cand.layout_strategy}"
                return cand

        raise RuntimeError("Unable to generate a valid plan distinct from the excluded signatures.")
