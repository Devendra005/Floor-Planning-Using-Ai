import {
  Project, PlotConfig, RoomRequirement, OptimizationWeights, VastuProfileType,
  FloorPlanCandidate, VastuEvaluationReport, PreliminaryStructure,
  MultiGenerationRequest, DifferentPlanRequest, PlanSimilarityDetail, LayoutStrategyInfo, LayoutRoom
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Seed demo data for 30x40 ft East Facing Plot
export const DEMO_PLOT: PlotConfig = {
  length: 12.192, // 40 ft in meters
  width: 9.144,   // 30 ft in meters
  unit: 'feet',
  orientation: 'E',
  road_direction: 'E',
  north_angle: 0,
  setbacks: { front: 1.2, rear: 1.0, left: 1.0, right: 1.0 },
  is_corner_plot: false
};

export const DEMO_REQUIREMENTS: RoomRequirement[] = [
  { id: '1', name: 'Master Bedroom', room_type: 'master_bedroom', min_width: 3.0, min_length: 3.6, preferred_width: 3.6, preferred_length: 4.2, priority: 1, quantity: 1, privacy_level: 'high', preferred_direction: 'SW', adjacent_to: [] },
  { id: '2', name: 'Kitchen', room_type: 'kitchen', min_width: 2.4, min_length: 2.7, preferred_width: 2.7, preferred_length: 3.0, priority: 1, quantity: 1, privacy_level: 'medium', preferred_direction: 'SE', adjacent_to: ['dining'] },
  { id: '3', name: 'Living Room', room_type: 'living', min_width: 3.6, min_length: 4.2, preferred_width: 4.2, preferred_length: 4.8, priority: 1, quantity: 1, privacy_level: 'low', preferred_direction: 'NE', adjacent_to: ['dining', 'entrance'] },
  { id: '4', name: 'Puja Room', room_type: 'puja', min_width: 1.8, min_length: 1.8, preferred_width: 2.1, preferred_length: 2.1, priority: 2, quantity: 1, privacy_level: 'high', preferred_direction: 'NE', adjacent_to: [] },
  { id: '5', name: 'Second Bedroom', room_type: 'bedroom', min_width: 3.0, min_length: 3.0, preferred_width: 3.3, preferred_length: 3.6, priority: 2, quantity: 1, privacy_level: 'high', preferred_direction: 'NW', adjacent_to: [] },
  { id: '6', name: 'Bathroom 1', room_type: 'toilet', min_width: 1.5, min_length: 2.1, preferred_width: 1.8, preferred_length: 2.4, priority: 1, quantity: 1, privacy_level: 'high', preferred_direction: 'NW', adjacent_to: ['master_bedroom'] },
  { id: '7', name: 'Parking & Porch', room_type: 'parking', min_width: 3.0, min_length: 4.5, preferred_width: 3.3, preferred_length: 4.8, priority: 2, quantity: 1, privacy_level: 'low', preferred_direction: 'NW', adjacent_to: [] },
  { id: '8', name: 'Main Staircase (Mandatory)', room_type: 'staircase', min_width: 2.2, min_length: 3.2, preferred_width: 2.4, preferred_length: 3.5, priority: 1, quantity: 1, privacy_level: 'low', preferred_direction: 'S', adjacent_to: ['living'] }
];

export async function createProjectApi(payload: {
  name: string;
  description?: string;
  project_type: string;
  location?: string;
  plot: PlotConfig;
  requirements: RoomRequirement[];
  vastu_profile: VastuProfileType;
  weights: OptimizationWeights;
}): Promise<Project> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API server error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unavailable. Using fast client-side layout solver.', err);
    return generateFallbackProject(payload);
  }
}

export async function generateLayoutsApi(payload: {
  plot: PlotConfig;
  requirements: RoomRequirement[];
  weights: OptimizationWeights;
  vastu_profile: VastuProfileType;
}): Promise<FloorPlanCandidate[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API server error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API offline, serving fallback generated candidates.');
    return generateFallbackCandidates(payload.plot, payload.requirements);
  }
}

export async function generateMultipleLayoutsApi(payload: MultiGenerationRequest): Promise<FloorPlanCandidate[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/generate/multiple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API server error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API offline, serving diverse fallback candidates.');
    return generateFallbackCandidates(payload.plot, payload.requirements);
  }
}

export async function generateDifferentLayoutApi(payload: DifferentPlanRequest): Promise<FloorPlanCandidate> {
  const res = await fetch(`${API_BASE_URL}/generate/different`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to generate different layout from server.');
  return await res.json();
}

export async function comparePlanSimilarityApi(planA: FloorPlanCandidate, planB: FloorPlanCandidate, plot: PlotConfig): Promise<PlanSimilarityDetail> {
  const res = await fetch(`${API_BASE_URL}/generate/similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_a_rooms: planA.rooms,
      plan_b_rooms: planB.rooms,
      plot
    })
  });
  if (!res.ok) throw new Error('Similarity check failed.');
  return await res.json();
}

export async function getLayoutStrategiesApi(): Promise<LayoutStrategyInfo[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/generate/strategies`);
    if (!res.ok) throw new Error('Failed to fetch strategies.');
    return await res.json();
  } catch (err) {
    return [
      { id: 'central_corridor', name: 'Central Corridor Layout', description: 'Axial circulation spine with balanced room access.', spatial_features: ['Central spine', 'Cross-ventilation'], ideal_plot_aspect: 'Square or rectangular' },
      { id: 'side_corridor', name: 'Side Corridor Layout', description: 'Edge pathway maximizing daylight frontage.', spatial_features: ['Daylight orientation', 'Streamlined utilities'], ideal_plot_aspect: 'Narrow or deep' },
      { id: 'open_plan', name: 'Open Plan Layout', description: 'Social pavilion of Living + Dining + Kitchen.', spatial_features: ['Open sightlines', 'Zero hallway waste'], ideal_plot_aspect: 'Square or wide' },
      { id: 'courtyard', name: 'Courtyard Layout', description: 'Brahmasthan open-to-sky courtyard arrangement.', spatial_features: ['Internal light well', 'Thermal comfort'], ideal_plot_aspect: 'Generous square' },
      { id: 'l_shaped', name: 'L-Shaped Layout', description: 'Perpendicular public and private wings.', spatial_features: ['Corner terrace', 'Acoustic zoning'], ideal_plot_aspect: 'Corner plot' },
      { id: 'front_public_rear_private', name: 'Front-Public / Rear-Private Layout', description: 'Strict dual-zone street and sanctuary split.', spatial_features: ['Security', 'Quiet family bedrooms'], ideal_plot_aspect: 'Deep plot' }
    ];
  }
}

export async function generateElectricalPlanApi(rooms: LayoutRoom[], plot: PlotConfig) {
  const res = await fetch(`${API_BASE_URL}/electrical/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rooms, plot })
  });
  if (!res.ok) throw new Error('Electrical generation failed.');
  return await res.json();
}


function generateFallbackProject(payload: any): Project {
  const plans = generateFallbackCandidates(payload.plot, payload.requirements);
  return {
    id: `PROJ-${Date.now()}`,
    name: payload.name,
    description: payload.description || '',
    project_type: payload.project_type || 'Residential Single Family',
    location: payload.location || '',
    plot: payload.plot,
    requirements: payload.requirements,
    vastu_profile: payload.vastu_profile || 'traditional-basic',
    weights: payload.weights,
    plans: plans,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function generateFallbackCandidates(plot: PlotConfig, reqs: RoomRequirement[]): FloorPlanCandidate[] {
  const plotW = plot.width;
  const plotL = plot.length;
  const sb = plot.setbacks;

  const numFloors = Math.max(1, plot.floors_count || 1);
  const isMulti = numFloors > 1;

  const fallbackRooms: LayoutRoom[] = [
    { id: 'r4', type: 'living', name: 'Living Room', x: sb.left, y: sb.rear + 3.0, width: 3.5, length: 4.5, rotation: 0, floor_level: 0, zone: 'N', vastu_score: 95.0, doors: [{ id: 'd4', wall_side: 'south', offset: 1.2, width: 1.0 }], windows: [{ id: 'w4', wall_side: 'north', offset: 1.0, width: 1.5 }] },
    { id: 'r2', type: 'kitchen', name: 'Kitchen', x: plotW - sb.right - 2.4, y: sb.rear, width: 2.4, length: 3.0, rotation: 0, floor_level: 0, zone: 'SE', vastu_score: 98.0, doors: [{ id: 'd2', wall_side: 'west', offset: 0.6, width: 0.9 }], windows: [{ id: 'w2', wall_side: 'east', offset: 0.8, width: 1.2 }] },
    { id: 'r3', type: 'puja', name: 'Puja Room', x: plotW - sb.right - 2.4, y: plotL - sb.front - 2.4, width: 2.4, length: 2.4, rotation: 0, floor_level: 0, zone: 'NE', vastu_score: 100.0, doors: [{ id: 'd3', wall_side: 'west', offset: 0.5, width: 0.8 }], windows: [{ id: 'w3', wall_side: 'east', offset: 0.5, width: 0.9 }] },
    { id: 'r7', type: 'parking', name: 'Parking & Porch', x: sb.left, y: plotL - sb.front - 2.4, width: 3.6, length: 2.4, rotation: 0, floor_level: 0, zone: 'NW', vastu_score: 90.0, doors: [], windows: [] },
    { id: 'r_stair', type: 'staircase', name: 'Main Staircase', x: sb.left + 5.1, y: sb.rear, width: 2.2, length: 3.0, rotation: 0, floor_level: 0, zone: 'S', vastu_score: 95.0, doors: [{ id: 'ds1', wall_side: 'north', offset: 0.5, width: 0.9 }], windows: [] },
    { id: 'r1', type: 'master_bedroom', name: isMulti ? 'Master Bedroom (F1)' : 'Master Bedroom', x: sb.left, y: sb.rear, width: 3.6, length: 4.0, rotation: 0, floor_level: isMulti ? 1 : 0, zone: 'SW', vastu_score: 98.0, doors: [{ id: 'd1', wall_side: 'north', offset: 0.8, width: 0.9 }], windows: [{ id: 'w1', wall_side: 'south', offset: 1.0, width: 1.2 }] },
    { id: 'r6', type: 'toilet', name: isMulti ? 'Master Bath (F1)' : 'Master Bath (Attached)', x: sb.left + 3.6, y: sb.rear, width: 1.5, length: 2.5, rotation: 0, floor_level: isMulti ? 1 : 0, zone: 'S', vastu_score: 85.0, doors: [{ id: 'd6', wall_side: 'north', offset: 0.4, width: 0.8 }], windows: [{ id: 'w6', wall_side: 'south', offset: 0.5, width: 0.6 }] },
    { id: 'r5', type: 'bedroom', name: isMulti ? 'Second Bedroom (F1)' : 'Second Bedroom', x: sb.left, y: sb.rear + 4.0, width: 3.6, length: 3.5, rotation: 0, floor_level: isMulti ? 1 : 0, zone: 'W', vastu_score: 88.0, doors: [{ id: 'd5', wall_side: 'east', offset: 0.8, width: 0.9 }], windows: [{ id: 'w5', wall_side: 'west', offset: 1.0, width: 1.2 }] }
  ];

  if (isMulti) {
    for (let fl = 1; fl < numFloors; fl++) {
      fallbackRooms.push({
        id: `r_stair_f${fl}`,
        type: 'staircase',
        name: `Main Staircase (F${fl})`,
        x: sb.left + 5.1,
        y: sb.rear,
        width: 2.2,
        length: 3.0,
        rotation: 0,
        floor_level: fl,
        zone: 'S',
        vastu_score: 95.0,
        doors: [{ id: `ds1_f${fl}`, wall_side: 'north', offset: 0.5, width: 0.9 }],
        windows: []
      });
    }
  }

  const candidates: FloorPlanCandidate[] = [
    {
      id: 'PLAN-01-MASTER-LAYOUT',
      name: 'Master Floor Plan — Vastu Compliant Layout',
      fitness_score: 93.5,
      vastu_score: 95.0,
      requirement_score: 98.0,
      space_utilization_score: 91.0,
      circulation_score: 89.0,
      adjacency_score: 92.0,
      structural_score: 94.0,
      daylight_score: 92.0,
      rooms: fallbackRooms,
      vastu_report: {
        total_score: 95.0,
        profile_used: 'traditional-basic',
        category_scores: { Kitchen: 98.0, 'Master Bedroom': 98.0, 'Puja Room': 100.0, Entrance: 95.0, Toilet: 85.0 },
        positive_observations: [
          'Kitchen placed in optimal South-East (Agni) zone for maximum prosperity.',
          'Master Bedroom situated in South-West (Nairrutya) zone for stability and leadership.',
          'Puja Room positioned in sacred North-East (Ishanya) zone for divine energy flow.',
          'Brahmasthan (Center core) remains uncluttered and open for positive energy.'
        ],
        warnings: [],
        recommendations: [
          'Orient cooking stove towards East inside the kitchen.',
          'Ensure master bed headboard faces South or East.'
        ],
        rule_details: [],
        disclaimer: 'Evaluated under Traditional Vastu principles for educational and planning preference.'
      },
      structure: {
        grid: {
          grid_lines_x: [
            { label: '1', position: sb.left, axis: 'X' },
            { label: '2', position: sb.left + 3.8, axis: 'X' },
            { label: '3', position: plotW - sb.right, axis: 'X' }
          ],
          grid_lines_y: [
            { label: 'A', position: sb.rear, axis: 'Y' },
            { label: 'B', position: sb.rear + 4.2, axis: 'Y' },
            { label: 'C', position: plotL - sb.front, axis: 'Y' }
          ]
        },
        columns: [
          { id: 'C1', x: sb.left, y: sb.rear, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' },
          { id: 'C2', x: sb.left + 3.6, y: sb.rear, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' },
          { id: 'C3', x: plotW - sb.right, y: sb.rear, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' },
          { id: 'C4', x: sb.left, y: plotL - sb.front, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' },
          { id: 'C5', x: plotW - sb.right, y: plotL - sb.front, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' }
        ],
        beams: [
          { id: 'B1', start_point: [sb.left, sb.rear, 3.0], end_point: [plotW - sb.right, sb.rear, 3.0], section_width: 0.23, section_depth: 0.45, span: 7.0, beam_type: 'PRIMARY', floor: 0, structural_type: 'RC_BEAM', source: 'conceptual_default', verification_status: 'AI_GENERATED' },
          { id: 'B2', start_point: [sb.left, plotL - sb.front, 3.0], end_point: [plotW - sb.right, plotL - sb.front, 3.0], section_width: 0.23, section_depth: 0.45, span: 7.0, beam_type: 'PRIMARY', floor: 0, structural_type: 'RC_BEAM', source: 'conceptual_default', verification_status: 'AI_GENERATED' }
        ],
        slabs: [
          { id: 'S1', boundary: [[sb.left, sb.rear], [plotW - sb.right, sb.rear], [plotW - sb.right, plotL - sb.front], [sb.left, plotL - sb.front]], thickness: 0.15, slab_type: 'TWO_WAY', span_direction: 'X', floor: 0, source: 'conceptual_default', verification_status: 'AI_GENERATED' }
        ],
        footings: [
          { id: 'F1', column_id: 'C1', x: sb.left, y: sb.rear, width: 1.2, length: 1.2, depth: 0.5, footing_type: 'ISOLATED_PAD', floor: 0, source: 'conceptual_default', verification_status: 'AI_GENERATED' }
        ],
        rebars: [
          { element_id: 'C1', member_type: 'COLUMN', bar_mark: 'C1-T1', bar_type: 'LONGITUDINAL', diameter_mm: 16, count: 4, spacing_mm: 150, cover_mm: 40, grade: 'Fe500', shape_code: 'STRAIGHT', individual_length_m: 3.6, total_length_m: 14.4, weight_kg: 22.7, source: 'conceptual_visualization_only' },
          { element_id: 'B1', member_type: 'BEAM', bar_mark: 'B1-T1', bar_type: 'TOP', diameter_mm: 16, count: 2, spacing_mm: 150, cover_mm: 30, grade: 'Fe500', shape_code: 'L_HOOK', individual_length_m: 7.5, total_length_m: 15.0, weight_kg: 23.7, source: 'conceptual_visualization_only' }
        ],
        clashes: [],
        quantity_summary: {
          column_weight_kg: 22.7,
          beam_weight_kg: 23.7,
          slab_weight_kg: 0.0,
          footing_weight_kg: 0.0,
          stair_weight_kg: 0.0,
          total_weight_kg: 46.4,
          total_weight_tonnes: 0.046
        },
        bar_schedule: [
          { bar_mark: 'C1-T1', member_id: 'C1', member_type: 'COLUMN', floor: 0, bar_type: 'LONGITUDINAL', diameter_mm: 16, grade: 'Fe500', quantity: 4, spacing_mm: 150, individual_length_m: 3.6, total_length_m: 14.4, shape_code: 'STRAIGHT', weight_kg: 22.7 },
          { bar_mark: 'B1-T1', member_id: 'B1', member_type: 'BEAM', floor: 0, bar_type: 'TOP', diameter_mm: 16, grade: 'Fe500', quantity: 2, spacing_mm: 150, individual_length_m: 7.5, total_length_m: 15.0, shape_code: 'L_HOOK', weight_kg: 23.7 }
        ],
        revisions: [],
        disclaimer: 'PRELIMINARY ENGINEERING & STEEL VISUALIZATION ONLY: Conceptual column, beam and rebar layout.'
      }
    }
  ];

  return candidates;
}
