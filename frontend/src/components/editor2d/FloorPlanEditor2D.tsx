import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { formatDimension } from '../../utils/units';
import { FloorLevelType } from '../../types';
import { ArchitecturalFurnitureSVG } from './ArchitecturalFurnitureSVG';
import {
  ZoomIn, ZoomOut, Maximize2, Layers, Move, Plus, Trash2, Compass, Box, FileText,
  Copy, Lock, Grid, ShieldAlert, Sparkles, Sun, Moon, ChevronLeft, ChevronRight
} from 'lucide-react';

const getRoomPastelColor = (roomType: string): string => {
  switch (roomType) {
    case 'kitchen':
      return '#fef3c7'; // soft warm yellow/amber
    case 'dining':
      return '#fef9c3'; // soft light yellow
    case 'living':
      return '#e0f2fe'; // soft ice blue
    case 'master_bedroom':
      return '#ffedd5'; // soft warm peach
    case 'bedroom':
      return '#f3e8ff'; // soft lavender
    case 'toilet':
    case 'bathroom':
      return '#ccfbf1'; // soft cyan/teal
    case 'puja':
      return '#fef3c7'; // soft warm gold
    case 'parking':
    case 'porch':
      return '#f5f5f4'; // soft sand/beige
    default:
      return '#f8fafc';
  }
};

export const FloorPlanEditor2D: React.FC = () => {
  const {
    currentProject, selectedPlan, setSelectedPlan, layers, toggleLayer,
    unit, selectedRoomIds, setSelectedRoomIds, toggleSelectRoomId, updateRoomPosition, updateRoomDimensions,
    deleteRoomFromPlan, duplicateSelectedRooms, autoFixOverlaps, setActiveTab, zoom, setZoom,
    activeFloor, setActiveFloor
  } = useProjectStore();

  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; roomX: number; roomY: number } | null>(null);
  const [themeMode, setThemeMode] = useState<'blueprint_light' | 'blueprint_dark'>('blueprint_light');

  if (!currentProject || !selectedPlan) return null;

  const plot = currentProject.plot;
  const plotW = plot.width;
  const plotL = plot.length;
  const sb = plot.setbacks;

  const svgWidth = 900;
  const svgHeight = 650;
  const margin = 60;

  const scale = Math.min((svgWidth - 2 * margin) / plotW, (svgHeight - 2 * margin) / plotL) * zoom;
  const offsetX = (svgWidth - plotW * scale) / 2;
  const offsetY = (svgHeight - plotL * scale) / 2;

  const toSvgX = (x: number) => offsetX + x * scale;
  const toSvgY = (y: number) => offsetY + (plotL - y) * scale;

  const handleMouseDown = (e: React.MouseEvent, roomId: string, rx: number, ry: number) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelectRoomId(roomId);
    } else {
      setSelectedRoomIds([roomId]);
    }
    setDraggingRoomId(roomId);
    setDragStart({ mouseX: e.clientX, mouseY: e.clientY, roomX: rx, roomY: ry });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRoomId || !dragStart) return;
    const dxSvg = e.clientX - dragStart.mouseX;
    const dySvg = e.clientY - dragStart.mouseY;

    const dxPlot = dxSvg / scale;
    const dyPlot = -dySvg / scale;

    const newX = Math.max(sb.left, Math.min(plotW - sb.right - 1.0, dragStart.roomX + dxPlot));
    const newY = Math.max(sb.rear, Math.min(plotL - sb.front - 1.0, dragStart.roomY + dyPlot));

    updateRoomPosition(draggingRoomId, Number(newX.toFixed(2)), Number(newY.toFixed(2)));
  };

  const handleMouseUp = () => {
    setDraggingRoomId(null);
    setDragStart(null);
  };

  const selectedRoom = selectedPlan.rooms.find(r => selectedRoomIds.includes(r.id));
  const isLight = themeMode === 'blueprint_light';

  // Format dimensions into standard feet-inches (e.g. 12'-0" x 13'-6")
  const formatImperialDimension = (metersW: number, metersL: number) => {
    const feetW = metersW * 3.28084;
    const feetL = metersL * 3.28084;
    const ftW = Math.floor(feetW);
    const inW = Math.round((feetW - ftW) * 12);
    const ftL = Math.floor(feetL);
    const inL = Math.round((feetL - ftL) * 12);
    return `${ftW}'-${inW}" x ${ftL}'-${inL}"`;
  };

  const getFloorLevelIndex = (f: FloorLevelType): number => {
    if (f === 'GF') return 0;
    if (f === 'RF') return 99;
    return parseInt(f.replace('F', '')) || 0;
  };

  const activeFloorLevel = getFloorLevelIndex(activeFloor);

  // Filter rooms for active floor + auto-mirror Staircase onto all floor levels if missing
  const activeFloorRooms = selectedPlan ? selectedPlan.rooms.filter(r => {
    if (activeFloor === 'RF') return true;
    return (r.floor_level || 0) === activeFloorLevel;
  }) : [];

  const gfStairs = selectedPlan ? selectedPlan.rooms.filter(r => (r.floor_level || 0) === 0 && r.type.includes('stair')) : [];
  const displayRooms = [...activeFloorRooms];

  if (activeFloorLevel > 0 && activeFloorLevel !== 99) {
    for (const gfStair of gfStairs) {
      const alreadyHasStairOnFloor = activeFloorRooms.some(r => r.type.includes('stair'));
      if (!alreadyHasStairOnFloor) {
        displayRooms.push({
          ...gfStair,
          id: `${gfStair.id}-F${activeFloorLevel}`,
          name: `Main Staircase (${activeFloor})`,
          floor_level: activeFloorLevel
        });
      }
    }
  }

  const maxFloors = currentProject?.plot?.floors_count || 3;
  const availableFloorsList: FloorLevelType[] = ['GF'];
  for (let i = 1; i < maxFloors; i++) {
    availableFloorsList.push(`F${i}` as FloorLevelType);
  }
  availableFloorsList.push('RF');

  const currentFloorIdx = availableFloorsList.indexOf(activeFloor);
  const handlePrevFloor = () => {
    if (currentFloorIdx > 0) setActiveFloor(availableFloorsList[currentFloorIdx - 1]);
  };
  const handleNextFloor = () => {
    if (currentFloorIdx < availableFloorsList.length - 1) setActiveFloor(availableFloorsList[currentFloorIdx + 1]);
  };

  const checkOverlap = (
    x1: number, y1: number, w1: number, l1: number,
    x2: number, y2: number, w2: number, l2: number,
    eps: number = 0.05
  ) => {
    if (x1 + w1 - eps <= x2 || x2 + w2 - eps <= x1) return false;
    if (y1 + l1 - eps <= y2 || y2 + l2 - eps <= y1) return false;
    return true;
  };

  const overlappingRoomIds = new Set<string>();
  if (displayRooms.length > 0) {
    for (let i = 0; i < displayRooms.length; i++) {
      for (let j = i + 1; j < displayRooms.length; j++) {
        if (checkOverlap(displayRooms[i].x, displayRooms[i].y, displayRooms[i].width, displayRooms[i].length, displayRooms[j].x, displayRooms[j].y, displayRooms[j].width, displayRooms[j].length)) {
          overlappingRoomIds.add(displayRooms[i].id);
          overlappingRoomIds.add(displayRooms[j].id);
        }
      }
    }
  }

  const handleCopyGFToCurrentFloor = () => {
    const { copyFloorLayout } = useProjectStore.getState();
    if (activeFloorLevel > 0 && activeFloorLevel !== 99) {
      copyFloorLayout(0, activeFloorLevel);
    }
  };

  const { addRoomToPlan } = useProjectStore();

  const handleAddPresetRoom = (type: string, name: string, w: number, l: number) => {
    const newRoom = {
      id: `R-${Date.now().toString().slice(-4)}`,
      type,
      name,
      x: Number((sb.left + 1.0 + (selectedPlan.rooms.length % 3) * 2.5).toFixed(2)),
      y: Number((sb.rear + 1.0 + Math.floor(selectedPlan.rooms.length / 3) * 2.5).toFixed(2)),
      width: w,
      length: l,
      rotation: 0,
      floor_level: activeFloorLevel,
      doors: [{ id: `d-new-${Date.now()}`, wall_side: 'north', offset: 0.5, width: 0.9 }],
      windows: [{ id: `w-new-${Date.now()}`, wall_side: 'south', offset: 0.5, width: 1.2 }],
      vastu_score: 90
    };
    addRoomToPlan(newRoom);
    setSelectedRoomIds([newRoom.id]);
  };

  return (
    <div className="h-[calc(100vh-4rem-2.5rem)] bg-slate-50 flex flex-col overflow-hidden select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
        {/* Floor & Theme Controls */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Floor Level:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 space-x-1 overflow-x-auto max-w-md">
            {availableFloorsList.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFloor(f)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold font-mono transition-all whitespace-nowrap ${
                  activeFloor === f ? 'bg-blue-600 text-white shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {activeFloorLevel > 0 && activeFloorLevel !== 99 && (
            <button
              onClick={handleCopyGFToCurrentFloor}
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Copy Ground Floor layout to current floor"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone GF to {activeFloor}</span>
            </button>
          )}

          <button
            onClick={() => setThemeMode(isLight ? 'blueprint_dark' : 'blueprint_light')}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{isLight ? 'Dark CAD Mode' : 'Light Blueprint Mode'}</span>
          </button>
        </div>

        {/* Single Master Plan Header */}
        <div className="flex items-center space-x-2 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-900 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>{selectedPlan.name}</span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-mono border border-emerald-300">Vastu Score: {selectedPlan.vastu_score}/100</span>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-3">
          {overlappingRoomIds.size > 0 && (
            <button
              onClick={autoFixOverlaps}
              className="shimmer-btn flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition-all hover:scale-105"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Auto-Fix Overlaps ({Math.ceil(overlappingRoomIds.size / 2)} pairs)</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 space-x-1">
            <button onClick={() => setZoom(zoom + 0.15)} className="p-1.5 hover:bg-white rounded-lg text-slate-700"><ZoomIn className="w-4 h-4" /></button>
            <span className="text-xs font-mono font-extrabold text-blue-600 px-1">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(zoom - 0.15)} className="p-1.5 hover:bg-white rounded-lg text-slate-700"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1.0)} className="p-1.5 hover:bg-white rounded-lg text-slate-700"><Maximize2 className="w-4 h-4" /></button>
          </div>

          <button onClick={() => setActiveTab('viewer3d')} className="shimmer-btn flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-md hover:scale-105">
            <Box className="w-4 h-4" />
            <span>3D Studio</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 p-4 space-y-5 overflow-y-auto shrink-0 shadow-sm">
          {/* Quick Add Architectural Elements */}
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2.5 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add Architectural Elements</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleAddPresetRoom('staircase', 'Main Staircase', 2.2, 3.2)}
                className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Staircase</span>
              </button>
              <button
                onClick={() => handleAddPresetRoom('master_bedroom', 'Master Bed', 3.6, 4.0)}
                className="p-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Master Bed</span>
              </button>
              <button
                onClick={() => handleAddPresetRoom('living', 'Living Room', 3.8, 4.5)}
                className="p-2 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Living</span>
              </button>
              <button
                onClick={() => handleAddPresetRoom('kitchen', 'Kitchen', 2.4, 3.0)}
                className="p-2 rounded-xl bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Kitchen</span>
              </button>
              <button
                onClick={() => handleAddPresetRoom('puja', 'Puja Room', 2.0, 2.0)}
                className="p-2 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Puja Room</span>
              </button>
              <button
                onClick={() => handleAddPresetRoom('toilet', 'Bathroom', 1.8, 2.2)}
                className="p-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Bathroom</span>
              </button>
            </div>
          </div>

          {/* Selected Room Details Inspector */}
          {selectedRoom && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">{selectedRoom.name}</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">{selectedRoom.type}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block uppercase">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={selectedRoom.width}
                    onChange={(e) => updateRoomDimensions(selectedRoom.id, Number(e.target.value), selectedRoom.length)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-extrabold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block uppercase">Length (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={selectedRoom.length}
                    onChange={(e) => updateRoomDimensions(selectedRoom.id, selectedRoom.width, Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-extrabold"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={duplicateSelectedRooms}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => deleteRoomFromPlan(selectedRoom.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Architectural Layers */}
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2.5 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Architectural Layers</span>
            </h4>
            <div className="space-y-2 text-xs font-bold">
              {[
                { id: 'architecture', label: 'Walls & Furniture' },
                { id: 'doorsWindows', label: 'Doors & Windows' },
                { id: 'dimensions', label: 'Room Dimensions' },
                { id: 'vastuOverlay', label: 'Vastu 9-Zone Grid' },
                { id: 'vastu81Pad', label: 'Vastu 81-Pad Mandala' },
                { id: 'structural', label: 'Structural Columns & Beams' }
              ].map((l) => (
                <label key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm">
                  <span className="text-slate-800 uppercase font-mono text-[11px] font-extrabold">{l.label}</span>
                  <input
                    type="checkbox"
                    checked={!!(layers as any)[l.id]}
                    onChange={() => toggleLayer(l.id as any)}
                    className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Architectural SVG Blueprint Canvas */}
        <div className={`flex-1 relative flex items-center justify-center p-4 overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950 bg-animated-grid'}`}>
          
          {/* Carousel Left Arrow Button (<) */}
          {currentFloorIdx > 0 && (
            <button
              onClick={handlePrevFloor}
              className="absolute left-6 z-30 w-10 h-10 rounded-full bg-white text-blue-600 border border-slate-200 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              title="Previous Floor Level"
            >
              <ChevronLeft className="w-6 h-6 stroke-[3]" />
            </button>
          )}

          {/* Carousel Right Arrow Button (>) */}
          {currentFloorIdx < availableFloorsList.length - 1 && (
            <button
              onClick={handleNextFloor}
              className="absolute right-6 z-30 w-10 h-10 rounded-full bg-white text-blue-600 border border-slate-200 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              title="Next Floor Level"
            >
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          )}

          {overlappingRoomIds.size > 0 && (
            <div className="absolute top-6 left-6 z-30 bg-red-950/90 text-red-200 px-4 py-2 rounded-xl shadow-xl border border-red-500/50 flex items-center space-x-2.5 text-xs font-bold backdrop-blur-md animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Room overlap detected in current layout! Click "Auto-Fix Overlaps" in the top bar to separate rooms automatically.</span>
            </div>
          )}

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full max-w-full max-h-full select-none shadow-2xl rounded-xl">
            <defs>
              <pattern id="gridPatternLight" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(203, 213, 225, 0.6)" strokeWidth="0.8" />
              </pattern>
              <pattern id="gridPatternDark" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Background Canvas */}
            <rect
              x="0"
              y="0"
              width={svgWidth}
              height={svgHeight}
              fill={isLight ? '#f8fafc' : '#0f172a'}
            />

            {/* Blueprint Grid */}
            <rect
              x={toSvgX(0)}
              y={toSvgY(plotL)}
              width={plotW * scale}
              height={plotL * scale}
              fill={isLight ? 'url(#gridPatternLight)' : 'url(#gridPatternDark)'}
              stroke={isLight ? '#475569' : '#38bdf8'}
              strokeWidth="3"
            />

            {/* Vastu 9-Zone Grid Overlay with Directional Labels */}
            {layers.vastuOverlay && (
              <g opacity="0.85">
                {[1, 2].map(i => (
                  <line key={`v-${i}`} x1={toSvgX((plotW / 3) * i)} y1={toSvgY(plotL)} x2={toSvgX((plotW / 3) * i)} y2={toSvgY(0)} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" />
                ))}
                {[1, 2].map(i => (
                  <line key={`h-${i}`} x1={toSvgX(0)} y1={toSvgY((plotL / 3) * i)} x2={toSvgX(plotW)} y2={toSvgY((plotL / 3) * i)} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" />
                ))}

                {/* Vastu 9 Zone Directional Grid Text Labels */}
                {[
                  { name: 'NW (Vayu)', x: plotW * 0.16, y: plotL * 0.83 },
                  { name: 'N (Kubera)', x: plotW * 0.50, y: plotL * 0.83 },
                  { name: 'NE (Ishanya)', x: plotW * 0.83, y: plotL * 0.83 },
                  { name: 'W (Varuna)', x: plotW * 0.16, y: plotL * 0.50 },
                  { name: 'BRAHMASTHAN', x: plotW * 0.50, y: plotL * 0.50 },
                  { name: 'E (Surya)', x: plotW * 0.83, y: plotL * 0.50 },
                  { name: 'SW (Nairrutya)', x: plotW * 0.16, y: plotL * 0.16 },
                  { name: 'S (Yama)', x: plotW * 0.50, y: plotL * 0.16 },
                  { name: 'SE (Agni)', x: plotW * 0.83, y: plotL * 0.16 },
                ].map((z, idx) => (
                  <text
                    key={`vzone-${idx}`}
                    x={toSvgX(z.x)}
                    y={toSvgY(z.y)}
                    fill="#d97706"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="mono"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.75"
                    pointerEvents="none"
                  >
                    {z.name}
                  </text>
                ))}
              </g>
            )}

            {/* North Arrow Compass Indicator */}
            <g transform={`translate(${toSvgX(plotW) - 45}, ${toSvgY(plotL) + 45}) rotate(${plot.north_angle || 0})`} pointerEvents="none">
              <circle r="22" fill={isLight ? '#ffffff' : '#1e293b'} stroke="#3b82f6" strokeWidth="2" shadow-sm="true" />
              <polygon points="0,-16 -6,4 0,0" fill="#ef4444" />
              <polygon points="0,-16 6,4 0,0" fill="#dc2626" />
              <polygon points="0,16 -6,-4 0,0" fill="#94a3b8" />
              <polygon points="0,16 6,-4 0,0" fill="#64748b" />
              <text x="0" y="-18" fill="#ef4444" fontSize="10" fontWeight="900" textAnchor="middle">N</text>
            </g>

            {/* Architectural Rooms & Furniture */}
            {layers.architecture && displayRooms.map((room) => {
              const isSelected = selectedRoomIds.includes(room.id);
              const isOverlapping = overlappingRoomIds.has(room.id);
              const rx = toSvgX(room.x);
              const ry = toSvgY(room.y + room.length);
              const rw = room.width * scale;
              const rl = room.length * scale;

              return (
                <g
                  key={room.id}
                  onMouseDown={(e) => handleMouseDown(e, room.id, room.x, room.y)}
                  className="cursor-move"
                >
                  {/* Room Interior Fill with Soft Pastel Colors */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rl}
                    fill={
                      isOverlapping
                        ? 'rgba(239, 68, 68, 0.25)'
                        : isLight
                        ? (isSelected ? '#d1fae5' : getRoomPastelColor(room.type))
                        : (isSelected ? 'rgba(16,185,129,0.25)' : 'rgba(30,41,59,0.9)')
                    }
                  />

                  {/* Render Wall Segments with Genuine Open Door Cutouts */}
                  {(() => {
                    const roomDoors = (room.doors && room.doors.length > 0)
                      ? room.doors
                      : [
                          {
                            id: `d-auto-${room.id}`,
                            wall_side: room.type === 'living' ? 'south' : room.type === 'kitchen' ? 'west' : room.type === 'puja' ? 'west' : 'north',
                            offset: Math.min(room.width, room.length) * 0.25,
                            width: room.type === 'living' ? 1.0 : room.type === 'toilet' || room.type === 'puja' ? 0.8 : 0.9
                          }
                        ];

                    const wallColor = isOverlapping
                      ? '#ef4444'
                      : isSelected
                      ? '#10b981'
                      : isLight
                      ? '#1e293b'
                      : '#94a3b8';

                    const wallStrokeW = isOverlapping ? 5 : 4;

                    const southDoors = roomDoors.filter(d => d.wall_side === 'south');
                    const northDoors = roomDoors.filter(d => d.wall_side === 'north');
                    const westDoors = roomDoors.filter(d => d.wall_side === 'west');
                    const eastDoors = roomDoors.filter(d => d.wall_side === 'east');

                    return (
                      <g opacity="0.95">
                        {/* 1. SOUTH WALL */}
                        {southDoors.length === 0 ? (
                          <line x1={rx} y1={ry + rl} x2={rx + rw} y2={ry + rl} stroke={wallColor} strokeWidth={wallStrokeW} />
                        ) : (
                          southDoors.map((d, i) => {
                            const dw = Math.min(rw - 10, d.width * scale);
                            const offsetPx = Math.min(rw - dw - 5, Math.max(5, d.offset * scale));
                            const dStart = rx + offsetPx;
                            const dEnd = dStart + dw;
                            return (
                              <g key={`s-door-${i}`}>
                                {/* Solid Wall Segment Before Door */}
                                <line x1={rx} y1={ry + rl} x2={dStart} y2={ry + rl} stroke={wallColor} strokeWidth={wallStrokeW} />
                                {/* Solid Wall Segment After Door */}
                                <line x1={dEnd} y1={ry + rl} x2={rx + rw} y2={ry + rl} stroke={wallColor} strokeWidth={wallStrokeW} />
                                {/* Door Frame Jamb Ticks */}
                                <line x1={dStart} y1={ry + rl - 4} x2={dStart} y2={ry + rl + 4} stroke={wallColor} strokeWidth="2" />
                                <line x1={dEnd} y1={ry + rl - 4} x2={dEnd} y2={ry + rl + 4} stroke={wallColor} strokeWidth="2" />
                                {/* Open Door Leaf Panel (Swings Upward Into Room) */}
                                {layers.doorsWindows && (
                                  <>
                                    <line x1={dStart} y1={ry + rl} x2={dStart} y2={ry + rl - dw} stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="3" />
                                    <path d={`M ${dEnd} ${ry + rl} A ${dw} ${dw} 0 0 0 ${dStart} ${ry + rl - dw}`} fill="none" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="3 3" />
                                  </>
                                )}
                              </g>
                            );
                          })
                        )}

                        {/* 2. NORTH WALL */}
                        {northDoors.length === 0 ? (
                          <line x1={rx} y1={ry} x2={rx + rw} y2={ry} stroke={wallColor} strokeWidth={wallStrokeW} />
                        ) : (
                          northDoors.map((d, i) => {
                            const dw = Math.min(rw - 10, d.width * scale);
                            const offsetPx = Math.min(rw - dw - 5, Math.max(5, d.offset * scale));
                            const dStart = rx + offsetPx;
                            const dEnd = dStart + dw;
                            return (
                              <g key={`n-door-${i}`}>
                                <line x1={rx} y1={ry} x2={dStart} y2={ry} stroke={wallColor} strokeWidth={wallStrokeW} />
                                <line x1={dEnd} y1={ry} x2={rx + rw} y2={ry} stroke={wallColor} strokeWidth={wallStrokeW} />
                                <line x1={dStart} y1={ry - 4} x2={dStart} y2={ry + 4} stroke={wallColor} strokeWidth="2" />
                                <line x1={dEnd} y1={ry - 4} x2={dEnd} y2={ry + 4} stroke={wallColor} strokeWidth="2" />
                                {layers.doorsWindows && (
                                  <>
                                    <line x1={dStart} y1={ry} x2={dStart} y2={ry + dw} stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="3" />
                                    <path d={`M ${dEnd} ${ry} A ${dw} ${dw} 0 0 1 ${dStart} ${ry + dw}`} fill="none" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="3 3" />
                                  </>
                                )}
                              </g>
                            );
                          })
                        )}

                        {/* 3. WEST WALL */}
                        {westDoors.length === 0 ? (
                          <line x1={rx} y1={ry} x2={rx} y2={ry + rl} stroke={wallColor} strokeWidth={wallStrokeW} />
                        ) : (
                          westDoors.map((d, i) => {
                            const dw = Math.min(rl - 10, d.width * scale);
                            const offsetPx = Math.min(rl - dw - 5, Math.max(5, d.offset * scale));
                            const dStartPlotY = ry + rl - offsetPx;
                            const dEndPlotY = dStartPlotY - dw;
                            return (
                              <g key={`w-door-${i}`}>
                                <line x1={rx} y1={ry + rl} x2={rx} y2={dStartPlotY} stroke={wallColor} strokeWidth={wallStrokeW} />
                                <line x1={rx} y1={dEndPlotY} x2={rx} y2={ry} stroke={wallColor} strokeWidth={wallStrokeW} />
                                <line x1={rx - 4} y1={dStartPlotY} x2={rx + 4} y2={dStartPlotY} stroke={wallColor} strokeWidth="2" />
                                <line x1={rx - 4} y1={dEndPlotY} x2={rx + 4} y2={dEndPlotY} stroke={wallColor} strokeWidth="2" />
                                {layers.doorsWindows && (
                                  <>
                                    <line x1={rx} y1={dStartPlotY} x2={rx + dw} y2={dStartPlotY} stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="3" />
                                    <path d={`M ${rx} ${dEndPlotY} A ${dw} ${dw} 0 0 1 ${rx + dw} ${dStartPlotY}`} fill="none" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="3 3" />
                                  </>
                                )}
                              </g>
                            );
                          })
                        )}

                        {/* 4. EAST WALL */}
                        {eastDoors.length === 0 ? (
                          <line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + rl} stroke={wallColor} strokeWidth={wallStrokeW} />
                        ) : (
                          eastDoors.map((d, i) => {
                            const dw = Math.min(rl - 10, d.width * scale);
                            const offsetPx = Math.min(rl - dw - 5, Math.max(5, d.offset * scale));
                            const dStartPlotY = ry + rl - offsetPx;
                            const dEndPlotY = dStartPlotY - dw;
                            return (
                              <g key={`e-door-${i}`}>
                                <line x1={rx + rw} y1={ry + rl} x2={rx + rw} y2={dStartPlotY} stroke={wallColor} strokeWidth={wallStrokeW} />
                                <line x1={rx + rw} y1={dEndPlotY} x2={rx + rw} y2={ry} stroke={wallColor} strokeWidth={wallStrokeW} />
                                <line x1={rx + rw - 4} y1={dStartPlotY} x2={rx + rw + 4} y2={dStartPlotY} stroke={wallColor} strokeWidth="2" />
                                <line x1={rx + rw - 4} y1={dEndPlotY} x2={rx + rw + 4} y2={dEndPlotY} stroke={wallColor} strokeWidth="2" />
                                {layers.doorsWindows && (
                                  <>
                                    <line x1={rx + rw} y1={dStartPlotY} x2={rx + rw - dw} y2={dStartPlotY} stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="3" />
                                    <path d={`M ${rx + rw} ${dEndPlotY} A ${dw} ${dw} 0 0 0 ${rx + rw - dw} ${dStartPlotY}`} fill="none" stroke={isLight ? '#0f172a' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="3 3" />
                                  </>
                                )}
                              </g>
                            );
                          })
                        )}
                      </g>
                    );
                  })()}

                  {/* Render Architectural Vector Furniture */}
                  <g transform={`translate(${rx}, ${ry})`}>
                    <ArchitecturalFurnitureSVG roomType={room.type} width={rw} height={rl} />
                  </g>

                  {/* Room Name & Imperial Dimension Labels */}
                  {layers.dimensions && (
                    <g pointerEvents="none">
                      {/* Room Title */}
                      <text
                        x={rx + rw / 2}
                        y={ry + rl / 2 - (rw > 100 ? 8 : 2)}
                        fill={isLight ? '#0f172a' : '#f8fafc'}
                        fontSize={rw > 120 ? '12' : '10'}
                        fontWeight="800"
                        fontFamily="sans-serif"
                        letterSpacing="0.5"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {room.name.toUpperCase()}
                      </text>

                      {/* Imperial Dimension String e.g. 16'-0" x 14'-0" */}
                      <text
                        x={rx + rw / 2}
                        y={ry + rl / 2 + (rw > 100 ? 10 : 10)}
                        fill={isLight ? '#475569' : '#94a3b8'}
                        fontSize={rw > 120 ? '10' : '9'}
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {formatImperialDimension(room.width, room.length)}
                      </text>
                    </g>
                  )}

                  {/* Vastu Room Status Badge Overlay */}
                  {layers.vastuOverlay && (
                    <g pointerEvents="none" transform={`translate(${rx + 6}, ${ry + 6})`}>
                      <rect
                        width="70"
                        height="18"
                        rx="4"
                        fill={
                          (room.vastu_score || 85) >= 85
                            ? '#16a34a'
                            : (room.vastu_score || 85) >= 70
                            ? '#2563eb'
                            : (room.vastu_score || 85) >= 50
                            ? '#d97706'
                            : '#dc2626'
                        }
                        opacity="0.95"
                      />
                      <text
                        x="35"
                        y="10"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="800"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {room.zone || 'SE'} • {Math.round(room.vastu_score || 85)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Structural Columns & Beams 2D Overlay */}
            {layers.structural && selectedPlan.structure.columns.map((col) => {
              const cx = toSvgX(col.x);
              const cy = toSvgY(col.y);
              const cw = (col.width || 0.3) * scale;
              const cd = (col.depth || 0.3) * scale;

              return (
                <g key={`2d-col-${col.id}`} pointerEvents="none">
                  {/* RC Column Square Box */}
                  <rect
                    x={cx - cw / 2}
                    y={cy - cd / 2}
                    width={cw}
                    height={cd}
                    fill={isLight ? '#1e293b' : '#38bdf8'}
                    stroke="#ef4444"
                    strokeWidth="2"
                    rx="1"
                  />
                  {/* 4 Corner Rebar Dots */}
                  <circle cx={cx - cw / 3} cy={cy - cd / 3} r="1.8" fill="#ef4444" />
                  <circle cx={cx + cw / 3} cy={cy - cd / 3} r="1.8" fill="#ef4444" />
                  <circle cx={cx - cw / 3} cy={cy + cd / 3} r="1.8" fill="#ef4444" />
                  <circle cx={cx + cw / 3} cy={cy + cd / 3} r="1.8" fill="#ef4444" />
                </g>
              );
            })}

            {/* AI Plumbing 2D Vector Overlay */}
            {layers.plumbing && selectedPlan.plumbing && (
              <g id="plumbing-2d-layer">
                {/* 1. Plumbing Shaft (VP-01) Box */}
                {selectedPlan.plumbing.shafts.map((shaft) => {
                  const sx = toSvgX(shaft.x);
                  const sy = toSvgY(shaft.y + shaft.length);
                  const sw = shaft.width * scale;
                  const sl = shaft.length * scale;
                  return (
                    <g key={`shaft-${shaft.id}`}>
                      <rect
                        x={sx}
                        y={sy}
                        width={sw}
                        height={sl}
                        fill="#0284c7"
                        stroke="#0369a1"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                        opacity="0.85"
                      />
                      <line x1={sx} y1={sy} x2={sx + sw} y2={sy + sl} stroke="#ffffff" strokeWidth="2" />
                      <line x1={sx + sw} y1={sy} x2={sx} y2={sy + sl} stroke="#ffffff" strokeWidth="2" />
                      <text
                        x={sx + sw / 2}
                        y={sy - 4}
                        fill="#0284c7"
                        fontSize="10"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        VP-01 (PLUMBING SHAFT)
                      </text>
                    </g>
                  );
                })}

                {/* 2. Pipe Routes Lines */}
                {selectedPlan.plumbing.pipe_routes.map((pipe) => {
                  if (!pipe.path_points || pipe.path_points.length < 2) return null;
                  const color =
                    pipe.system_type === 'WATER_SUPPLY'
                      ? '#06b6d4'
                      : pipe.system_type === 'WASTEWATER'
                      ? '#10b981'
                      : pipe.system_type === 'SOIL_DRAIN'
                      ? '#d97706'
                      : '#8b5cf6';

                  const dPath = pipe.path_points
                    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(pt[0])} ${toSvgY(pt[1])}`)
                    .join(' ');

                  return (
                    <g key={`pipe-${pipe.id}`}>
                      <path
                        d={dPath}
                        fill="none"
                        stroke={color}
                        strokeWidth={pipe.system_type === 'SOIL_DRAIN' || pipe.system_type === 'MAIN_CONNECTION' ? '4' : '3'}
                        strokeDasharray={pipe.system_type === 'WATER_SUPPLY' ? 'none' : '6 3'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Flow directional dot on mid-point */}
                      {pipe.path_points.length >= 2 && (
                        <circle
                          cx={toSvgX(pipe.path_points[0][0])}
                          cy={toSvgY(pipe.path_points[0][1])}
                          r="3.5"
                          fill={color}
                        />
                      )}
                    </g>
                  );
                })}

                {/* 3. Water-Use Fixture Icons & Dots */}
                {selectedPlan.plumbing.fixtures.map((fix) => {
                  const fx = toSvgX(fix.x);
                  const fy = toSvgY(fix.y);
                  const fixColor =
                    fix.connection_type === 'WATER_INLET'
                      ? '#06b6d4'
                      : fix.connection_type === 'SOIL_DRAIN'
                      ? '#d97706'
                      : '#10b981';

                  return (
                    <g key={`fixture-${fix.fixture_id}`} transform={`translate(${fx}, ${fy})`}>
                      <circle r="6" fill={fixColor} stroke="#ffffff" strokeWidth="2" />
                      <text
                        x="9"
                        y="3"
                        fill={isLight ? '#0f172a' : '#f8fafc'}
                        fontSize="9"
                        fontWeight="700"
                      >
                        {fix.fixture_type.replace('_', ' ').toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Heavy Outer Perimeter Wall Stroke */}
            <rect
              x={toSvgX(sb.left)}
              y={toSvgY(plotL - sb.front)}
              width={(plotW - sb.left - sb.right) * scale}
              height={(plotL - sb.front - sb.rear) * scale}
              fill="none"
              stroke={isLight ? '#0f172a' : '#1e293b'}
              strokeWidth="8"
            />
          </svg>

          {/* Compass Rose */}
          <div className={`absolute top-6 right-6 p-3 rounded-xl shadow-xl flex flex-col items-center border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <Compass className="w-8 h-8 text-emerald-500 animate-pulse" />
            <span className={`text-[10px] font-bold mt-1 uppercase ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Facing: {plot.orientation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
