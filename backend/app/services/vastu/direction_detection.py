import math
from typing import Tuple
from app.models.pydantic_schemas import OrientationEnum, PlotConfig

DIRECTION_ANGLES = {
    OrientationEnum.N: 0.0,
    OrientationEnum.NE: 45.0,
    OrientationEnum.E: 90.0,
    OrientationEnum.SE: 135.0,
    OrientationEnum.S: 180.0,
    OrientationEnum.SW: 225.0,
    OrientationEnum.W: 270.0,
    OrientationEnum.NW: 315.0,
}

def get_plot_north_angle(plot: PlotConfig) -> float:
    """
    Returns effective North angle in degrees (0..360).
    0° = North is along +Y axis (Top).
    If north_angle is explicitly provided, it takes precedence.
    Otherwise, orientation/road_direction determines default angle.
    """
    if getattr(plot, "north_angle", None) is not None and plot.north_angle != 0.0:
        return plot.north_angle % 360.0

    orientation = getattr(plot, "orientation", OrientationEnum.E)
    if isinstance(orientation, str):
        orientation = OrientationEnum(orientation)

    # If plot faces East, North is 90 degrees counter-clockwise (+Y is North when plot orientation=N)
    default_angle_map = {
        OrientationEnum.N: 0.0,
        OrientationEnum.NE: 315.0,
        OrientationEnum.E: 270.0,
        OrientationEnum.SE: 225.0,
        OrientationEnum.S: 180.0,
        OrientationEnum.SW: 135.0,
        OrientationEnum.W: 90.0,
        OrientationEnum.NW: 45.0,
    }
    return default_angle_map.get(orientation, 0.0)

def coordinate_to_direction(
    cx: float, cy: float, plot_w: float, plot_l: float, north_angle: float = 0.0
) -> OrientationEnum:
    """
    Translates coordinate (cx, cy) relative to plot center into cardinal Vastu direction,
    accounting for custom North angle rotation.
    """
    center_x = plot_w / 2.0
    center_y = plot_l / 2.0

    # Vector relative to plot center
    dx = cx - center_x
    dy = cy - center_y

    dist = math.hypot(dx, dy)
    # If coordinate is within 12% radius of plot center, classify as CENTER
    max_radius = math.hypot(plot_w, plot_l) / 2.0
    if dist < max_radius * 0.15:
        return OrientationEnum.CENTER

    # Standard Cartesian angle in degrees (0° = +X / East, 90° = +Y / North)
    raw_angle = math.degrees(math.atan2(dy, dx))
    
    # Convert to compass angle (0° = North = +Y, 90° = East = +X, 180° = South = -Y, 270° = West = -X)
    compass_angle = (90.0 - raw_angle) % 360.0

    # Adjust for North orientation angle
    adjusted_angle = (compass_angle - north_angle) % 360.0

    # Map angle to 8 cardinal sectors (45 degrees per sector)
    # N: [337.5 - 360] U [0 - 22.5]
    # NE: [22.5 - 67.5]
    # E: [67.5 - 112.5]
    # SE: [112.5 - 157.5]
    # S: [157.5 - 202.5]
    # SW: [202.5 - 247.5]
    # W: [247.5 - 292.5]
    # NW: [292.5 - 337.5]
    if adjusted_angle >= 337.5 or adjusted_angle < 22.5:
        return OrientationEnum.N
    elif 22.5 <= adjusted_angle < 67.5:
        return OrientationEnum.NE
    elif 67.5 <= adjusted_angle < 112.5:
        return OrientationEnum.E
    elif 112.5 <= adjusted_angle < 157.5:
        return OrientationEnum.SE
    elif 157.5 <= adjusted_angle < 202.5:
        return OrientationEnum.S
    elif 202.5 <= adjusted_angle < 247.5:
        return OrientationEnum.SW
    elif 247.5 <= adjusted_angle < 292.5:
        return OrientationEnum.W
    else:
        return OrientationEnum.NW
