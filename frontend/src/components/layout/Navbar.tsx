import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { UnitType } from '../../types';
import { Compass, Plus, Scan, Menu, X, Cpu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, unit, setUnit, isMobileMenuOpen, toggleMobileMenu } = useProjectStore();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Mobile Menu Toggle & Brand Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5 h-5" />}
        </button>

        <div 
          className="flex items-center space-x-2.5 cursor-pointer group" 
          onClick={() => setActiveTab('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                VastuPlan AI
              </span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                BIM Studio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Status (Desktop) */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-600 font-medium">AI Engine</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-700 font-semibold flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          Vastu Purusha 81-Pad Active
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Unit Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(['feet', 'meter', 'inch'] as UnitType[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-2 py-1 rounded text-xs font-medium uppercase transition-all ${
                unit === u
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {u === 'feet' ? 'ft' : u === 'meter' ? 'm' : 'in'}
            </button>
          ))}
        </div>

        {/* CV Import Button */}
        <button
          onClick={() => setActiveTab('vision')}
          className="hidden sm:flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
        >
          <Scan className="w-3.5 h-3.5 text-blue-600" />
          <span>Vision Import</span>
        </button>

        {/* New Project Button */}
        <button
          onClick={() => setActiveTab('wizard')}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Floor Plan</span>
        </button>
      </div>
    </header>
  );
};

