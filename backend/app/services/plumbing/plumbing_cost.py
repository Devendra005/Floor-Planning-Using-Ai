from typing import List, Dict, Any
from app.models.pydantic_schemas import PipeSegment, PlumbingFixture, PlumbingCostEstimate

DEFAULT_PLUMBING_RATES = {
    "water_pipe_per_meter": 280.0,    # CPVC Water Supply pipe (₹/m)
    "waste_pipe_per_meter": 350.0,    # SWR Wastewater pipe (₹/m)
    "soil_pipe_per_meter": 450.0,     # Soil/Drainage PVC pipe (₹/m)
    "main_pipe_per_meter": 550.0,     # Heavy Main Sewer Line (₹/m)
    "fittings_per_fixture": 220.0,    # Traps, elbows, tees, valves per fixture
    "installation_labor_percent": 0.30 # 30% labor & fitting installation
}

def estimate_plumbing_cost(
    pipe_routes: List[PipeSegment],
    fixtures: List[PlumbingFixture],
    custom_rates: Dict[str, float] = None
) -> PlumbingCostEstimate:
    """
    Computes preliminary itemized plumbing cost estimate (Materials + Fittings + Labor).
    """
    rates = dict(DEFAULT_PLUMBING_RATES)
    if custom_rates:
        rates.update(custom_rates)

    water_len = sum(p.length_m for p in pipe_routes if p.system_type == "WATER_SUPPLY")
    waste_len = sum(p.length_m for p in pipe_routes if p.system_type == "WASTEWATER")
    soil_len = sum(p.length_m for p in pipe_routes if p.system_type == "SOIL_DRAIN")
    main_len = sum(p.length_m for p in pipe_routes if p.system_type == "MAIN_CONNECTION")

    water_cost = water_len * rates["water_pipe_per_meter"]
    waste_cost = waste_len * rates["waste_pipe_per_meter"]
    soil_cost = (soil_len + main_len) * rates["soil_pipe_per_meter"]

    fittings_cost = len(fixtures) * rates["fittings_per_fixture"]
    material_subtotal = water_cost + waste_cost + soil_cost + fittings_cost
    labor_cost = material_subtotal * rates["installation_labor_percent"]

    total_cost = round(material_subtotal + labor_cost, 2)

    return PlumbingCostEstimate(
        water_pipe_cost=round(water_cost, 2),
        waste_pipe_cost=round(waste_cost, 2),
        soil_pipe_cost=round(soil_cost, 2),
        fittings_cost=round(fittings_cost, 2),
        labor_cost=round(labor_cost, 2),
        total_estimated_cost=total_cost,
        currency="INR"
    )
