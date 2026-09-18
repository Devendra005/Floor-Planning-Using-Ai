import uuid
import math
from typing import List, Tuple, Set
from app.models.pydantic_schemas import (
    LayoutRoom, PlotConfig, PreliminaryStructure, StructuralColumn, StructuralBeam,
    StructuralSlab, StructuralFooting, RebarSpec, StructuralGridData, GridLine,
    VerificationStatusEnum
)
from app.services.structure.steel_engine import SteelEngine
from app.services.structure.clash_engine import ClashDetectionEngine

class StructuralEngine:
    def __init__(self):
        self.steel_engine = SteelEngine()
        self.clash_engine = ClashDetectionEngine()

    def generate_preliminary_structure(
        self, rooms: List[LayoutRoom], plot: PlotConfig
    ) -> PreliminaryStructure:
        columns: List[StructuralColumn] = []
        beams: List[StructuralBeam] = []
        slabs: List[StructuralSlab] = []
        footings: List[StructuralFooting] = []

        if not rooms:
            return PreliminaryStructure()

        # 1. Generate Structural Grid Lines (X: 1, 2, 3... Y: A, B, C...)
        x_coords = sorted(list(set(round(r.x, 2) for r in rooms) | set(round(r.x + r.width, 2) for r in rooms)))
        y_coords = sorted(list(set(round(r.y, 2) for r in rooms) | set(round(r.y + r.length, 2) for r in rooms)))

        grid_lines_x = [GridLine(label=f"{i+1}", position=xc, axis="X") for i, xc in enumerate(x_coords)]
        grid_lines_y = [GridLine(label=chr(65 + i), position=yc, axis="Y") for i, yc in enumerate(y_coords)]
        grid = StructuralGridData(grid_lines_x=grid_lines_x, grid_lines_y=grid_lines_y)

        # 2. Collect room corner points for candidate columns
        corner_points: Set[Tuple[float, float]] = set()
        for room in rooms:
            x, y, w, l = room.x, room.y, room.width, room.length
            corners = [
                (round(x, 2), round(y, 2)),
                (round(x + w, 2), round(y, 2)),
                (round(x + w, 2), round(y + l, 2)),
                (round(x, 2), round(y + l, 2))
            ]
            for c in corners:
                corner_points.add(c)

        # Filter points and create columns
        # Determine total floors count from rooms or plot config (up to 10 floors)
        floors_in_rooms = [r.floor_level for r in rooms if r.floor_level is not None]
        num_floors = max(1, min(10, max(getattr(plot, 'floors_count', 3), max(floors_in_rooms, default=0) + 1)))

        # Filter corner points across rooms
        for idx, (cx, cy) in enumerate(sorted(list(corner_points))):
            col_base_id = f"COL-{idx+1:02d}"
            
            # Ground footing
            footings.append(
                StructuralFooting(
                    id=f"FTG-{idx+1:02d}",
                    column_id=f"{col_base_id}-GF",
                    x=cx,
                    y=cy,
                    width=1.2,
                    length=1.2,
                    depth=0.5,
                    footing_type="ISOLATED_PAD",
                    floor=0,
                    source="conceptual_default",
                    verification_status=VerificationStatusEnum.AI_GENERATED
                )
            )

            # Generate columns for every floor level
            for fl in range(num_floors):
                columns.append(
                    StructuralColumn(
                        id=f"{col_base_id}-F{fl}",
                        x=cx,
                        y=cy,
                        width=0.3,
                        depth=0.3,
                        height=3.0,
                        floor=fl,
                        structural_type="RC_COLUMN",
                        source="conceptual_default",
                        verification_status=VerificationStatusEnum.AI_GENERATED
                    )
                )

        # 3. Connect columns with Beams per floor level
        beam_counter = 1
        for fl in range(num_floors):
            fl_rooms = [r for r in rooms if (r.floor_level or 0) == fl]
            target_rooms = fl_rooms if fl_rooms else rooms # fallback layout for upper stories if identical framing

            processed_edges: Set[Tuple[Tuple[float, float], Tuple[float, float]]] = set()

            for room in target_rooms:
                x, y, w, l = room.x, room.y, room.width, room.length
                pts = [
                    (round(x, 2), round(y, 2)),
                    (round(x + w, 2), round(y, 2)),
                    (round(x + w, 2), round(y + l, 2)),
                    (round(x, 2), round(y + l, 2))
                ]

                edges = [
                    (pts[0], pts[1]),
                    (pts[1], pts[2]),
                    (pts[2], pts[3]),
                    (pts[3], pts[0])
                ]

                for p1, p2 in edges:
                    edge_key = tuple(sorted([p1, p2]))
                    if edge_key not in processed_edges:
                        processed_edges.add(edge_key)
                        beam_id = f"BM-{beam_counter:02d}-F{fl}"
                        beam_counter += 1
                        b_span = math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)

                        beams.append(
                            StructuralBeam(
                                id=beam_id,
                                start_point=[p1[0], p1[1], (fl + 1) * 3.0],
                                end_point=[p2[0], p2[1], (fl + 1) * 3.0],
                                section_width=0.23,
                                section_depth=0.45,
                                span=round(b_span, 2),
                                beam_type="PRIMARY",
                                floor=fl,
                                structural_type="RC_BEAM",
                                source="conceptual_default",
                                verification_status=VerificationStatusEnum.AI_GENERATED
                            )
                        )

            # 4. Create Slabs per floor level
            for idx, r in enumerate(target_rooms):
                slabs.append(
                    StructuralSlab(
                        id=f"SLAB-{idx+1:02d}-F{fl}",
                        boundary=[
                            [r.x, r.y],
                            [r.x + r.width, r.y],
                            [r.x + r.width, r.y + r.length],
                            [r.x, r.y + r.length]
                        ],
                        thickness=0.15,
                        slab_type="TWO_WAY" if r.width / max(0.1, r.length) < 2.0 else "ONE_WAY",
                        span_direction="X",
                        floor=fl,
                        source="conceptual_default",
                        verification_status=VerificationStatusEnum.AI_GENERATED
                    )
                )

        # 5. Generate Rebar Detailing, Bar Bending Schedule, and Quantity Takeoff
        rebars, bar_schedule, quantity_summary = self.steel_engine.generate_steel_detailing(
            columns, beams, slabs, footings
        )

        # 6. Run Automated Clash Detection
        clashes = self.clash_engine.detect_clashes(columns, beams, rooms, rebars)

        return PreliminaryStructure(
            grid=grid,
            columns=columns,
            beams=beams,
            slabs=slabs,
            footings=footings,
            rebars=rebars,
            clashes=clashes,
            quantity_summary=quantity_summary,
            bar_schedule=bar_schedule
        )
