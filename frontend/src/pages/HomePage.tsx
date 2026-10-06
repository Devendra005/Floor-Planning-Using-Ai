import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { createProjectApi, DEMO_PLOT, DEMO_REQUIREMENTS } from '../services/api';
import {
  Compass, Sparkles, LayoutGrid, Box, Layers, ArrowRight, Play, Plus, Zap, Image, Droplet, FileText, CheckCircle2
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActiveTab, setCurrentProject, selectedPlan } = useProjectStore();
  const [generationError, setGenerationError] = React.useState<string | null>(null);

  const handleLaunchDemo = async () => {
    setGenerationError(null);
    try {
      const demoProj = await createProjectApi({
        name: 'Sample Villa (30 × 40 ft East Facing)',
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
    } catch (err) {
      console.error('Failed to load demo project:', err);
      setGenerationError(
        err instanceof Error ? err.message : 'Unable to load the demo project. Check that the backend is running.'
      );
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      
      {/* 1. Welcome Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-2xs relative overflow-hidden bg-arch-grid">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Architecture & Vastu Studio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Design your next floor plan.
          </h1>

          <p className="text-slate-600 text-base leading-relaxed">
            Generate 2D residential floor plans optimized with AI genetic algorithms and 81-pad Vastu Purusha Mandala principles. View full 3D models, structural steel, and plumbing networks.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('wizard')}
              className="btn-accent px-5 py-2.5 text-sm flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Floor Plan</span>
            </button>

            <button
              onClick={handleLaunchDemo}
              className="btn-secondary px-4 py-2.5 text-sm flex items-center space-x-2"
            >
              <Play className="w-4 h-4 text-blue-600 fill-current" />
              <span>Explore Demo (30×40 ft Villa)</span>
            </button>
          </div>
          {generationError && (
            <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {generationError}
            </div>
          )}
        </div>
      </div>

      {/* 2. Quick Workspaces & Tools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Workspaces & Tools</h2>
          <span className="text-xs text-slate-500 font-medium">Select a tool to launch studio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            onClick={() => setActiveTab('wizard')}
            className="arch-card-interactive p-5 text-left flex flex-col justify-between space-y-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                AI Layout Generator
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure plot dimensions, room specs, and Vastu rules to generate plans.
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-600 flex items-center space-x-1 pt-1">
              <span>Start Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab(selectedPlan ? 'editor2d' : 'wizard')}
            className="arch-card-interactive p-5 text-left flex flex-col justify-between space-y-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                2D Blueprint Studio
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Interactive CAD editor for room repositioning, dimensions, and wall layers.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 group-hover:text-blue-600 flex items-center space-x-1 pt-1">
              <span>Open Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab(selectedPlan ? 'viewer3d' : 'wizard')}
            className="arch-card-interactive p-5 text-left flex flex-col justify-between space-y-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                3D BIM Visualizer
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time 3D architectural rendering with cutaway controls and materials.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 group-hover:text-blue-600 flex items-center space-x-1 pt-1">
              <span>View 3D Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab(selectedPlan ? 'report' : 'wizard')}
            className="arch-card-interactive p-5 text-left flex flex-col justify-between space-y-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Vastu Analysis
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Transparent 81-pad mandala scoring, zone checks, and recommendations.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 group-hover:text-blue-600 flex items-center space-x-1 pt-1">
              <span>View Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>
      </div>

      {/* 3. Core Engine Features Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="arch-card p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero Overlap Guarantee</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-objective layout solver uses vector displacement relaxation to ensure rooms fit cleanly within plot setbacks.
          </p>
        </div>

        <div className="arch-card p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>81-Pad Vastu Mandala</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automatic direction checking for North-East (Eshanya), South-East (Agneya), and South-West (Nairrutya) zones.
          </p>
        </div>

        <div className="arch-card p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>IS 456 Steel Detailing</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Structural column and beam reinforcement mapping with bar bending schedules and 3D rebar visualization.
          </p>
        </div>
      </div>

    </div>
  );
};
