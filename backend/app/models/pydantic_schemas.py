from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum

class UnitEnum(str, Enum):
    FEET = "feet"
    METER = "meter"
    INCH = "inch"
    CENTIMETER = "centimeter"

class OrientationEnum(str, Enum):
    N = "N"
    NE = "NE"
    E = "E"
    SE = "SE"
    S = "S"
    SW = "SW"
    W = "W"
    NW = "NW"
    CENTER = "CENTER"

class VastuProfileEnum(str, Enum):
    TRADITIONAL_BASIC = "traditional-basic"
    TRADITIONAL_DETAILED = "traditional-detailed"
    CUSTOM_EXPERT = "custom-expert"
    USER_DEFINED = "user-defined"

class VastuModeEnum(str, Enum):
    STRICT = "STRICT"
    BALANCED = "BALANCED"
    FLEXIBLE = "FLEXIBLE"

class Setbacks(BaseModel):
    front: float = 1.0  # in meters
    rear: float = 1.0
    left: float = 1.0
    right: float = 1.0

class PlotConfig(BaseModel):
    length: float = 12.192  # 40 ft in meters default
    width: float = 9.144    # 30 ft in meters default
    unit: UnitEnum = UnitEnum.FEET
    orientation: OrientationEnum = OrientationEnum.E
    road_direction: OrientationEnum = OrientationEnum.E
    north_angle: float = 0.0
    vastu_mode: VastuModeEnum = VastuModeEnum.BALANCED
    setbacks: Setbacks = Field(default_factory=Setbacks)
    is_corner_plot: bool = False
    floors_count: int = 3  # 1 to 10 floors

class RoomRequirement(BaseModel):
    id: str
    name: str
    room_type: str  # e.g., bedroom, kitchen, living, puja, toilet, parking, dining
    min_width: float = 2.4  # meters
    min_length: float = 2.4  # meters
    preferred_width: float = 3.0  # meters
    preferred_length: float = 3.6  # meters
    priority: int = 1  # 1 (high) to 5 (low)
    quantity: int = 1
    privacy_level: str = "medium"  # low, medium, high
    preferred_direction: Optional[OrientationEnum] = None
    avoid_direction: Optional[OrientationEnum] = None
    adjacent_to: List[str] = Field(default_factory=list)  # list of room_types

class OptimizationWeights(BaseModel):
    vastu: float = 0.30
    user_requirements: float = 0.20
    space_utilization: float = 0.15
    circulation: float = 0.10
    adjacency: float = 0.10
    structural_grid: float = 0.10
    daylight: float = 0.05

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    project_type: str = "Residential Single Family"
    location: Optional[str] = ""
    plot: PlotConfig
    requirements: List[RoomRequirement]
    vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)

class DoorPlacement(BaseModel):
    id: str
    wall_side: str  # north, south, east, west
    offset: float   # offset along wall in meters
    width: float = 0.9  # meters
    connects_to: Optional[str] = None  # target room_id or 'exterior' / 'corridor'

class WindowPlacement(BaseModel):
    id: str
    wall_side: str
    offset: float
    width: float = 1.2

class LayoutRoom(BaseModel):
    id: str
    type: str
    name: str
    x: float  # bottom-left x in meters
    y: float  # bottom-left y in meters
    width: float  # east-west dimension in meters
    length: float  # north-south dimension in meters
    rotation: float = 0.0
    floor_level: int = 0
    zone: Optional[str] = None
    doors: List[DoorPlacement] = Field(default_factory=list)
    windows: List[WindowPlacement] = Field(default_factory=list)
    vastu_score: float = 100.0

class VerificationStatusEnum(str, Enum):
    AI_GENERATED = "AI_GENERATED"
    USER_EDITED = "USER_EDITED"
    PRELIMINARY = "PRELIMINARY"
    ENGINEER_REVIEWED = "ENGINEER_REVIEWED"
    ENGINEER_VERIFIED = "ENGINEER_VERIFIED"

class GridLine(BaseModel):
    label: str  # e.g., 'A', 'B', '1', '2'
    position: float  # position along axis in meters
    axis: str  # 'X' or 'Y'

class StructuralGridData(BaseModel):
    grid_lines_x: List[GridLine] = Field(default_factory=list)
    grid_lines_y: List[GridLine] = Field(default_factory=list)

class StructuralColumn(BaseModel):
    id: str
    x: float
    y: float
    width: float = 0.3  # 300mm
    depth: float = 0.3  # 300mm
    height: float = 3.0 # 3m storey height
    floor: int = 0
    structural_type: str = "RC_COLUMN"
    source: str = "conceptual_default"
    verification_status: VerificationStatusEnum = VerificationStatusEnum.AI_GENERATED

class StructuralBeam(BaseModel):
    id: str
    start_point: List[float]  # [x, y, z]
    end_point: List[float]    # [x, y, z]
    section_width: float = 0.23  # 230mm
    section_depth: float = 0.45  # 450mm
    span: float = 4.0
    beam_type: str = "PRIMARY"  # PRIMARY, SECONDARY, EDGE, LINTEL, ROOF
    floor: int = 0
    structural_type: str = "RC_BEAM"
    source: str = "conceptual_default"
    verification_status: VerificationStatusEnum = VerificationStatusEnum.AI_GENERATED

class StructuralSlab(BaseModel):
    id: str
    boundary: List[List[float]]  # List of [x, y] vertices
    thickness: float = 0.15  # 150mm
    slab_type: str = "TWO_WAY"  # ONE_WAY, TWO_WAY, FLAT
    span_direction: str = "X"
    floor: int = 0
    source: str = "conceptual_default"
    verification_status: VerificationStatusEnum = VerificationStatusEnum.AI_GENERATED

class StructuralFooting(BaseModel):
    id: str
    column_id: str
    x: float
    y: float
    width: float = 1.2
    length: float = 1.2
    depth: float = 0.5
    footing_type: str = "ISOLATED_PAD"  # ISOLATED_PAD, COMBINED, STRIP, RAFT
    floor: int = 0
    source: str = "conceptual_default"
    verification_status: VerificationStatusEnum = VerificationStatusEnum.AI_GENERATED

class RebarSpec(BaseModel):
    element_id: str
    member_id: str = ""
    member_type: str  # COLUMN, BEAM, SLAB, FOOTING, STAIR
    floor: int = 0
    bar_mark: str     # e.g., C1-L1, B1-T1, S1-M1, F1-B1
    bar_type: str     # TOP, BOTTOM, STIRRUP, LONGITUDINAL, MAIN_MESH, DISTRIBUTION
    diameter_mm: int  # 8, 10, 12, 16, 20, 25, 32
    count: int
    spacing_mm: Optional[int] = 150
    cover_mm: int = 40
    grade: str = "Fe500"
    shape_code: str = "STRAIGHT"  # STRAIGHT, L_HOOK, U_HOOK, STIRRUP_RECT, BENT_UP
    zone: str = "MIDSPAN"         # TOP, BOTTOM, STIRRUP, LEFT_SUPPORT, MIDSPAN, RIGHT_SUPPORT
    position: str = "INTERNAL"     # TOP_INSIDE, BOTTOM_INSIDE, STIRRUP_PERP, VERTICAL, HORIZONTAL
    start_point: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0])
    end_point: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0])
    individual_length_m: float = 3.5
    total_length_m: float = 14.0
    weight_kg: float = 22.1
    source: str = "structured_reinforcement_detailing_engine"
    verification_status: str = "PRELIMINARY_PLANNING_REQUIRES_QUALIFIED_STRUCTURAL_ENGINEER_REVIEW"

class StructuralClash(BaseModel):
    id: str
    clash_type: str  # REBAR_VS_REBAR, REBAR_VS_BOUNDARY, COLUMN_VS_OPENING, BEAM_VS_DOOR, BEAM_VS_STAIR
    severity: str    # CRITICAL, ERROR, WARNING, INFO
    location: List[float]  # [x, y, z]
    description: str

class BarBendingScheduleItem(BaseModel):
    bar_mark: str
    member_id: str
    member_type: str
    floor: int
    bar_type: str
    diameter_mm: int
    grade: str
    quantity: int
    spacing_mm: int
    individual_length_m: float
    total_length_m: float
    shape_code: str
    weight_kg: float

class QuantityTakeoffSummary(BaseModel):
    column_weight_kg: float = 0.0
    beam_weight_kg: float = 0.0
    slab_weight_kg: float = 0.0
    footing_weight_kg: float = 0.0
    stair_weight_kg: float = 0.0
    total_weight_kg: float = 0.0
    total_weight_tonnes: float = 0.0

class StructuralRevision(BaseModel):
    version: str
    timestamp: str
    notes: str
    changes_summary: str

class EngineerReview(BaseModel):
    reviewer_name: str
    status: VerificationStatusEnum
    comments: str
    signed_timestamp: str

class PreliminaryStructure(BaseModel):
    grid: StructuralGridData = Field(default_factory=StructuralGridData)
    columns: List[StructuralColumn] = Field(default_factory=list)
    beams: List[StructuralBeam] = Field(default_factory=list)
    slabs: List[StructuralSlab] = Field(default_factory=list)
    footings: List[StructuralFooting] = Field(default_factory=list)
    rebars: List[RebarSpec] = Field(default_factory=list)
    clashes: List[StructuralClash] = Field(default_factory=list)
    quantity_summary: QuantityTakeoffSummary = Field(default_factory=QuantityTakeoffSummary)
    bar_schedule: List[BarBendingScheduleItem] = Field(default_factory=list)
    revisions: List[StructuralRevision] = Field(default_factory=list)
    engineer_review: Optional[EngineerReview] = None
    disclaimer: str = (
        "PRELIMINARY ENGINEERING & STEEL VISUALIZATION ONLY: Structural grid, column/beam "
        "placement, reinforcement detailing, quantity takeoff, and bar bending schedules are "
        "preliminary planning outputs and MUST NOT be used for construction without explicit "
        "verification and certification by a licensed structural engineer."
    )

class RuleEvaluationDetail(BaseModel):
    rule_id: str
    category: str
    subject: str
    result: str  # preferred, acceptable, violation
    score_delta: float
    severity: str
    message: str
    recommendation: Optional[str] = None
    explanation: Optional[str] = None

class VastuEvaluationReport(BaseModel):
    total_score: float
    profile_used: Union[VastuProfileEnum, str]
    rating_label: Optional[str] = "Good"
    category_scores: Dict[str, float]
    positive_observations: List[str]
    warnings: List[str]
    recommendations: List[str]
    rule_details: List[RuleEvaluationDetail] = Field(default_factory=list)
    entrance_analysis: Optional[Dict[str, Any]] = None
    brahmasthan_analysis: Optional[Dict[str, Any]] = None
    panchamahabhuta_analysis: Optional[Dict[str, Any]] = None
    room_analyses: Optional[List[Dict[str, Any]]] = None
    optimization_summary: Optional[Dict[str, Any]] = None
    disclaimer: str = (
        "Evaluated under Traditional Vastu principles for educational and planning preference."
    )

class PlumbingFixture(BaseModel):
    fixture_id: str
    room_id: str
    room_name: str
    fixture_type: str  # kitchen_sink, dishwasher, wash_basin, wc, shower, floor_drain, washing_machine, utility_sink
    x: float
    y: float
    z: float = 0.0
    wall_side: str = "south"
    connection_type: str = "WATER_INLET"  # WATER_INLET, WASTEWATER, SOIL_DRAIN

class PipeSegment(BaseModel):
    id: str
    system_type: str  # WATER_SUPPLY, WASTEWATER, SOIL_DRAIN, MAIN_CONNECTION
    path_points: List[List[float]]  # list of [x, y, z]
    diameter_mm: int = 25
    length_m: float
    bends_count: int = 0
    junctions_count: int = 0
    connects_from: str
    connects_to: str

class PlumbingShaft(BaseModel):
    id: str = "VP-01"
    x: float
    y: float
    width: float = 0.6
    length: float = 0.6
    floor_level: int = 0
    is_vertical_stack: bool = True
    wet_rooms_served: List[str] = Field(default_factory=list)

class PlumbingCostEstimate(BaseModel):
    water_pipe_cost: float = 0.0
    waste_pipe_cost: float = 0.0
    soil_pipe_cost: float = 0.0
    fittings_cost: float = 0.0
    labor_cost: float = 0.0
    total_estimated_cost: float = 0.0
    currency: str = "INR"

class PlumbingValidationIssue(BaseModel):
    id: str
    severity: str  # CRITICAL, WARNING, INFO
    title: str
    description: str
    location: Optional[List[float]] = None

class PlumbingReportData(BaseModel):
    total_score: float = 85.0
    rating_label: str = "Very Good Plumbing Efficiency"
    pipe_efficiency_score: float = 85.0
    bend_efficiency_score: float = 80.0
    shaft_efficiency_score: float = 90.0
    cost_efficiency_score: float = 85.0
    maintenance_score: float = 80.0
    total_pipe_length_m: float = 0.0
    water_pipe_length_m: float = 0.0
    waste_pipe_length_m: float = 0.0
    soil_pipe_length_m: float = 0.0
    total_bends: int = 0
    total_junctions: int = 0
    fixtures: List[PlumbingFixture] = Field(default_factory=list)
    shafts: List[PlumbingShaft] = Field(default_factory=list)
    pipe_routes: List[PipeSegment] = Field(default_factory=list)
    cost_estimate: PlumbingCostEstimate = Field(default_factory=PlumbingCostEstimate)
    validation_issues: List[PlumbingValidationIssue] = Field(default_factory=list)
    positive_observations: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "PRELIMINARY PLUMBING PLANNING ONLY: Pipe routes, fixture placements, shaft locations, "
        "and cost estimates are conceptual planning outputs and MUST NOT be used for construction "
        "without explicit verification and certification by a licensed plumbing engineer."
    )

class FloorPlanCandidate(BaseModel):
    id: str
    name: str
    fitness_score: float
    vastu_score: float
    plumbing_score: float = 85.0
    requirement_score: float
    space_utilization_score: float
    circulation_score: float
    adjacency_score: float
    structural_score: float
    daylight_score: float
    rooms: List[LayoutRoom]
    vastu_report: VastuEvaluationReport
    structure: PreliminaryStructure = Field(default_factory=PreliminaryStructure)
    plumbing: PlumbingReportData = Field(default_factory=PlumbingReportData)
    # Layout Diversity & Multi-Plan Generation fields
    layout_strategy: Optional[str] = "Central Corridor Layout"
    diversity_score: float = 90.0
    similarity_to_previous: float = 0.0
    plan_signature: Optional[str] = None
    furniture_valid: bool = True
    furniture_fit_score: float = 85.0
    adjacency_graph: Optional[Dict[str, List[str]]] = None
    entrance_zone: Optional[str] = None

class LayoutStrategyInfo(BaseModel):
    id: str
    name: str
    description: str
    spatial_features: List[str]
    ideal_plot_aspect: str

class PlanSimilarityDetail(BaseModel):
    overall_similarity: float
    geometric_similarity: float
    visual_similarity: float
    centroid_similarity: float
    adjacency_similarity: float
    zone_similarity: float
    verdict: str

class DifferentPlanRequest(BaseModel):
    plot: PlotConfig
    requirements: List[RoomRequirement]
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)
    vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    vastu_strictness: str = "BALANCED"
    exclude_signatures: List[str] = Field(default_factory=list)
    max_similarity_threshold: float = 70.0
    target_strategy: Optional[str] = None


class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    project_type: str = "Residential Single Family"
    location: Optional[str] = ""
    plot: PlotConfig
    requirements: List[RoomRequirement]
    vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)
    plans: List[FloorPlanCandidate] = Field(default_factory=list)
    created_at: str
    updated_at: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    project_type: str = "Residential Single Family"
    location: Optional[str] = ""
    plot: PlotConfig
    requirements: List[RoomRequirement]
    vastu_profile: VastuProfileEnum = VastuProfileEnum.TRADITIONAL_BASIC
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)

ProjectResponse = Project

# Vision Pipeline Schemas
class VisionCalibrationRequest(BaseModel):
    point1: List[float]  # [x, y]
    point2: List[float]  # [x, y]
    real_distance: float
    unit: str = "meter"

class VisionCommitRequest(BaseModel):
    project_id: str
    rooms: List[Dict[str, Any]]
    walls: List[Dict[str, Any]]
    columns: List[Dict[str, Any]]
    doors: List[Dict[str, Any]]
    windows: List[Dict[str, Any]]
    scale: Dict[str, Any]
