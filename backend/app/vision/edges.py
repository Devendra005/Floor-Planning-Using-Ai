import cv2
import numpy as np
from typing import Dict, Any
from app.vision.preprocessing import encode_image_to_base64

def detect_edges(
    gray_or_binary: np.ndarray,
    threshold1: int = 50,
    threshold2: int = 150,
    aperture_size: int = 3
) -> Dict[str, Any]:
    """
    OpenCV Canny Edge Detection.
    Returns edge map matrix and base64 visualization string.
    """
    aperture = aperture_size if aperture_size in [3, 5, 7] else 3
    edges = cv2.Canny(gray_or_binary, threshold1, threshold2, apertureSize=aperture)

    return {
        "edges_mask": edges,
        "base64_edges": encode_image_to_base64(edges)
    }
