import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { ShieldAlert, Crosshair, Grid, Layers } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { unit, zoom, activeFloor, snapSettings } = useProjectStore();

  return (
    <footer className="h-8 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0 z-30 select-none">
      {/* Left X/Y Coordinates & Active Floor */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
          <Crosshair className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>X: 12.42 {unit === 'feet' ? 'ft' : 'm'} | Y: 8.17 {unit === 'feet' ? 'ft' : 'm'}</span>
        </div>

        <span className="text-slate-300">|</span>

        <div className="flex items-center space-x-1 text-slate-700 font-medium">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Floor Level: {activeFloor}</span>
        </div>
      </div>

      {/* Middle Safety Disclaimer */}
      <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-slate-400">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Preliminary BIM & Vastu Layout Solver &bull; Professional Engineer Verification Mandatory</span>
      </div>

      {/* Right Controls & Snap indicators */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center space-x-1 text-slate-600">
          <Grid className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Snap: {snapSettings.grid ? 'Grid' : 'Off'}</span>
        </div>

        <span className="text-slate-300">|</span>

        <span className="font-semibold text-slate-700">{Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
};

