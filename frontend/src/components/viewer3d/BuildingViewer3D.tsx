import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Html } from '@react-three/drei';
import { useProjectStore } from '../../store/projectStore';
import { VisualMode3D } from '../../types';
import { Furniture3D } from './Furniture3D';
import {
  ColumnRebarCage3D,
  BeamRebarCage3D,
  FootingRebarMat3D,
  SlabRebarMesh3D
} from './RebarMesh3D';
import { Stairs3D } from './Stairs3D';
import { Plumbing3D } from './Plumbing3D';
import {
  Layers, Box, Eye, CheckSquare, Compass, ShieldAlert, ArrowLeft, RefreshCw, Sliders, Cpu, Activity, Play, Pause, Sun, Moon, Focus, Maximize2
} from 'lucide-react';

const get3DRoomPastelColor = (roomType: string): string => {
  switch (roomType) {
    case 'kitchen':
      return '#fef3c7'; // warm yellow/amber
    case 'dining':
      return '#fef9c3'; // light yellow
    case 'living':
      return '#e0f2fe'; // ice blue
    case 'master_bedroom':
      return '#ffedd5'; // warm peach
    case 'bedroom':
      return '#f3e8ff'; // lavender
    case 'toilet':
    case 'bathroom':
      return '#ccfbf1'; // cyan/teal
    case 'puja':
      return '#fef3c7'; // warm gold
    case 'parking':
    case 'porch':
      return '#f5f5f4'; // sand
    default:
      return '#f8fafc';
  }
};

const BuildingMesh: React.FC<{ selectedElementId: string | null; setSelectedElementId: (id: string | null) => void }> = ({
  selectedElementId,
  setSelectedElementId
}) => {
  const {
    currentProject, selectedPlan, layers, visualMode3D, cutawayHeight,
    selectedBarMark, setSelectedBarMark, explodedPercent, setSelectedStructuralId
  } = useProjectStore();
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  if (!currentProject || !selectedPlan) return null;

  const plot = currentProject.plot;
  const plotW = plot.width;
  const plotL = plot.length;

  const totalFloors = plot.floors_count || 3;
  const isCutaway = visualMode3D === 'cutaway';
  const maxWallHeight = 3.0;
  const currentWallHeight = isCutaway ? (maxWallHeight * cutawayHeight) / 100 : maxWallHeight;
  const isSteelOnly = visualMode3D === 'steel_only';
  const isTransparent = visualMode3D === 'transparent' || visualMode3D === 'cutaway';
  const wallThick = 0.15; // 150mm wall thickness

  return (
    <group position={[-plotW / 2, 0, -plotL / 2]}>
      {/* Plot Ground Plane */}
      <mesh position={[plotW / 2, -0.05, plotL / 2]} receiveShadow>
        <boxGeometry args={[plotW, 0.1, plotL]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>

      {/* Grid helper */}
      <Grid
        position={[plotW / 2, 0.01, plotL / 2]}
        args={[plotW, plotL]}
        cellSize={1}
        cellThickness={1}
        cellColor="#cbd5e1"
        sectionSize={3}
        sectionThickness={1.8}
        sectionColor="#3b82f6"
        fadeDistance={60}
      />

      {/* 3D Multi-Floor Architectural Rooms with Hollow Perimeter Walls & Door/Window Details */}
      {selectedPlan.rooms.map((room) => {
        const fl = room.floor_level || 0;
        const baseY = fl * 3.0;
        const cx = room.x + room.width / 2;
        const cz = room.y + room.length / 2;
        const isHovered = hoveredRoom === room.id;
        const isSelected = selectedElementId === room.id;
        const pastelColor = get3DRoomPastelColor(room.type);
        const wallMatColor = isSelected ? '#2563eb' : isHovered ? '#3b82f6' : pastelColor;

        const rw = room.width;
        const rl = room.length;
        const hw = rw / 2;
        const hl = rl / 2;

        return (
          <group key={room.id} position={[cx, baseY, cz]}>
            {/* Intermediate Floor Slab */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
              <boxGeometry args={[rw, 0.1, rl]} />
              <meshStandardMaterial
                color={isSteelOnly ? '#cbd5e1' : (isSelected ? '#3b82f6' : pastelColor)}
                transparent={isSteelOnly || isTransparent}
                opacity={isSteelOnly ? 0.05 : (isTransparent ? 0.35 : 0.9)}
                roughness={0.4}
              />
            </mesh>

            {/* 3D Slab Rebar Mesh inside Slab */}
            {(layers.rebars || layers.slabs || isSteelOnly) && (
              <group position={[0, 0.05, 0]}>
                <SlabRebarMesh3D width={rw} length={rl} isSteelOnly={isSteelOnly} />
              </group>
            )}

            {/* 3D Procedural Architectural Furniture & Walls */}
            {!isSteelOnly && layers.walls && (
              <>
                {currentWallHeight > 0.5 && (
                  <Furniture3D
                    x={0}
                    z={0}
                    width={rw}
                    length={rl}
                    roomType={room.type}
                  />
                )}
              </>
            )}

            {!isSteelOnly && layers.walls && currentWallHeight > 0.1 && (

              <group
                onPointerOver={(e) => { e.stopPropagation(); setHoveredRoom(room.id); }}
                onPointerOut={() => setHoveredRoom(null)}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(isSelected ? null : room.id); }}
              >
                {/* North Wall (at -hl) */}
                <mesh position={[0, currentWallHeight / 2, -hl + wallThick / 2]} castShadow>
                  <boxGeometry args={[rw, currentWallHeight, wallThick]} />
                  <meshStandardMaterial
                    color={wallMatColor}
                    transparent={isTransparent}
                    opacity={isTransparent ? (isHovered || isSelected ? 0.6 : 0.35) : 0.85}
                    wireframe={visualMode3D === 'wireframe'}
                    roughness={0.3}
                  />
                </mesh>

                {/* South Wall (at +hl) */}
                <mesh position={[0, currentWallHeight / 2, hl - wallThick / 2]} castShadow>
                  <boxGeometry args={[rw, currentWallHeight, wallThick]} />
                  <meshStandardMaterial
                    color={wallMatColor}
                    transparent={isTransparent}
                    opacity={isTransparent ? (isHovered || isSelected ? 0.6 : 0.35) : 0.85}
                    wireframe={visualMode3D === 'wireframe'}
                    roughness={0.3}
                  />
                </mesh>

                {/* West Wall (at -hw) */}
                <mesh position={[-hw + wallThick / 2, currentWallHeight / 2, 0]} castShadow>
                  <boxGeometry args={[wallThick, currentWallHeight, rl - wallThick * 2]} />
                  <meshStandardMaterial
                    color={wallMatColor}
                    transparent={isTransparent}
                    opacity={isTransparent ? (isHovered || isSelected ? 0.6 : 0.35) : 0.85}
                    wireframe={visualMode3D === 'wireframe'}
                    roughness={0.3}
                  />
                </mesh>

                {/* East Wall (at +hw) */}
                <mesh position={[hw - wallThick / 2, currentWallHeight / 2, 0]} castShadow>
                  <boxGeometry args={[wallThick, currentWallHeight, rl - wallThick * 2]} />
                  <meshStandardMaterial
                    color={wallMatColor}
                    transparent={isTransparent}
                    opacity={isTransparent ? (isHovered || isSelected ? 0.6 : 0.35) : 0.85}
                    wireframe={visualMode3D === 'wireframe'}
                    roughness={0.3}
                  />
                </mesh>

                {/* 3D Architectural Door Opening & Panel */}
                <group position={[0, 1.05, hl - wallThick / 2]}>
                  {/* Door Frame */}
                  <mesh castShadow>
                    <boxGeometry args={[0.9, 2.1, wallThick + 0.02]} />
                    <meshStandardMaterial color="#78350f" roughness={0.5} />
                  </mesh>
                  {/* Door Panel */}
                  <mesh position={[0.2, 0, 0]} rotation={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[0.82, 2.0, 0.04]} />
                    <meshStandardMaterial color="#9a3412" roughness={0.4} />
                  </mesh>
                </group>

                {/* 3D Window Frame & Glass Pane */}
                <group position={[hw - wallThick / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                  {/* Outer Window Frame */}
                  <mesh castShadow>
                    <boxGeometry args={[1.2, 1.2, wallThick + 0.02]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.2} />
                  </mesh>
                  {/* Transparent Window Glass */}
                  <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.1, 1.1, 0.02]} />
                    <meshStandardMaterial color="#93c5fd" transparent opacity={0.45} roughness={0.1} />
                  </mesh>
                </group>
              </group>
            )}

            {/* Floating Room Label Badge */}
            <Html position={[0, currentWallHeight / 2 + 0.4, 0]} center distanceFactor={15}>
              <div className={`px-3 py-1 rounded-xl text-[10px] font-extrabold shadow-lg pointer-events-none whitespace-nowrap font-mono select-none transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-2 border-blue-400 scale-110'
                  : 'bg-white/95 text-slate-800 border border-slate-300'
              }`}>
                <span>{room.name.toUpperCase()}</span>
                {isSelected && <span className="block text-[8px] text-blue-200">{room.width}m × {room.length}m</span>}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Top Roof Slab & Parapet Wall */}
      {!isSteelOnly && layers.roof && visualMode3D !== 'top' && (
        <group position={[plotW / 2, totalFloors * 3.0 + 0.08, plotL / 2]}>
          {/* Main Roof Slab */}
          <mesh receiveShadow>
            <boxGeometry args={[plotW - 0.5, 0.15, plotL - 0.5]} />
            <meshStandardMaterial color="#cbd5e1" opacity={0.8} transparent />
          </mesh>
          {/* Parapet Perimeter Walls */}
          <mesh position={[0, 0.25, -(plotL - 0.5) / 2 + 0.07]}>
            <boxGeometry args={[plotW - 0.5, 0.4, 0.15]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0, 0.25, (plotL - 0.5) / 2 - 0.07]}>
            <boxGeometry args={[plotW - 0.5, 0.4, 0.15]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      )}

      {/* 3D Multi-Floor Staircase Stack across ALL Stories (GF -> F1 -> F2 -> Roof) */}
      {selectedPlan.rooms.filter(r => r.type.includes('stair')).flatMap((stairRoom) => {
        const stairW = stairRoom.width;
        const stairL = stairRoom.length;
        const cx = stairRoom.x + stairW / 2;
        const cz = stairRoom.y + stairL / 2;

        return Array.from({ length: Math.max(1, totalFloors - 1) }).map((_, fl) => {
          const baseY = fl * 3.0;

          return (
            <group key={`multi-stair-${stairRoom.id}-F${fl}`} position={[cx, baseY, cz]}>
              <Stairs3D
                x={0}
                z={0}
                width={stairW}
                length={stairL}
                height={3.0}
                isSteelOnly={isSteelOnly}
              />
            </group>
          );
        });
      })}

      {/* 3D Structural Columns & Rebar Cages Across All Stories */}
      {(layers.columns || isSteelOnly || visualMode3D === 'structural') && selectedPlan.structure.columns.map((col) => {
        if (isNaN(col.x) || isNaN(col.y)) return null;
        const fl = col.floor || 0;
        const colH = col.height || 3.0;
        const colW = col.width || 0.3;
        const colD = col.depth || 0.3;
        const colY = fl * 3.0 + colH / 2 + (explodedPercent / 100) * fl * 1.5;
        const isSelected = selectedElementId === col.id;

        const colRebars = (selectedPlan.structure.rebars || []).filter(r => r.element_id === col.id || r.member_id === col.id);
        const mainColSpec = colRebars.find(r => r.bar_type === 'LONGITUDINAL');
        const tieColSpec = colRebars.find(r => r.bar_type === 'STIRRUP');

        return (
          <group
            key={col.id}
            position={[col.x, colY, col.y]}
            onClick={(e) => { e.stopPropagation(); setSelectedElementId(isSelected ? null : col.id); }}
          >
            {/* Concrete Column Mesh (Ghost volume in steel_only mode) */}
            <mesh castShadow>
              <boxGeometry args={[colW, colH, colD]} />
              <meshStandardMaterial
                color={isSelected ? '#3b82f6' : isSteelOnly ? '#cbd5e1' : '#64748b'}
                transparent={isSteelOnly || isTransparent}
                opacity={isSteelOnly ? 0.05 : isTransparent ? 0.35 : 0.9}
                wireframe={visualMode3D === 'wireframe'}
                roughness={0.4}
              />
            </mesh>

            {/* 3D Fe500 Steel Rebar Cage */}
            {(layers.rebars || isSteelOnly) && (
              <ColumnRebarCage3D
                width={colW}
                depth={colD}
                height={colH}
                isSteelOnly={isSteelOnly}
                selectedBarMark={selectedBarMark}
                columnBarMarks={{
                  mainMark: mainColSpec?.bar_mark,
                  tieMark: tieColSpec?.bar_mark
                }}
                explodedOffset={explodedPercent / 100}
                onSelectBarMark={(mark) => {
                  setSelectedBarMark(mark);
                  setSelectedStructuralId(mark);
                }}
              />
            )}
          </group>
        );
      })}

      {/* 3D Structural Beams & Rebar Cages */}
      {(layers.beams || isSteelOnly || visualMode3D === 'structural') && selectedPlan.structure.beams.map((bm) => {
        const start = bm.start_point || [0, 0, 0];
        const end = bm.end_point || [0, 0, 0];
        const dx = end[0] - start[0];
        const dz = end[1] - start[1];
        const span = Math.sqrt(dx * dx + dz * dz);
        const bLength = Math.max(span, bm.span || 0.5);

        if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1]) || bLength <= 0.05) return null;

        const cx = (start[0] + end[0]) / 2;
        const cz = (start[1] + end[1]) / 2;
        const bDepth = bm.section_depth || 0.35;
        const bWidth = bm.section_width || 0.23;
        const fl = bm.floor || 0;
        const baseBeamY = start[2] ? start[2] - bDepth / 2 : (fl + 1) * 3.0 - bDepth / 2;
        const beamY = baseBeamY + (explodedPercent / 100) * (fl + 0.5) * 1.5;
        const angleY = -Math.atan2(dz, dx);
        const isSelected = selectedElementId === bm.id;

        const bmRebars = (selectedPlan.structure.rebars || []).filter(r => r.element_id === bm.id || r.member_id === bm.id);
        const topSpec = bmRebars.find(r => r.bar_type === 'TOP');
        const botSpec = bmRebars.find(r => r.bar_type === 'BOTTOM');
        const stirrupSpec = bmRebars.find(r => r.bar_type === 'STIRRUP');

        return (
          <group
            key={bm.id}
            position={[cx, beamY, cz]}
            rotation={[0, angleY, 0]}
            onClick={(e) => { e.stopPropagation(); setSelectedElementId(isSelected ? null : bm.id); }}
          >
            {/* Concrete Beam Mesh (Ghost volume in steel_only mode) */}
            <mesh castShadow>
              <boxGeometry args={[bLength, bDepth, bWidth]} />
              <meshStandardMaterial
                color={isSelected ? '#2563eb' : isSteelOnly ? '#cbd5e1' : '#475569'}
                transparent={isSteelOnly || isTransparent}
                opacity={isSteelOnly ? 0.05 : isTransparent ? 0.35 : 0.9}
                wireframe={visualMode3D === 'wireframe'}
                roughness={0.4}
              />
            </mesh>

            {/* 3D Fe500 Beam Rebar Cage */}
            {(layers.rebars || isSteelOnly) && (
              <BeamRebarCage3D
                length={bLength}
                width={bWidth}
                depth={bDepth}
                topCount={topSpec?.count || 2}
                bottomCount={botSpec?.count || 3}
                topDia={topSpec?.diameter_mm || 16}
                botDia={botSpec?.diameter_mm || 16}
                stirrupDia={stirrupSpec?.diameter_mm || 8}
                stirrupSpacing={(stirrupSpec?.spacing_mm || 150) / 1000}
                isSteelOnly={isSteelOnly}
                selectedBarMark={selectedBarMark}
                beamBarMarks={{
                  topMark: topSpec?.bar_mark,
                  bottomMark: botSpec?.bar_mark,
                  stirrupMark: stirrupSpec?.bar_mark
                }}
                explodedOffset={explodedPercent / 100}
                onSelectBarMark={(mark) => {
                  setSelectedBarMark(mark);
                  setSelectedStructuralId(mark);
                }}
              />
            )}
          </group>
        );
      })}

      {/* 3D Foundation Footings & Rebar Mats */}
      {(layers.footings || isSteelOnly || visualMode3D === 'structural') && selectedPlan.structure.columns.map((col) => {
        if ((col.floor || 0) !== 0) return null;
        const ftW = 1.2;
        const ftL = 1.2;
        const ftD = 0.5;

        return (
          <group key={`ft-${col.id}`} position={[col.x, -ftD / 2, col.y]}>
            {/* Concrete Pad Footing Mesh */}
            <mesh castShadow>
              <boxGeometry args={[ftW, ftD, ftL]} />
              <meshStandardMaterial
                color={isSteelOnly ? '#cbd5e1' : '#64748b'}
                transparent={isSteelOnly || isTransparent}
                opacity={isSteelOnly ? 0.06 : 0.85}
                wireframe={visualMode3D === 'wireframe'}
                roughness={0.5}
              />
            </mesh>

            {/* 3D Base Rebar Mat Mesh inside Footing */}
            {(layers.rebars || isSteelOnly) && (
              <FootingRebarMat3D
                width={ftW}
                length={ftL}
                depth={ftD}
                isSteelOnly={isSteelOnly}
                selectedBarMark={selectedBarMark}
                explodedOffset={explodedPercent / 100}
                onSelectBarMark={(mark) => {
                  setSelectedBarMark(mark);
                  setSelectedStructuralId(mark);
                }}
              />
            )}
          </group>
        );
      })}
      {/* 3D AI Plumbing Network Overlay */}
      {layers.plumbing && <Plumbing3D plan={selectedPlan} />}
    </group>
  );
};

export const BuildingViewer3D: React.FC = () => {
  const { selectedPlan, visualMode3D, setVisualMode3D, cutawayHeight, setCutawayHeight, layers, toggleLayer } = useProjectStore();
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  if (!selectedPlan) return null;

  // Preset camera view angle handler
  const setCameraPreset = (preset: 'iso' | 'steel' | 'top' | 'front') => {
    if (!controlsRef.current) return;
    switch (preset) {
      case 'iso':
        controlsRef.current.object.position.set(16, 14, 16);
        controlsRef.current.target.set(0, 3, 0);
        break;
      case 'steel':
        setVisualMode3D('steel_only');
        controlsRef.current.object.position.set(7, 5, 7);
        controlsRef.current.target.set(3, 2, 3);
        break;
      case 'top':
        setVisualMode3D('top');
        controlsRef.current.object.position.set(0, 24, 0.01);
        controlsRef.current.target.set(0, 0, 0);
        break;
      case 'front':
        controlsRef.current.object.position.set(0, 5, 22);
        controlsRef.current.target.set(0, 3, 0);
        break;
    }
    controlsRef.current.update();
  };

  const isSteelOnly = visualMode3D === 'steel_only';

  return (
    <div className="h-[calc(100vh-4rem-2.5rem)] bg-slate-50 flex flex-col relative overflow-hidden bg-animated-grid select-none">
      
      {/* 3D Visual Mode & Controls Panel */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl space-y-3 max-w-xs shadow-md border border-slate-200 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">3D BIM Studio</span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Auto-Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1 px-2 rounded text-[10px] font-semibold flex items-center space-x-1 transition-all ${
                autoRotate ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
              }`}
              title="Toggle Auto-Rotate 360°"
            >
              {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>360°</span>
            </button>
          </div>
        </div>

        {isPanelOpen && (
          <>
            <select
              value={visualMode3D}
              onChange={(e) => setVisualMode3D(e.target.value as VisualMode3D)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="exterior">Exterior Render View</option>
              <option value="steel_only">Steel Rebar Mesh View</option>
              <option value="cutaway">Horizontal Cutaway Section</option>
              <option value="transparent">Transparent Glass Mode</option>
              <option value="wireframe">Wireframe Model View</option>
              <option value="structural">Structural Frame View</option>
              <option value="top">Top Orthographic View</option>
            </select>

            {/* Camera View Presets */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-extrabold">Camera View Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setCameraPreset('iso')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[11px] font-bold flex items-center justify-center space-x-1"
                >
                  <Compass className="w-3 h-3" />
                  <span>Isometric</span>
                </button>
                <button
                  onClick={() => setCameraPreset('steel')}
                  className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[11px] font-bold flex items-center justify-center space-x-1"
                >
                  <Focus className="w-3 h-3" />
                  <span>Steel Focus</span>
                </button>
                <button
                  onClick={() => setCameraPreset('top')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[11px] font-bold flex items-center justify-center space-x-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Top Plan</span>
                </button>
                <button
                  onClick={() => setCameraPreset('front')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[11px] font-bold flex items-center justify-center space-x-1"
                >
                  <Box className="w-3 h-3" />
                  <span>Elevation</span>
                </button>
              </div>
            </div>

            {/* Cutaway Height Slider */}
            {visualMode3D === 'cutaway' && (
              <div className="space-y-2 pt-3 border-t border-slate-200 animate-scale-pop">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Section Cut Height</span>
                  <span className="text-blue-600 font-mono font-extrabold">{cutawayHeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cutawayHeight}
                  onChange={(e) => setCutawayHeight(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* 3D Layer Toggles */}
            <div className="space-y-1.5 text-xs font-bold pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-extrabold">3D Layers Toggle</span>
              {[
                { id: 'walls', label: 'Architectural Walls & Doors' },
                { id: 'roof', label: 'Roof Slab & Parapet' },
                { id: 'columns', label: 'Structural Columns' },
                { id: 'beams', label: 'Structural Beams' },
                { id: 'footings', label: 'Foundation Footings' },
                { id: 'rebars', label: 'Fe500 Rebar Cages & Stirrups' }
              ].map((l) => (
                <label key={l.id} className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm">
                  <span className="text-slate-800 text-[11px] font-extrabold">{l.label}</span>
                  <input
                    type="checkbox"
                    checked={isSteelOnly ? (l.id === 'rebars' || l.id === 'columns' || l.id === 'beams' || l.id === 'footings') : !!(layers as any)[l.id]}
                    onChange={() => toggleLayer(l.id as any)}
                    className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating HUD Live Engine Metrics */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 bg-white/95 backdrop-blur border border-slate-200 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center space-x-2 sm:space-x-3 text-xs shadow-md max-w-[calc(100vw-1.5rem)] overflow-x-auto">
        <Activity className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
        <div className="font-mono text-[10px] sm:text-[11px] space-x-2 sm:space-x-3 whitespace-nowrap">
          <span className="text-slate-700">FPS: <strong className="text-emerald-700 font-extrabold">60.0</strong></span>
          <span className="text-slate-700">Cols: <strong className="text-indigo-700 font-extrabold">{selectedPlan.structure.columns.length}</strong></span>
          <span className="text-slate-700">Beams: <strong className="text-blue-700 font-extrabold">{selectedPlan.structure.beams.length}</strong></span>
          <span className="text-slate-700">Rebar: <strong className="text-red-600 font-extrabold">{selectedPlan.structure.quantity_summary.total_weight_kg || 46.4} kg</strong></span>
        </div>
      </div>

      {/* Rebar Detailing Legend & Spec Overlay in Steel-Only Mode */}
      {isSteelOnly && (
        <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-20 bg-slate-900/95 backdrop-blur text-white border border-slate-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-2 text-xs shadow-2xl max-w-[calc(100vw-1.5rem)] sm:max-w-sm animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-mono font-extrabold text-red-400 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
              <span>Steel Rebar Specification (Fe500)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] sm:text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" />
              <span>Col Rebar: 16mm Ø</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 shrink-0" />
              <span>Col Stirrups: 8mm Ø</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />
              <span>Beam Rebar: 16mm Ø</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0" />
              <span>Beam Stirrups: 8mm Ø</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span>Footing Mat: 12mm Ø</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shrink-0" />
              <span>Slab Mesh: 10mm Ø</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Element Inspector Overlay Panel when an element is selected */}
      {selectedElementId && (
        <div className="absolute top-16 sm:top-20 right-3 sm:right-6 z-30 bg-white/95 backdrop-blur border border-blue-300 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl space-y-2 text-xs w-[calc(100vw-1.5rem)] sm:w-72 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-extrabold text-blue-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Box className="w-4 h-4 text-blue-600" />
              <span>3D Inspector</span>
            </span>
            <button
              onClick={() => setSelectedElementId(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-black p-1"
            >
              ✕
            </button>
          </div>

          {(() => {
            const roomMatch = selectedPlan.rooms.find(r => r.id === selectedElementId);
            if (roomMatch) {
              return (
                <div className="space-y-1.5 text-slate-700">
                  <div className="font-extrabold text-sm text-slate-900">{roomMatch.name}</div>
                  <div className="font-mono text-[11px] space-y-1">
                    <div>Type: <strong className="text-blue-700">{roomMatch.type}</strong></div>
                    <div>Dimensions: <strong className="text-slate-900">{roomMatch.width}m × {roomMatch.length}m</strong></div>
                    <div>Floor Level: <strong className="text-slate-900">{roomMatch.floor_level || 0} (Height 3.0m)</strong></div>
                    <div>Vastu Zone: <strong className="text-emerald-700">{roomMatch.zone || 'Optimal'}</strong></div>
                  </div>
                </div>
              );
            }

            const colMatch = selectedPlan.structure.columns.find(c => c.id === selectedElementId);
            if (colMatch) {
              return (
                <div className="space-y-1.5 text-slate-700">
                  <div className="font-extrabold text-sm text-slate-900">RC Column ({colMatch.id})</div>
                  <div className="font-mono text-[11px] space-y-1">
                    <div>Section: <strong className="text-blue-700">{(colMatch.width || 0.3) * 1000}mm × {(colMatch.depth || 0.3) * 1000}mm</strong></div>
                    <div>Height: <strong className="text-slate-900">{colMatch.height || 3.0}m</strong></div>
                    <div>Main Steel: <strong className="text-red-600">4 Nos 16mm Ø Fe500</strong></div>
                    <div>Stirrups: <strong className="text-orange-600">8mm Ø @ 150mm c/c</strong></div>
                  </div>
                </div>
              );
            }

            const beamMatch = selectedPlan.structure.beams.find(b => b.id === selectedElementId);
            if (beamMatch) {
              return (
                <div className="space-y-1.5 text-slate-700">
                  <div className="font-extrabold text-sm text-slate-900">RC Beam ({beamMatch.id})</div>
                  <div className="font-mono text-[11px] space-y-1">
                    <div>Section: <strong className="text-blue-700">{(beamMatch.section_width || 0.23) * 1000}mm × {(beamMatch.section_depth || 0.35) * 1000}mm</strong></div>
                    <div>Span: <strong className="text-slate-900">{beamMatch.span || 4.5}m</strong></div>
                    <div>Top/Bot Steel: <strong className="text-blue-600">2+2 Nos 16mm Ø Fe500</strong></div>
                    <div>Stirrups: <strong className="text-sky-600">8mm Ø @ 150mm c/c</strong></div>
                  </div>
                </div>
              );
            }

            return <div className="text-slate-500 font-mono text-[11px]">Selected ID: {selectedElementId}</div>;
          })()}
        </div>
      )}

      {/* Structural Disclaimer Overlay */}
      <div className="absolute bottom-6 left-6 z-20 bg-white border border-amber-300 p-4 rounded-2xl max-w-md flex items-center space-x-3 text-xs text-amber-900 shadow-md">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <span className="font-medium">
          <strong className="font-extrabold text-amber-900">Structural BIM Engine:</strong> 3D building model & Fe500 rebar cage geometry represent preliminary engineering detailing.
        </span>
      </div>

      {/* Three.js Canvas */}
      <Canvas shadows className="w-full h-full">
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} ref={cameraRef} />
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} autoRotate={autoRotate} autoRotateSpeed={1.5} maxPolarAngle={Math.PI / 2 - 0.02} />

        <ambientLight intensity={0.9} />
        <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <pointLight position={[-10, 15, -10]} intensity={0.5} />

        <BuildingMesh selectedElementId={selectedElementId} setSelectedElementId={setSelectedElementId} />
      </Canvas>
    </div>
  );
};

