import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { StructuralClash } from '../../types';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, MapPin } from 'lucide-react';

export const ClashDetectionStudio: React.FC = () => {
  const { selectedPlan, setActiveTab } = useProjectStore();

  if (!selectedPlan) return null;

  const clashes: StructuralClash[] = selectedPlan.structure.clashes;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Automated Structural Clash & Clearance Check</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time analysis of rebar congestion, cover limits, and member openings</p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono font-bold text-emerald-400">
          {clashes.length} Issues Flagged
        </div>
      </div>

      {clashes.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="font-bold text-slate-200">Zero Structural Clashes Detected</h4>
          <p className="text-xs text-slate-400">All member geometries and clear covers conform to preliminary engineering rules.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clashes.map((c) => (
            <div key={c.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${c.severity === 'CRITICAL' || c.severity === 'ERROR' ? 'text-red-400' : 'text-amber-400'}`} />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{c.clash_type}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      c.severity === 'ERROR' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{c.description}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('viewer3d')}
                className="flex items-center space-x-1 text-xs bg-slate-950 hover:bg-slate-800 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Locate in 3D</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
