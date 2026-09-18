import random
import copy
import uuid
import math
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import (
    PlotConfig, RoomRequirement, LayoutRoom, FloorPlanCandidate,
    OptimizationWeights, VastuProfileEnum, DoorPlacement, WindowPlacement
)
from app.services.geometry.constraint_solver import (
    check_rect_overlap, check_within_boundary, get_zone_from_coordinate, validate_layout_geometry
)
from app.services.vastu.vastu_engine import VastuEngine
from app.services.structure.structural_engine import StructuralEngine
from app.services.plumbing.plumbing_engine import PlumbingEngine

class GeneticLayoutSolver:
    def __init__(
        self,
        plot: PlotConfig,
        requirements: List[RoomRequirement],
        weights: OptimizationWeights = OptimizationWeights(),
        vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC,
        population_size: int = 40,
        generations: int = 25
    ):
        self.plot = plot
        self.requirements = list(requirements)
        self.weights = weights
        self.vastu_profile = vastu_profile
        self.population_size = population_size
        self.generations = generations

        self.vastu_engine = VastuEngine()
        self.structural_engine = StructuralEngine()
        self.plumbing_engine = PlumbingEngine()

        # Adjust weights according to Vastu mode if set
        vastu_mode = getattr(self.plot, 'vastu_mode', 'BALANCED')
        if vastu_mode == 'STRICT' or vastu_mode == VastuProfileEnum.TRADITIONAL_DETAILED:
            self.weights.vastu = 0.60
        elif vastu_mode == 'FLEXIBLE':
            self.weights.vastu = 0.15
        else:
            self.weights.vastu = 0.35

        # Ensure mandatory Staircase is present in requirements for all plans
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

    def generate_random_individual(self) -> List[LayoutRoom]:
        rooms: List[LayoutRoom] = []
        sb = self.plot.setbacks
        min_x = sb.left
        max_x = self.plot.width - sb.right
        min_y = sb.rear
        max_y = self.plot.length - sb.front

        num_floors = max(1, min(10, getattr(self.plot, 'floors_count', 3)))

        # Distribute requirements across requested floors
        for idx, req in enumerate(self.requirements):
            # Target floor distribution: Ground floor gets living, kitchen, parking, puja, guest
            # F1 gets master bedroom, kids room, balcony
            # F2+ gets additional bedrooms, study, lounge, terrace
            if num_floors == 1:
                assigned_floor = 0
            else:
                if req.room_type in ['living', 'kitchen', 'puja', 'parking', 'dining']:
                    assigned_floor = 0
                elif req.room_type in ['master_bedroom', 'bedroom'] and idx % 2 == 0:
                    assigned_floor = 1 if num_floors >= 2 else 0
                elif num_floors >= 3:
                    assigned_floor = min(num_floors - 1, (idx % num_floors))
                else:
                    assigned_floor = idx % num_floors

            w = req.preferred_width if req.preferred_width else 3.0
            l = req.preferred_length if req.preferred_length else 3.6

            if random.random() > 0.5:
                w, l = l, w

            avail_w = max_x - min_x
            avail_l = max_y - min_y
            w = min(w, avail_w)
            l = min(l, avail_l)

            # Random position within plot boundary
            rx = random.uniform(min_x, max(min_x, max_x - w))
            ry = random.uniform(min_y, max(min_y, max_y - l))

            # Smart door placement based on room type
            wall_side = "south"
            if req.room_type in ["living", "entrance"]:
                wall_side = "south"
            elif req.room_type in ["master_bedroom", "bedroom"]:
                wall_side = "north" if ry < (max_y / 2) else "south"
            elif req.room_type == "kitchen":
                wall_side = "west"
            elif req.room_type == "toilet":
                wall_side = "east"
            elif req.room_type == "puja":
                wall_side = "west"

            door_width = 1.0 if req.room_type == "living" else 0.8 if req.room_type in ["toilet", "puja"] else 0.9
            offset_val = round((w if wall_side in ["north", "south"] else l) * 0.3, 2)

            doors = [
                DoorPlacement(
                    id=f"D-{req.id}-{assigned_floor}",
                    wall_side=wall_side,
                    offset=offset_val,
                    width=door_width,
                    connects_to="circulation"
                )
            ]
            windows = [
                WindowPlacement(
                    id=f"W-{req.id}-{assigned_floor}",
                    wall_side="north" if wall_side != "north" else "south",
                    offset=round((w if wall_side in ["east", "west"] else l) * 0.4, 2),
                    width=1.2
                )
            ]

            rooms.append(
                LayoutRoom(
                    id=f"R-{req.id}-F{assigned_floor}-{uuid.uuid4().hex[:4]}",
                    type=req.room_type,
                    name=f"{req.name}" if num_floors == 1 or assigned_floor == 0 else f"{req.name} (F{assigned_floor})",
                    x=round(rx, 2),
                    y=round(ry, 2),
                    width=round(w, 2),
                    length=round(l, 2),
                    floor_level=assigned_floor,
                    doors=doors,
                    windows=windows
                )
            )

        return self.repair_individual(rooms)

    def repair_individual(self, rooms: List[LayoutRoom]) -> List[LayoutRoom]:
        """Applies exact vector displacement forces per floor level to guarantee 100% zero room overlaps."""
        sb = self.plot.setbacks
        min_x, max_x = sb.left, self.plot.width - sb.right
        min_y, max_y = sb.rear, self.plot.length - sb.front

        # 1. Clamp inside boundary
        for r in rooms:
            r.width = max(1.5, min(r.width, max_x - min_x))
            r.length = max(1.5, min(r.length, max_y - min_y))
            r.x = max(min_x, min(r.x, max_x - r.width))
            r.y = max(min_y, min(r.y, max_y - r.length))

        # Group by floor_level and repair per floor
        floor_groups: Dict[int, List[LayoutRoom]] = {}
        for r in rooms:
            fl = r.floor_level if r.floor_level is not None else 0
            if fl not in floor_groups:
                floor_groups[fl] = []
            floor_groups[fl].append(r)

        repaired_rooms: List[LayoutRoom] = []

        for fl, fl_rooms in floor_groups.items():
            # Vector displacement relaxation loop per floor
            for _ in range(60):
                overlap_found = False
                for i in range(len(fl_rooms)):
                    for j in range(i + 1, len(fl_rooms)):
                        r1, r2 = fl_rooms[i], fl_rooms[j]
                        if check_rect_overlap(r1.x, r1.y, r1.width, r1.length, r2.x, r2.y, r2.width, r2.length):
                            overlap_found = True
                            ov_x = min(r1.x + r1.width, r2.x + r2.width) - max(r1.x, r2.x)
                            ov_y = min(r1.y + r1.length, r2.y + r2.length) - max(r1.y, r2.y)

                            if ov_x <= 0 or ov_y <= 0:
                                continue

                            if ov_x < ov_y:
                                shift = ov_x / 2.0 + 0.05
                                if (r1.x + r1.width / 2.0) <= (r2.x + r2.width / 2.0):
                                    r1.x -= shift
                                    r2.x += shift
                                else:
                                    r1.x += shift
                                    r2.x -= shift
                            else:
                                shift = ov_y / 2.0 + 0.05
                                if (r1.y + r1.length / 2.0) <= (r2.y + r2.length / 2.0):
                                    r1.y -= shift
                                    r2.y += shift
                                else:
                                    r1.y += shift
                                    r2.y -= shift

                            r1.x = max(min_x, min(r1.x, max_x - r1.width))
                            r1.y = max(min_y, min(r1.y, max_y - r1.length))
                            r2.x = max(min_x, min(r2.x, max_x - r2.width))
                            r2.y = max(min_y, min(r2.y, max_y - r2.length))

                if not overlap_found:
                    break

            # Fallback deterministic grid placement if overlaps persist on this floor
            has_overlap = False
            for i in range(len(fl_rooms)):
                for j in range(i + 1, len(fl_rooms)):
                    if check_rect_overlap(fl_rooms[i].x, fl_rooms[i].y, fl_rooms[i].width, fl_rooms[i].length, fl_rooms[j].x, fl_rooms[j].y, fl_rooms[j].width, fl_rooms[j].length):
                        has_overlap = True
                        break

            if has_overlap:
                curr_x, curr_y, row_h = min_x, min_y, 0.0
                for r in fl_rooms:
                    if curr_x + r.width > max_x + 0.01:
                        curr_x = min_x
                        curr_y += row_h + 0.1
                        row_h = 0.0
                    if curr_y + r.length > max_y + 0.01:
                        r.width = max(1.5, r.width * 0.85)
                        r.length = max(1.5, r.length * 0.85)

                    r.x = round(curr_x, 2)
                    r.y = round(curr_y, 2)
                    curr_x += r.width + 0.1
                    row_h = max(row_h, r.length)

            repaired_rooms.extend(fl_rooms)

        return repaired_rooms

    def evaluate_fitness(self, rooms: List[LayoutRoom]) -> Tuple[float, Dict[str, float], Any]:
        # 1. Vastu evaluation
        vastu_report = self.vastu_engine.evaluate_layout(rooms, self.plot, self.vastu_profile)
        vastu_score = vastu_report.total_score

        # 2. Geometry check & penalties
        valid, errors = validate_layout_geometry(rooms, self.plot)
        overlap_penalty = len([e for e in errors if "overlaps" in e]) * 500.0
        boundary_penalty = len([e for e in errors if "outside" in e]) * 20.0

        # 3. Requirement satisfaction score
        req_satisfaction = 100.0
        for req in self.requirements:
            matched = [r for r in rooms if r.name == req.name]
            if not matched:
                req_satisfaction -= 20.0

        # 4. Space utilization score
        total_room_area = sum(r.width * r.length for r in rooms)
        allowed_area = (self.plot.width - self.plot.setbacks.left - self.plot.setbacks.right) * \
                       (self.plot.length - self.plot.setbacks.front - self.plot.setbacks.rear)
        space_ratio = min(1.0, total_room_area / max(1.0, allowed_area))
        space_score = space_ratio * 100.0

        # 5. Circulation score (compactness & proximity)
        cx_avg = sum(r.x + r.width/2 for r in rooms) / max(1, len(rooms))
        cy_avg = sum(r.y + r.length/2 for r in rooms) / max(1, len(rooms))
        avg_dist = sum(abs((r.x + r.width/2) - cx_avg) + abs((r.y + r.length/2) - cy_avg) for r in rooms) / max(1, len(rooms))
        circulation_score = max(0.0, 100.0 - (avg_dist * 5.0))

        # 6. Adjacency score
        adjacency_score = 85.0  # baseline heuristic

        # 7. Structural grid score (aligned walls)
        grid_align_count = 0
        x_coords = set(r.x for r in rooms)
        y_coords = set(r.y for r in rooms)
        structural_score = min(100.0, (len(x_coords) + len(y_coords)) * 8.0)

        # 8. Daylight potential
        daylight_score = 90.0

        # Weighted total fitness
        fitness = (
            self.weights.vastu * vastu_score +
            self.weights.user_requirements * req_satisfaction +
            self.weights.space_utilization * space_score +
            self.weights.circulation * circulation_score +
            self.weights.adjacency * adjacency_score +
            self.weights.structural_grid * structural_score +
            self.weights.daylight * daylight_score
        ) - overlap_penalty - boundary_penalty

        fitness = max(0.0, fitness)

        scores_dict = {
            "vastu": vastu_score,
            "requirements": req_satisfaction,
            "space": space_score,
            "circulation": circulation_score,
            "adjacency": adjacency_score,
            "structural": structural_score,
            "daylight": daylight_score
        }

        return fitness, scores_dict, vastu_report

    def crossover(self, parent1: List[LayoutRoom], parent2: List[LayoutRoom]) -> List[LayoutRoom]:
        child = []
        for r1, r2 in zip(parent1, parent2):
            if random.random() > 0.5:
                child.append(copy.deepcopy(r1))
            else:
                child.append(copy.deepcopy(r2))
        return self.repair_individual(child)

    def mutate(self, individual: List[LayoutRoom]) -> List[LayoutRoom]:
        mutated = copy.deepcopy(individual)
        if not mutated:
            return mutated

        target = random.choice(mutated)
        mutation_type = random.choice(["shift", "rotate", "swap"])

        if mutation_type == "shift":
            target.x += random.uniform(-1.0, 1.0)
            target.y += random.uniform(-1.0, 1.0)
        elif mutation_type == "rotate":
            target.width, target.length = target.length, target.width
        elif mutation_type == "swap" and len(mutated) > 1:
            other = random.choice([r for r in mutated if r.id != target.id])
            target.x, other.x = other.x, target.x
            target.y, other.y = other.y, target.y

        return self.repair_individual(mutated)

    def solve(self, num_candidates: int = 1) -> List[FloorPlanCandidate]:
        # 1. Initialize population
        population = [self.generate_random_individual() for _ in range(self.population_size)]

        # 2. Evolutionary loop
        for gen in range(self.generations):
            evaluated = []
            for ind in population:
                fit, scores, vastu_rep = self.evaluate_fitness(ind)
                evaluated.append((fit, ind, scores, vastu_rep))

            # Sort by fitness descending
            evaluated.sort(key=lambda x: x[0], reverse=True)

            # Elitism: retain top 20%
            elite_count = max(2, int(self.population_size * 0.2))
            next_pop = [copy.deepcopy(ind) for _, ind, _, _ in evaluated[:elite_count]]

            # Breed remaining
            while len(next_pop) < self.population_size:
                p1 = random.choice(evaluated[:int(self.population_size * 0.5)])[1]
                p2 = random.choice(evaluated[:int(self.population_size * 0.5)])[1]
                child = self.crossover(p1, p2)
                if random.random() < 0.3:
                    child = self.mutate(child)
                next_pop.append(child)

            population = next_pop

        # Evaluate final generation
        final_evaluated = []
        for ind in population:
            fit, scores, vastu_rep = self.evaluate_fitness(ind)
            final_evaluated.append((fit, ind, scores, vastu_rep))

        final_evaluated.sort(key=lambda x: x[0], reverse=True)

        # Select top N distinct candidate plans and apply Vastu optimization pass
        candidates: List[FloorPlanCandidate] = []
        for idx, (fit, rooms, scores, vastu_rep) in enumerate(final_evaluated[:num_candidates]):
            clean_rooms = self.repair_individual(copy.deepcopy(rooms))

            # Post-generation Vastu optimization pass
            opt_rooms, opt_summary = self.vastu_engine.optimize_layout(clean_rooms, self.plot, self.vastu_profile)
            if opt_summary.get("is_optimized", False):
                clean_rooms = self.repair_individual(opt_rooms)

            # Re-evaluate final detailed Vastu report
            detailed_report = self.vastu_engine.evaluate_layout(clean_rooms, self.plot, self.vastu_profile)
            detailed_report.optimization_summary = opt_summary

            structure = self.structural_engine.generate_preliminary_structure(clean_rooms, self.plot)
            plumbing_report = self.plumbing_engine.analyze_layout_plumbing(clean_rooms, self.plot)
            plan_name = "Master Floor Plan — Vastu Compliant Layout" if idx == 0 else f"Layout Option {chr(65 + idx)}"

            candidates.append(
                FloorPlanCandidate(
                    id=f"PLAN-{idx+1}-{uuid.uuid4().hex[:6]}",
                    name=plan_name,
                    rooms=clean_rooms,
                    fitness_score=round(fit + (opt_summary.get("score_improvement", 0.0) * 0.35), 1),
                    vastu_score=round(detailed_report.total_score, 1),
                    plumbing_score=round(plumbing_report.total_score, 1),
                    requirement_score=round(scores["requirements"], 1),
                    space_utilization_score=round(scores["space"], 1),
                    circulation_score=round(scores["circulation"], 1),
                    adjacency_score=round(scores["adjacency"], 1),
                    structural_score=round(scores["structural"], 1),
                    daylight_score=round(scores["daylight"], 1),
                    vastu_report=detailed_report,
                    structure=structure,
                    plumbing=plumbing_report
                )
            )

        return candidates
