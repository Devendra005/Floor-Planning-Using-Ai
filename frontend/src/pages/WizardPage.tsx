import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { PlotConfig, RoomRequirement, UnitType, OrientationType, VastuProfileType, OptimizationWeights } from '../types';
import { createProjectApi, generateMultipleLayoutsApi, DEMO_REQUIREMENTS } from '../services/api';
import { convertToMeters, convertFromMeters } from '../utils/units';
import { FloorPlanEditor2D } from '../components/editor2d/FloorPlanEditor2D';
import {
  Sparkles, ArrowRight, Compass, Plus, Trash2, Loader2, Zap, Layers,
  ChevronDown, ChevronUp, CheckCircle2, Sliders, Info
} from 'lucide-react';

export const WizardPage: React.FC = () => {
  const { setActiveTab, setCurrentProject, setUnit: setStoreUnit } = useProjectStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('My Architectural Home');
  const [description, setDescription] = useState('2-Story Vastu Compliant Residence');
  const [projectType, setProjectType] = useState('Residential Single Family');
  const [location, setLocation] = useState('India');

  // Plot State
  const [unit, setUnitState] = useState<UnitType>('feet');
  const [plotLengthUnit, setPlotLengthUnit] = useState<number>(40); // 40 ft
  const [plotWidthUnit, setPlotWidthUnit] = useState<number>(30);   // 30 ft
  const [floorsCount, setFloorsCount] = useState<number>(2);
  const [bedroomCount, setBedroomCount] = useState<number>(3);
  const [washroomCount, setWashroomCount] = useState<number>(2);
  const [hasPujaRoom, setHasPujaRoom] = useState<boolean>(true);
  const [hasLivingRoom, setHasLivingRoom] = useState<boolean>(true);
  const [hasMasterBedroom, setHasMasterBedroom] = useState<boolean>(true);

  // Multi-Plan Diversity State
  const [numPlans, setNumPlans] = useState<number>(5);
  const [vastuStrictness, setVastuStrictness] = useState<'STRICT' | 'BALANCED' | 'FLEXIBLE'>('BALANCED');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(70);

  // Orientation & Setbacks State
  const [orientation, setOrientation] = useState<OrientationType>('E');
  const [northAngle, setNorthAngle] = useState<number>(0);
  const [vastuMode, setVastuMode] = useState<'STRICT' | 'BALANCED' | 'FLEXIBLE'>('BALANCED');
  const [setbackFront, setSetbackFront] = useState<number>(4);
  const [setbackRear, setSetbackRear] = useState<number>(3);
  const [setbackLeft, setSetbackLeft] = useState<number>(3);
  const [setbackRight, setSetbackRight] = useState<number>(3);

  // Auto-build room requirements from inputs
  const buildRequirementsFromDirectInputs = (): RoomRequirement[] => {
    const reqs: RoomRequirement[] = [];
    let reqId = 1;

    if (hasLivingRoom) {
      reqs.push({
        id: `req-${reqId++}`, name: 'Living Room', room_type: 'living',
        min_width: 3.6, min_length: 4.2, preferred_width: 4.2, preferred_length: 4.8,
        priority: 1, quantity: 1, privacy_level: 'low', preferred_direction: 'NE', adjacent_to: ['entrance', 'dining']
      });
    }

    reqs.push({
      id: `req-${reqId++}`, name: 'Kitchen', room_type: 'kitchen',
      min_width: 2.4, min_length: 2.7, preferred_width: 2.7, preferred_length: 3.0,
      priority: 1, quantity: 1, privacy_level: 'medium', preferred_direction: 'SE', adjacent_to: ['dining']
    });

    if (hasPujaRoom) {
      reqs.push({
        id: `req-${reqId++}`, name: 'Puja Room', room_type: 'puja',
        min_width: 1.8, min_length: 1.8, preferred_width: 2.1, preferred_length: 2.1,
        priority: 1, quantity: 1, privacy_level: 'high', preferred_direction: 'NE', adjacent_to: []
      });
    }

    let remainingBeds = bedroomCount;
    if (hasMasterBedroom && remainingBeds > 0) {
      reqs.push({
        id: `req-${reqId++}`, name: 'Master Bedroom', room_type: 'master_bedroom',
        min_width: 3.3, min_length: 3.9, preferred_width: 3.6, preferred_length: 4.2,
        priority: 1, quantity: 1, privacy_level: 'high', preferred_direction: 'SW', adjacent_to: []
      });
      remainingBeds--;
    }

    for (let i = 0; i < remainingBeds; i++) {
      reqs.push({
        id: `req-${reqId++}`, name: `Bedroom ${i + (hasMasterBedroom ? 2 : 1)}`, room_type: 'bedroom',
        min_width: 3.0, min_length: 3.3, preferred_width: 3.3, preferred_length: 3.6,
        priority: 2, quantity: 1, privacy_level: 'high', preferred_direction: i % 2 === 0 ? 'NW' : 'W', adjacent_to: []
      });
    }

    for (let i = 0; i < washroomCount; i++) {
      const isMasterAttached = i === 0 && hasMasterBedroom;
      reqs.push({
        id: `req-${reqId++}`, name: isMasterAttached ? 'Master Washroom (Attached)' : `Washroom ${i + 1}`,
        room_type: 'toilet', min_width: 1.5, min_length: 2.1, preferred_width: 1.8, preferred_length: 2.4,
        priority: 1, quantity: 1, privacy_level: 'high', preferred_direction: 'NW', adjacent_to: isMasterAttached ? ['master_bedroom'] : []
      });
    }

    reqs.push({
      id: `req-${reqId++}`, name: 'Parking & Porch', room_type: 'parking',
      min_width: 3.0, min_length: 4.5, preferred_width: 3.3, preferred_length: 4.8,
      priority: 2, quantity: 1, privacy_level: 'low', preferred_direction: 'NW', adjacent_to: []
    });

    reqs.push({
      id: `req-${reqId++}`, name: 'Main Staircase', room_type: 'staircase',
      min_width: 2.2, min_length: 3.2, preferred_width: 2.4, preferred_length: 3.5,
      priority: 1, quantity: 1, privacy_level: 'low', preferred_direction: 'S', adjacent_to: ['living']
    });

    return reqs;
  };

  const [requirements, setRequirements] = useState<RoomRequirement[]>(DEMO_REQUIREMENTS);

  React.useEffect(() => {
    setRequirements(buildRequirementsFromDirectInputs());
  }, [bedroomCount, washroomCount, hasPujaRoom, hasLivingRoom, hasMasterBedroom]);

  // Vastu & Optimization Weights
  const [vastuProfile, setVastuProfile] = useState<VastuProfileType>('traditional-basic');
  const [weightVastu, setWeightVastu] = useState<number>(35);
  const [weightSpace, setWeightSpace] = useState<number>(20);
  const [weightCirculation, setWeightCirculation] = useState<number>(15);
  const [weightStructure, setWeightStructure] = useState<number>(15);
  const [weightDaylight, setWeightDaylight] = useState<number>(15);

  const handleUnitChange = (newUnit: UnitType) => {
    const lMeters = convertToMeters(plotLengthUnit, unit);
    const wMeters = convertToMeters(plotWidthUnit, unit);
    setUnitState(newUnit);
    setStoreUnit(newUnit);
    setPlotLengthUnit(convertFromMeters(lMeters, newUnit));
    setPlotWidthUnit(convertFromMeters(wMeters, newUnit));
  };

  const generationSteps = [
    'Analyzing plot geometry & setback boundaries...',
    'Generating spatial room layout candidates...',
    'Checking zero-overlap vector constraints...',
    'Evaluating 81-pad Vastu Purusha Mandala alignment...',
    'Optimizing circulation pathways & plumbing nodes...',
    'Finalizing architectural plan alternatives...'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 400);

    try {
      const plotMeters: PlotConfig = {
        length: convertToMeters(plotLengthUnit, unit),
        width: convertToMeters(plotWidthUnit, unit),
        unit: unit,
        orientation: orientation,
        road_direction: orientation,
        north_angle: northAngle,
        vastu_mode: vastuMode,
        setbacks: {
          front: convertToMeters(setbackFront, unit),
          rear: convertToMeters(setbackRear, unit),
          left: convertToMeters(setbackLeft, unit),
          right: convertToMeters(setbackRight, unit)
        },
        is_corner_plot: false,
        floors_count: floorsCount
      };

      const weightsNorm: OptimizationWeights = {
        vastu: weightVastu / 100,
        space_utilization: weightSpace / 100,
        circulation: weightCirculation / 100,
        adjacency: 0.15,
        structural_alignment: weightStructure / 100,
        daylight_ventilation: weightDaylight / 100
      };

      const project = await createProjectApi({
        name,
        description,
        project_type: projectType,
        location,
        plot: plotMeters,
        requirements,
        vastu_profile: vastuProfile,
        weights: weightsNorm
      });

      try {
        const uniquePlans = await generateMultipleLayoutsApi({
          plot: plotMeters,
          requirements,
          weights: weightsNorm,
          vastu_profile: vastuProfile,
          num_candidates: numPlans,
          vastu_strictness: vastuStrictness,
          max_similarity_threshold: similarityThreshold
        });
        if (uniquePlans && uniquePlans.length > 0) {
          project.plans = uniquePlans;
        }
      } catch (genErr) {
        console.warn('Using project initial layout plans', genErr);
      }

      setCurrentProject(project);
      setActiveTab('comparison');
    } catch (err) {
      console.error('Failed to generate project:', err);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in relative">
      
      {/* AI GENERATION LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-6 animate-fade-up">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
              <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Generating AI Floor Plans</h3>
              <p className="text-xs text-slate-500 font-mono">{generationSteps[loadingStep]}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 ease-out" 
                style={{ width: `${((loadingStep + 1) / generationSteps.length) * 100}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400">Evaluating 81-Pad Vastu Purusha Mandala and zero-overlap spatial geometry</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>AI Design Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Floor Plan Generator</h1>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => handleUnitChange('feet')}
            className={`px-3 py-1 rounded font-medium transition-all ${unit === 'feet' ? 'bg-white text-blue-600 font-bold shadow-2xs' : 'text-slate-600'}`}
          >
            Feet (ft)
          </button>
          <button
            onClick={() => handleUnitChange('meter')}
            className={`px-3 py-1 rounded font-medium transition-all ${unit === 'meter' ? 'bg-white text-blue-600 font-bold shadow-2xs' : 'text-slate-600'}`}
          >
            Meters (m)
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Input Form Panel */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section 1: Plot Dimensions & Road Orientation */}
          <div className="arch-card p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center space-x-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>1. Plot & Orientation</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Plot Width ({unit})</label>
                <input
                  type="number"
                  value={plotWidthUnit}
                  onChange={(e) => setPlotWidthUnit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Plot Length ({unit})</label>
                <input
                  type="number"
                  value={plotLengthUnit}
                  onChange={(e) => setPlotLengthUnit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Road Direction</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="N">North Facing</option>
                  <option value="NE">North-East Facing</option>
                  <option value="E">East Facing</option>
                  <option value="SE">South-East Facing</option>
                  <option value="S">South Facing</option>
                  <option value="SW">South-West Facing</option>
                  <option value="W">West Facing</option>
                  <option value="NW">North-West Facing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Vastu Mode</label>
                <select
                  value={vastuMode}
                  onChange={(e) => setVastuMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="BALANCED">Balanced Compliance</option>
                  <option value="STRICT">Strict Vastu</option>
                  <option value="FLEXIBLE">Flexible Vastu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Building Specs & Room Requirements */}
          <div className="arch-card p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>2. Rooms & Specifications</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Floors</label>
                <select
                  value={floorsCount}
                  onChange={(e) => setFloorsCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {[1, 2, 3, 4].map(f => <option key={f} value={f}>{f} Story</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Bedrooms</label>
                <select
                  value={bedroomCount}
                  onChange={(e) => setBedroomCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {[1, 2, 3, 4, 5].map(b => <option key={b} value={b}>{b} BHK</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Bathrooms</label>
                <select
                  value={washroomCount}
                  onChange={(e) => setWashroomCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {[1, 2, 3, 4].map(w => <option key={w} value={w}>{w} Bath</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasPujaRoom} 
                  onChange={(e) => setHasPujaRoom(e.target.checked)} 
                  className="accent-blue-600 w-4 h-4 rounded" 
                />
                <span>Puja Room (Mandir)</span>
              </label>

              <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasMasterBedroom} 
                  onChange={(e) => setHasMasterBedroom(e.target.checked)} 
                  className="accent-blue-600 w-4 h-4 rounded" 
                />
                <span>Master Suite</span>
              </label>
            </div>
          </div>

          {/* Section 3: Progressive Disclosure - Advanced Options Collapsible */}
          <div className="arch-card overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Advanced Options & Setbacks</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-6 border-t border-slate-200 space-y-4 bg-slate-50/50 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 block">Setbacks ({unit})</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Front</span>
                      <input
                        type="number"
                        value={setbackFront}
                        onChange={(e) => setSetbackFront(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Rear</span>
                      <input
                        type="number"
                        value={setbackRear}
                        onChange={(e) => setSetbackRear(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Left</span>
                      <input
                        type="number"
                        value={setbackLeft}
                        onChange={(e) => setSetbackLeft(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Right</span>
                      <input
                        type="number"
                        value={setbackRight}
                        onChange={(e) => setSetbackRight(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-medium text-slate-600 block">Number of Generated Alternatives</label>
                  <div className="flex items-center space-x-2">
                    {[3, 5, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNumPlans(n)}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${
                          numPlans === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {n} Plans
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-accent w-full py-3.5 text-sm flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Floor Plan</span>
          </button>

        </div>

        {/* RIGHT COLUMN: Live Configuration & Plot Summary */}
        <div className="lg:col-span-6 arch-card p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Live Plot & Room Summary</h3>
            <p className="text-xs text-slate-500">Preview of configuration before AI layout optimization</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total Plot Area:</span>
              <span className="font-bold text-slate-900">{plotWidthUnit * plotLengthUnit} sq.{unit} ({plotWidthUnit} × {plotLengthUnit} {unit})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Road Orientation:</span>
              <span className="font-bold text-blue-600">{orientation} Facing</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Building Height:</span>
              <span className="font-bold text-slate-900">{floorsCount} Story Structure</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Configured Rooms:</span>
              <span className="font-bold text-slate-900">{requirements.length} Rooms</span>
            </div>
          </div>

          {/* Minimal Room Badges */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-600 block">Room Allocation List</span>
            <div className="flex flex-wrap gap-1.5">
              {requirements.map((r) => (
                <span key={r.id} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                  {r.name}
                </span>
              ))}
            </div>
          </div>

          {/* Preview Placeholder canvas */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center space-y-2 min-h-[220px] flex flex-col justify-center items-center">
            <Compass className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-700">Ready to Generate Layouts</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Click &quot;Generate Floor Plan&quot; to run the multi-objective genetic algorithm layout solver.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

