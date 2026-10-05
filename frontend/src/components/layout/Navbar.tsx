import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { UnitType } from '../../types';
import {
  Compass, Sparkles, PlusCircle, Scan, CheckCircle2, Cpu, Zap, Menu, X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, unit, setUnit, isMobileMenuOpen, toggleMobileMenu } = useProjectStore();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm select-none">
      {/* Left: Mobile Menu Hamburger & Brand Header */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
          aria-label="Toggle Mobile Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center space-x-2.5 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-45 transition-transform duration-500 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h1 className="font-black text-base sm:text-lg tracking-wider font-mono text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
              VASTUCRAFT AI
            </h1>
            <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-blue-600 flex items-center space-x-1">
              <Zap className="w-3 h-3 inline text-amber-500 animate-bounce" />
              <span className="hidden xs:inline">Intelligent BIM & Vastu Studio</span>
              <span className="xs:hidden">BIM Studio</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center Status Indicators (Desktop) */}
      <div className="hidden lg:flex items-center space-x-4">
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
      <div className="flex items-center space-x-1.5 sm:space-x-3">
        {/* Mobile Compact Dropdown Unit Selector */}
        <div className="sm:hidden">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitType)}
            className="bg-slate-100 border border-slate-300 rounded-lg text-xs font-black uppercase py-1 px-1.5 text-blue-700 font-mono focus:outline-none"
          >
            <option value="feet">ft</option>
            <option value="meter">m</option>
            <option value="inch">in</option>
            <option value="centimeter">cm</option>
            <option value="millimeter">mm</option>
          </select>
        </div>

        {/* Desktop Unit Selector Pills */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
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

        {/* CV Import Button */}
        <button
          onClick={() => setActiveTab('vision')}
          className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold border border-slate-300 transition-all shrink-0"
          title="CV Import Floor Plan"
        >
          <Scan className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">CV Import</span>
        </button>

        {/* New Project Button */}
        <button
          onClick={() => setActiveTab('wizard')}
          className="shimmer-btn flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline">New Project</span>
        </button>
      </div>
    </header>
  );
};
