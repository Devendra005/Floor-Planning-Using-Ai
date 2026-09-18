import math
from typing import List, Dict, Tuple, Set, Optional
from app.models.pydantic_schemas import LayoutRoom, RoomRequirement

# Core rules for residential functional connections
MUST_HAVE_ADJACENCIES = [
    ("kitchen", "dining"),
    ("master_bedroom", "toilet"),
    ("living", "entrance"),
    ("kitchen", "utility")
]

MUST_NOT_HAVE_ADJACENCIES = [
    ("toilet", "kitchen"),
    ("puja", "toilet"),
    ("bedroom", "parking")
]

class AdjacencyEngine:
    """
    Builds strategy-aligned room adjacency graphs and validates
    physical room connectivity in generated floor plans.
    """

    @staticmethod
    def generate_strategy_adjacency_graph(
        strategy_id: str,
        requirements: List[RoomRequirement]
    ) -> Dict[str, List[str]]:
        """
        Builds a canonical desired adjacency graph tailored for the layout strategy.
        Keys and values use room identifiers or room types.
        """
        graph: Dict[str, Set[str]] = {r.name: set() for r in requirements}
        req_by_type: Dict[str, List[RoomRequirement]] = {}
        for r in requirements:
            t = r.room_type.lower()
            req_by_type.setdefault(t, []).append(r)

        # 1. Strategy-specific backbone topology
        living_rooms = req_by_type.get("living", [])
        dining_rooms = req_by_type.get("dining", [])
        kitchen_rooms = req_by_type.get("kitchen", [])
        master_beds = req_by_type.get("master_bedroom", [])
        other_beds = req_by_type.get("bedroom", [])
        toilets = req_by_type.get("toilet", [])
        stairs = req_by_type.get("staircase", [])
        puja = req_by_type.get("puja", [])

        if strategy_id == "open_plan":
            # Mutual cross-adjacency between social core
            if living_rooms and dining_rooms:
                graph[living_rooms[0].name].add(dining_rooms[0].name)
                graph[dining_rooms[0].name].add(living_rooms[0].name)
            if dining_rooms and kitchen_rooms:
                graph[dining_rooms[0].name].add(kitchen_rooms[0].name)
                graph[kitchen_rooms[0].name].add(dining_rooms[0].name)
            if living_rooms and kitchen_rooms:
                graph[living_rooms[0].name].add(kitchen_rooms[0].name)
                graph[kitchen_rooms[0].name].add(living_rooms[0].name)
        elif strategy_id == "central_corridor":
            # Rooms connect to circulation spine rather than through each other
            if living_rooms and stairs:
                graph[living_rooms[0].name].add(stairs[0].name)
                graph[stairs[0].name].add(living_rooms[0].name)
            if dining_rooms and kitchen_rooms:
                graph[dining_rooms[0].name].add(kitchen_rooms[0].name)
                graph[kitchen_rooms[0].name].add(dining_rooms[0].name)
        elif strategy_id == "front_public_rear_private":
            if living_rooms and dining_rooms:
                graph[living_rooms[0].name].add(dining_rooms[0].name)
                graph[dining_rooms[0].name].add(living_rooms[0].name)
            if dining_rooms and kitchen_rooms:
                graph[dining_rooms[0].name].add(kitchen_rooms[0].name)
                graph[kitchen_rooms[0].name].add(dining_rooms[0].name)
            # Rear bedrooms share family foyer
            if master_beds and other_beds:
                graph[master_beds[0].name].add(other_beds[0].name)
                graph[other_beds[0].name].add(master_beds[0].name)
        else:
            # Baseline residential connections
            if living_rooms and dining_rooms:
                graph[living_rooms[0].name].add(dining_rooms[0].name)
                graph[dining_rooms[0].name].add(living_rooms[0].name)
            if dining_rooms and kitchen_rooms:
                graph[dining_rooms[0].name].add(kitchen_rooms[0].name)
                graph[kitchen_rooms[0].name].add(dining_rooms[0].name)

        # 2. Master bedroom & toilet pairing
        if master_beds and toilets:
            graph[master_beds[0].name].add(toilets[0].name)
            graph[toilets[0].name].add(master_beds[0].name)

        # 3. Puja near living or dining
        if puja:
            target = living_rooms[0] if living_rooms else (dining_rooms[0] if dining_rooms else None)
            if target:
                graph[puja[0].name].add(target.name)
                graph[target.name].add(puja[0].name)

        return {k: sorted(list(v)) for k, v in graph.items()}

    @staticmethod
    def extract_actual_adjacency(rooms: List[LayoutRoom], tolerance: float = 0.25) -> Dict[str, List[str]]:
        """
        Determines which rooms physically share a wall boundary within `tolerance` meters.
        """
        adj_map: Dict[str, Set[str]] = {r.name: set() for r in rooms}
        n = len(rooms)
        for i in range(n):
            for j in range(i + 1, n):
                r1 = rooms[i]
                r2 = rooms[j]
                if r1.floor_level != r2.floor_level:
                    continue

                # Check horizontal touch (x-axis)
                touch_x = (abs(r1.x + r1.width - r2.x) <= tolerance) or (abs(r2.x + r2.width - r1.x) <= tolerance)
                overlap_y = min(r1.y + r1.length, r2.y + r2.length) - max(r1.y, r2.y)

                # Check vertical touch (y-axis)
                touch_y = (abs(r1.y + r1.length - r2.y) <= tolerance) or (abs(r2.y + r2.length - r1.y) <= tolerance)
                overlap_x = min(r1.x + r1.width, r2.x + r2.width) - max(r1.x, r2.x)

                if (touch_x and overlap_y > 0.3) or (touch_y and overlap_x > 0.3):
                    adj_map[r1.name].add(r2.name)
                    adj_map[r2.name].add(r1.name)

        return {k: sorted(list(v)) for k, v in adj_map.items()}

    @staticmethod
    def evaluate_adjacency_score(
        rooms: List[LayoutRoom],
        target_graph: Optional[Dict[str, List[str]]] = None
    ) -> Tuple[float, List[str], List[str]]:
        """
        Calculates adjacency score (0 - 100%) and returns satisfaction/violation observations.
        """
        actual_adj = AdjacencyEngine.extract_actual_adjacency(rooms)
        room_by_name = {r.name: r for r in rooms}

        score = 80.0
        positive_obs: List[str] = []
        violations: List[str] = []

        # 1. Check MUST-HAVE connections
        for t1, t2 in MUST_HAVE_ADJACENCIES:
            r1_list = [r for r in rooms if t1 in r.type.lower()]
            r2_list = [r for r in rooms if t2 in r.type.lower()]
            if not r1_list or not r2_list:
                continue

            connected = False
            for r1 in r1_list:
                for r2 in r2_list:
                    if r2.name in actual_adj.get(r1.name, []):
                        connected = True
                        break
                if connected:
                    break

            if connected:
                score += 5.0
                positive_obs.append(f"{t1.replace('_', ' ').title()} directly accessible to {t2.replace('_', ' ').title()}.")
            else:
                # Proximity distance check
                min_dist = 999.0
                for r1 in r1_list:
                    for r2 in r2_list:
                        c1 = (r1.x + r1.width / 2.0, r1.y + r1.length / 2.0)
                        c2 = (r2.x + r2.width / 2.0, r2.y + r2.length / 2.0)
                        d = math.hypot(c1[0] - c2[0], c1[1] - c2[1])
                        min_dist = min(min_dist, d)
                if min_dist < 4.5:
                    score += 2.0
                    positive_obs.append(f"{t1.replace('_', ' ').title()} in close proximity ({min_dist:.1f}m) to {t2.replace('_', ' ').title()}.")
                else:
                    score -= 4.0
                    violations.append(f"{t1.replace('_', ' ').title()} is separated ({min_dist:.1f}m) from {t2.replace('_', ' ').title()}.")

        # 2. Check MUST-NOT-HAVE violations
        for t1, t2 in MUST_NOT_HAVE_ADJACENCIES:
            r1_list = [r for r in rooms if t1 in r.type.lower()]
            r2_list = [r for r in rooms if t2 in r.type.lower()]
            for r1 in r1_list:
                for r2 in r2_list:
                    if r2.name in actual_adj.get(r1.name, []):
                        score -= 10.0
                        violations.append(f"Undesirable direct wall sharing between {r1.name} and {r2.name}.")

        final_score = max(40.0, min(100.0, score))
        return round(final_score, 1), positive_obs, violations
