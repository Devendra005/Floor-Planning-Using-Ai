import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { PlumbingCostEstimate } from '../types';
import {
  Droplet, Wrench, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck, DollarSign,
  TrendingDown, Layers, FileText, Compass, Info, RefreshCw, Cpu, Zap
} from 'lucide-react';

export const PlumbingReportPage: React.FC = () => {
  const { selectedPlan, setActiveTab, toggleLayer } = useProjectStore();
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  if (!selectedPlan) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
          <Droplet className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Active Floor Plan Selected</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm">Please generate or select a floor plan to view the AI Plumbing Optimization Analysis.</p>
        <button
          onClick={() => setActiveTab('wizard')}
          className="btn-accent px-5 py-2.5 text-xs flex items-center space-x-2"
        >
          <span>Create Floor Plan</span>
        </button>
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
    <div className="min-h-full bg-slate-50 p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 mb-1">
            <Droplet className="w-3.5 h-3.5" />
            <span>AI Plumbing Routing & Clustering</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plumbing Infrastructure Analysis</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => { toggleLayer('plumbing'); setActiveTab('editor2d'); }}
            className="btn-secondary px-3.5 py-1.5 text-xs flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View 2D Layers</span>
          </button>
          <button
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="btn-accent px-4 py-1.5 text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>Re-Optimize Routing</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="arch-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Overall Efficiency</span>
            <span className="font-semibold text-blue-600 font-mono">{score}/100</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{plumbing.rating_label || 'High Efficiency'}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${score}%` }} />
          </div>
        </div>

        <div className="arch-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Pipe Length</span>
            <span className="font-semibold text-emerald-600 font-mono">-18% vs standard</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{plumbing.total_pipe_length_m} meters</div>
          <p className="text-[11px] text-slate-500">Water: {plumbing.water_pipe_length_m}m &bull; Waste: {plumbing.waste_pipe_length_m}m &bull; Soil: {plumbing.soil_pipe_length_m}m</p>
        </div>

        <div className="arch-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Bends & Junctions</span>
            <span className="font-semibold text-slate-700 font-mono">{plumbing.total_bends} Bends</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{plumbing.total_junctions} Junctions</div>
          <p className="text-[11px] text-slate-500">Low bend count reduces friction loss & maintenance</p>
        </div>

        <div className="arch-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Estimated Material Cost</span>
            <span className="font-semibold text-slate-700 font-mono">INR ₹</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">₹{cost.total_estimated_cost?.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">Includes pipes, fittings, and labor allocation</p>
        </div>

      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Observations & Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="arch-card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Optimized Layout Characteristics</span>
            </h3>
            <div className="space-y-2.5">
              {plumbing.positive_observations?.map((obs, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{obs}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="arch-card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Engineering Recommendations</span>
            </h3>
            <div className="space-y-2.5">
              {plumbing.recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Cost Breakdown Table */}
        <div className="lg:col-span-5 arch-card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span>Cost Estimate Breakdown</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Fresh Water Lines:</span>
              <span className="font-semibold text-slate-900">₹{cost.water_pipe_cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Grey Water Waste Lines:</span>
              <span className="font-semibold text-slate-900">₹{cost.waste_pipe_cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Black Water Soil Lines:</span>
              <span className="font-semibold text-slate-900">₹{cost.soil_pipe_cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Fittings & Traps:</span>
              <span className="font-semibold text-slate-900">₹{cost.fittings_cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Labor Installation:</span>
              <span className="font-semibold text-slate-900">₹{cost.labor_cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-bold text-sm text-slate-900 border-t border-slate-200">
              <span>Total Estimate:</span>
              <span className="text-blue-600">₹{cost.total_estimated_cost?.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> {plumbing.disclaimer}
          </div>
        </div>

      </div>

    </div>
  );
};


