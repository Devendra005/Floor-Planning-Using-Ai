import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-400">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-200">AI Vastu Planner</strong> &bull; AI-Assisted Floor Planning & Vastu Knowledge System
          </span>
        </div>
        <div className="flex items-center space-x-2 text-amber-400/90 text-[11px] bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Disclaimer:</strong> Vastu Shastra is evaluated as a cultural/traditional planning framework. Structural outputs are preliminary visualizer geometry, not construction-ready certified design drawings.
          </span>
        </div>
      </div>
    </footer>
  );
};
