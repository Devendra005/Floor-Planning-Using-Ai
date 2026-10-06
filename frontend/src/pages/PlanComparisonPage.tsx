import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { FloorPlanCandidate } from '../types';
import { Sparkles, Check, ArrowRight, Award, Image, Box, Layers } from 'lucide-react';

export const PlanComparisonPage: React.FC = () => {
  const { currentProject, selectedPlan, setSelectedPlan, setActiveTab } = useProjectStore();

  if (!currentProject || !currentProject.plans || currentProject.plans.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Floor Plans Generated Yet</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm">Use the AI Floor Plan Generator to configure your plot and create layout alternatives.</p>
        <button
          onClick={() => setActiveTab('wizard')}
          className="btn-accent px-5 py-2.5 text-xs flex items-center space-x-2"
        >
          <span>Create Floor Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const plans = currentProject.plans;

  const handleSelectPlan = (plan: FloorPlanCandidate) => {
    setSelectedPlan(plan);
    setActiveTab('editor2d');
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Layout Solver</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Floor Plan Alternatives</h1>
        </div>

        <span className="text-xs text-slate-500 font-medium font-mono">
          {plans.length} Unique Alternatives Generated
        </span>
      </div>

      {/* Alternatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const isSelected = selectedPlan?.id === plan.id;
          const letter = String.fromCharCode(65 + index); // Plan A, B, C...

          const bedCount = plan.rooms.filter(r => r.type.includes('bedroom')).length;
          const bathCount = plan.rooms.filter(r => r.type === 'toilet' || r.type === 'bathroom').length;

          return (
            <div 
              key={plan.id}
              className={`arch-card-interactive p-6 space-y-4 flex flex-col justify-between ${isSelected ? 'arch-card-active' : ''}`}
            >
              <div className="space-y-3">
                {/* Header Badge & Vastu Score */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    Plan {letter}
                  </span>

                  <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200 text-xs font-semibold font-mono">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Vastu {plan.vastu_score}/100</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{plan.name || `Alternative Layout ${letter}`}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bedCount} BHK &bull; {bathCount} Baths &bull; {plan.rooms.length} Rooms Total
                  </p>
                </div>

                {/* Score breakdown metrics */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Space Efficiency:</span>
                    <span className="font-semibold text-slate-900">{plan.space_utilization_score}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Structural Grid:</span>
                    <span className="font-semibold text-slate-900">{plan.structural_score}%</span>
                  </div>
                </div>

                {/* Key Observations / Features */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Key Vastu Features</span>
                  <div className="space-y-1">
                    {plan.vastu_report?.positive_observations?.slice(0, 3).map((obs, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{obs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-2">
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'btn-secondary'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Currently Selected' : 'Select Plan & Open 2D'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

