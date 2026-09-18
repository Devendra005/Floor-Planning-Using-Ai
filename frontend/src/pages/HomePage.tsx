import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { createProjectApi, DEMO_PLOT, DEMO_REQUIREMENTS } from '../services/api';
import {
  Compass, Sparkles, LayoutGrid, Box, Layers, ShieldCheck, CheckCircle2, ArrowRight, PlayCircle, Zap, Cpu, Award
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActiveTab, setCurrentProject } = useProjectStore();

  const handleLaunchDemo = async () => {
    const demoProj = await createProjectApi({
      name: 'Sample Demo Villa (30 x 40 ft East Facing)',
      description: 'Pre-configured 2BHK residential home with Puja Room, Kitchen & Parking',
      project_type: 'Residential Single Family',
      location: 'Bangalore, India',
      plot: DEMO_PLOT,
      requirements: DEMO_REQUIREMENTS,
      vastu_profile: 'traditional-basic',
      weights: { vastu: 0.35, space_utilization: 0.20, circulation: 0.15, adjacency: 0.15, structural_alignment: 0.10, daylight_ventilation: 0.05 }
    });
    setCurrentProject(demoProj);
    setActiveTab('editor2d');
  };

  return (
    <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-50 text-slate-900 flex flex-col justify-between overflow-hidden">
      {/* Hero Section with Aurora Light Mesh & Animated Grid */}
      <div className="relative overflow-hidden pt-16 pb-20 px-6 border-b border-slate-200 bg-animated-grid bg-aurora-mesh">
        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Animated Levitating Floating Badge */}
          <div className="inline-flex items-center space-x-2.5 bg-white border border-blue-200 px-4 py-2 rounded-full text-blue-700 text-xs font-extrabold uppercase tracking-widest shadow-sm animate-float backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-gradient-cyan font-mono font-black">Next-Gen AI Architectural BIM Engine</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* Animated Hero Headline */}
          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-slate-900 leading-none">
            Architectural Precision Powered by <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">
              AI & Vastu Shastra
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Generate intelligent 2D residential layouts with zero overlap guarantee, evaluate 81-pad Vastu Purusha Mandala compliance, and view interactive 3D structural steel reinforcement.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <button
              onClick={() => setActiveTab('wizard')}
              className="shimmer-btn w-full sm:w-auto flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-9 py-4 rounded-2xl text-base font-extrabold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 border border-blue-500"
            >
              <Zap className="w-5 h-5 fill-current text-white" />
              <span>Create Floor Plan Now</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            <button
              onClick={handleLaunchDemo}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-7 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105 shadow-sm"
            >
              <PlayCircle className="w-5 h-5 text-blue-600 animate-pulse" />
              <span>Explore Demo (30×40 ft Villa)</span>
            </button>
          </div>

          {/* Floating Metric Badges */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm hover:border-blue-300 transition-colors">
              <p className="text-2xl font-black text-blue-600 font-mono">100%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Zero Room Overlap</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm hover:border-purple-300 transition-colors">
              <p className="text-2xl font-black text-purple-600 font-mono">81-Pad</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Vastu Purusha Grid</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm hover:border-emerald-300 transition-colors">
              <p className="text-2xl font-black text-emerald-600 font-mono">60 FPS</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">3D BIM Visualizer</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm hover:border-indigo-300 transition-colors">
              <p className="text-2xl font-black text-indigo-600 font-mono">Rebar Mesh</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">IS 456 Structural</p>
            </div>
          </div>

        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="max-w-7xl mx-auto px-6 py-14 w-full">
        <h2 className="text-2xl md:text-3xl font-black text-center text-slate-900 mb-3 tracking-tight">
          Core Engine Capabilities
        </h2>
        <p className="text-center text-slate-600 text-sm mb-10 max-w-xl mx-auto font-medium">
          Multi-objective genetic layout optimization, transparent rule-based Vastu scoring, and automatic structural column-beam mesh generation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-3xl space-y-4 border border-slate-200 shadow-md relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-all">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
              AI Genetic Floor Plan Solver
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Multi-objective Genetic Algorithm layout solver that places rooms inside plot setbacks with minimum vector displacement force relaxation to guarantee 100% zero overlaps.
            </p>
            <div className="pt-2 flex items-center text-xs font-extrabold text-blue-600 space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Explore AI Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl space-y-4 border border-slate-200 shadow-md relative overflow-hidden group hover:border-purple-400 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-all">
              <Compass className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
              Transparent Vastu Engine
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Rule-based evaluation across 34+ room categories using 9-zone and 81-pad Vastu Purusha Mandala overlays with transparent mathematical scoring and recommendations.
            </p>
            <div className="pt-2 flex items-center text-xs font-extrabold text-purple-600 space-x-1 group-hover:translate-x-1 transition-transform">
              <span>View Vastu Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl space-y-4 border border-slate-200 shadow-md relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-all">
              <Box className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Interactive 3D BIM & Steel Mesh
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Convert 2D plans into Three.js 3D architectural models with preliminary structural columns, beams, footings, and Fe500 rebar reinforcement visualization.
            </p>
            <div className="pt-2 flex items-center text-xs font-extrabold text-emerald-600 space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Open 3D Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
