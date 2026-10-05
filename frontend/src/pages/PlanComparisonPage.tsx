import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { BarChart2, Check, ArrowRight, Award, ShieldCheck, Sparkles, Box } from 'lucide-react';

export const PlanComparisonPage: React.FC = () => {
  const { currentProject, selectedPlan, setSelectedPlan, setActiveTab } = useProjectStore();

  if (!currentProject || !selectedPlan) {
    return (
      <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center bg-animated-grid">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-float">
          <BarChart2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-white">No Floor Plan Generated</h3>
        <p className="text-sm text-slate-400 mt-2 mb-6 max-w-md">Configure project inputs in the wizard to generate your master floor plan layout.</p>
        <button
          onClick={() => setActiveTab('wizard')}
          className="shimmer-btn bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
        >
          Create Floor Plan
        </button>
      </div>
    );
  }

  const plan = selectedPlan;

  return (
    <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-950 py-6 sm:py-10 px-3 sm:px-6 bg-animated-grid">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-slide-up">
        
        {/* Header */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2 sm:space-x-3">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 shrink-0" />
              <span>Master Layout Analytics & Vastu Audit</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Detailed breakdown of space utilization, Vastu score, and structural grid alignment</p>
          </div>
          
          <div className="bg-emerald-950/80 px-3.5 py-1.5 rounded-2xl border border-emerald-500/40 flex items-center space-x-2 text-xs font-mono text-emerald-300 shrink-0">
            <Award className="w-4 h-4 text-amber-400" />
            <span>VASTU SCORE: {plan.vastu_score}/100</span>
          </div>
        </div>

        {/* Master Plan Card */}
        <div className="glass-panel-glow p-4 sm:p-8 rounded-3xl space-y-6 sm:space-y-8 border-indigo-500/30">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-black uppercase text-gradient-cyan tracking-widest font-mono">Clean & Beautiful Layout</span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{plan.name}</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentProject.plot.floors_count || 1} Story &bull; Facing: {currentProject.plot.orientation} &bull; {plan.rooms.length} Configured Rooms</p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('editor2d')}
                className="shimmer-btn flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all"
              >
                <span>2D Blueprint</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={() => setActiveTab('viewer3d')}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-indigo-500/30 font-extrabold px-5 py-3 rounded-2xl text-sm transition-all"
              >
                <Box className="w-4 h-4 text-cyan-400" />
                <span>3D Studio</span>
              </button>
            </div>
          </div>

          {/* Metric Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/20 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Vastu Compliance</span>
                <span className="text-emerald-400 font-mono text-sm font-extrabold">{plan.vastu_score}%</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${plan.vastu_score}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/20 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Space Utilization</span>
                <span className="text-cyan-400 font-mono text-sm font-extrabold">{plan.space_utilization_score}%</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${plan.space_utilization_score}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/20 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Structural Grid Alignment</span>
                <span className="text-indigo-400 font-mono text-sm font-extrabold">{plan.structural_score}%</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${plan.structural_score}%` }} />
              </div>
            </div>
          </div>

          {/* Vastu Observations */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Vastu Compliant Placement Analysis</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.vastu_report.positive_observations.map((obs, i) => (
                <div key={i} className="flex items-start space-x-3 bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/15">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200 font-medium leading-relaxed">{obs}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
