import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Layers, Sliders, ChevronRight, Box, ShieldCheck } from 'lucide-react';

export const StructuralTreeExplorer: React.FC = () => {
  const { selectedPlan, setActiveTab, explodedPercent, setExplodedPercent } = useProjectStore();

  if (!selectedPlan) return null;

  const struct = selectedPlan.structure;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>3D Vertical Exploded View Controller</span>
          </h3>
          <span className="font-mono text-emerald-400 font-bold text-sm">{explodedPercent}% Exploded</span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={explodedPercent}
            onChange={(e) => setExplodedPercent(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>0% (Assembled Building)</span>
            <span>50% (Separated Floors)</span>
            <span>100% (Fully Exploded Structural Mesh)</span>
          </div>
        </div>
      </div>

      {/* Structural Tree Explorer */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Building Structural Tree Hierarchy</span>
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <ChevronRight className="w-4 h-4" />
            <span>Building Project &bull; Ground Floor</span>
          </div>

          <div className="pl-6 space-y-1 text-slate-400">
            <div className="flex justify-between items-center p-1.5 hover:bg-slate-900 rounded">
              <span>├── Columns ({struct.columns.length} members)</span>
              <span className="text-indigo-400 font-bold">RC_COLUMN</span>
            </div>
            <div className="flex justify-between items-center p-1.5 hover:bg-slate-900 rounded">
              <span>├── Beams ({struct.beams.length} members)</span>
              <span className="text-indigo-400 font-bold">RC_BEAM</span>
            </div>
            <div className="flex justify-between items-center p-1.5 hover:bg-slate-900 rounded">
              <span>├── Slabs ({struct.slabs.length} panels)</span>
              <span className="text-cyan-400 font-bold">TWO_WAY</span>
            </div>
            <div className="flex justify-between items-center p-1.5 hover:bg-slate-900 rounded">
              <span>└── Footings ({struct.footings.length} pads)</span>
              <span className="text-amber-400 font-bold">ISOLATED_PAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
