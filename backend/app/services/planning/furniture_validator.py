import math
from typing import List, Dict, Any, Tuple
from app.models.pydantic_schemas import LayoutRoom

FURNITURE_REQUIREMENTS = {
    "master_bedroom": [
        {"item": "King Bed", "w": 1.8, "l": 2.0, "clearance": 0.6},
        {"item": "Wardrobe", "w": 1.5, "l": 0.6, "clearance": 0.7},
        {"item": "Side Tables", "w": 1.0, "l": 0.45, "clearance": 0.4}
    ],
    "bedroom": [
        {"item": "Queen Bed", "w": 1.5, "l": 1.9, "clearance": 0.6},
        {"item": "Wardrobe", "w": 1.2, "l": 0.6, "clearance": 0.6},
        {"item": "Study Desk", "w": 1.0, "l": 0.5, "clearance": 0.6}
    ],
    "living": [
        {"item": "3-Seater Sofa", "w": 2.1, "l": 0.9, "clearance": 0.7},
        {"item": "Coffee Table", "w": 1.0, "l": 0.6, "clearance": 0.5},
        {"item": "TV Media Wall", "w": 1.8, "l": 0.4, "clearance": 1.5}
    ],
    "dining": [
        {"item": "6-Seat Dining Table", "w": 1.5, "l": 0.9, "clearance": 0.8}
    ],
    "kitchen": [
        {"item": "L-Countertop Platform", "w": 2.4, "l": 0.6, "clearance": 0.9},
        {"item": "Refrigerator Space", "w": 0.8, "l": 0.7, "clearance": 0.8}
    ],
    "toilet": [
        {"item": "Water Closet (WC)", "w": 0.8, "l": 0.9, "clearance": 0.5},
        {"item": "Shower Stall", "w": 0.85, "l": 0.85, "clearance": 0.5},
        {"item": "Wash Basin", "w": 0.55, "l": 0.45, "clearance": 0.6}
    ]
}

class FurnitureValidator:
    """
    Validates that room geometry can comfortably fit required residential furniture
    with adequate ergonomic circulation aisles.
    """

    @staticmethod
    def evaluate_room_furniture(room: LayoutRoom) -> Tuple[bool, float, List[str]]:
        t = room.type.lower()
        items = None
        for key in FURNITURE_REQUIREMENTS:
            if key in t:
                items = FURNITURE_REQUIREMENTS[key]
                break

        if not items:
            return True, 95.0, ["Standard open room sizing verified."]

        room_area = room.width * room.length
        total_furniture_footprint = 0.0
        issues = []

        # 1. Total footprint ratio check (furniture should not exceed 45% of room area)
        for it in items:
            total_furniture_footprint += (it["w"] * it["l"])

        coverage_ratio = total_furniture_footprint / max(1.0, room_area)
        if coverage_ratio > 0.55:
            issues.append(f"Room area ({room_area:.1f}m²) is too congested for {len(items)} primary furniture elements.")

        # 2. Minimum dimension check against longest furniture piece + clearance
        max_item_span = max(it["w"] + it["clearance"] for it in items)
        min_room_dim = min(room.width, room.length)
        if min_room_dim < (max_item_span * 0.85):
            issues.append(f"Narrowest room dimension ({min_room_dim:.1f}m) restricts ergonomic aisle clearance for furniture ({max_item_span:.1f}m required).")

        is_valid = len(issues) == 0
        score = max(50.0, 100.0 - (len(issues) * 25.0) - (max(0.0, coverage_ratio - 0.4) * 50.0))
        return is_valid, round(score, 1), issues

    @staticmethod
    def validate_layout_furniture(rooms: List[LayoutRoom]) -> Tuple[bool, float, Dict[str, Any]]:
        all_valid = True
        scores = []
        detailed_report = {}

        for r in rooms:
            valid, score, issues = FurnitureValidator.evaluate_room_furniture(r)
            if not valid:
                all_valid = False
            scores.append(score)
            detailed_report[r.name] = {
                "valid": valid,
                "score": score,
                "issues": issues
            }

        avg_score = sum(scores) / max(1, len(scores))
        return all_valid, round(avg_score, 1), detailed_report
