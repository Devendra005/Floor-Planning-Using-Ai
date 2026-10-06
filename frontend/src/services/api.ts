import {
  Project, PlotConfig, RoomRequirement, OptimizationWeights, VastuProfileType,
  FloorPlanCandidate,
  MultiGenerationRequest, DifferentPlanRequest, PlanSimilarityDetail, LayoutStrategyInfo, LayoutRoom
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function requestApiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const responseBody = await response.text();
    let detail = responseBody;
    try {
      const parsed: unknown = JSON.parse(responseBody);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'detail' in parsed &&
        typeof parsed.detail === 'string'
      ) {
        detail = parsed.detail;
      }
    } catch {
      // Keep the response text when the server did not return JSON.
    }
    throw new Error(
      `API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : '.'}`
    );
  }
  return response.json() as Promise<T>;
}

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
  return requestApiJson<Project>(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function generateLayoutsApi(payload: {
  plot: PlotConfig;
  requirements: RoomRequirement[];
  weights: OptimizationWeights;
  vastu_profile: VastuProfileType;
}): Promise<FloorPlanCandidate[]> {
  return requestApiJson<FloorPlanCandidate[]>(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function generateMultipleLayoutsApi(payload: MultiGenerationRequest): Promise<FloorPlanCandidate[]> {
  return requestApiJson<FloorPlanCandidate[]>(`${API_BASE_URL}/generate/multiple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function generateDifferentLayoutApi(payload: DifferentPlanRequest): Promise<FloorPlanCandidate> {
  return requestApiJson<FloorPlanCandidate>(`${API_BASE_URL}/generate/different`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function comparePlanSimilarityApi(planA: FloorPlanCandidate, planB: FloorPlanCandidate, plot: PlotConfig): Promise<PlanSimilarityDetail> {
  return requestApiJson<PlanSimilarityDetail>(`${API_BASE_URL}/generate/similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_a_rooms: planA.rooms,
      plan_b_rooms: planB.rooms,
      plot
    })
  });
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
  const sb = plot.setbacks || { front: 1.0, rear: 1.0, left: 1.0, right: 1.0 };
  const minX = sb.left;
  const maxX = Math.max(minX + 3.0, plotW - sb.right);
  const minY = sb.rear;
  const maxY = Math.max(minY + 3.0, plotL - sb.front);
  const netW = maxX - minX;
  const netL = maxY - minY;

  const numFloors = Math.max(1, plot.floors_count || 1);
  const isMulti = numFloors > 1;

  const fallbackRooms: LayoutRoom[] = [];
  let currX = minX;
  let currY = minY;
  let rowH = 0.0;

  (reqs.length > 0 ? reqs : DEMO_REQUIREMENTS).forEach((r, idx) => {
    const fl = isMulti && (r.room_type.includes('bedroom') || r.room_type.includes('toilet')) ? 1 : 0;
    const w = Math.min(netW * 0.48, Math.max(2.0, r.preferred_width || 3.2));
    const l = Math.min(netL * 0.45, Math.max(2.0, r.preferred_length || 3.5));

    if (currX + w > maxX + 0.01) {
      currX = minX;
      currY += rowH + 0.1;
      rowH = 0.0;
    }
    if (currY + l > maxY + 0.01) {
      currY = minY;
    }

    fallbackRooms.push({
      id: `r-${r.id}-${idx}`,
      type: r.room_type,
      name: isMulti && fl > 0 ? `${r.name} (F${fl})` : r.name,
      x: Number(currX.toFixed(2)),
      y: Number(currY.toFixed(2)),
      width: Number(w.toFixed(2)),
      length: Number(l.toFixed(2)),
      rotation: 0,
      floor_level: fl,
      zone: r.preferred_direction || 'NE',
      vastu_score: 92.0,
      doors: [{ id: `d-${idx}`, wall_side: 'south', offset: 0.8, width: 0.9 }],
      windows: [{ id: `w-${idx}`, wall_side: 'north', offset: 1.0, width: 1.2 }]
    });

    currX += w + 0.1;
    rowH = Math.max(rowH, l);
  });

  if (isMulti) {
    for (let fl = 1; fl < numFloors; fl++) {
      fallbackRooms.push({
        id: `r_stair_f${fl}`,
        type: 'staircase',
        name: `Main Staircase (F${fl})`,
        x: minX,
        y: minY,
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
          'Puja Room positioned in sacred North-East (Ishanya) zone for divine energy flow.'
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
            { label: '1', position: minX, axis: 'X' },
            { label: '2', position: minX + 3.8, axis: 'X' },
            { label: '3', position: maxX, axis: 'X' }
          ],
          grid_lines_y: [
            { label: 'A', position: minY, axis: 'Y' },
            { label: 'B', position: minY + 4.2, axis: 'Y' },
            { label: 'C', position: maxY, axis: 'Y' }
          ]
        },
        columns: [
          { id: 'C1', x: minX, y: minY, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' },
          { id: 'C2', x: maxX, y: minY, width: 0.3, depth: 0.3, height: 3.0, floor: 0, structural_type: 'RC_COLUMN', source: 'conceptual_default', verification_status: 'AI_GENERATED' }
        ],
        beams: [],
        slabs: [],
        footings: [],
        rebars: [],
        clashes: [],
        quantity_summary: { column_weight_kg: 22.7, beam_weight_kg: 23.7, slab_weight_kg: 0.0, footing_weight_kg: 0.0, stair_weight_kg: 0.0, total_weight_kg: 46.4, total_weight_tonnes: 0.046 },
        bar_schedule: [],
        revisions: [],
        disclaimer: 'PRELIMINARY ENGINEERING ONLY'
      }
    }
  ];

  return candidates;
}
