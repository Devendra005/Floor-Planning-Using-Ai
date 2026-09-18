import numpy as np
from typing import Dict, Any
from app.vision.preprocessing import preprocess_floorplan_image
from app.vision.edges import detect_edges
from app.vision.walls import detect_walls
from app.vision.rooms import detect_rooms
from app.vision.columns import detect_column_candidates
from app.vision.doors_windows import detect_doors_and_windows
from app.vision.ocr_engine import classify_rooms_with_ocr
from app.vision.scale import estimate_or_calibrate_scale
from app.vision.geometry import clean_and_snap_geometry

def run_floorplan_vision_pipeline(
    image_bytes: bytes,
    known_p1: tuple = None,
    known_p2: tuple = None,
    real_dist: float = None,
    unit: str = "meter"
) -> Dict[str, Any]:
    """
    Master Floor Plan Vision Engine Pipeline:
    Upload -> Preprocessing -> Edge Map -> Walls -> Rooms -> Columns -> Openings -> OCR Classify -> Scale -> Clean -> Vector Output.
    """
    from app.vision.preprocessing import decode_image_bytes

    # 1. Decode raw file bytes into OpenCV image
    img = decode_image_bytes(image_bytes)

    # 2. Preprocess (grayscale, CLAHE, Gaussian blur, Otsu/adaptive threshold)
    prep = preprocess_floorplan_image(img)
    binary = prep["binary"]

    # 3. Edge Map Detection
    edge_res = detect_edges(prep["gray"])

    # 4. Scale Analysis
    scale_res = estimate_or_calibrate_scale(
        prep["width"], prep["height"], known_p1, known_p2, real_dist, unit
    )
    px_to_m = scale_res["px_to_m_scale"]

    # 5. Wall Segment Extraction
    walls = detect_walls(binary, px_to_m_scale=px_to_m)

    # 6. Room Enclosed Contour Boundary Extraction
    raw_rooms = detect_rooms(binary, px_to_m_scale=px_to_m)

    # 7. Structural Column Candidate Extraction
    columns = detect_column_candidates(binary, walls, px_to_m_scale=px_to_m)

    # 8. Door & Window Openings Detection
    openings = detect_doors_and_windows(binary, walls, px_to_m_scale=px_to_m)

    # 9. Hybrid OCR Room Classification
    classified_rooms = classify_rooms_with_ocr(raw_rooms)

    # 10. Geometry Cleaning and Point Snapping
    cleaned = clean_and_snap_geometry(walls, classified_rooms, columns)

    return {
        "status": "SUCCESS",
        "processing_metadata": {
            "width_px": prep["width"],
            "height_px": prep["height"],
            "walls_detected": len(cleaned["walls"]),
            "rooms_detected": len(cleaned["rooms"]),
            "columns_detected": len(cleaned["columns"]),
            "doors_detected": len(openings["doors"]),
            "windows_detected": len(openings["windows"]),
            "scale": scale_res
        },
        "base64_original": prep["base64_original"],
        "base64_processed": prep["base64_processed"],
        "base64_edges": edge_res["base64_edges"],
        "walls": cleaned["walls"],
        "rooms": cleaned["rooms"],
        "columns": cleaned["columns"],
        "doors": openings["doors"],
        "windows": openings["windows"],
        "scale": scale_res
    }
