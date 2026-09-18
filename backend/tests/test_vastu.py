import pytest
from app.services.vastu.vastu_engine import VastuEngine
from app.services.vastu.direction_detection import coordinate_to_direction, get_plot_north_angle
from app.services.vastu.entrance_analysis import analyze_main_entrance
from app.services.vastu.brahmasthan_analysis import analyze_brahmasthan
from app.services.vastu.element_analysis import analyze_panchamahabhuta
from app.models.pydantic_schemas import LayoutRoom, PlotConfig, VastuProfileEnum, OrientationEnum, VastuModeEnum

def test_direction_detection_and_north_angle():
    plot_e = PlotConfig(length=12.0, width=9.0, orientation=OrientationEnum.E)
    plot_s = PlotConfig(length=12.0, width=9.0, orientation=OrientationEnum.S)
    plot_n = PlotConfig(length=12.0, width=9.0, orientation=OrientationEnum.N)
    plot_w = PlotConfig(length=12.0, width=9.0, orientation=OrientationEnum.W)

    assert get_plot_north_angle(plot_n) == 0.0
    assert get_plot_north_angle(plot_s) == 180.0
    assert get_plot_north_angle(plot_e) == 270.0
    assert get_plot_north_angle(plot_w) == 90.0

def test_vastu_engine_evaluation():
    engine = VastuEngine()
    plot = PlotConfig(length=12.0, width=9.0, orientation=OrientationEnum.N)

    # Kitchen in SE zone (High X, Low Y)
    kitchen = LayoutRoom(
        id="r1", type="kitchen", name="Kitchen",
        x=6.0, y=1.0, width=2.5, length=2.5
    )
    # Master bed in SW zone (Low X, Low Y)
    mbed = LayoutRoom(
        id="r2", type="master_bedroom", name="Master Bedroom",
        x=1.0, y=1.0, width=3.5, length=3.5
    )
    # Puja in NE zone (High X, High Y)
    puja = LayoutRoom(
        id="r3", type="puja", name="Puja Room",
        x=6.0, y=8.0, width=2.0, length=2.0
    )

    report = engine.evaluate_layout([kitchen, mbed, puja], plot, VastuProfileEnum.TRADITIONAL_BASIC)
    assert report.total_score >= 70.0
    assert len(report.positive_observations) >= 1

def test_brahmasthan_detection():
    plot = PlotConfig(length=12.0, width=9.0)
    # Toilet placed right in center
    toilet = LayoutRoom(
        id="r-center", type="toilet", name="Central Toilet",
        x=3.5, y=5.0, width=2.0, length=2.0
    )
    res = analyze_brahmasthan([toilet], plot)
    assert res["status"] == "Encumbered"
    assert len(res["heavy_service_rooms"]) == 1
    assert res["is_acceptable"] is True

def test_panchamahabhuta_analysis():
    plot = PlotConfig(length=12.0, width=9.0)
    kitchen = LayoutRoom(id="r1", type="kitchen", name="Kitchen", x=6.0, y=1.0, width=2.5, length=2.5)
    res = analyze_panchamahabhuta([kitchen], plot)
    assert "Fire" in res["element_scores"]
    assert res["overall_element_score"] > 0

def test_vastu_optimizer():
    engine = VastuEngine()
    plot = PlotConfig(length=12.0, width=9.0)
    # Misplaced kitchen in SW and master bed in SE
    kitchen = LayoutRoom(id="r1", type="kitchen", name="Kitchen", x=1.0, y=1.0, width=2.5, length=2.5)
    mbed = LayoutRoom(id="r2", type="master_bedroom", name="Master Bedroom", x=6.0, y=1.0, width=3.5, length=3.5)

    opt_rooms, summary = engine.optimize_layout([kitchen, mbed], plot)
    assert "before_score" in summary
    assert "after_score" in summary
