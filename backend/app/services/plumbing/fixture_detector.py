from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import LayoutRoom, PlumbingFixture

WET_AREA_CATEGORIES = {
    "kitchen": {"level": "HIGH", "plumbing_required": True},
    "bathroom": {"level": "HIGH", "plumbing_required": True},
    "master_bathroom": {"level": "HIGH", "plumbing_required": True},
    "toilet": {"level": "HIGH", "plumbing_required": True},
    "utility": {"level": "HIGH", "plumbing_required": True},
    "laundry": {"level": "HIGH", "plumbing_required": True},
    "wash": {"level": "MEDIUM", "plumbing_required": True},
    "wash_area": {"level": "MEDIUM", "plumbing_required": True},
    "bedroom": {"level": "LOW", "plumbing_required": False},
    "master_bedroom": {"level": "LOW", "plumbing_required": False},
    "living": {"level": "LOW", "plumbing_required": False},
    "dining": {"level": "LOW", "plumbing_required": False},
    "study": {"level": "LOW", "plumbing_required": False},
    "store": {"level": "LOW", "plumbing_required": False},
    "parking": {"level": "LOW", "plumbing_required": False},
    "staircase": {"level": "LOW", "plumbing_required": False}
}

def classify_room_plumbing_requirement(room: LayoutRoom) -> Dict[str, Any]:
    """Classifies room into HIGH, MEDIUM, or LOW plumbing requirement."""
    rtype = room.type.lower()
    rname = room.name.lower()

    if any(k in rtype or k in rname for k in ["kitchen"]):
        return {"category": "KITCHEN", "level": "HIGH", "required": True}
    elif any(k in rtype or k in rname for k in ["bath", "toilet", "washroom", "wc"]):
        return {"category": "BATHROOM", "level": "HIGH", "required": True}
    elif any(k in rtype or k in rname for k in ["utility", "laundry", "service"]):
        return {"category": "UTILITY", "level": "HIGH", "required": True}
    elif any(k in rtype or k in rname for k in ["wash"]):
        return {"category": "WASH_AREA", "level": "MEDIUM", "required": True}
    else:
        return {"category": "DRY_ROOM", "level": "LOW", "required": False}

def detect_room_fixtures(room: LayoutRoom) -> List[PlumbingFixture]:
    """Generates precise water-use fixtures inside wet rooms with exact x,y coordinates."""
    classification = classify_room_plumbing_requirement(room)
    if not classification["required"]:
        return []

    fixtures: List[PlumbingFixture] = []
    rx, ry = room.x, room.y
    rw, rl = room.width, room.length
    fl = getattr(room, "floor_level", 0) or 0
    fz = float(fl) * 3.0

    category = classification["category"]

    if category == "KITCHEN":
        # Kitchen Sink on West or North wall
        sink_x = round(rx + 0.6, 2)
        sink_y = round(ry + rl - 0.6, 2)
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-KSINK-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="kitchen_sink",
                x=sink_x,
                y=sink_y,
                z=fz + 0.9,
                wall_side="north",
                connection_type="WASTEWATER"
            )
        )
        # Kitchen Water Inlet
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-KINLET-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="water_inlet",
                x=sink_x + 0.1,
                y=sink_y,
                z=fz + 0.6,
                wall_side="north",
                connection_type="WATER_INLET"
            )
        )
        # Dishwasher Connection
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-DISHW-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="dishwasher",
                x=round(rx + 1.4, 2),
                y=sink_y,
                z=fz + 0.4,
                wall_side="north",
                connection_type="WASTEWATER"
            )
        )

    elif category == "BATHROOM":
        # Water Closet (WC) on South wall
        wc_x = round(rx + rw * 0.3, 2)
        wc_y = round(ry + 0.4, 2)
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-WC-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="wc",
                x=wc_x,
                y=wc_y,
                z=fz + 0.4,
                wall_side="south",
                connection_type="SOIL_DRAIN"
            )
        )
        # Wash Basin on East/West wall
        basin_x = round(rx + rw - 0.5, 2)
        basin_y = round(ry + rl * 0.4, 2)
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-BASIN-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="wash_basin",
                x=basin_x,
                y=basin_y,
                z=fz + 0.85,
                wall_side="east",
                connection_type="WASTEWATER"
            )
        )
        # Shower Area in corner
        shower_x = round(rx + 0.5, 2)
        shower_y = round(ry + rl - 0.5, 2)
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-SHOWER-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="shower",
                x=shower_x,
                y=shower_y,
                z=fz + 2.1,
                wall_side="north",
                connection_type="WATER_INLET"
            )
        )
        # Floor Drain Trap
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-FDRAIN-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="floor_drain",
                x=round(rx + rw * 0.5, 2),
                y=round(ry + rl * 0.5, 2),
                z=fz + 0.0,
                wall_side="center",
                connection_type="WASTEWATER"
            )
        )

    elif category in ["UTILITY", "WASH_AREA"]:
        # Washing Machine Inlet & Drain
        wm_x = round(rx + 0.5, 2)
        wm_y = round(ry + 0.5, 2)
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-WM-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="washing_machine",
                x=wm_x,
                y=wm_y,
                z=fz + 0.8,
                wall_side="south",
                connection_type="WASTEWATER"
            )
        )
        # Utility Sink
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-USINK-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="utility_sink",
                x=round(rx + rw - 0.5, 2),
                y=round(ry + 0.5, 2),
                z=fz + 0.85,
                wall_side="south",
                connection_type="WASTEWATER"
            )
        )
        # Floor Drain
        fixtures.append(
            PlumbingFixture(
                fixture_id=f"FIX-UFDRAIN-{room.id}",
                room_id=room.id,
                room_name=room.name,
                fixture_type="floor_drain",
                x=round(rx + rw * 0.5, 2),
                y=round(ry + rl * 0.5, 2),
                z=fz + 0.0,
                wall_side="center",
                connection_type="WASTEWATER"
            )
        )

    return fixtures

def detect_all_layout_fixtures(rooms: List[LayoutRoom]) -> List[PlumbingFixture]:
    """Scans all rooms and returns complete list of plumbing fixtures."""
    all_fixtures: List[PlumbingFixture] = []
    for r in rooms:
        all_fixtures.extend(detect_room_fixtures(r))
    return all_fixtures
