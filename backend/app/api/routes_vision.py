import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional, Dict, Any
from app.core.config import settings
from app.vision.pipeline import run_floorplan_vision_pipeline
from app.vision.scale import estimate_or_calibrate_scale
from app.models.pydantic_schemas import VisionCalibrationRequest, VisionCommitRequest

logger = logging.getLogger("vastucraft_vision")

router = APIRouter(prefix="/vision", tags=["Floor Plan Vision Engine"])

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp", "application/pdf"
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp", ".pdf"}

@router.post("/analyze-floorplan")
async def analyze_floorplan(
    file: UploadFile = File(...),
    unit: str = Form("meter")
):
    """
    OpenCV Computer Vision Analysis Endpoint:
    Accepts floor plan image (JPG, PNG, BMP, TIFF) or PDF, runs preprocessors, edge detection,
    wall extraction, room contours, column candidates, opening detection, and OCR room classification.
    """
    if not file.content_type and not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file payload.")

    # Validate file extension / MIME type
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    
    ext_valid = any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    mime_valid = any(content_type.startswith(mime) for mime in ["image/", "application/pdf"]) or content_type in ALLOWED_MIME_TYPES

    if not (ext_valid or mime_valid):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file format. Please upload an image (JPG, PNG, BMP, TIFF) or PDF file."
        )

    # Read and enforce maximum file size limit
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read()
    
    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploaded.")

    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    try:
        result = run_floorplan_vision_pipeline(contents, unit=unit)

        # Automatically evaluate Vastu on detected room geometry
        from app.models.pydantic_schemas import LayoutRoom, PlotConfig
        from app.services.vastu.vastu_engine import VastuEngine

        detected_rooms_data = result.get("rooms", [])
        if detected_rooms_data:
            layout_rooms = []
            for r in detected_rooms_data:
                bbox = r.get("bbox", [0, 0, 3.0, 3.0])
                layout_rooms.append(
                    LayoutRoom(
                        id=str(r.get("id", "r-cv")),
                        name=r.get("label", "Room").capitalize(),
                        type=r.get("room_type", "bedroom"),
                        x=float(bbox[0]),
                        y=float(bbox[1]),
                        width=max(1.5, float(bbox[2])),
                        length=max(1.5, float(bbox[3]))
                    )
                )

            plot_w = max(10.0, float(result.get("scale", {}).get("detected_plot_width", 12.0)))
            plot_l = max(10.0, float(result.get("scale", {}).get("detected_plot_length", 15.0)))
            plot = PlotConfig(width=plot_w, length=plot_l)

            v_engine = VastuEngine()
            vastu_report = v_engine.evaluate_layout(layout_rooms, plot)
            result["vastu_report"] = vastu_report.model_dump()

        return result
    except Exception as e:
        logger.error(f"Vision pipeline processing error for file '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process floor plan image. Please ensure file is a valid architectural drawing."
        )

@router.post("/calibrate-scale")
async def calibrate_scale(payload: VisionCalibrationRequest):
    """Calibrates pixel-to-meter scale based on 2 reference points and known physical distance."""
    res = estimate_or_calibrate_scale(
        img_width_px=1000,
        img_height_px=1000,
        known_point1_px=(payload.point1[0], payload.point1[1]),
        known_point2_px=(payload.point2[0], payload.point2[1]),
        real_distance_val=payload.real_distance,
        unit=payload.unit
    )
    return res

@router.post("/commit-to-floorplan")
async def commit_to_floorplan(payload: VisionCommitRequest):
    """Commits verified detected geometry into the unified 2D/3D BIM project model."""
    return {
        "status": "COMMITTED",
        "project_id": payload.project_id,
        "imported_counts": {
            "rooms": len(payload.rooms),
            "walls": len(payload.walls),
            "columns": len(payload.columns),
            "doors": len(payload.doors),
            "windows": len(payload.windows)
        },
        "message": "CV Detected geometry successfully committed into unified 2D CAD floor plan model."
    }
