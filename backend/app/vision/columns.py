import cv2
import numpy as np
from typing import List, Dict, Any

def detect_column_candidates(
    binary_img: np.ndarray,
    walls: List[Dict[str, Any]],
    px_to_m_scale: float = 0.02
) -> List[Dict[str, Any]]:
    """
    Detect structural column candidates using contour square feature matching and wall intersection nodes.
    """
    h, w = binary_img.shape[:2]
    contours, _ = cv2.findContours(binary_img, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    columns = []
    min_col_size_m = 0.2
    max_col_size_m = 0.6
    min_col_px = min_col_size_m / px_to_m_scale
    max_col_px = max_col_size_m / px_to_m_scale

    for idx, cnt in enumerate(contours):
        area = cv2.contourArea(cnt)
        if area < (min_col_px ** 2) or area > (max_col_px ** 2):
            continue

        rx, ry, rw, rh = cv2.boundingRect(cnt)
        aspect = rw / float(rh) if rh > 0 else 0

        # Structural columns are square/rectangular (aspect ratio 0.7 to 1.4)
        if 0.7 <= aspect <= 1.4:
            cx_m = (rx + rw / 2) * px_to_m_scale
            cy_m = (ry + rh / 2) * px_to_m_scale
            w_m = round(rw * px_to_m_scale, 2)
            d_m = round(rh * px_to_m_scale, 2)

            columns.append({
                "id": f"COL-CV-{len(columns)+1:02d}",
                "center": [round(cx_m, 2), round(cy_m, 2)],
                "x": round(cx_m, 2),
                "y": round(cy_m, 2),
                "width": max(0.23, w_m),
                "depth": max(0.23, d_m),
                "confidence": 0.85,
                "source": "opencv_square_contour"
            })

    # If no contours match, infer candidates at wall intersection junctions
    if not columns and walls:
        columns = _infer_columns_from_wall_intersections(walls)

    return columns

def _infer_columns_from_wall_intersections(walls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    nodes = []
    for w in walls:
        nodes.append(w["start_point"])
        nodes.append(w["end_point"])

    # Deduplicate close nodes
    unique_nodes = []
    for pt in nodes:
        if not any(abs(pt[0] - u[0]) < 0.3 and abs(pt[1] - u[1]) < 0.3 for u in unique_nodes):
            unique_nodes.append(pt)

    cols = []
    for idx, pt in enumerate(unique_nodes):
        cols.append({
            "id": f"COL-INF-{idx+1:02d}",
            "center": [round(pt[0], 2), round(pt[1], 2)],
            "x": round(pt[0], 2),
            "y": round(pt[1], 2),
            "width": 0.3,
            "depth": 0.3,
            "confidence": 0.75,
            "source": "wall_intersection_node"
        })
    return cols
