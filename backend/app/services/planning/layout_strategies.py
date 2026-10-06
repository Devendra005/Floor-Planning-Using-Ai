import copy
import uuid
import math
import random
from typing import List, Dict, Any, Tuple, Optional
from app.models.pydantic_schemas import (
    PlotConfig, RoomRequirement, LayoutRoom, DoorPlacement, WindowPlacement, VastuProfileEnum
)
from app.services.geometry.constraint_solver import (
    check_rect_overlap, check_within_boundary, get_zone_from_coordinate
)

# Architectural layout strategy descriptors
STRATEGY_REGISTRY = {
    "central_corridor": {
        "id": "central_corridor",
        "name": "Central Corridor Layout",
        "description": "An axial spine runs from front to back, symmetrically distributing social rooms on one side and private chambers on the other.",
        "spatial_features": ["Clear central circulation", "Equal access to rooms", "Balanced cross-ventilation"],
        "ideal_plot_aspect": "Square or rectangular (1:1 to 1:1.5)"
    },
    "side_corridor": {
        "id": "side_corridor",
        "name": "Side Corridor Layout",
        "description": "Circulation pathway hugging one boundary, opening living and bedroom spaces towards maximum garden/daylight frontage on the opposite side.",
        "spatial_features": ["Maximizes perimeter windows", "Private buffer on corridor side", "Streamlined utility lines"],
        "ideal_plot_aspect": "Narrow or deep plots (1:1.5 to 1:2.2)"
    },
    "open_plan": {
        "id": "open_plan",
        "name": "Open Plan Layout",
        "description": "Integrated Living, Dining, and Kitchen flowing as a great-room social pavilion with private bedrooms nestled to the rear.",
        "spatial_features": ["Spacious visual sightlines", "Zero wasted hallway space", "Flexible social entertainment zone"],
        "ideal_plot_aspect": "Square or wide frontage"
    },
    "courtyard": {
        "id": "courtyard",
        "name": "Courtyard Layout",
        "description": "Inspired by traditional Haveli and Brahmasthan architecture, wrapping rooms around a central open-to-sky atrium or light well.",
        "spatial_features": ["Internal microclimate & light well", "High thermal comfort", "Strong cultural & spiritual centering"],
        "ideal_plot_aspect": "Generous square or wide rectangular plot"
    },
    "l_shaped": {
        "id": "l_shaped",
        "name": "L-Shaped Layout",
        "description": "Two perpendicular wings separating public day zones from private night quarters, wrapping a protected corner terrace or garden.",
        "spatial_features": ["Dedicated private outdoor court", "Acoustic zoning between wings", "Corner plot adaptability"],
        "ideal_plot_aspect": "Corner plots or wide plots"
    },
    "u_shaped": {
        "id": "u_shaped",
        "name": "U-Shaped Layout",
        "description": "Three wings enclosing an entry court or rear patio, granting private garden views to all major rooms.",
        "spatial_features": ["Triple-aspect natural light", "Architectural entrance court", "High privacy from neighbors"],
        "ideal_plot_aspect": "Wide frontage plots (width >= 12m)"
    },
    "linear": {
        "id": "linear",
        "name": "Linear Layout",
        "description": "Sequential functional progression from front road to rear garden: Verandah -> Living -> Dining -> Kitchen -> Bedrooms.",
        "spatial_features": ["Simple structural grid", "Low construction cost", "Optimal for narrow urban row-houses"],
        "ideal_plot_aspect": "Elongated rectangular plots (length/width > 1.6)"
    },
    "clustered": {
        "id": "clustered",
        "name": "Clustered Layout",
        "description": "Autonomous functional pods (Social Pod, Culinary Pod, Night Sanctuary) connected through short nodal vestibules.",
        "spatial_features": ["Modular expandability", "Sound dampening between zones", "Distinct privacy barriers"],
        "ideal_plot_aspect": "Medium to large plots"
    },
    "front_public_rear_private": {
        "id": "front_public_rear_private",
        "name": "Front-Public / Rear-Private Layout",
        "description": "Rigorous dual-zone split: Street-facing front half contains Living, Foyer, and Parking; rear half is strictly private for Family & Bedrooms.",
        "spatial_features": ["Maximum security and acoustic insulation", "Formal guest screening", "Secluded family bedrooms"],
        "ideal_plot_aspect": "Deep urban plots"
    },
    "compact": {
        "id": "compact",
        "name": "Compact Layout",
        "description": "High-efficiency volumetric layout with shared plumbing wet walls, zero dead-end corridors, and minimal circulation area (< 8%).",
        "spatial_features": ["Lowest cost per sq. meter", "Shared structural and plumbing cores", "Maximum usable room areas"],
        "ideal_plot_aspect": "Compact plots (below 35x45 ft)"
    }
}


def get_all_strategy_infos() -> List[Dict[str, Any]]:
    return list(STRATEGY_REGISTRY.values())


def categorize_rooms(requirements: List[RoomRequirement]) -> Dict[str, List[RoomRequirement]]:
    categories: Dict[str, List[RoomRequirement]] = {
        "entrance": [],
        "public": [],
        "semi_private": [],
        "private": [],
        "wet_services": [],
        "utility": [],
        "outdoor": []
    }
    for r in requirements:
        t = r.room_type.lower()
        if t in ["entrance", "foyer", "verandah", "porch"]:
            categories["entrance"].append(r)
        elif t in ["living", "drawing", "lounge"]:
            categories["public"].append(r)
        elif t in ["dining", "family", "study", "puja"]:
            categories["semi_private"].append(r)
        elif t in ["master_bedroom", "bedroom", "guest_room", "kids_bedroom"]:
            categories["private"].append(r)
        elif t in ["kitchen", "toilet", "bathroom", "wc", "powder_room"]:
            categories["wet_services"].append(r)
        elif t in ["utility", "store", "staircase", "stair"]:
            categories["utility"].append(r)
        elif t in ["parking", "garage", "balcony", "terrace"]:
            categories["outdoor"].append(r)
        else:
            categories["semi_private"].append(r)
    return categories


def build_smart_openings(room_type: str, x: float, y: float, w: float, l: float,
                         plot_w: float, plot_l: float, wall_preference: str = "south") -> Tuple[List[DoorPlacement], List[WindowPlacement]]:
    door_w = 1.0 if room_type in ["living", "entrance"] else 0.8 if room_type in ["toilet", "puja"] else 0.9
    offset_d = round((w if wall_preference in ["north", "south"] else l) * 0.25, 2)

    doors = [
        DoorPlacement(
            id=f"D-{uuid.uuid4().hex[:4]}",
            wall_side=wall_preference,
            offset=max(0.2, min(offset_d, max(0.5, (w if wall_preference in ["north", "south"] else l) - door_w - 0.2))),
            width=door_w,
            connects_to="circulation"
        )
    ]

    win_wall = "north" if wall_preference != "north" else "south"
    if x <= 1.5:
        win_wall = "west"
    elif (x + w) >= (plot_w - 1.5):
        win_wall = "east"

    windows = [
        WindowPlacement(
            id=f"W-{uuid.uuid4().hex[:4]}",
            wall_side=win_wall,
            offset=round((w if win_wall in ["north", "south"] else l) * 0.35, 2),
            width=1.2
        )
    ]
    return doors, windows


class LayoutStrategyBuilder:
    """
    Constructs an initial architecturally distinct 2D spatial seed
    according to a specified layout strategy, seed, and plot orientation.
    """

    @staticmethod
    def build_layout(
        strategy_id: str,
        plot: PlotConfig,
        requirements: List[RoomRequirement],
        vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC,
        vastu_strictness: str = "BALANCED",
        seed: Optional[int] = None,
        orientation: Optional[str] = None
    ) -> List[LayoutRoom]:
        sb = plot.setbacks
        min_x = sb.left
        max_x = max(min_x + 5.0, plot.width - sb.right)
        min_y = sb.rear
        max_y = max(min_y + 5.0, plot.length - sb.front)

        net_w = max_x - min_x
        net_l = max_y - min_y

        rnd = random.Random(seed) if seed is not None else random.Random()
        orient = orientation or getattr(plot, 'orientation', None) or getattr(plot, 'road_direction', None) or "E"

        dispatch = {
            "central_corridor": LayoutStrategyBuilder._layout_central_corridor,
            "side_corridor": LayoutStrategyBuilder._layout_side_corridor,
            "open_plan": LayoutStrategyBuilder._layout_open_plan,
            "courtyard": LayoutStrategyBuilder._layout_courtyard,
            "l_shaped": LayoutStrategyBuilder._layout_l_shaped,
            "u_shaped": LayoutStrategyBuilder._layout_u_shaped,
            "linear": LayoutStrategyBuilder._layout_linear,
            "clustered": LayoutStrategyBuilder._layout_clustered,
            "front_public_rear_private": LayoutStrategyBuilder._layout_front_public_rear_private,
            "compact": LayoutStrategyBuilder._layout_compact,
        }

        fn = dispatch.get(strategy_id, LayoutStrategyBuilder._layout_central_corridor)
        rooms = fn(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd, orient)

        # Distribute rooms across floor levels (GF, F1, F2... Fn) for multi-story buildings
        rooms = LayoutStrategyBuilder._assign_multi_floor_levels(rooms, plot)
        
        # Enforce hard dimensional guarantees (all rooms >= 1.5m and inside boundary)
        for r in rooms:
            r.width = max(1.5, min(r.width, net_w))
            r.length = max(1.5, min(r.length, net_l))
            r.x = max(min_x, min(r.x, max_x - r.width))
            r.y = max(min_y, min(r.y, max_y - r.length))

        return rooms

    @staticmethod
    def _assign_multi_floor_levels(rooms: List[LayoutRoom], plot: PlotConfig) -> List[LayoutRoom]:
        """
        Distributes rooms across requested plot floors_count (1 to 10 floors).
        """
        num_floors = max(1, min(10, getattr(plot, 'floors_count', 1)))
        if num_floors <= 1:
            for r in rooms:
                r.floor_level = 0
            return rooms

        gf_types = {
            "entrance", "foyer", "verandah", "porch", "living", "drawing", "lounge",
            "kitchen", "pantry", "dining", "puja", "parking", "garage", "utility", "store"
        }
        upper_types = {
            "master_bedroom", "kids_bedroom", "family", "study", "balcony", "terrace", "gym", "home_theater"
        }

        bedroom_rooms: List[LayoutRoom] = []
        toilet_rooms: List[LayoutRoom] = []
        stair_rooms: List[LayoutRoom] = []
        other_rooms: List[LayoutRoom] = []

        for r in rooms:
            t = r.type.lower()
            if "stair" in t:
                stair_rooms.append(r)
            elif "bedroom" in t or ("room" in t and "guest" in t):
                bedroom_rooms.append(r)
            elif "toilet" in t or "bath" in t or "wc" in t or "powder" in t:
                toilet_rooms.append(r)
            else:
                other_rooms.append(r)

        assigned_rooms: List[LayoutRoom] = []

        # 1. Other functional rooms (Living, Kitchen, Foyer, etc.)
        for r in other_rooms:
            t = r.type.lower()
            if t in gf_types:
                r.floor_level = 0
            elif t in upper_types:
                r.floor_level = 1 if num_floors >= 2 else 0
                if num_floors > 1 and not "(F" in r.name:
                    r.name = f"{r.name} (F1)"
            else:
                r.floor_level = 0
            assigned_rooms.append(r)

        # 2. Bedrooms: 1st (Master) -> F1, 2nd -> F1, 3rd -> F2, etc.
        for idx, bed in enumerate(bedroom_rooms):
            if idx == 0:
                fl = 1 if num_floors >= 2 else 0
            elif idx == 1:
                fl = 1 if num_floors >= 2 else 0
            elif idx == 2:
                fl = 2 if num_floors >= 3 else (1 if num_floors >= 2 else 0)
            else:
                fl = min(num_floors - 1, idx % num_floors)
            bed.floor_level = fl
            if fl > 0 and not f"(F{fl})" in bed.name:
                bed.name = f"{bed.name} (F{fl})"
            assigned_rooms.append(bed)

        # 3. Toilets: 1st stays on GF (Powder room), remaining placed on upper floors
        gf_toilets_count = 0
        for toi in toilet_rooms:
            if gf_toilets_count == 0:
                toi.floor_level = 0
                gf_toilets_count += 1
            else:
                fl = 1 if num_floors >= 2 else 0
                toi.floor_level = fl
                if fl > 0 and not f"(F{fl})" in toi.name:
                    toi.name = f"{toi.name} (F{fl})"
            assigned_rooms.append(toi)

        # 4. Staircase: Set to GF and vertically clone to all upper floors
        for st in stair_rooms:
            st.floor_level = 0
            assigned_rooms.append(st)
            for fl in range(1, num_floors):
                cloned_st = copy.deepcopy(st)
                cloned_st.id = f"{st.id}-F{fl}"
                cloned_st.name = f"{st.name} (F{fl})"
                cloned_st.floor_level = fl
                assigned_rooms.append(cloned_st)

        return assigned_rooms

    @staticmethod
    def _layout_central_corridor(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        mid_x = min_x + (net_w / 2.0)
        corridor_w = round(rnd.uniform(1.1, 1.3), 2)
        left_w = max(2.2, (net_w - corridor_w) / 2.0)
        right_w = max(2.2, (net_w - corridor_w) / 2.0)

        left_x = min_x
        right_x = mid_x + (corridor_w / 2.0)

        cats = categorize_rooms(requirements)
        curr_left_y = min_y
        curr_right_y = min_y

        # Public/Entrance rooms placed towards front
        front_pool = list(cats["outdoor"] + cats["public"] + cats["entrance"])
        if len(front_pool) > 1:
            rnd.shuffle(front_pool)

        for r in front_pool:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(left_w, (r.preferred_width or 3.6) * w_scale))
            l = max(1.8, min(net_l * 0.45, (r.preferred_length or 4.2) * l_scale))
            doors, wins = build_smart_openings(r.room_type, left_x, curr_left_y, w, l, plot.width, plot.length, "east")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(left_x, 2),
                y=round(curr_left_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            curr_left_y += l + 0.1

        mid_pool = list(cats["wet_services"][:2] + cats["semi_private"])
        if len(mid_pool) > 1:
            rnd.shuffle(mid_pool)

        for r in mid_pool:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(right_w, (r.preferred_width or 3.0) * w_scale))
            l = max(1.8, min(net_l * 0.35, (r.preferred_length or 3.2) * l_scale))
            doors, wins = build_smart_openings(r.room_type, right_x, curr_right_y, w, l, plot.width, plot.length, "west")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(right_x, 2),
                y=round(curr_right_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            curr_right_y += l + 0.1

        rear_pool = list(cats["private"] + cats["wet_services"][2:] + cats["utility"])
        for idx, r in enumerate(rear_pool):
            is_left = (idx % 2 == 0)
            target_x = left_x if is_left else right_x
            target_y = curr_left_y if is_left else curr_right_y
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(left_w if is_left else right_w, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(3.8, (r.preferred_length or 3.6) * l_scale))
            if target_y + l > max_y:
                target_y = max(min_y, max_y - l)
            doors, wins = build_smart_openings(r.room_type, target_x, target_y, w, l, plot.width, plot.length, "east" if is_left else "west")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(target_x, 2),
                y=round(target_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            if is_left:
                curr_left_y += l + 0.1
            else:
                curr_right_y += l + 0.1

        return rooms

    @staticmethod
    def _layout_side_corridor(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        corridor_w = round(rnd.uniform(1.0, 1.3), 2)
        
        # Corridor on left or right side based on seed
        corridor_on_left = (rnd.random() > 0.5)
        if corridor_on_left:
            room_start_x = min_x + corridor_w
            avail_w = max(2.5, max_x - room_start_x)
        else:
            room_start_x = min_x
            avail_w = max(2.5, max_x - min_x - corridor_w)

        curr_y = min_y
        for r in requirements:
            w_scale = rnd.uniform(0.88, 1.12)
            l_scale = rnd.uniform(0.88, 1.12)
            w = max(1.8, min(avail_w, (r.preferred_width or 3.5) * w_scale))
            l = max(1.8, min(max(2.4, net_l / max(2, len(requirements) // 2)), (r.preferred_length or 3.6) * l_scale))
            if curr_y + l > max_y:
                curr_y = min_y
                room_start_x = min(max_x - w, room_start_x + (avail_w / 2.0))

            doors, wins = build_smart_openings(r.room_type, room_start_x, curr_y, w, l, plot.width, plot.length, "west" if corridor_on_left else "east")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(room_start_x, 2),
                y=round(curr_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            curr_y += l + 0.1
        return rooms

    @staticmethod
    def _layout_open_plan(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        cats = categorize_rooms(requirements)

        front_depth_ratio = rnd.uniform(0.40, 0.50)
        front_depth = max(3.0, net_l * front_depth_ratio)
        front_y = max(min_y + 3.0, max_y - front_depth)

        social_rooms = list(cats["public"] + cats["semi_private"] + [r for r in cats["wet_services"] if "kitchen" in r.room_type])
        other_rooms = list(cats["private"] + [r for r in cats["wet_services"] if "kitchen" not in r.room_type] + cats["utility"] + cats["outdoor"])

        if len(social_rooms) > 1:
            rnd.shuffle(social_rooms)

        cur_x = min_x
        num_social = max(1, len(social_rooms))
        slot_w = max(2.5, net_w / num_social)
        for r in social_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(slot_w, (r.preferred_width or 4.0) * w_scale))
            l = max(1.8, min(front_depth, (r.preferred_length or 4.2) * l_scale))
            doors, wins = build_smart_openings(r.room_type, cur_x, front_y, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(cur_x, 2),
                y=round(front_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            cur_x += w + 0.1

        rear_cur_x = min_x
        rear_cur_y = min_y
        row_h = 0.0
        avail_rear_h = max(2.5, front_y - min_y)
        for r in other_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.5, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(avail_rear_h, (r.preferred_length or 3.4) * l_scale))
            if rear_cur_x + w > max_x:
                rear_cur_x = min_x
                rear_cur_y += row_h + 0.1
                row_h = 0.0
            if rear_cur_y + l > front_y:
                rear_cur_y = max(min_y, front_y - l)
            doors, wins = build_smart_openings(r.room_type, rear_cur_x, rear_cur_y, w, l, plot.width, plot.length, "north")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(rear_cur_x, 2),
                y=round(rear_cur_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            rear_cur_x += w + 0.1
            row_h = max(row_h, l)

        return rooms

    @staticmethod
    def _layout_courtyard(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        court_w_ratio = rnd.uniform(0.20, 0.30)
        court_l_ratio = rnd.uniform(0.20, 0.30)
        court_w = max(2.0, net_w * court_w_ratio)
        court_l = max(2.0, net_l * court_l_ratio)
        court_x = min_x + (net_w - court_w) / 2.0
        court_y = min_y + (net_l - court_l) / 2.0

        quadrants = [
            (min_x, court_x, court_y + court_l, max_y),
            (court_x + court_w, max_x, court_y + court_l, max_y),
            (court_x + court_w, max_x, min_y, court_y),
            (min_x, court_x, min_y, court_y),
        ]

        # Vastu-conscious quadrant mapping: NE (Top-Right), SE (Bottom-Right), SW (Bottom-Left), NW (Top-Left)
        req_shuffled = list(requirements)
        if rnd.random() > 0.3:
            # Sort by Vastu preference if possible
            def zone_pref(r):
                t = r.room_type.lower()
                if "puja" in t or "living" in t: return 0 # NE
                if "kitchen" in t: return 2 # SE
                if "master" in t: return 3 # SW
                return 1 # NW
            req_shuffled.sort(key=zone_pref)

        for idx, r in enumerate(req_shuffled):
            qx1, qx2, qy1, qy2 = quadrants[idx % 4]
            qw = max(2.0, qx2 - qx1)
            ql = max(2.0, qy2 - qy1)
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(qw, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(ql, (r.preferred_length or 3.4) * l_scale))
            rx = qx1 + ((idx // 4) * 0.4)
            ry = qy1 + ((idx // 4) * 0.4)
            rx = max(min_x, min(rx, max_x - w))
            ry = max(min_y, min(ry, max_y - l))

            doors, wins = build_smart_openings(r.room_type, rx, ry, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(rx, 2),
                y=round(ry, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
        return rooms

    @staticmethod
    def _layout_l_shaped(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        wing_w_ratio = rnd.uniform(0.50, 0.60)
        wing_w = max(3.0, net_w * wing_w_ratio)

        cats = categorize_rooms(requirements)
        public_pool = list(cats["public"] + cats["semi_private"] + cats["outdoor"])
        private_pool = list(cats["private"] + cats["wet_services"] + cats["utility"])

        cur_x = min_x
        cur_y = min_y
        for r in public_pool:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(wing_w, (r.preferred_width or 3.6) * w_scale))
            l = max(1.8, min(3.8, (r.preferred_length or 4.0) * l_scale))
            doors, wins = build_smart_openings(r.room_type, cur_x, cur_y, w, l, plot.width, plot.length, "north")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(cur_x, 2),
                y=round(cur_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            cur_x += w + 0.1

        priv_x = min_x
        priv_y = min(max_y - 2.5, min_y + 3.8 + 0.1)
        for r in private_pool:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.45, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(3.6, (r.preferred_length or 3.5) * l_scale))
            if priv_y + l > max_y:
                priv_y = min_y
                priv_x = min(max_x - w, priv_x + w + 0.1)
            doors, wins = build_smart_openings(r.room_type, priv_x, priv_y, w, l, plot.width, plot.length, "east")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(priv_x, 2),
                y=round(priv_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            priv_y += l + 0.1
        return rooms

    @staticmethod
    def _layout_u_shaped(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        col_w_ratio = rnd.uniform(0.30, 0.38)
        col_w = max(2.5, net_w * col_w_ratio)
        left_x = min_x
        right_x = max(min_x + col_w + 1.0, max_x - col_w)

        req_list = list(requirements)
        third = max(1, len(req_list) // 3)

        left_rooms = req_list[:third]
        rear_rooms = req_list[third:third*2]
        right_rooms = req_list[third*2:]

        curr_y = min_y
        for r in left_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(col_w, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(3.6, (r.preferred_length or 3.5) * l_scale))
            doors, wins = build_smart_openings(r.room_type, left_x, curr_y, w, l, plot.width, plot.length, "east")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(left_x, 2),
                y=round(curr_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            curr_y += l + 0.1

        curr_y = min_y
        for r in right_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(col_w, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(3.6, (r.preferred_length or 3.5) * l_scale))
            doors, wins = build_smart_openings(r.room_type, right_x, curr_y, w, l, plot.width, plot.length, "west")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(right_x, 2),
                y=round(curr_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            curr_y += l + 0.1

        rear_x = left_x + col_w + 0.1
        avail_rear_w = max(2.5, right_x - rear_x - 0.1)
        rear_y = max(min_y, max_y - (net_l * 0.35))
        for r in rear_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(avail_rear_w, (r.preferred_width or 3.4) * w_scale))
            l = max(1.8, min(net_l * 0.35, (r.preferred_length or 3.6) * l_scale))
            doors, wins = build_smart_openings(r.room_type, rear_x, rear_y, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(rear_x, 2),
                y=round(rear_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            rear_x += w + 0.1
        return rooms

    @staticmethod
    def _layout_linear(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        curr_y = max_y
        total_rooms = max(1, len(requirements))
        slice_h = net_l / total_rooms

        cats = categorize_rooms(requirements)
        ordered = cats["outdoor"] + cats["entrance"] + cats["public"] + cats["semi_private"] + \
                  [r for r in cats["wet_services"] if "kitchen" in r.room_type] + cats["private"] + \
                  [r for r in cats["wet_services"] if "kitchen" not in r.room_type] + cats["utility"]

        for r in ordered:
            w_scale = rnd.uniform(0.85, 0.95)
            w = max(1.8, min(net_w * w_scale, (r.preferred_width or 3.6)))
            l = max(1.8, min(slice_h * 1.3, (r.preferred_length or 3.8)))
            curr_y -= (l + 0.05)
            rx = min_x + (net_w - w) / 2.0
            ry = max(min_y, curr_y)

            doors, wins = build_smart_openings(r.room_type, rx, ry, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(rx, 2),
                y=round(ry, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
        return rooms

    @staticmethod
    def _layout_clustered(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        cats = categorize_rooms(requirements)

        c1_rooms = list(cats["outdoor"] + cats["entrance"] + cats["public"])
        c2_rooms = list(cats["semi_private"] + [r for r in cats["wet_services"] if "kitchen" in r.room_type] + cats["utility"])
        c3_rooms = list(cats["private"] + [r for r in cats["wet_services"] if "kitchen" not in r.room_type])

        # Cluster 1: Front
        c1_x = min_x
        c1_y = max(min_y, max_y - (net_l * 0.4))
        for r in c1_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.5, (r.preferred_width or 3.8) * w_scale))
            l = max(1.8, min(net_l * 0.38, (r.preferred_length or 4.0) * l_scale))
            doors, wins = build_smart_openings(r.room_type, c1_x, c1_y, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(c1_x, 2),
                y=round(c1_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            c1_x += w + 0.1

        # Cluster 2: Mid
        c2_x = min_x + (net_w * 0.45)
        c2_y = min_y + (net_l * 0.25)
        for r in c2_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.5, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(net_l * 0.32, (r.preferred_length or 3.4) * l_scale))
            doors, wins = build_smart_openings(r.room_type, c2_x, c2_y, w, l, plot.width, plot.length, "west")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(min(max_x - w, c2_x), 2),
                y=round(c2_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            c2_y += l + 0.1

        # Cluster 3: Rear
        c3_x = min_x
        c3_y = min_y
        for r in c3_rooms:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.45, (r.preferred_width or 3.4) * w_scale))
            l = max(1.8, min(net_l * 0.35, (r.preferred_length or 3.6) * l_scale))
            doors, wins = build_smart_openings(r.room_type, c3_x, c3_y, w, l, plot.width, plot.length, "north")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(c3_x, 2),
                y=round(c3_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            c3_x += w + 0.1
        return rooms

    @staticmethod
    def _layout_front_public_rear_private(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        cats = categorize_rooms(requirements)

        split_ratio = rnd.uniform(0.45, 0.52)
        split_y = min_y + (net_l * split_ratio)

        public_items = list(cats["outdoor"] + cats["entrance"] + cats["public"] + cats["semi_private"])
        cur_x = min_x
        cur_y = split_y
        row_h = 0.0
        for r in public_items:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.48, (r.preferred_width or 3.8) * w_scale))
            l = max(1.8, min(max(2.0, max_y - split_y), (r.preferred_length or 4.0) * l_scale))
            if cur_x + w > max_x:
                cur_x = min_x
                cur_y += row_h + 0.1
                row_h = 0.0
            if cur_y + l > max_y:
                cur_y = max(split_y, max_y - l)
            doors, wins = build_smart_openings(r.room_type, cur_x, cur_y, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(cur_x, 2),
                y=round(cur_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            cur_x += w + 0.1
            row_h = max(row_h, l)

        private_items = list(cats["private"] + cats["wet_services"] + cats["utility"])
        cur_x = min_x
        cur_y = min_y
        row_h = 0.0
        for r in private_items:
            w_scale = rnd.uniform(0.9, 1.1)
            l_scale = rnd.uniform(0.9, 1.1)
            w = max(1.8, min(net_w * 0.48, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(max(2.0, split_y - min_y), (r.preferred_length or 3.5) * l_scale))
            if cur_x + w > max_x:
                cur_x = min_x
                cur_y += row_h + 0.1
                row_h = 0.0
            if cur_y + l > split_y:
                cur_y = max(min_y, split_y - l)
            doors, wins = build_smart_openings(r.room_type, cur_x, cur_y, w, l, plot.width, plot.length, "north")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(cur_x, 2),
                y=round(cur_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            cur_x += w + 0.1
            row_h = max(row_h, l)

        return rooms

    @staticmethod
    def _layout_compact(plot, requirements, min_x, max_x, min_y, max_y, net_w, net_l, vastu_strictness, rnd: random.Random, orient: str):
        rooms: List[LayoutRoom] = []
        cols = 2 if net_w < 12.0 else 3
        col_w = max(2.5, net_w / cols)

        cats = categorize_rooms(requirements)
        sorted_reqs = list(cats["public"] + cats["semi_private"] + cats["private"] + cats["wet_services"] + cats["utility"] + cats["outdoor"])

        curr_x = min_x
        curr_y = min_y
        col_idx = 0
        for r in sorted_reqs:
            w_scale = rnd.uniform(0.88, 1.12)
            l_scale = rnd.uniform(0.88, 1.12)
            w = max(1.8, min(col_w, (r.preferred_width or 3.2) * w_scale))
            l = max(1.8, min(net_l * 0.4, (r.preferred_length or 3.5) * l_scale))
            if curr_y + l > max_y:
                col_idx += 1
                curr_x = min(max_x - w, min_x + (col_idx * col_w))
                curr_y = min_y

            doors, wins = build_smart_openings(r.room_type, curr_x, curr_y, w, l, plot.width, plot.length, "south")
            rooms.append(LayoutRoom(
                id=f"R-{r.id}-{uuid.uuid4().hex[:4]}",
                type=r.room_type,
                name=r.name,
                x=round(curr_x, 2),
                y=round(curr_y, 2),
                width=round(w, 2),
                length=round(l, 2),
                doors=doors,
                windows=wins
            ))
            curr_y += l + 0.05

        return rooms
