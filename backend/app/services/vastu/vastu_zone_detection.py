from typing import Dict, List, Any, Tuple
from app.models.pydantic_schemas import OrientationEnum, LayoutRoom, PlotConfig
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle

def get_3x3_zone(cx: float, cy: float, plot_w: float, plot_l: float) -> OrientationEnum:
    """Calculates zone in standard 3x3 grid (unrotated)."""
    grid_x = min(2, max(0, int((cx / max(0.1, plot_w)) * 3)))
    grid_y = min(2, max(0, int((cy / max(0.1, plot_l)) * 3)))

    mapping = {
        (2, 0): OrientationEnum.NW,
        (2, 1): OrientationEnum.N,
        (2, 2): OrientationEnum.NE,
        (1, 0): OrientationEnum.W,
        (1, 1): OrientationEnum.CENTER,
        (1, 2): OrientationEnum.E,
        (0, 0): OrientationEnum.SW,
        (0, 1): OrientationEnum.S,
        (0, 2): OrientationEnum.SE,
    }
    return mapping.get((grid_y, grid_x), OrientationEnum.CENTER)

def get_room_zone_overlap(
    room: LayoutRoom, plot: PlotConfig, grid_divisions: int = 3
) -> Dict[str, float]:
    """
    Computes percentage area overlap of room polygon across all Vastu zones.
    Discretizes room into a fine 10x10 sub-grid and calculates zone for each sample point.
    """
    plot_w, plot_l = plot.width, plot.length
    north_angle = get_plot_north_angle(plot)

    rx, ry = room.x, room.y
    rw, rl = room.width, room.length

    if rw <= 0 or rl <= 0:
        return {OrientationEnum.CENTER.value: 100.0}

    samples_x = 10
    samples_y = 10
    total_samples = samples_x * samples_y

    zone_counts: Dict[str, int] = {}

    dx = rw / samples_x
    dy = rl / samples_y

    for ix in range(samples_x):
        for iy in range(samples_y):
            cx = rx + (ix + 0.5) * dx
            cy = ry + (iy + 0.5) * dy

            z = coordinate_to_direction(cx, cy, plot_w, plot_l, north_angle)
            z_val = z.value
            zone_counts[z_val] = zone_counts.get(z_val, 0) + 1

    overlap_pct: Dict[str, float] = {}
    for z_val, cnt in zone_counts.items():
        overlap_pct[z_val] = round((cnt / total_samples) * 100.0, 1)

    return overlap_pct

def get_primary_zone_for_room(
    room: LayoutRoom, plot: PlotConfig
) -> Tuple[OrientationEnum, Dict[str, float]]:
    """Returns primary Vastu zone (highest overlap) and full overlap percentage dictionary."""
    overlaps = get_room_zone_overlap(room, plot)
    primary_str = max(overlaps.items(), key=lambda x: x[1])[0]
    return OrientationEnum(primary_str), overlaps

def get_9x9_mandala_analysis(cx: float, cy: float, plot_w: float, plot_l: float) -> Dict[str, Any]:
    """Computes 81-pad Vastu Purusha Mandala pad details."""
    col = min(8, max(0, int((cx / max(0.1, plot_w)) * 9)))
    row = min(8, max(0, int((cy / max(0.1, plot_l)) * 9)))

    pad_index = row * 9 + col + 1
    is_brahmasthan = (2 <= row <= 6) and (2 <= col <= 6)

    # Name classical deity pad according to position
    if is_brahmasthan:
        deity = "Brahma (Central Core)"
    elif row >= 7 and col >= 7:
        deity = "Isha / Shikhi (NE Supreme Light)"
    elif row >= 7 and col <= 1:
        deity = "Vayu / Roga (NW Air & Motion)"
    elif row <= 1 and col >= 7:
        deity = "Agni / Parjanya (SE Fire Element)"
    elif row <= 1 and col <= 1:
        deity = "Pitri / Nairrutya (SW Ancestors & Stability)"
    elif row >= 7:
        deity = "Kubera / Bhallata (North Prosperity)"
    elif col >= 7:
        deity = "Aditya / Surya (East Vitality)"
    elif row <= 1:
        deity = "Yama (South Discipline)"
    else:
        deity = "Varuna (West Waters)"

    return {
        "row": row,
        "col": col,
        "pad_index": pad_index,
        "deity": deity,
        "is_brahmasthan": is_brahmasthan
    }
