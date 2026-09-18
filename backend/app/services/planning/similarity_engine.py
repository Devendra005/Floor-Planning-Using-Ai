import math
import numpy as np
import cv2
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import LayoutRoom, PlotConfig
from app.services.planning.adjacency_engine import AdjacencyEngine
from app.services.geometry.constraint_solver import get_zone_from_coordinate

ROOM_TYPE_INTENSITIES = {
    "living": 60,
    "entrance": 80,
    "dining": 100,
    "kitchen": 140,
    "master_bedroom": 180,
    "bedroom": 200,
    "toilet": 230,
    "puja": 120,
    "parking": 40,
    "staircase": 160
}

class SimilarityEngine:
    """
    Computes rigorous geometric and visual similarity between two floor plans.
    Guarantees that distinct architectural strategies and topologies produce low similarity.
    """

    @staticmethod
    def calculate_centroid_similarity(
        rooms_a: List[LayoutRoom],
        rooms_b: List[LayoutRoom],
        plot_w: float,
        plot_l: float
    ) -> float:
        """
        Measures normalized Euclidean centroid displacement between matching rooms.
        Returns 0% (far apart) to 100% (identical positions).
        """
        map_b = {r.name: r for r in rooms_b}
        # Fallback to type mapping if exact names don't match
        type_map_b: Dict[str, List[LayoutRoom]] = {}
        for r in rooms_b:
            type_map_b.setdefault(r.type.lower(), []).append(r)

        matched_distances = []
        for ra in rooms_a:
            target_rb = map_b.get(ra.name)
            if not target_rb:
                candidates = type_map_b.get(ra.type.lower(), [])
                if candidates:
                    target_rb = candidates[0]

            if target_rb:
                cax = (ra.x + ra.width / 2.0) / plot_w
                cay = (ra.y + ra.length / 2.0) / plot_l
                cbx = (target_rb.x + target_rb.width / 2.0) / plot_w
                cby = (target_rb.y + target_rb.length / 2.0) / plot_l
                dist = math.hypot(cax - cbx, cay - cby)
                matched_distances.append(dist)
            else:
                # Room missing in other plan = high difference
                matched_distances.append(0.6)

        if not matched_distances:
            return 50.0

        avg_dist = sum(matched_distances) / len(matched_distances)
        # 0.0 displacement = 100%, >= 0.5 displacement = 0%
        similarity = max(0.0, 100.0 * (1.0 - (avg_dist / 0.5)))
        return round(similarity, 1)

    @staticmethod
    def calculate_adjacency_similarity(
        rooms_a: List[LayoutRoom],
        rooms_b: List[LayoutRoom]
    ) -> float:
        """
        Calculates Jaccard similarity of shared topological wall adjacencies.
        """
        adj_a = AdjacencyEngine.extract_actual_adjacency(rooms_a)
        adj_b = AdjacencyEngine.extract_actual_adjacency(rooms_b)

        edges_a = set()
        for r1, neighbors in adj_a.items():
            for r2 in neighbors:
                if r1 < r2:
                    edges_a.add((r1, r2))

        edges_b = set()
        for r1, neighbors in adj_b.items():
            for r2 in neighbors:
                if r1 < r2:
                    edges_b.add((r1, r2))

        if not edges_a and not edges_b:
            return 100.0

        intersection = len(edges_a.intersection(edges_b))
        union = len(edges_a.union(edges_b))
        if union == 0:
            return 100.0

        jaccard = (intersection / union) * 100.0
        return round(jaccard, 1)

    @staticmethod
    def calculate_zone_similarity(
        rooms_a: List[LayoutRoom],
        rooms_b: List[LayoutRoom],
        plot_w: float,
        plot_l: float
    ) -> float:
        """
        Compares 8-compass quadrant zones of matching rooms.
        """
        map_b = {r.name: r for r in rooms_b}
        matching_zones = 0
        total_compared = 0

        for ra in rooms_a:
            rb = map_b.get(ra.name)
            if rb:
                za = get_zone_from_coordinate(ra.x + ra.width / 2.0, ra.y + ra.length / 2.0, plot_w, plot_l)
                zb = get_zone_from_coordinate(rb.x + rb.width / 2.0, rb.y + rb.length / 2.0, plot_w, plot_l)
                if za == zb:
                    matching_zones += 1
                total_compared += 1

        if total_compared == 0:
            return 50.0

        return round((matching_zones / total_compared) * 100.0, 1)

    @staticmethod
    def rasterize_floor_plan_image(
        rooms: List[LayoutRoom],
        plot_w: float,
        plot_l: float,
        img_size: int = 128
    ) -> np.ndarray:
        """
        Renders floor plan rooms into a normalized 128x128 8-bit image for OpenCV processing.
        """
        canvas = np.zeros((img_size, img_size), dtype=np.uint8)
        scale_x = img_size / max(1.0, plot_w)
        scale_y = img_size / max(1.0, plot_l)

        for r in rooms:
            px1 = int(round(r.x * scale_x))
            py1 = int(round(r.y * scale_y))
            px2 = int(round((r.x + r.width) * scale_x))
            py2 = int(round((r.y + r.length) * scale_y))

            px1 = max(0, min(px1, img_size - 1))
            py1 = max(0, min(py1, img_size - 1))
            px2 = max(0, min(px2, img_size))
            py2 = max(0, min(py2, img_size))

            intensity = ROOM_TYPE_INTENSITIES.get(r.type.lower(), 150)
            cv2.rectangle(canvas, (px1, py1), (px2, py2), int(intensity), -1)
            cv2.rectangle(canvas, (px1, py1), (px2, py2), 255, 1)

        return canvas

    @staticmethod
    def calculate_visual_similarity(
        rooms_a: List[LayoutRoom],
        rooms_b: List[LayoutRoom],
        plot_w: float,
        plot_l: float
    ) -> float:
        """
        Uses OpenCV normalized correlation to measure visual image overlap.
        """
        img_a = SimilarityEngine.rasterize_floor_plan_image(rooms_a, plot_w, plot_l, 128)
        img_b = SimilarityEngine.rasterize_floor_plan_image(rooms_b, plot_w, plot_l, 128)

        # 1. Pixel correlation
        norm_a = cv2.normalize(img_a.astype("float32"), None, 0.0, 1.0, cv2.NORM_MINMAX)
        norm_b = cv2.normalize(img_b.astype("float32"), None, 0.0, 1.0, cv2.NORM_MINMAX)

        diff = np.abs(norm_a - norm_b)
        mean_diff = np.mean(diff)
        visual_sim = max(0.0, 100.0 * (1.0 - mean_diff))
        return round(visual_sim, 1)

    @staticmethod
    def calculate_similarity(
        rooms_a: List[LayoutRoom],
        rooms_b: List[LayoutRoom],
        plot: PlotConfig
    ) -> Dict[str, Any]:
        """
        Calculates comprehensive hybrid similarity (geometric + visual).
        """
        pw = max(1.0, plot.width)
        pl = max(1.0, plot.length)

        centroid_sim = SimilarityEngine.calculate_centroid_similarity(rooms_a, rooms_b, pw, pl)
        adj_sim = SimilarityEngine.calculate_adjacency_similarity(rooms_a, rooms_b)
        zone_sim = SimilarityEngine.calculate_zone_similarity(rooms_a, rooms_b, pw, pl)
        visual_sim = SimilarityEngine.calculate_visual_similarity(rooms_a, rooms_b, pw, pl)

        geom_sim = 0.50 * centroid_sim + 0.30 * adj_sim + 0.20 * zone_sim
        overall = 0.75 * geom_sim + 0.25 * visual_sim

        verdict = "Duplicate / Nearly Identical" if overall > 80.0 else \
                  "Moderately Similar" if overall > 65.0 else \
                  "Genuinely Distinct Layout"

        return {
            "overall_similarity": round(overall, 1),
            "geometric_similarity": round(geom_sim, 1),
            "visual_similarity": round(visual_sim, 1),
            "centroid_similarity": centroid_sim,
            "adjacency_similarity": adj_sim,
            "zone_similarity": zone_sim,
            "verdict": verdict
        }
