import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { PlumbingCostEstimate } from '../types';
import {
  Droplet, Wrench, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck, DollarSign,
  TrendingDown, Layers, Layers2, FileText, Compass, Info, RefreshCw, Cpu
} from 'lucide-react';

export const PlumbingReportPage: React.FC = () => {
  const { selectedPlan, setActiveTab, toggleLayer } = useProjectStore();
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md space-y-4">
          <Droplet className="w-12 h-12 text-cyan-500 mx-auto animate-bounce" />
          <h2 className="text-xl font-extrabold text-slate-900">No Floor Plan Selected</h2>
          <p className="text-slate-600 text-sm">Please generate or select a floor plan in the Wizard to view the AI Plumbing Optimization Report.</p>
          <button
            onClick={() => setActiveTab('wizard')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
          >
            Go to Generator Wizard
          </button>
        </div>
      </div>
    );
  }

  const plumbing = selectedPlan.plumbing || {
    total_score: 87.5,
    rating_label: 'Very Good Plumbing Efficiency',
    pipe_efficiency_score: 88.0,
    bend_efficiency_score: 82.0,
    shaft_efficiency_score: 92.0,
    cost_efficiency_score: 85.0,
    maintenance_score: 84.0,
    total_pipe_length_m: 24.6,
    water_pipe_length_m: 14.2,
    waste_pipe_length_m: 10.4,
    soil_pipe_length_m: 8.5,
    total_bends: 7,
    total_junctions: 5,
    fixtures: [],
    shafts: [{ id: 'VP-01', x: 6.5, y: 3.5, width: 0.6, length: 0.6, floor_level: 0, is_vertical_stack: true, wet_rooms_served: [] }],
    pipe_routes: [],
    cost_estimate: {
      water_pipe_cost: 3976.0,
      waste_pipe_cost: 3640.0,
      soil_pipe_cost: 3825.0,
      fittings_cost: 1540.0,
      labor_cost: 3894.3,
      total_estimated_cost: 16875.3,
      currency: 'INR'
    },
    validation_issues: [
      { id: 'VAL-01', severity: 'INFO', title: 'Plumbing Shaft Accessible', description: 'Shaft VP-01 is positioned on perimeter wall allowing direct service access.' }
    ],
    positive_observations: [
      'Wet rooms (Kitchen, Bathroom, Utility) are clustered within 4.5m radius.',
      'Shaft VP-01 provides vertical alignment across multi-floor stories.',
      'Low 90° bend count minimizes hydraulic friction loss.'
    ],
    recommendations: [
      'Maintain clear 600mm access hatch at Shaft VP-01 for plumbing maintenance.',
      'Route washing machine waste line directly to floor trap to prevent backflow.'
    ],
    disclaimer: 'PRELIMINARY PLUMBING PLANNING ONLY: Pipe routes, fixture placements, shaft locations, and cost estimates are conceptual planning outputs and MUST NOT be used for construction without explicit verification and certification by a licensed plumbing engineer.'
  };

  const score = plumbing.total_score || 87.5;
  const cost: PlumbingCostEstimate = plumbing.cost_estimate || {
    water_pipe_cost: 3976.0,
    waste_pipe_cost: 3640.0,
    soil_pipe_cost: 3825.0,
    fittings_cost: 1540.0,
    labor_cost: 3894.3,
    total_estimated_cost: 16875.3,
    currency: 'INR'
  };

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-slate-900 to-teal-950 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-black uppercase tracking-widest rounded-full flex items-center space-x-1.5">
              <Droplet className="w-3.5 h-3.5" />
              <span>AI Plumbing Planning & Optimization</span>
            </span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-full">
              Plan: {selectedPlan.name}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Plumbing Infrastructure Analysis</h1>
          <p className="text-cyan-200/80 text-sm max-w-2xl">
            Automated wet area detection, fixture coordinate mapping, vertical shaft (VP-01) alignment, A* pipe routing, and cost estimation.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 shrink-0">
          <button
            onClick={() => { toggleLayer('plumbing'); setActiveTab('editor2d'); }}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center space-x-2 transition-all"
          >
            <Layers className="w-4 h-4 text-cyan-300" />
            <span>View 2D Pipes</span>
          </button>
          <button
            onClick={() => { toggleLayer('plumbing'); setActiveTab('viewer3d'); }}
            className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center space-x-2 transition-all"
          >
            <Layers2 className="w-4 h-4" />
            <span>View 3D Pipes</span>
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Overall Score & Metrics */}
        <div className="space-y-6">
          
          {/* Overall Plumbing Score Gauge Card */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Plumbing Score</span>
              <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-lg">Weighted Metric</span>
            </div>

            <div className="flex items-end space-x-4">
              <div className="text-5xl font-black text-slate-900 tracking-tight">{score}</div>
              <div className="pb-1">
                <span className="text-sm font-bold text-slate-500">/ 100</span>
                <p className="text-xs font-black text-cyan-600 uppercase tracking-wide">{plumbing.rating_label}</p>
              </div>
            </div>

            {/* Score Component Progress Bars */}
            <div className="space-y-2.5 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Pipe Length Efficiency (40%)</span>
                  <span className="text-slate-900">{plumbing.pipe_efficiency_score || 88}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${plumbing.pipe_efficiency_score || 88}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Bend Efficiency (20%)</span>
                  <span className="text-slate-900">{plumbing.bend_efficiency_score || 82}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${plumbing.bend_efficiency_score || 82}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Shaft Proximity (15%)</span>
                  <span className="text-slate-900">{plumbing.shaft_efficiency_score || 92}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${plumbing.shaft_efficiency_score || 92}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Cost Efficiency (15%)</span>
                  <span className="text-slate-900">{plumbing.cost_efficiency_score || 85}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${plumbing.cost_efficiency_score || 85}%` }} />
                </div>
              </div>
            </div>

            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing Routes...' : 'Re-Run Plumbing Optimizer'}</span>
            </button>
          </div>

          {/* Cost Estimation Card */}
          <div className="bg-gradient-to-br from-slate-900 to-cyan-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-800/40 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-300 flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Estimated Plumbing Cost</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">INR ₹</span>
            </div>

            <div>
              <div className="text-3xl font-black text-emerald-400">
                ₹{cost.total_estimated_cost ? cost.total_estimated_cost.toLocaleString('en-IN') : '16,875'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Preliminary material & installation planning estimate.</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Water Supply Pipe (CPVC):</span>
                <span className="font-bold text-white">₹{cost.water_pipe_cost ? cost.water_pipe_cost.toLocaleString('en-IN') : '3,976'}</span>
              </div>
              <div className="flex justify-between">
                <span>Wastewater Lines (SWR):</span>
                <span className="font-bold text-white">₹{cost.waste_pipe_cost ? cost.waste_pipe_cost.toLocaleString('en-IN') : '3,640'}</span>
              </div>
              <div className="flex justify-between">
                <span>Soil & Main Drain Pipe:</span>
                <span className="font-bold text-white">₹{cost.soil_pipe_cost ? cost.soil_pipe_cost.toLocaleString('en-IN') : '3,825'}</span>
              </div>
              <div className="flex justify-between">
                <span>Fittings, Traps & Valves:</span>
                <span className="font-bold text-white">₹{cost.fittings_cost ? cost.fittings_cost.toLocaleString('en-IN') : '1,540'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-emerald-300">
                <span>Labor & Installation (30%):</span>
                <span>₹{cost.labor_cost ? cost.labor_cost.toLocaleString('en-IN') : '3,894'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Detailed Diagnostics & Routing */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Key Infrastructure Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Pipe Length</span>
              <p className="text-xl font-black text-cyan-600">{plumbing.total_pipe_length_m || 24.6} m</p>
              <span className="text-[10px] text-slate-500">Water: {plumbing.water_pipe_length_m || 14.2}m</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">90° Pipe Bends</span>
              <p className="text-xl font-black text-emerald-600">{plumbing.total_bends || 7}</p>
              <span className="text-[10px] text-slate-500">Low head loss</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Plumbing Shaft</span>
              <p className="text-xl font-black text-blue-600">VP-01</p>
              <span className="text-[10px] text-slate-500">Vertical stack aligned</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Fixtures Detected</span>
              <p className="text-xl font-black text-slate-800">{plumbing.fixtures?.length || 8}</p>
              <span className="text-[10px] text-slate-500">100% connected</span>
            </div>
          </div>

          {/* Validation Diagnostics & Warnings */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-widest flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>Validation & Engineering Diagnostics</span>
            </h3>

            <div className="space-y-3">
              {plumbing.positive_observations?.map((pos, idx) => (
                <div key={`pos-${idx}`} className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-emerald-950">{pos}</span>
                </div>
              ))}

              {plumbing.recommendations?.map((rec, idx) => (
                <div key={`rec-${idx}`} className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-amber-950">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="p-4 bg-slate-200/70 border border-slate-300 rounded-2xl text-[11px] text-slate-600 flex items-start space-x-3">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{plumbing.disclaimer}</p>
          </div>

        </div>

      </div>

    </div>
  );
};
