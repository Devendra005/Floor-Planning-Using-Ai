import numpy as np
from typing import Dict, Any, Tuple

def estimate_or_calibrate_scale(
    img_width_px: int,
    img_height_px: int,
    known_point1_px: Tuple[float, float] = None,
    known_point2_px: Tuple[float, float] = None,
    real_distance_val: float = None,
    unit: str = "meter"
) -> Dict[str, Any]:
    """
    Computes pixels-per-meter / pixels-per-foot scale factor.
    Supports manual 2-point reference calibration and default image dimension scaling heuristics.
    """
    if known_point1_px and known_point2_px and real_distance_val and real_distance_val > 0:
        dx = known_point2_px[0] - known_point1_px[0]
        dy = known_point2_px[1] - known_point1_px[1]
        dist_px = np.hypot(dx, dy)

        dist_m = real_distance_val if unit == "meter" else real_distance_val * 0.3048
        px_per_meter = dist_px / dist_m
        px_to_m_scale = 1.0 / px_per_meter

        return {
            "scale_detected": True,
            "calibration_method": "user_2point_manual",
            "pixels_per_meter": round(px_per_meter, 2),
            "px_to_m_scale": round(px_to_m_scale, 6),
            "confidence": 1.0,
            "unit": unit
        }

    # Default heuristic: Assume average residential drawing fits within 15m x 15m
    avg_dim_px = (img_width_px + img_height_px) / 2.0
    px_to_m_scale = 12.0 / avg_dim_px  # ~12 meters reference span
    px_per_meter = 1.0 / px_to_m_scale

    return {
        "scale_detected": False,
        "calibration_method": "heuristic_aspect_estimation",
        "pixels_per_meter": round(px_per_meter, 2),
        "px_to_m_scale": round(px_to_m_scale, 6),
        "confidence": 0.65,
        "unit": "meter",
        "message": "Scale estimated heuristically — manual calibration recommended."
    }
