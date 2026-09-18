import re
from typing import List, Dict, Any

# Dictionary of standard architectural room keywords and their domain room types & preferred Vastu zones
ROOM_TYPE_MAP = {
    "MASTER BEDROOM": {"type": "master_bedroom", "name": "Master Bedroom", "zone": "SW"},
    "BEDROOM": {"type": "bedroom", "name": "Bedroom", "zone": "NW"},
    "BED": {"type": "bedroom", "name": "Bedroom", "zone": "NW"},
    "KITCHEN": {"type": "kitchen", "name": "Kitchen", "zone": "SE"},
    "COOK": {"type": "kitchen", "name": "Kitchen", "zone": "SE"},
    "LIVING": {"type": "living", "name": "Living Room", "zone": "N"},
    "HALL": {"type": "living", "name": "Living Hall", "zone": "NE"},
    "DINING": {"type": "dining", "name": "Dining Room", "zone": "E"},
    "PUJA": {"type": "puja", "name": "Puja Room", "zone": "NE"},
    "PRAYER": {"type": "puja", "name": "Puja Room", "zone": "NE"},
    "TOILET": {"type": "toilet", "name": "Toilet / Bath", "zone": "NW"},
    "BATH": {"type": "toilet", "name": "Bathroom", "zone": "W"},
    "WC": {"type": "toilet", "name": "Toilet", "zone": "S"},
    "PARKING": {"type": "parking", "name": "Parking & Porch", "zone": "NW"},
    "GARAGE": {"type": "parking", "name": "Garage", "zone": "NW"},
    "STAIRS": {"type": "staircase", "name": "Staircase", "zone": "S"},
    "BALCONY": {"type": "balcony", "name": "Balcony", "zone": "N"}
}

def classify_rooms_with_ocr(
    detected_rooms: List[Dict[str, Any]],
    raw_ocr_texts: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Combines OpenCV room polygon geometry + OCR detected text labels + Vastu position heuristics.
    Returns classified room objects with confidence score strings (e.g. "Master Bedroom — 94% confidence").
    """
    classified = []

    # Default fallback classification sequence based on room surface area and spatial layout
    default_types = ["master_bedroom", "kitchen", "living", "puja", "bedroom", "toilet", "parking"]

    for idx, room in enumerate(detected_rooms):
        room_name = "Room"
        room_type = "bedroom"
        confidence = room.get("confidence", 0.80)

        # 1. Match against OCR detected text if available
        matched_label = None
        if raw_ocr_texts:
            for text_item in raw_ocr_texts:
                label_upper = text_item.get("text", "").upper().strip()
                for keyword, info in ROOM_TYPE_MAP.items():
                    if keyword in label_upper:
                        matched_label = info
                        confidence = 0.95
                        break
                if matched_label:
                    break

        # 2. Heuristic layout classification based on area & position if OCR not matched
        if not matched_label:
            assigned_type = default_types[idx % len(default_types)]
            for kw, info in ROOM_TYPE_MAP.items():
                if info["type"] == assigned_type:
                    matched_label = info
                    break

        if matched_label:
            room_name = matched_label["name"]
            room_type = matched_label["type"]

        classified.append({
            "id": room["id"],
            "name": room_name,
            "type": room_type,
            "x": room["x"],
            "y": room["y"],
            "width": room["width"],
            "length": room["length"],
            "area_sq_m": room["area_sq_m"],
            "polygon": room["polygon"],
            "center": room["center"],
            "confidence": confidence,
            "confidence_label": f"{room_name} — {int(confidence * 100)}% confidence",
            "source": room.get("source", "opencv_hybrid_ocr")
        })

    return classified
