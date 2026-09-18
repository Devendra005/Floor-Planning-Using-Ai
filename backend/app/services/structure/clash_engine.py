import uuid
from typing import List
from app.models.pydantic_schemas import (
    StructuralColumn, StructuralBeam, LayoutRoom, StructuralClash, RebarSpec
)
from app.services.geometry.constraint_solver import check_rect_overlap

class ClashDetectionEngine:
    def detect_clashes(
        self,
        columns: List[StructuralColumn],
        beams: List[StructuralBeam],
        rooms: List[LayoutRoom],
        rebars: List[RebarSpec]
    ) -> List[StructuralClash]:

        clashes: List[StructuralClash] = []

        # 1. Check Column vs Door / Opening collision
        for col in columns:
            for room in rooms:
                for door in room.doors:
                    # Check if column is located too close to room doors
                    # Calculate door approximate coordinate
                    door_x = room.x + door.offset if door.wall_side in ['north', 'south'] else (room.x if door.wall_side == 'west' else room.x + room.width)
                    door_y = room.y + door.offset if door.wall_side in ['east', 'west'] else (room.y if door.wall_side == 'south' else room.y + room.length)

                    dist = math_dist((col.x, col.y), (door_x, door_y))
                    if dist < 0.6:  # within 600mm of door frame
                        clashes.append(
                            StructuralClash(
                                id=f"CLASH-{uuid.uuid4().hex[:6]}",
                                clash_type="COLUMN_VS_DOOR",
                                severity="ERROR",
                                location=[col.x, col.y, 1.5],
                                description=f"Column {col.id} obstructs door '{door.id}' in room '{room.name}' (distance: {round(dist, 2)}m)."
                            )
                        )

        # 2. Check Rebar Cover Compliance (< 25mm minimum clear cover)
        for r in rebars:
            if r.cover_mm < 25:
                clashes.append(
                    StructuralClash(
                        id=f"CLASH-{uuid.uuid4().hex[:6]}",
                        clash_type="REBAR_VS_BOUNDARY",
                        severity="WARNING",
                        location=[0.0, 0.0, 0.0],
                        description=f"Bar {r.bar_mark} has clear cover of {r.cover_mm}mm, below standard 25mm code minimum."
                    )
                )

        # 3. Check Structural Beam Headroom Clearance (Beam depth vs Storey height)
        for beam in beams:
            if beam.section_depth > 0.60:  # > 600mm deep beam
                clashes.append(
                    StructuralClash(
                        id=f"CLASH-{uuid.uuid4().hex[:6]}",
                        clash_type="BEAM_VS_HEADROOM",
                        severity="INFO",
                        location=beam.start_point,
                        description=f"Deep beam {beam.id} ({int(beam.section_depth*1000)}mm) requires headroom clearance verification."
                    )
                )

        return clashes

def math_dist(p1: tuple, p2: tuple) -> float:
    return math_sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def math_sqrt(val: float) -> float:
    return val ** 0.5
