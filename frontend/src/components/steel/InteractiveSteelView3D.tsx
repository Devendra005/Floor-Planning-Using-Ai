import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { BuildingViewer3D } from '../viewer3d/BuildingViewer3D';
import { RebarSpec, StructuralBeam } from '../../types';
import {
  Layers, Box, Eye, CheckCircle2, Search, Sliders, Focus, ShieldAlert,
  ChevronRight, RefreshCw, Compass, Maximize2, AlertTriangle, Cpu, Info
} from 'lucide-react';

export const InteractiveSteelView3D: React.FC = () => {
  const {
    selectedPlan, selectedStructuralId, setSelectedStructuralId,
    selectedBarMark, setSelectedBarMark, explodedPercent, setExplodedPercent,
    visualMode3D, setVisualMode3D
  } = useProjectStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | 'ALL'>('ALL');

  if (!selectedPlan || !selectedPlan.structure) {
    return (
      <div className="glass-panel p-8 rounded-3xl border-amber-500/30 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white">No Structural Model Available</h3>
        <p className="text-xs text-slate-400">Please generate or load a floor plan layout to inspect the steel reinforcement module.</p>
      </div>
    );
  }

  const beams: StructuralBeam[] = selectedPlan.structure.beams || [];
  const rebars: RebarSpec[] = selectedPlan.structure.rebars || [];

  // Helper to extract numeric index from ID for short Beam ID format (e.g. BM-01-F0 -> B1)
  const getShortBeamId = (bmId: string, fl?: number) => {
    const parts = bmId.split('-');
    for (const p of parts) {
      if (/^\d+$/.test(p)) {
        const num = parseInt(p, 10);
        return fl && fl > 0 ? `B${num}-F${fl}` : `B${num}`;
      }
    }
    return bmId;
  };

  // Filter beams
  const filteredBeams = beams.filter((bm) => {
    const shortId = getShortBeamId(bm.id, bm.floor);
    const matchesSearch = bm.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          shortId.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFloor = floorFilter === 'ALL' || (bm.floor || 0) === floorFilter;
    return matchesSearch && matchesFloor;
  });

  // Determine currently active/selected beam
  const selectedBeamId = selectedStructuralId && beams.some(b => b.id === selectedStructuralId)
    ? selectedStructuralId
    : (filteredBeams[0]?.id || beams[0]?.id || null);

  const selectedBeam = beams.find(b => b.id === selectedBeamId);
  const selectedBeamShortName = selectedBeam ? getShortBeamId(selectedBeam.id, selectedBeam.floor) : 'B1';

  // Get bars associated with the selected beam
  const beamBars = selectedBeam
    ? rebars.filter(r => r.element_id === selectedBeam.id || r.member_id === selectedBeam.id)
    : [];

  // Currently selected bar object
  const activeBarSpec = selectedBarMark ? rebars.find(r => r.bar_mark === selectedBarMark) : null;

  return (
    <div className="space-y-6">
      
      {/* Module Header & Quick Control HUD */}
      <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <span>Interactive 3D Steel Mapping & Rebar Inspector</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-[10px] font-mono border border-cyan-500/30 font-bold uppercase">
                IS 456 / SP 34
              </span>
            </h3>
            <p className="text-xs text-slate-400">Beam-to-Bar structural mapping, 3D Fe500 rebar cages & exploded view controller</p>
          </div>
        </div>

        {/* View Mode & Exploded Slider Quick Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 font-bold">Exploded View:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={explodedPercent}
              onChange={(e) => setExplodedPercent(Number(e.target.value))}
              className="accent-cyan-500 w-24 cursor-pointer"
            />
            <span className="text-cyan-400 font-extrabold w-8 text-right">{explodedPercent}%</span>
          </div>

          <button
            onClick={() => setVisualMode3D(visualMode3D === 'steel_only' ? 'transparent' : 'steel_only')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-md ${
              visualMode3D === 'steel_only'
                ? 'bg-red-600 text-white shadow-red-900/50 scale-105'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{visualMode3D === 'steel_only' ? 'Steel Frame View' : 'Concrete Ghost View'}</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop Dual-Column / Mobile Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Panel: Beam List & Selected Beam Bar Hierarchy */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          
          {/* Beam List Container */}
          <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Structural Beams ({filteredBeams.length})</span>
              </span>

              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-300 font-bold"
              >
                <option value="ALL">All Floors</option>
                {Array.from(new Set(beams.map(b => b.floor || 0))).sort().map(fl => (
                  <option key={fl} value={fl}>Floor {fl}</option>
                ))}
              </select>
            </div>

            {/* Beam Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Beam (e.g. B1, BM-01)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Scrollable Beam List Items */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
              {filteredBeams.map((bm) => {
                const sName = getShortBeamId(bm.id, bm.floor);
                const isSelected = selectedBeamId === bm.id;
                return (
                  <button
                    key={bm.id}
                    onClick={() => {
                      setSelectedStructuralId(bm.id);
                      // Select first bar of this beam if available
                      const firstBar = rebars.find(r => r.element_id === bm.id || r.member_id === bm.id);
                      if (firstBar) setSelectedBarMark(firstBar.bar_mark);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                      <span className="font-extrabold text-cyan-300">{sName}</span>
                      <span className="text-[10px] text-slate-400">({bm.id})</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      <span>{bm.span || 4.2}m span &bull; </span>
                      <span className="text-slate-300">{Math.round((bm.section_width || 0.23)*1000)}×{Math.round((bm.section_depth || 0.45)*1000)}mm</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Beam Summary & Bar Mapping Tree */}
          {selectedBeam && (
            <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 space-y-4 shadow-xl flex-1">
              
              {/* Selected Beam Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-indigo-400 font-mono font-extrabold uppercase tracking-widest block">Selected Structural Element</span>
                  <h4 className="text-base font-black text-white font-mono flex items-center space-x-2">
                    <span>Beam {selectedBeamShortName}</span>
                    <span className="text-xs text-slate-400 font-normal">({selectedBeam.id})</span>
                  </h4>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <div>Floor: <strong className="text-white">{selectedBeam.floor || 0}</strong></div>
                  <div>Span: <strong className="text-cyan-400">{selectedBeam.span || 4.2}m</strong></div>
                </div>
              </div>

              {/* Beam Section Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>Section Width: <strong className="text-white">{Math.round((selectedBeam.section_width || 0.23)*1000)} mm</strong></div>
                <div>Section Depth: <strong className="text-white">{Math.round((selectedBeam.section_depth || 0.45)*1000)} mm</strong></div>
                <div>Concrete Cover: <strong className="text-emerald-400">30 mm</strong></div>
                <div>Concrete Grade: <strong className="text-amber-400">M25</strong></div>
              </div>

              {/* Bar List for Selected Beam */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reinforcement Bars ({beamBars.length})</span>
                </span>

                <div className="space-y-1.5 font-mono text-xs">
                  {beamBars.map((bar) => {
                    const isBarSelected = selectedBarMark === bar.bar_mark;
                    return (
                      <button
                        key={bar.bar_mark}
                        onClick={() => setSelectedBarMark(isBarSelected ? null : bar.bar_mark)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isBarSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-white font-bold shadow-lg shadow-cyan-950/50 scale-[1.02]'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            bar.bar_type === 'BOTTOM' ? 'bg-amber-400' :
                            bar.bar_type === 'TOP' ? 'bg-blue-400' : 'bg-cyan-400'
                          }`} />
                          <div>
                            <div className="font-extrabold text-cyan-300 flex items-center space-x-1.5">
                              <span>{bar.bar_mark}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-sans">({bar.position || bar.bar_type})</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Ø{bar.diameter_mm}mm Fe500 &bull; {bar.count} Nos &bull; {bar.individual_length_m}m cut
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-emerald-400 block">{bar.weight_kg} kg</span>
                          {bar.spacing_mm && bar.spacing_mm > 0 && (
                            <span className="text-[9px] text-slate-400 block">@{bar.spacing_mm}mm c/c</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right Side 3D Model Viewer Canvas & Selected Bar Details Inspector */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* 3D Canvas Container */}
          <div className="glass-panel p-2 rounded-3xl border-indigo-500/30 overflow-hidden shadow-2xl relative min-h-[480px] lg:min-h-[560px] flex flex-col">
            <BuildingViewer3D />
          </div>

          {/* Selected Bar Details Inspector Card */}
          {activeBarSpec && (
            <div className="glass-panel p-5 rounded-2xl border-cyan-500/40 space-y-3 shadow-2xl animate-slide-up bg-slate-950/90">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-black text-white font-mono uppercase tracking-wider">
                    Bar Detailing Spec &bull; {activeBarSpec.bar_mark}
                  </span>
                </div>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  {activeBarSpec.position || activeBarSpec.bar_type}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Bar Mark / ID</span>
                  <span className="font-extrabold text-cyan-400 text-sm">{activeBarSpec.bar_mark}</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Parent Member ID</span>
                  <span className="font-extrabold text-white text-sm">{activeBarSpec.member_id || activeBarSpec.element_id}</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Diameter & Grade</span>
                  <span className="font-extrabold text-amber-400 text-sm">Ø{activeBarSpec.diameter_mm}mm {activeBarSpec.grade}</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Quantity</span>
                  <span className="font-extrabold text-white text-sm">{activeBarSpec.count} Nos</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Spacing / Cover</span>
                  <span className="font-extrabold text-white text-sm">
                    {activeBarSpec.spacing_mm ? `${activeBarSpec.spacing_mm}mm c/c` : '—'} ({activeBarSpec.cover_mm}mm cover)
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Cut Length</span>
                  <span className="font-extrabold text-white text-sm">{activeBarSpec.individual_length_m} m</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Length</span>
                  <span className="font-extrabold text-white text-sm">{activeBarSpec.total_length_m} m</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Steel Weight</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{activeBarSpec.weight_kg} kg</span>
                </div>
              </div>
            </div>
          )}

          {/* Structural Engineering Disclaimer Notice */}
          <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-2xl flex items-start space-x-3 text-xs text-amber-200/90 shadow-md">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-extrabold text-amber-400 block uppercase font-mono text-[11px]">Engineering & Structural Disclaimer:</strong>
              <p className="text-[11px] leading-relaxed">
                This 3D steel view provides preliminary structural detailing, rebar mapping, and visualization for AI-driven floor planning.
                Final rebar layouts, lap lengths, and load calculations must be reviewed and certified by a qualified structural engineer prior to construction.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
