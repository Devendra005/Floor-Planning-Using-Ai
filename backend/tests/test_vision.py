import pytest
import numpy as np
import cv2
from app.vision.preprocessing import preprocess_floorplan_image
from app.vision.edges import detect_edges
from app.vision.walls import detect_walls
from app.vision.rooms import detect_rooms
from app.vision.columns import detect_column_candidates
from app.vision.pipeline import run_floorplan_vision_pipeline

def create_synthetic_floorplan_image():
    """Generates a synthetic 500x500 floor plan image with 4 rooms and thick wall lines."""
    img = np.ones((500, 500, 3), dtype=np.uint8) * 255
    # Draw black outer perimeter walls
    cv2.rectangle(img, (50, 50), (450, 450), (0, 0, 0), 12)
    # Draw internal partition wall
    cv2.line(img, (250, 50), (250, 450), (0, 0, 0), 8)
    cv2.line(img, (50, 250), (450, 250), (0, 0, 0), 8)

    _, encoded = cv2.imencode(".png", img)
    return encoded.tobytes()

def test_preprocessing():
    img_bytes = create_synthetic_floorplan_image()
    from app.vision.preprocessing import decode_image_bytes
    img = decode_image_bytes(img_bytes)
    res = preprocess_floorplan_image(img)
    assert "binary" in res
    assert res["binary"].shape == (500, 500)

def test_edge_detection():
    img_bytes = create_synthetic_floorplan_image()
    from app.vision.preprocessing import decode_image_bytes
    img = decode_image_bytes(img_bytes)
    res = detect_edges(img)
    assert "edges_mask" in res
    assert res["edges_mask"].shape == (500, 500)

def test_wall_detection():
    img_bytes = create_synthetic_floorplan_image()
    from app.vision.preprocessing import decode_image_bytes
    img = decode_image_bytes(img_bytes)
    prep = preprocess_floorplan_image(img)
    walls = detect_walls(prep["binary"])
    assert isinstance(walls, list)
    assert len(walls) > 0

def test_vision_pipeline():
    img_bytes = create_synthetic_floorplan_image()
    res = run_floorplan_vision_pipeline(img_bytes)
    assert res["status"] == "SUCCESS"
    assert "walls" in res
    assert "rooms" in res
    assert "columns" in res
    assert len(res["rooms"]) >= 1
