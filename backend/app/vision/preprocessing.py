import cv2
import numpy as np
import base64
from typing import Dict, Any, Tuple

def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes into OpenCV BGR numpy array."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes. Unsupported format or corrupted file.")
    return img

def encode_image_to_base64(img: np.ndarray, ext: str = ".png") -> str:
    """Encode OpenCV image array to base64 string for API response."""
    _, buffer = cv2.imencode(ext, img)
    return base64.b64encode(buffer).decode("utf-8")

def preprocess_floorplan_image(
    img: np.ndarray,
    target_max_dim: int = 1600,
    blur_kernel: int = 5,
    use_clahe: bool = True,
    adaptive_block_size: int = 11,
    adaptive_c: int = 2
) -> Dict[str, Any]:
    """
    OpenCV Preprocessing Pipeline:
    Resize -> Grayscale -> Contrast (CLAHE) -> Blur -> Thresholding (Otsu & Adaptive) -> Morphological Cleaning.
    Returns preprocessed binary image and base64 visualization strings.
    """
    h, w = img.shape[:2]

    # 1. Resize if image is too large for fast CV processing
    scale = 1.0
    if max(h, w) > target_max_dim:
        scale = target_max_dim / float(max(h, w))
        img_resized = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        img_resized = img.copy()

    # 2. Grayscale conversion
    if len(img_resized.shape) == 3:
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    else:
        gray = img_resized.copy()

    # 3. Contrast enhancement (CLAHE)
    if use_clahe:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray_enhanced = clahe.apply(gray)
    else:
        gray_enhanced = gray.copy()

    # 4. Noise removal using Bilateral Filter or Gaussian Blur
    k_size = blur_kernel if blur_kernel % 2 != 0 else blur_kernel + 1
    blurred = cv2.GaussianBlur(gray_enhanced, (k_size, k_size), 0)

    # 5. Otsu and Adaptive Binarization
    _, otsu_thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    block_size = adaptive_block_size if adaptive_block_size % 2 != 0 else adaptive_block_size + 1
    adaptive_thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block_size, adaptive_c
    )

    # Combine Otsu and Adaptive for wall line isolation
    combined_binary = cv2.bitwise_or(otsu_thresh, adaptive_thresh)

    # 6. Morphological opening/closing to remove small noise artifacts
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    morph_cleaned = cv2.morphologyEx(combined_binary, cv2.MORPH_CLOSE, kernel)
    morph_cleaned = cv2.morphologyEx(morph_cleaned, cv2.MORPH_OPEN, kernel)

    return {
        "original_resized": img_resized,
        "gray": gray,
        "binary": morph_cleaned,
        "scale": scale,
        "width": img_resized.shape[1],
        "height": img_resized.shape[0],
        "base64_original": encode_image_to_base64(img_resized),
        "base64_processed": encode_image_to_base64(morph_cleaned)
    }
