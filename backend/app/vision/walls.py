import cv2
import numpy as np
import math
from typing import List, Dict, Any

def detect_walls(
    binary_or_edges: np.ndarray,
    min_line_length: int = 40,
    max_line_gap: int = 15,
    hough_threshold: int = 50,
    px_to_m_scale: float = 0.02
) -> List[Dict[str, Any]]:
    """
    Detect architectural wall segments using OpenCV HoughLinesP and collinear segment merging.
    Estimates thickness and wall type (external vs internal).
    """
    h, w = binary_or_edges.shape[:2]

    # Run Probabilistic Hough Line Transform
    lines = cv2.HoughLinesP(
        binary_or_edges,
        rho=1,
        theta=np.pi / 180,
        threshold=hough_threshold,
        minLineLength=min_line_length,
        maxLineGap=max_line_gap
    )

    if lines is None:
        return []

    raw_segments = []
    for idx, l in enumerate(lines):
        pts = l.flatten()
        if len(pts) < 4:
            continue
        x1, y1, x2, y2 = int(pts[0]), int(pts[1]), int(pts[2]), int(pts[3])
        length = math.hypot(x2 - x1, y2 - y1)
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1)) % 180

        # Snap to horizontal/vertical if close
        if abs(angle) < 8 or abs(angle - 180) < 8:
            y2 = y1
            angle = 0
        elif abs(angle - 90) < 8:
            x2 = x1
            angle = 90

        raw_segments.append({
            "id": f"WALL-RAW-{idx+1}",
            "x1": float(x1),
            "y1": float(y1),
            "x2": float(x2),
            "y2": float(y2),
            "length_px": float(length),
            "angle": float(angle)
        })

    # Merge collinear and nearby parallel wall segments
    merged_walls = _merge_collinear_walls(raw_segments, px_to_m_scale, img_width=w, img_height=h)
    return merged_walls

def _merge_collinear_walls(segments: List[Dict[str, Any]], scale: float, img_width: int, img_height: int) -> List[Dict[str, Any]]:
    """Groups collinear segments and builds clean wall objects with confidence."""
    walls = []
    visited = set()

    for i, seg1 in enumerate(segments):
        if i in visited:
            continue
        visited.add(i)

        group = [seg1]
        for j, seg2 in enumerate(segments):
            if j in visited:
                continue
            # Check if angles align (ortho alignment) and distance is small
            if abs(seg1["angle"] - seg2["angle"]) < 5:
                dist = _point_line_dist(seg2["x1"], seg2["y1"], seg1["x1"], seg1["y1"], seg1["x2"], seg1["y2"])
                if dist < 12.0:
                    group.append(seg2)
                    visited.add(j)

        # Compute bounding line for group
        xs = [s["x1"] for s in group] + [s["x2"] for s in group]
        ys = [s["y1"] for s in group] + [s["y2"] for s in group]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)

        is_horiz = abs(seg1["angle"]) < 45 or abs(seg1["angle"] - 180) < 45
        if is_horiz:
            start_pt = [min_x * scale, min_y * scale]
            end_pt = [max_x * scale, min_y * scale]
            length_m = (max_x - min_x) * scale
        else:
            start_pt = [min_x * scale, min_y * scale]
            end_pt = [min_x * scale, max_y * scale]
            length_m = (max_y - min_y) * scale

        if length_m < 0.6:  # Filter noise shorter than 0.6m
            continue

        # Check if boundary wall
        margin_px = 30
        is_external = (min_x < margin_px or max_x > img_width - margin_px or min_y < margin_px or max_y > img_height - margin_px)
        thickness_m = 0.23 if is_external else 0.115
        confidence = 0.94 if is_external else 0.88

        walls.append({
            "id": f"WALL-{len(walls)+1:02d}",
            "type": "wall",
            "wall_type": "EXTERNAL" if is_external else "INTERNAL",
            "start_point": start_pt,
            "end_point": end_pt,
            "thickness": thickness_m,
            "confidence": confidence,
            "source": "opencv_hough"
        })

    return walls

def _point_line_dist(px, py, x1, y1, x2, y2):
    line_len = math.hypot(x2 - x1, y2 - y1)
    if line_len == 0:
        return math.hypot(px - x1, py - y1)
    return abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / line_len
