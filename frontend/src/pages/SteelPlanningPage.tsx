import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { InteractiveSteelView3D } from '../components/steel/InteractiveSteelView3D';
import { SteelDashboard } from '../components/steel/SteelDashboard';
import { BarBendingSchedule } from '../components/steel/BarBendingSchedule';
import { ClashDetectionStudio } from '../components/steel/ClashDetectionStudio';
import { SectionDetails2D } from '../components/steel/SectionDetails2D';
import { StructuralTreeExplorer } from '../components/steel/StructuralTreeExplorer';
import { RevisionReviewStudio } from '../components/steel/RevisionReviewStudio';
import {
  Layers, Box, BarChart2, ShieldAlert, FileText, FileSpreadsheet, Sliders, Award, Eye, Cpu
} from 'lucide-react';

export const SteelPlanningPage: React.FC = () => {
  const { currentProject, selectedPlan, setActiveTab } = useProjectStore();
  const [subTab, setSubTab] = useState<'3d_steel' | 'dashboard' | 'bbs' | 'clashes' | 'section2d' | 'tree' | 'review'>('3d_steel');

  if (!currentProject || !selectedPlan) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Active Structural Plan Loaded</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm">Create or load a floor plan to access the Steel & Reinforcement Detailing Studio.</p>
        <button
          onClick={() => setActiveTab('wizard')}
          className="btn-accent px-5 py-2.5 text-xs flex items-center space-x-2"
        >
          <span>Create Floor Plan</span>
        </button>
      </div>
    );
  }

  const subNav = [
    { id: '3d_steel', label: '3D Steel View', icon: Eye },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'bbs', label: 'Bar Bending Schedule', icon: FileSpreadsheet },
    { id: 'clashes', label: 'Clash Detection', icon: ShieldAlert },
    { id: 'section2d', label: '2D Sections', icon: FileText },
    { id: 'tree', label: 'Structural Tree', icon: Sliders },
    { id: 'review', label: 'Review', icon: Award }
  ];

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Module Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>IS 456 Structural BIM Detailing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Steel & Reinforcement Planning</h1>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
          {subNav.map((item) => {
            const Icon = item.icon;
            const isActive = subTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-View Render */}
      <main className="animate-fade-in">
        {subTab === '3d_steel' && <InteractiveSteelView3D />}
        {subTab === 'dashboard' && <SteelDashboard />}
        {subTab === 'bbs' && <BarBendingSchedule />}
        {subTab === 'clashes' && <ClashDetectionStudio />}
        {subTab === 'section2d' && <SectionDetails2D />}
        {subTab === 'tree' && <StructuralTreeExplorer />}
        {subTab === 'review' && <RevisionReviewStudio />}
      </main>

    </div>
  );
};

