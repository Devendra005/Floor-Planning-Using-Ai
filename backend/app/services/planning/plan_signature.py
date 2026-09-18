import hashlib
import json
from typing import List, Dict, Any
from app.models.pydantic_schemas import LayoutRoom, PlotConfig
from app.services.geometry.constraint_solver import get_zone_from_coordinate
from app.services.planning.adjacency_engine import AdjacencyEngine

class PlanSignature:
    """
    Computes a canonical structural fingerprint for a residential floor plan.
    Used for duplicate detection, exclusion memory, and similarity scoring.
    """

    @staticmethod
    def extract_signature(
        rooms: List[LayoutRoom],
        plot: PlotConfig,
        layout_strategy: str = "custom"
    ) -> Dict[str, Any]:
        plot_w = max(1.0, plot.width)
        plot_l = max(1.0, plot.length)

        # 1. Normalized centroids sorted by room name/type
        room_signatures = []
        for r in sorted(rooms, key=lambda rm: rm.name):
            cx = (r.x + r.width / 2.0) / plot_w
            cy = (r.y + r.length / 2.0) / plot_l
            area_ratio = (r.width * r.length) / (plot_w * plot_l)
            zone = get_zone_from_coordinate(r.x + r.width / 2.0, r.y + r.length / 2.0, plot_w, plot_l)

            room_signatures.append({
                "name": r.name,
                "type": r.type,
                "cx": round(cx, 3),
                "cy": round(cy, 3),
                "area_pct": round(area_ratio * 100.0, 2),
                "zone": zone.value if hasattr(zone, 'value') else str(zone)
            })

        # 2. Extract topological adjacency edges
        actual_adj = AdjacencyEngine.extract_actual_adjacency(rooms)

        # 3. Identify strategic anchor zones
        entrance_zone = "South"
        kitchen_zone = "Unknown"
        master_bed_zone = "Unknown"
        for r in rooms:
            t = r.type.lower()
            zone = get_zone_from_coordinate(r.x + r.width / 2.0, r.y + r.length / 2.0, plot_w, plot_l)
            zone_val = zone.value if hasattr(zone, 'value') else str(zone)
            if t in ["living", "entrance"]:
                entrance_zone = zone_val
            elif "kitchen" in t:
                kitchen_zone = zone_val
            elif "master_bedroom" in t:
                master_bed_zone = zone_val

        sig_data = {
            "strategy": layout_strategy,
            "entrance_zone": entrance_zone,
            "kitchen_zone": kitchen_zone,
            "master_bed_zone": master_bed_zone,
            "rooms": room_signatures,
            "adjacency": actual_adj
        }

        # Deterministic compact hash
        sig_str = json.dumps(sig_data, sort_keys=True)
        hash_digest = hashlib.sha256(sig_str.encode('utf-8')).hexdigest()[:16]
        sig_data["hash"] = hash_digest

        return sig_data

    @staticmethod
    def compute_signature_hash(
        rooms: List[LayoutRoom],
        plot: PlotConfig,
        layout_strategy: str = "custom"
    ) -> str:
        sig = PlanSignature.extract_signature(rooms, plot, layout_strategy)
        return sig["hash"]
