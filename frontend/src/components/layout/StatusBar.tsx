import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { ShieldAlert, Crosshair, Grid, Layers } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { unit, zoom, activeFloor, snapSettings } = useProjectStore();

  return (
    <footer className="h-9 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[11px] text-slate-600 font-mono shrink-0 z-30 select-none">
      {/* Left X/Y Coordinates & Active Floor */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-blue-700 font-extrabold">
          <Crosshair className="w-3.5 h-3.5" />
          <span>X: 12.42 {unit === 'feet' ? 'ft' : 'm'} | Y: 8.17 {unit === 'feet' ? 'ft' : 'm'}</span>
        </div>

        <span className="text-slate-300">|</span>

        <div className="flex items-center space-x-1 text-indigo-700 font-extrabold">
          <Layers className="w-3.5 h-3.5" />
          <span>FLOOR: {activeFloor}</span>
        </div>
      </div>

      {/* Middle Safety Disclaimer */}
      <div className="hidden md:flex items-center space-x-1.5 text-amber-800 text-[10px] font-bold">
        <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
        <span>PRELIMINARY BIM & STEEL DETAILED VISUALIZER &bull; ENGINEER CERTIFICATION MANDATORY</span>
      </div>

      {/* Right Controls & Snap indicators */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1 text-slate-700 font-bold">
          <Grid className="w-3.5 h-3.5 text-emerald-600" />
          <span>SNAP: {snapSettings.grid ? 'GRID' : 'OFF'}</span>
        </div>

        <span className="text-slate-300">|</span>

        <span className="text-emerald-700 font-extrabold">{Math.round(zoom * 100)}% ZOOM</span>
      </div>
    </footer>
  );
};
