import cv2
import numpy as np
from typing import List, Dict, Any

def detect_rooms(
    binary_img: np.ndarray,
    px_to_m_scale: float = 0.02,
    min_area_sq_m: float = 2.0
) -> List[Dict[str, Any]]:
    """
    OpenCV Contour & Connected Component Enclosed Space Detection.
    Finds room boundaries, center points, polygon coordinates, and surface area.
    """
    h, w = binary_img.shape[:2]

    # Invert binary so rooms/open regions become white connected blobs
    inv_binary = cv2.bitwise_not(binary_img)

    # Find external and internal contours
    contours, hierarchy = cv2.findContours(inv_binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    if not contours or hierarchy is None:
        return []

    rooms = []
    min_area_px = min_area_sq_m / (px_to_m_scale ** 2)
    max_area_px = (w * h) * 0.85

    for idx, cnt in enumerate(contours):
        area_px = cv2.contourArea(cnt)
        if area_px < min_area_px or area_px > max_area_px:
            continue

        # Approximate contour polygon
        epsilon = 0.02 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)

        # Bounding rectangle
        rx, ry, rw, rh = cv2.boundingRect(approx)

        # Convert to real world meters
        x_m = rx * px_to_m_scale
        y_m = ry * px_to_m_scale
        w_m = rw * px_to_m_scale
        l_m = rh * px_to_m_scale
        area_sq_m = round(area_px * (px_to_m_scale ** 2), 2)

        # Compute rectangularity and aspect ratio metrics
        rect_area = rw * rh
        rectangularity = min(1.0, area_px / float(rect_area)) if rect_area > 0 else 0
        aspect_ratio = rw / float(rh) if rh > 0 else 1.0

        # Confidence based on geometric regularity
        confidence = round(0.70 + 0.25 * rectangularity, 2)

        polygon_pts = [[float(pt[0][0] * px_to_m_scale), float(pt[0][1] * px_to_m_scale)] for pt in approx]

        rooms.append({
            "id": f"ROOM-CV-{len(rooms)+1:02d}",
            "polygon": polygon_pts,
            "center": [round(x_m + w_m / 2, 2), round(y_m + l_m / 2, 2)],
            "x": round(x_m, 2),
            "y": round(y_m, 2),
            "width": round(w_m, 2),
            "length": round(l_m, 2),
            "area_sq_m": area_sq_m,
            "rectangularity": round(rectangularity, 2),
            "aspect_ratio": round(aspect_ratio, 2),
            "confidence": confidence,
            "source": "opencv_connected_contours"
        })

    return rooms
