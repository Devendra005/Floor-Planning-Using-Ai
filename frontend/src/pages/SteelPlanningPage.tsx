import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { SteelDashboard } from '../components/steel/SteelDashboard';
import { BarBendingSchedule } from '../components/steel/BarBendingSchedule';
import { ClashDetectionStudio } from '../components/steel/ClashDetectionStudio';
import { SectionDetails2D } from '../components/steel/SectionDetails2D';
import { StructuralTreeExplorer } from '../components/steel/StructuralTreeExplorer';
import { RevisionReviewStudio } from '../components/steel/RevisionReviewStudio';
import {
  Layers, Box, BarChart2, ShieldAlert, FileText, FileSpreadsheet, Sliders, Award, Compass, Cpu
} from 'lucide-react';

export const SteelPlanningPage: React.FC = () => {
  const { currentProject, selectedPlan, setActiveTab } = useProjectStore();
  const [subTab, setSubTab] = useState<'dashboard' | 'bbs' | 'clashes' | 'section2d' | 'tree' | 'review'>('dashboard');

  if (!currentProject || !selectedPlan) {
    return (
      <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center bg-animated-grid">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-float">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-white">No Active Structural Plan Loaded</h3>
        <p className="text-sm text-slate-400 mt-2 mb-6 max-w-md">Create or load a floor plan to access the Steel & Reinforcement Detailing Studio.</p>
        <button
          onClick={() => setActiveTab('wizard')}
          className="shimmer-btn bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
        >
          Create Floor Plan
        </button>
      </div>
    );
  }

  const subNav = [
    { id: 'dashboard', label: 'Steel Dashboard', icon: BarChart2 },
    { id: 'bbs', label: 'Bar Bending Schedule (BBS)', icon: FileSpreadsheet },
    { id: 'clashes', label: 'Clash Detection', icon: ShieldAlert },
    { id: 'section2d', label: '2D CAD Sections', icon: FileText },
    { id: 'tree', label: 'Structural Tree & Exploded', icon: Sliders },
    { id: 'review', label: 'Engineer Review', icon: Award }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-950 py-8 px-6 bg-animated-grid">
      <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
        
        {/* Module Header */}
        <div className="glass-panel p-6 rounded-3xl border-indigo-500/30 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shadow-2xl">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-widest font-mono mb-1">
              <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>IS 456 / SP 34 Structural BIM Detailing</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Steel & Reinforcement Planning Studio</h2>
          </div>

          {/* Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center bg-slate-950 p-1.5 rounded-2xl border border-indigo-500/20 gap-1.5 shadow-inner">
            {subNav.map((item) => {
              const Icon = item.icon;
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSubTab(item.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sub-View Render */}
        <main className="animate-scale-pop">
          {subTab === 'dashboard' && <SteelDashboard />}
          {subTab === 'bbs' && <BarBendingSchedule />}
          {subTab === 'clashes' && <ClashDetectionStudio />}
          {subTab === 'section2d' && <SectionDetails2D />}
          {subTab === 'tree' && <StructuralTreeExplorer />}
          {subTab === 'review' && <RevisionReviewStudio />}
        </main>
      </div>
    </div>
  );
};
