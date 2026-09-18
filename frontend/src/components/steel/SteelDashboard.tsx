import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  ShieldAlert, Box, Layers, BarChart2, CheckCircle2, AlertTriangle, FileText, Download, Award
} from 'lucide-react';

export const SteelDashboard: React.FC = () => {
  const { selectedPlan, setActiveTab } = useProjectStore();

  if (!selectedPlan) return null;

  const struct = selectedPlan.structure;
  const q = struct.quantity_summary;
  const clashes = struct.clashes;
  const status = struct.engineer_review?.status || 'AI_GENERATED';

  return (
    <div className="space-y-6">
      {/* Top Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Steel Weight</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {q.total_weight_kg} kg <span className="text-xs font-normal text-slate-400">({q.total_weight_tonnes} tonnes)</span>
          </div>
          <p className="text-[11px] text-slate-400">Derived via W = (D²/162.2) × L formula</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Structural Elements</span>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono">
            {struct.columns.length} Cols &bull; {struct.beams.length} Beams
          </div>
          <p className="text-[11px] text-slate-400">{struct.slabs.length} Slabs &bull; {struct.footings.length} Footings</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clash Detection Status</span>
          <div className={`text-2xl font-extrabold font-mono ${clashes.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {clashes.length} {clashes.length === 1 ? 'Issue' : 'Issues'} Detected
          </div>
          <p className="text-[11px] text-slate-400">Rebar cover, opening & clearance checks</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engineering Status</span>
          <div className="text-sm font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 inline-block">
            {status}
          </div>
          <p className="text-[11px] text-slate-400">Preliminary engineering visualization</p>
        </div>
      </div>

      {/* Breakdown by Element Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Reinforcement Weight Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Column Reinforcement</span>
                <span className="text-emerald-400 font-mono">{q.column_weight_kg} kg</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (q.column_weight_kg / max(1, q.total_weight_kg)) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Beam Reinforcement</span>
                <span className="text-indigo-400 font-mono">{q.beam_weight_kg} kg</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (q.beam_weight_kg / max(1, q.total_weight_kg)) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Slab Reinforcement</span>
                <span className="text-cyan-400 font-mono">{q.slab_weight_kg} kg</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (q.slab_weight_kg / max(1, q.total_weight_kg)) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Footing Reinforcement</span>
                <span className="text-amber-400 font-mono">{q.footing_weight_kg} kg</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (q.footing_weight_kg / max(1, q.total_weight_kg)) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Quick Engineering Workspaces</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button onClick={() => setActiveTab('viewer3d')} className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-left font-bold text-slate-200 hover:border-emerald-500/50 transition-all">
              <Box className="w-5 h-5 text-indigo-400 mb-1" />
              <span>3D Steel Viewer</span>
            </button>
            <button onClick={() => setActiveTab('report')} className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-left font-bold text-slate-200 hover:border-emerald-500/50 transition-all">
              <FileText className="w-5 h-5 text-emerald-400 mb-1" />
              <span>Bar Bending Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function max(a: number, b: number) {
  return a > b ? a : b;
}
