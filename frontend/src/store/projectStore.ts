import { create } from 'zustand';
import {
  Project, FloorPlanCandidate, LayoutRoom, LayerVisibility, UnitType,
  FloorLevelType, VisualMode3D, CadToolType, SnapSettings, StructuralColumn,
  StructuralBeam, RebarSpec, VisionUploadResult
} from '../types';

export type TabType = 'home' | 'wizard' | 'editor2d' | 'viewer3d' | 'steel' | 'plumbing' | 'comparison' | 'report' | 'vision';

interface ProjectState {
  // Navigation & View mode
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Active Project & Candidate Plans
  currentProject: Project | null;
  selectedPlan: FloorPlanCandidate | null;
  setCurrentProject: (project: Project) => void;
  setSelectedPlan: (plan: FloorPlanCandidate) => void;
  addPlanToProject: (plan: FloorPlanCandidate) => void;
  setProjectPlans: (plans: FloorPlanCandidate[]) => void;

  // Vision Engine state
  visionResult: VisionUploadResult | null;
  setVisionResult: (res: VisionUploadResult | null) => void;
  commitVisionToPlan: () => void;

  // Multi-Floor State
  activeFloor: FloorLevelType;
  setActiveFloor: (floor: FloorLevelType) => void;

  // 3D Visual Modes
  visualMode3D: VisualMode3D;
  setVisualMode3D: (mode: VisualMode3D) => void;
  cutawayHeight: number; // 0 to 100%
  setCutawayHeight: (h: number) => void;

  // 2D & 3D Layer Visibilities
  layers: LayerVisibility;
  toggleLayer: (layerName: keyof LayerVisibility) => void;

  // CAD Editor Tools & Selection
  activeTool: CadToolType;
  setActiveTool: (tool: CadToolType) => void;
  snapSettings: SnapSettings;
  toggleSnapSetting: (setting: keyof SnapSettings) => void;

  selectedRoomIds: string[];
  setSelectedRoomIds: (ids: string[]) => void;
  toggleSelectRoomId: (id: string) => void;

  selectedStructuralId: string | null;
  setSelectedStructuralId: (id: string | null) => void;

  // Unit System
  unit: UnitType;
  setUnit: (u: UnitType) => void;

  // Canvas View Controls
  zoom: number;
  setZoom: (z: number) => void;

  // Layout Modifications (Updating rooms in 2D Editor)
  updateRoomPosition: (roomId: string, x: number, y: number) => void;
  updateRoomDimensions: (roomId: string, width: number, length: number) => void;
  addRoomToPlan: (room: LayoutRoom) => void;
  deleteRoomFromPlan: (roomId: string) => void;
  duplicateSelectedRooms: () => void;
  autoFixOverlaps: () => void;
  copyFloorLayout: (sourceFloorLevel: number, targetFloorLevel: number) => void;

  // Steel Detailing Modifications
  updateColumnSpec: (columnId: string, updates: Partial<StructuralColumn>) => void;
  updateBeamSpec: (beamId: string, updates: Partial<StructuralBeam>) => void;
  updateRebarSpec: (barMark: string, updates: Partial<RebarSpec>) => void;
}

const defaultLayers: LayerVisibility = {
  architecture: true,
  walls: true,
  doorsWindows: true,
  roof: false,
  dimensions: true,
  vastuOverlay: true,
  vastu81Pad: false,
  structural: true,
  steel: true,
  plumbing: true,
  columns: true,
  beams: true,
  slabs: true,
  footings: true,
  rebars: false
};

const defaultSnaps: SnapSettings = {
  grid: true,
  wall: true,
  corner: true,
  midpoint: true
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  currentProject: null,
  selectedPlan: null,
  setCurrentProject: (project) => set({
    currentProject: project,
    selectedPlan: project.plans.length > 0 ? project.plans[0] : null
  }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  addPlanToProject: (plan) => set((state) => {
    if (!state.currentProject) return {};
    const updatedPlans = [...state.currentProject.plans, plan];
    return {
      currentProject: {
        ...state.currentProject,
        plans: updatedPlans
      },
      selectedPlan: plan
    };
  }),
  setProjectPlans: (plans) => set((state) => {
    if (!state.currentProject) return {};
    return {
      currentProject: {
        ...state.currentProject,
        plans
      },
      selectedPlan: plans.length > 0 ? plans[0] : state.selectedPlan
    };
  }),


  visionResult: null,
  setVisionResult: (res) => set({ visionResult: res }),
  commitVisionToPlan: () => {
    const { visionResult, selectedPlan } = get();
    if (!visionResult || !selectedPlan) return;

    // Convert detected rooms into LayoutRoom format
    const newRooms: LayoutRoom[] = visionResult.rooms.map((r, idx) => ({
      id: r.id || `ROOM-CV-${idx+1}`,
      name: r.name || `Room ${idx+1}`,
      type: r.type || 'bedroom',
      x: r.x,
      y: r.y,
      width: r.width,
      length: r.length,
      rotation: 0,
      floor_level: 0,
      doors: [],
      windows: [],
      vastu_score: 90
    }));

    // Convert detected columns into StructuralColumn format
    const newColumns: StructuralColumn[] = visionResult.columns.map((c, idx) => ({
      id: c.id || `C-${idx+1}`,
      x: c.center[0],
      y: c.center[1],
      width: c.width,
      depth: c.depth,
      height: 3.0,
      floor: 0,
      structural_type: 'RC_COLUMN',
      source: 'opencv_vision_engine',
      verification_status: 'AI_GENERATED'
    }));

    const updatedPlan: FloorPlanCandidate = {
      ...selectedPlan,
      rooms: newRooms,
      structure: {
        ...selectedPlan.structure,
        columns: newColumns
      }
    };

    set({ selectedPlan: updatedPlan, activeTab: 'editor2d' });
  },

  activeFloor: 'GF',
  setActiveFloor: (floor) => set({ activeFloor: floor }),

  visualMode3D: 'exterior',
  setVisualMode3D: (mode) => set({ visualMode3D: mode }),
  cutawayHeight: 50,
  setCutawayHeight: (h) => set({ cutawayHeight: Math.max(0, Math.min(100, h)) }),

  layers: defaultLayers,
  toggleLayer: (layerName) => set((state) => ({
    layers: { ...state.layers, [layerName]: !state.layers[layerName] }
  })),

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  snapSettings: defaultSnaps,
  toggleSnapSetting: (setting) => set((state) => ({
    snapSettings: { ...state.snapSettings, [setting]: !state.snapSettings[setting] }
  })),

  selectedRoomIds: [],
  setSelectedRoomIds: (ids) => set({ selectedRoomIds: ids }),
  toggleSelectRoomId: (id) => set((state) => {
    const exists = state.selectedRoomIds.includes(id);
    return {
      selectedRoomIds: exists
        ? state.selectedRoomIds.filter(rId => rId !== id)
        : [...state.selectedRoomIds, id]
    };
  }),

  selectedStructuralId: null,
  setSelectedStructuralId: (id) => set({ selectedStructuralId: id }),

  unit: 'feet',
  setUnit: (u) => set({ unit: u }),

  zoom: 1.0,
  setZoom: (z) => set({ zoom: Math.max(0.4, Math.min(3.0, z)) }),

  updateRoomPosition: (roomId, x, y) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedRooms = state.selectedPlan.rooms.map((r) =>
      r.id === roomId ? { ...r, x: Math.max(0, x), y: Math.max(0, y) } : r
    );
    const updatedPlan = { ...state.selectedPlan, rooms: updatedRooms };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  updateRoomDimensions: (roomId, width, length) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedRooms = state.selectedPlan.rooms.map((r) =>
      r.id === roomId ? { ...r, width: Math.max(1.0, width), length: Math.max(1.0, length) } : r
    );
    const updatedPlan = { ...state.selectedPlan, rooms: updatedRooms };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  addRoomToPlan: (room) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedRooms = [...state.selectedPlan.rooms, room];
    const updatedPlan = { ...state.selectedPlan, rooms: updatedRooms };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  deleteRoomFromPlan: (roomId) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedRooms = state.selectedPlan.rooms.filter(r => r.id !== roomId);
    const updatedPlan = { ...state.selectedPlan, rooms: updatedRooms };
    return {
      selectedPlan: updatedPlan,
      selectedRoomIds: state.selectedRoomIds.filter(id => id !== roomId),
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  duplicateSelectedRooms: () => set((state) => {
    if (!state.selectedPlan || state.selectedRoomIds.length === 0) return state;
    const roomsToDup = state.selectedPlan.rooms.filter(r => state.selectedRoomIds.includes(r.id));
    const newRooms = roomsToDup.map((r, i) => ({
      ...r,
      id: `r-dup-${Date.now()}-${i}`,
      name: `${r.name} Copy`,
      x: r.x + 1.0,
      y: r.y + 1.0
    }));
    const updatedPlan = { ...state.selectedPlan, rooms: [...state.selectedPlan.rooms, ...newRooms] };
    return {
      selectedPlan: updatedPlan,
      selectedRoomIds: newRooms.map(r => r.id),
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  autoFixOverlaps: () => set((state) => {
    if (!state.selectedPlan || !state.currentProject) return state;
    const plot = state.currentProject.plot;
    const sb = plot.setbacks;
    const minX = sb.left;
    const maxX = plot.width - sb.right;
    const minY = sb.rear;
    const maxY = plot.length - sb.front;

    const rooms = state.selectedPlan.rooms.map(r => ({ ...r }));

    const checkOverlap = (
      x1: number, y1: number, w1: number, l1: number,
      x2: number, y2: number, w2: number, l2: number
    ) => {
      const eps = 0.05;
      if (x1 + w1 - eps <= x2 || x2 + w2 - eps <= x1) return false;
      if (y1 + l1 - eps <= y2 || y2 + l2 - eps <= y1) return false;
      return true;
    };

    // 1. Clamp bounds
    for (const r of rooms) {
      r.width = Math.max(1.5, Math.min(r.width, maxX - minX));
      r.length = Math.max(1.5, Math.min(r.length, maxY - minY));
      r.x = Math.max(minX, Math.min(r.x, maxX - r.width));
      r.y = Math.max(minY, Math.min(r.y, maxY - r.length));
    }

    // 2. Iterative overlap resolution PER FLOOR LEVEL
    const floorGroups: Record<number, typeof rooms> = {};
    for (const r of rooms) {
      const fl = r.floor_level || 0;
      if (!floorGroups[fl]) floorGroups[fl] = [];
      floorGroups[fl].push(r);
    }

    for (const flStr in floorGroups) {
      const flRooms = floorGroups[flStr];
      for (let iter = 0; iter < 60; iter++) {
        let overlapFound = false;
        for (let i = 0; i < flRooms.length; i++) {
          for (let j = i + 1; j < flRooms.length; j++) {
            const r1 = flRooms[i];
            const r2 = flRooms[j];
            if (checkOverlap(r1.x, r1.y, r1.width, r1.length, r2.x, r2.y, r2.width, r2.length)) {
              overlapFound = true;
              const ovX = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
              const ovY = Math.min(r1.y + r1.length, r2.y + r2.length) - Math.max(r1.y, r2.y);
              if (ovX <= 0 || ovY <= 0) continue;

              if (ovX < ovY) {
                const shift = ovX / 2.0 + 0.05;
                if ((r1.x + r1.width / 2.0) <= (r2.x + r2.width / 2.0)) {
                  r1.x -= shift;
                  r2.x += shift;
                } else {
                  r1.x += shift;
                  r2.x -= shift;
                }
              } else {
                const shift = ovY / 2.0 + 0.05;
                if ((r1.y + r1.length / 2.0) <= (r2.y + r2.length / 2.0)) {
                  r1.y -= shift;
                  r2.y += shift;
                } else {
                  r1.y += shift;
                  r2.y -= shift;
                }
              }

              r1.x = Math.max(minX, Math.min(r1.x, maxX - r1.width));
              r1.y = Math.max(minY, Math.min(r1.y, maxY - r1.length));
              r2.x = Math.max(minX, Math.min(r2.x, maxX - r2.width));
              r2.y = Math.max(minY, Math.min(r2.y, maxY - r2.length));
            }
          }
        }
        if (!overlapFound) break;
      }
    }

    // Round coordinates
    for (const r of rooms) {
      r.x = Number(r.x.toFixed(2));
      r.y = Number(r.y.toFixed(2));
    }

    const updatedPlan = { ...state.selectedPlan, rooms };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  copyFloorLayout: (sourceFloorLevel, targetFloorLevel) => set((state) => {
    if (!state.selectedPlan) return state;
    const sourceRooms = state.selectedPlan.rooms.filter(r => (r.floor_level || 0) === sourceFloorLevel);
    if (sourceRooms.length === 0) return state;

    // Filter out existing rooms on target floor level to overwrite with source floor layout
    const otherRooms = state.selectedPlan.rooms.filter(r => (r.floor_level || 0) !== targetFloorLevel);
    const copiedRooms = sourceRooms.map((r, idx) => ({
      ...r,
      id: `R-F${targetFloorLevel}-${Date.now()}-${idx+1}`,
      name: r.name.includes('(F') ? r.name.replace(/\(F\d+\)/, `(F${targetFloorLevel})`) : `${r.name} (F${targetFloorLevel})`,
      floor_level: targetFloorLevel
    }));

    const updatedPlan = {
      ...state.selectedPlan,
      rooms: [...otherRooms, ...copiedRooms]
    };

    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  updateColumnSpec: (columnId, updates) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedCols = state.selectedPlan.structure.columns.map(c => c.id === columnId ? { ...c, ...updates } : c);
    const updatedStructure = { ...state.selectedPlan.structure, columns: updatedCols };
    const updatedPlan = { ...state.selectedPlan, structure: updatedStructure };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  updateBeamSpec: (beamId, updates) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedBeams = state.selectedPlan.structure.beams.map(b => b.id === beamId ? { ...b, ...updates } : b);
    const updatedStructure = { ...state.selectedPlan.structure, beams: updatedBeams };
    const updatedPlan = { ...state.selectedPlan, structure: updatedStructure };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  }),

  updateRebarSpec: (barMark, updates) => set((state) => {
    if (!state.selectedPlan) return state;
    const updatedRebars = state.selectedPlan.structure.rebars.map(r => r.bar_mark === barMark ? { ...r, ...updates } : r);
    const updatedStructure = { ...state.selectedPlan.structure, rebars: updatedRebars };
    const updatedPlan = { ...state.selectedPlan, structure: updatedStructure };
    return {
      selectedPlan: updatedPlan,
      currentProject: state.currentProject ? {
        ...state.currentProject,
        plans: state.currentProject.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null
    };
  })
}));
