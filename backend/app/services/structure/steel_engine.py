import math
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import (
    RebarSpec, BarBendingScheduleItem, QuantityTakeoffSummary,
    StructuralColumn, StructuralBeam, StructuralSlab, StructuralFooting
)

def calculate_rebar_weight(diameter_mm: int, total_length_m: float) -> float:
    """Calculates steel rebar weight using standard unit weight formula: W = (D^2 / 162.2) * L"""
    unit_weight_per_m = (diameter_mm ** 2) / 162.2
    weight_kg = unit_weight_per_m * total_length_m
    return round(weight_kg, 2)

class SteelEngine:
    def generate_steel_detailing(
        self,
        columns: List[StructuralColumn],
        beams: List[StructuralBeam],
        slabs: List[StructuralSlab],
        footings: List[StructuralFooting]
    ) -> Tuple[List[RebarSpec], List[BarBendingScheduleItem], QuantityTakeoffSummary]:

        rebars: List[RebarSpec] = []
        bar_schedule: List[BarBendingScheduleItem] = []

        # 1. Column Reinforcement (C1-L1: 4x 16mm vertical + C1-T1: 8mm ties @ 150mm)
        for col in columns:
            col_height = col.height if col.height > 1.0 else 3.0
            fl = col.floor or 0
            base_z = fl * 3.0
            top_z = (fl + 1) * 3.0
            
            long_len = col_height + 0.6  # includes starter lap length
            long_tot_len = long_len * 4
            long_wt = calculate_rebar_weight(16, long_tot_len)

            rebars.append(
                RebarSpec(
                    element_id=col.id,
                    member_id=col.id,
                    member_type="COLUMN",
                    floor=fl,
                    bar_mark=f"{col.id}-L1",
                    bar_type="LONGITUDINAL",
                    diameter_mm=16,
                    count=4,
                    spacing_mm=150,
                    cover_mm=40,
                    grade="Fe500",
                    shape_code="STRAIGHT",
                    zone="VERTICAL",
                    position="VERTICAL",
                    start_point=[col.x, col.y, base_z],
                    end_point=[col.x, col.y, top_z],
                    individual_length_m=round(long_len, 2),
                    total_length_m=round(long_tot_len, 2),
                    weight_kg=long_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

            # Lateral Ties (C1-T1)
            num_ties = max(4, int(col_height / 0.15) + 1)
            tie_perimeter = 2 * (col.width - 0.08 + col.depth - 0.08) + 0.24
            tie_tot_len = tie_perimeter * num_ties
            tie_wt = calculate_rebar_weight(8, tie_tot_len)

            rebars.append(
                RebarSpec(
                    element_id=col.id,
                    member_id=col.id,
                    member_type="COLUMN",
                    floor=fl,
                    bar_mark=f"{col.id}-T1",
                    bar_type="STIRRUP",
                    diameter_mm=8,
                    count=num_ties,
                    spacing_mm=150,
                    cover_mm=40,
                    grade="Fe500",
                    shape_code="STIRRUP_RECT",
                    zone="TIES",
                    position="PERPENDICULAR",
                    start_point=[col.x, col.y, base_z + 0.1],
                    end_point=[col.x, col.y, top_z - 0.1],
                    individual_length_m=round(tie_perimeter, 2),
                    total_length_m=round(tie_tot_len, 2),
                    weight_kg=tie_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

        # 2. Beam Reinforcement (B1-T1: Top 2-16mm, B1-B1: Bottom 3-16mm, B1-S1: Stirrups @ 150mm)
        for beam in beams:
            b_span = beam.span if beam.span > 0.5 else 4.2
            b_width = beam.section_width if beam.section_width > 0.1 else 0.23
            b_depth = beam.section_depth if beam.section_depth > 0.2 else 0.45
            fl = beam.floor or 0
            beam_z = beam.start_point[2] if len(beam.start_point) > 2 else (fl + 1) * 3.0

            # Top Longitudinal Bars (B1-T1)
            top_len = b_span + 0.5
            top_tot_len = top_len * 2
            top_wt = calculate_rebar_weight(16, top_tot_len)

            rebars.append(
                RebarSpec(
                    element_id=beam.id,
                    member_id=beam.id,
                    member_type="BEAM",
                    floor=fl,
                    bar_mark=f"{beam.id}-T1",
                    bar_type="TOP",
                    diameter_mm=16,
                    count=2,
                    spacing_mm=150,
                    cover_mm=30,
                    grade="Fe500",
                    shape_code="L_HOOK",
                    zone="TOP_SUPPORT",
                    position="TOP_INSIDE",
                    start_point=[beam.start_point[0], beam.start_point[1], beam_z],
                    end_point=[beam.end_point[0], beam.end_point[1], beam_z],
                    individual_length_m=round(top_len, 2),
                    total_length_m=round(top_tot_len, 2),
                    weight_kg=top_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

            # Bottom Longitudinal Bars (B1-B1)
            bot_len = b_span + 0.5
            bot_tot_len = bot_len * 3
            bot_wt = calculate_rebar_weight(16, bot_tot_len)

            rebars.append(
                RebarSpec(
                    element_id=beam.id,
                    member_id=beam.id,
                    member_type="BEAM",
                    floor=fl,
                    bar_mark=f"{beam.id}-B1",
                    bar_type="BOTTOM",
                    diameter_mm=16,
                    count=3,
                    spacing_mm=150,
                    cover_mm=30,
                    grade="Fe500",
                    shape_code="L_HOOK",
                    zone="BOTTOM_MIDSPAN",
                    position="BOTTOM_INSIDE",
                    start_point=[beam.start_point[0], beam.start_point[1], beam_z - b_depth + 0.05],
                    end_point=[beam.end_point[0], beam.end_point[1], beam_z - b_depth + 0.05],
                    individual_length_m=round(bot_len, 2),
                    total_length_m=round(bot_tot_len, 2),
                    weight_kg=bot_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

            # Closed Stirrups (B1-S1)
            num_bm_ties = max(4, int(b_span / 0.15) + 1)
            bm_tie_perim = 2 * (b_width - 0.06 + b_depth - 0.06) + 0.2
            bm_tie_tot = bm_tie_perim * num_bm_ties
            bm_tie_wt = calculate_rebar_weight(8, bm_tie_tot)

            rebars.append(
                RebarSpec(
                    element_id=beam.id,
                    member_id=beam.id,
                    member_type="BEAM",
                    floor=fl,
                    bar_mark=f"{beam.id}-S1",
                    bar_type="STIRRUP",
                    diameter_mm=8,
                    count=num_bm_ties,
                    spacing_mm=150,
                    cover_mm=30,
                    grade="Fe500",
                    shape_code="STIRRUP_RECT",
                    zone="FULL_SPAN",
                    position="PERPENDICULAR",
                    start_point=[beam.start_point[0], beam.start_point[1], beam_z],
                    end_point=[beam.end_point[0], beam.end_point[1], beam_z],
                    individual_length_m=round(bm_tie_perim, 2),
                    total_length_m=round(bm_tie_tot, 2),
                    weight_kg=bm_tie_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

        # 3. Slab Reinforcement (S1-M1: Main 10mm @ 150mm, S1-D1: Distribution 8mm @ 200mm)
        for slab in slabs:
            fl = slab.floor or 0
            slab_z = (fl + 1) * 3.0

            if slab.boundary and len(slab.boundary) >= 2:
                xs = [pt[0] for pt in slab.boundary]
                ys = [pt[1] for pt in slab.boundary]
                s_wid = max(xs) - min(xs)
                s_len = max(ys) - min(ys)
                s_x = min(xs)
                s_y = min(ys)
            else:
                s_wid = 4.0
                s_len = 4.0
                s_x, s_y = 0.0, 0.0

            s_wid = s_wid if s_wid > 0.5 else 4.0
            s_len = s_len if s_len > 0.5 else 4.0

            num_main = max(2, int(s_wid / 0.15) + 1)
            main_tot = s_len * num_main
            main_wt = calculate_rebar_weight(10, main_tot)

            rebars.append(
                RebarSpec(
                    element_id=slab.id,
                    member_id=slab.id,
                    member_type="SLAB",
                    floor=fl,
                    bar_mark=f"{slab.id}-M1",
                    bar_type="MAIN_MESH",
                    diameter_mm=10,
                    count=num_main,
                    spacing_mm=150,
                    cover_mm=25,
                    grade="Fe500",
                    shape_code="STRAIGHT",
                    zone="BOTTOM_MAT",
                    position="LONGITUDINAL",
                    start_point=[s_x, s_y, slab_z],
                    end_point=[s_x + s_wid, s_y + s_len, slab_z],
                    individual_length_m=round(s_len, 2),
                    total_length_m=round(main_tot, 2),
                    weight_kg=main_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

            num_dist = max(2, int(s_len / 0.20) + 1)
            dist_tot = s_wid * num_dist
            dist_wt = calculate_rebar_weight(8, dist_tot)

            rebars.append(
                RebarSpec(
                    element_id=slab.id,
                    member_id=slab.id,
                    member_type="SLAB",
                    floor=fl,
                    bar_mark=f"{slab.id}-D1",
                    bar_type="DISTRIBUTION",
                    diameter_mm=8,
                    count=num_dist,
                    spacing_mm=200,
                    cover_mm=25,
                    grade="Fe500",
                    shape_code="STRAIGHT",
                    zone="BOTTOM_MAT",
                    position="TRANSVERSE",
                    start_point=[s_x, s_y, slab_z + 0.01],
                    end_point=[s_x + s_wid, s_y + s_len, slab_z + 0.01],
                    individual_length_m=round(s_wid, 2),
                    total_length_m=round(dist_tot, 2),
                    weight_kg=dist_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

        # 4. Footing Reinforcement (F1-B1 & F1-B2: Mesh 12mm @ 150mm)
        for ft in footings:
            ft_w = ft.width if ft.width > 0.5 else 1.5
            ft_l = ft.length if ft.length > 0.5 else 1.5
            num_ft_bars = max(2, int(ft_w / 0.15) + 1)
            ft_tot = (ft_l + 0.4) * num_ft_bars * 2 # both directions
            ft_wt = calculate_rebar_weight(12, ft_tot)

            rebars.append(
                RebarSpec(
                    element_id=ft.id,
                    member_id=ft.id,
                    member_type="FOOTING",
                    floor=0,
                    bar_mark=f"{ft.id}-B1",
                    bar_type="MAIN_MESH",
                    diameter_mm=12,
                    count=num_ft_bars * 2,
                    spacing_mm=150,
                    cover_mm=50,
                    grade="Fe500",
                    shape_code="U_HOOK",
                    zone="BOTTOM_MAT",
                    position="BOTH_DIRECTIONS",
                    start_point=[ft.x, ft.y, -1.5],
                    end_point=[ft.x + ft_w, ft.y + ft_l, -1.5],
                    individual_length_m=round(ft_l + 0.4, 2),
                    total_length_m=round(ft_tot, 2),
                    weight_kg=ft_wt,
                    source="structured_reinforcement_detailing_engine"
                )
            )

        # 5. Build Bar Bending Schedule (BBS) items
        col_wt, bm_wt, sl_wt, ft_wt = 0.0, 0.0, 0.0, 0.0

        for r in rebars:
            bbs_item = BarBendingScheduleItem(
                bar_mark=r.bar_mark,
                member_id=r.member_id,
                member_type=r.member_type,
                floor=r.floor,
                bar_type=r.bar_type,
                diameter_mm=r.diameter_mm,
                grade=r.grade,
                quantity=r.count,
                spacing_mm=r.spacing_mm or 150,
                individual_length_m=r.individual_length_m,
                total_length_m=r.total_length_m,
                shape_code=r.shape_code,
                weight_kg=r.weight_kg
            )
            bar_schedule.append(bbs_item)

            if r.member_type == "COLUMN":
                col_wt += r.weight_kg
            elif r.member_type == "BEAM":
                bm_wt += r.weight_kg
            elif r.member_type == "SLAB":
                sl_wt += r.weight_kg
            elif r.member_type == "FOOTING":
                ft_wt += r.weight_kg

        tot_wt = col_wt + bm_wt + sl_wt + ft_wt
        summary = QuantityTakeoffSummary(
            column_weight_kg=round(col_wt, 2),
            beam_weight_kg=round(bm_wt, 2),
            slab_weight_kg=round(sl_wt, 2),
            footing_weight_kg=round(ft_wt, 2),
            stair_weight_kg=0.0,
            total_weight_kg=round(tot_wt, 2),
            total_weight_tonnes=round(tot_wt / 1000.0, 3)
        )

        return rebars, bar_schedule, summary
