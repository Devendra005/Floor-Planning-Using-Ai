export type UnitType = 'feet' | 'meter' | 'inch' | 'centimeter' | 'millimeter';
export type OrientationType = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';
export type VastuProfileType = 'traditional-basic' | 'traditional-detailed' | 'custom-expert' | 'user-defined';
export type VastuModeType = 'STRICT' | 'BALANCED' | 'FLEXIBLE';
export type VerificationStatusType = 'AI_GENERATED' | 'USER_EDITED' | 'PRELIMINARY' | 'ENGINEER_REVIEWED' | 'ENGINEER_VERIFIED';

export type FloorLevelType = 'GF' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'RF';

export type VisualMode3D =
  | 'exterior'
  | 'interior'
  | 'top'
  | 'cutaway'
  | 'transparent'
  | 'wireframe'
  | 'structural'
  | 'steel_only'
  | 'full_building';

export type CadToolType =
  | 'select'
  | 'multi_select'
  | 'move'
  | 'resize'
  | 'rotate'
  | 'measure'
  | 'add'
  | 'delete';

export interface SnapSettings {
  grid: boolean;
  wall: boolean;
  corner: boolean;
  midpoint: boolean;
}

export interface LayerVisibility {
  architecture: boolean;
  dimensions: boolean;
  vastuOverlay: boolean;
  vastu81Pad: boolean;
  structural: boolean;
  steel: boolean;
  plumbing: boolean;
  walls: boolean;
  roof: boolean;
  columns: boolean;
  beams: boolean;
  slabs: boolean;
  footings: boolean;
  rebars: boolean;
  doorsWindows: boolean;
}

export interface Setbacks {
  front: number;
  rear: number;
  left: number;
  right: number;
}

export interface PlotConfig {
  length: number;
  width: number;
  unit: UnitType;
  orientation: OrientationType;
  road_direction: OrientationType;
  north_angle: number;
  vastu_mode?: VastuModeType;
  setbacks: Setbacks;
  is_corner_plot: boolean;
  floors_count?: number; // 1 to 10 floors
}

export interface RoomRequirement {
  id: string;
  name: string;
  room_type: string;
  min_width: number;
  min_length: number;
  preferred_width: number;
  preferred_length: number;
  priority: number;
  quantity: number;
  privacy_level: string;
  preferred_direction: OrientationType;
  adjacent_to: string[];
}

export interface OptimizationWeights {
  vastu: number;
  space_utilization: number;
  circulation: number;
  adjacency: number;
  structural_alignment: number;
  daylight_ventilation: number;
}

export interface DoorPlacement {
  id: string;
  wall_side: string;
  offset: number;
  width: number;
  connects_to?: string;
}

export interface WindowPlacement {
  id: string;
  wall_side: string;
  offset: number;
  width: number;
}

export interface LayoutRoom {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  length: number;
  rotation?: number;
  floor_level?: number;
  zone?: string;
  doors?: DoorPlacement[];
  windows?: WindowPlacement[];
  vastu_score?: number;
}

export interface GridLine {
  label: string;
  position: number;
  axis: 'X' | 'Y';
}

export interface StructuralGridData {
  grid_lines_x: GridLine[];
  grid_lines_y: GridLine[];
}

export interface StructuralColumn {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  floor: number;
  structural_type: string;
  source?: string;
  verification_status?: VerificationStatusType;
}

export interface StructuralBeam {
  id: string;
  start_point: [number, number, number];
  end_point: [number, number, number];
  section_width: number;
  section_depth: number;
  span: number;
  beam_type: string;
  floor: number;
  structural_type: string;
  source?: string;
  verification_status?: VerificationStatusType;
}

export interface StructuralSlab {
  id: string;
  boundary: [number, number][];
  thickness: number;
  slab_type: string;
  span_direction: string;
  floor: number;
  source?: string;
  verification_status?: VerificationStatusType;
}

export interface StructuralFooting {
  id: string;
  column_id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  depth: number;
  footing_type: string;
  floor: number;
  source?: string;
  verification_status?: VerificationStatusType;
}

export interface RebarSpec {
  element_id: string;
  member_type: 'COLUMN' | 'BEAM' | 'SLAB' | 'FOOTING' | 'STAIR';
  bar_mark: string;
  bar_type: 'TOP' | 'BOTTOM' | 'STIRRUP' | 'LONGITUDINAL' | 'MAIN_MESH' | 'DISTRIBUTION';
  diameter_mm: number;
  count: number;
  spacing_mm: number;
  cover_mm: number;
  grade: string;
  shape_code: string;
  individual_length_m: number;
  total_length_m: number;
  weight_kg: number;
  source?: string;
}

export interface StructuralClash {
  id: string;
  clash_type: string;
  element_id_1: string;
  element_id_2: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  location: [number, number, number];
  description: string;
}

export interface BarBendingScheduleItem {
  bar_mark: string;
  member_id: string;
  member_type: string;
  floor: number;
  bar_type: string;
  diameter_mm: number;
  grade: string;
  quantity: number;
  spacing_mm: number;
  individual_length_m: number;
  total_length_m: number;
  shape_code: string;
  weight_kg: number;
}

export interface QuantityTakeoffSummary {
  column_weight_kg: number;
  beam_weight_kg: number;
  slab_weight_kg: number;
  footing_weight_kg: number;
  stair_weight_kg: number;
  total_weight_kg: number;
  total_weight_tonnes: number;
}

export interface StructuralRevision {
  version: string;
  timestamp: string;
  notes: string;
  changes_summary: string;
}

export interface EngineerReview {
  reviewer_name: string;
  status: VerificationStatusType;
  comments: string;
  signed_timestamp: string;
}

export interface PreliminaryStructure {
  grid: StructuralGridData;
  columns: StructuralColumn[];
  beams: StructuralBeam[];
  slabs: StructuralSlab[];
  footings: StructuralFooting[];
  rebars: RebarSpec[];
  clashes: StructuralClash[];
  quantity_summary: QuantityTakeoffSummary;
  bar_schedule: BarBendingScheduleItem[];
  revisions: StructuralRevision[];
  engineer_review?: EngineerReview;
  disclaimer: string;
}

export interface RuleEvaluationDetail {
  rule_id: string;
  category: string;
  subject: string;
  result: string;
  score_delta: number;
  severity: string;
  message: string;
  recommendation?: string;
  explanation?: string;
}

export interface VastuEvaluationReport {
  total_score: number;
  profile_used: VastuProfileType;
  category_scores: Record<string, number>;
  positive_observations: string[];
  warnings: string[];
  recommendations: string[];
  rule_details: RuleEvaluationDetail[];
  optimization_summary?: any;
  brahmasthan_analysis?: any;
  panchamahabhuta_analysis?: any;
  entrance_analysis?: any;
  room_analyses?: any[];
  disclaimer: string;
}

export interface PlumbingFixture {
  fixture_id: string;
  room_id: string;
  room_name: string;
  fixture_type: string;
  x: number;
  y: number;
  z?: number;
  wall_side?: string;
  connection_type: 'WATER_INLET' | 'WASTEWATER' | 'SOIL_DRAIN';
}

export interface PipeSegment {
  id: string;
  system_type: 'WATER_SUPPLY' | 'WASTEWATER' | 'SOIL_DRAIN' | 'MAIN_CONNECTION';
  path_points: [number, number, number][];
  diameter_mm: number;
  length_m: number;
  bends_count: number;
  junctions_count: number;
  connects_from: string;
  connects_to: string;
}

export interface PlumbingShaft {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  floor_level: number;
  is_vertical_stack: boolean;
  wet_rooms_served: string[];
}

export interface PlumbingCostEstimate {
  water_pipe_cost: number;
  waste_pipe_cost: number;
  soil_pipe_cost: number;
  fittings_cost: number;
  labor_cost: number;
  total_estimated_cost: number;
  currency: string;
}

export interface PlumbingValidationIssue {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  location?: [number, number];
}

export interface PlumbingReportData {
  total_score: number;
  rating_label: string;
  pipe_efficiency_score: number;
  bend_efficiency_score: number;
  shaft_efficiency_score: number;
  cost_efficiency_score: number;
  maintenance_score: number;
  total_pipe_length_m: number;
  water_pipe_length_m: number;
  waste_pipe_length_m: number;
  soil_pipe_length_m: number;
  total_bends: number;
  total_junctions: number;
  fixtures: PlumbingFixture[];
  shafts: PlumbingShaft[];
  pipe_routes: PipeSegment[];
  cost_estimate: PlumbingCostEstimate;
  validation_issues: PlumbingValidationIssue[];
  positive_observations: string[];
  recommendations: string[];
  disclaimer: string;
}

export interface FloorPlanCandidate {
  id: string;
  name: string;
  rooms: LayoutRoom[];
  fitness_score: number;
  vastu_score: number;
  plumbing_score?: number;
  requirement_score: number;
  space_utilization_score: number;
  circulation_score: number;
  adjacency_score: number;
  structural_score: number;
  daylight_score: number;
  vastu_report: VastuEvaluationReport;
  structure: PreliminaryStructure;
  plumbing?: PlumbingReportData;
  // Layout Diversity Engine fields
  layout_strategy?: string;
  diversity_score?: number;
  similarity_to_previous?: number;
  plan_signature?: string;
  furniture_valid?: boolean;
  furniture_fit_score?: number;
  adjacency_graph?: Record<string, string[]>;
  entrance_zone?: string;
}

export interface LayoutStrategyInfo {
  id: string;
  name: string;
  description: string;
  spatial_features: string[];
  ideal_plot_aspect: string;
}

export interface PlanSimilarityDetail {
  overall_similarity: number;
  geometric_similarity: number;
  visual_similarity: number;
  centroid_similarity: number;
  adjacency_similarity: number;
  zone_similarity: number;
  verdict: string;
}

export interface MultiGenerationRequest {
  plot: PlotConfig;
  requirements: RoomRequirement[];
  weights?: OptimizationWeights;
  vastu_profile?: VastuProfileType;
  num_candidates?: number;
  vastu_strictness?: 'STRICT' | 'BALANCED' | 'FLEXIBLE';
  max_similarity_threshold?: number;
  exclude_signatures?: string[];
  strategies?: string[];
}

export interface DifferentPlanRequest {
  plot: PlotConfig;
  requirements: RoomRequirement[];
  weights?: OptimizationWeights;
  vastu_profile?: VastuProfileType;
  vastu_strictness?: 'STRICT' | 'BALANCED' | 'FLEXIBLE';
  exclude_signatures: string[];
  max_similarity_threshold?: number;
  target_strategy?: string;
}


export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  location: string;
  plot: PlotConfig;
  requirements: RoomRequirement[];
  vastu_profile: VastuProfileType;
  weights: OptimizationWeights;
  plans: FloorPlanCandidate[];
  created_at: string;
  updated_at: string;
}

// OpenCV Computer Vision Interfaces
export interface VisionDetectedWall {
  id: string;
  type: string;
  wall_type: 'EXTERNAL' | 'INTERNAL';
  start_point: [number, number];
  end_point: [number, number];
  thickness: number;
  confidence: number;
  source: string;
}

export interface VisionDetectedRoom {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  length: number;
  area_sq_m: number;
  polygon: [number, number][];
  center: [number, number];
  confidence: number;
  confidence_label: string;
  source: string;
}

export interface VisionDetectedColumn {
  id: string;
  center: [number, number];
  x: number;
  y: number;
  width: number;
  depth: number;
  confidence: number;
  source: string;
}

export interface VisionDetectedOpening {
  id: string;
  wall_id?: string;
  position: [number, number];
  width: number;
  type?: string;
  swing_direction?: string;
  confidence: number;
  source: string;
}

export interface VisionScale {
  scale_detected: boolean;
  calibration_method: string;
  pixels_per_meter: number;
  px_to_m_scale: number;
  confidence: number;
  unit: string;
  message?: string;
}

export interface VisionUploadResult {
  status: string;
  processing_metadata: {
    width_px: number;
    height_px: number;
    walls_detected: number;
    rooms_detected: number;
    columns_detected: number;
    doors_detected: number;
    windows_detected: number;
    scale: VisionScale;
  };
  base64_original: string;
  base64_processed: string;
  base64_edges: string;
  walls: VisionDetectedWall[];
  rooms: VisionDetectedRoom[];
  columns: VisionDetectedColumn[];
  doors: VisionDetectedOpening[];
  windows: VisionDetectedOpening[];
  scale: VisionScale;
}
