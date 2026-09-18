import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { UnitType } from '../../types';
import {
  Compass, Sparkles, PlusCircle, Scan, CheckCircle2, Cpu, Zap
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, unit, setUnit, currentProject, selectedPlan } = useProjectStore();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm select-none">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center shadow-md shrink-0">
            <Compass className="w-6 h-6 text-white group-hover:rotate-45 transition-transform duration-500 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <h1 className="font-black text-lg tracking-wider font-mono text-slate-900 group-hover:text-blue-600 transition-colors">
            VASTUCRAFT AI
          </h1>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 flex items-center space-x-1">
            <Zap className="w-3 h-3 inline text-amber-500 animate-bounce" />
            <span>Intelligent BIM & Vastu Studio</span>
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-2.5 text-xs font-mono">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-slate-800 font-extrabold tracking-wide flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>AI CORE: ACTIVE</span>
          </span>
        </div>

        <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-1.5 text-xs text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-700">AUTO-SYNCED</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Unit Selector Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['feet', 'meter', 'inch', 'centimeter', 'millimeter'] as UnitType[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
                unit === u
                  ? 'bg-blue-600 text-white shadow-sm scale-105'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {u === 'feet' ? 'ft' : u === 'meter' ? 'm' : u === 'inch' ? 'in' : u === 'centimeter' ? 'cm' : 'mm'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveTab('vision')}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-all"
        >
          <Scan className="w-4 h-4 text-blue-600" />
          <span>CV Import</span>
        </button>

        <button
          onClick={() => setActiveTab('wizard')}
          className="shimmer-btn flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
