import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { PlotConfig, RoomRequirement, UnitType, OrientationType, VastuProfileType, OptimizationWeights } from '../types';
import { createProjectApi, generateMultipleLayoutsApi, DEMO_REQUIREMENTS } from '../services/api';
import { convertToMeters, convertFromMeters } from '../utils/units';
import { FloorPlanEditor2D } from '../components/editor2d/FloorPlanEditor2D';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Compass, Sliders, ShieldCheck, Home, Plus, Trash2, Loader2, Zap, Layers,
  Layers2, Cpu, SlidersHorizontal
} from 'lucide-react';

export const WizardPage: React.FC = () => {
  const { setActiveTab, setCurrentProject, setUnit: setStoreUnit } = useProjectStore();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('My Dream Home');
  const [description, setDescription] = useState('2 Story modern Vastu compliant home');
  const [projectType, setProjectType] = useState('Residential Single Family');
  const [location, setLocation] = useState('India');

  // Plot State (stored internally in meters, displayed in unit)
  const [unit, setUnitState] = useState<UnitType>('feet');
  const [plotLengthUnit, setPlotLengthUnit] = useState<number>(40); // 40 ft
  const [plotWidthUnit, setPlotWidthUnit] = useState<number>(30);   // 30 ft
  // Direct Structured Inputs
  const [floorsCount, setFloorsCount] = useState<number>(2); // 1 to 10 floors
  const [bedroomCount, setBedroomCount] = useState<number>(3); // 1 to 10 bedrooms
  const [washroomCount, setWashroomCount] = useState<number>(2); // 1 to 10 washrooms
  const [hasPujaRoom, setHasPujaRoom] = useState<boolean>(true); // Puja room compulsory
  const [hasLivingRoom, setHasLivingRoom] = useState<boolean>(true); // Living room compulsory
  const [hasMasterBedroom, setHasMasterBedroom] = useState<boolean>(true); // Master bedroom included

  // Multi-Plan Diversity State
  const [numPlans, setNumPlans] = useState<number>(5);
  const [vastuStrictness, setVastuStrictness] = useState<'STRICT' | 'BALANCED' | 'FLEXIBLE'>('BALANCED');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(70);


  // Orientation & Setbacks State
  const [orientation, setOrientation] = useState<OrientationType>('E');
  const [northAngle, setNorthAngle] = useState<number>(0);
  const [vastuMode, setVastuMode] = useState<'STRICT' | 'BALANCED' | 'FLEXIBLE'>('BALANCED');
  const [setbackFront, setSetbackFront] = useState<number>(4); // 4 ft
  const [setbackRear, setSetbackRear] = useState<number>(3);  // 3 ft
  const [setbackLeft, setSetbackLeft] = useState<number>(3);  // 3 ft
  const [setbackRight, setSetbackRight] = useState<number>(3); // 3 ft

  // Requirements State (Initialized automatically from direct inputs)
  const buildRequirementsFromDirectInputs = (): RoomRequirement[] => {
    const reqs: RoomRequirement[] = [];
    let reqId = 1;

    // 1. Living Room (if compulsory)
    if (hasLivingRoom) {
      reqs.push({
        id: `req-${reqId++}`,
        name: 'Living Room',
        room_type: 'living',
        min_width: 3.6,
        min_length: 4.2,
        preferred_width: 4.2,
        preferred_length: 4.8,
        priority: 1,
        quantity: 1,
        privacy_level: 'low',
        preferred_direction: 'NE',
        adjacent_to: ['entrance', 'dining']
      });
    }

    // 2. Kitchen (essential)
    reqs.push({
      id: `req-${reqId++}`,
      name: 'Kitchen',
      room_type: 'kitchen',
      min_width: 2.4,
      min_length: 2.7,
      preferred_width: 2.7,
      preferred_length: 3.0,
      priority: 1,
      quantity: 1,
      privacy_level: 'medium',
      preferred_direction: 'SE',
      adjacent_to: ['dining']
    });

    // 3. Puja Room (if compulsory)
    if (hasPujaRoom) {
      reqs.push({
        id: `req-${reqId++}`,
        name: 'Puja Room',
        room_type: 'puja',
        min_width: 1.8,
        min_length: 1.8,
        preferred_width: 2.1,
        preferred_length: 2.1,
        priority: 1,
        quantity: 1,
        privacy_level: 'high',
        preferred_direction: 'NE',
        adjacent_to: []
      });
    }

    // 4. Bedrooms & Master Bedroom
    let remainingBeds = bedroomCount;
    if (hasMasterBedroom && remainingBeds > 0) {
      reqs.push({
        id: `req-${reqId++}`,
        name: 'Master Bedroom',
        room_type: 'master_bedroom',
        min_width: 3.3,
        min_length: 3.9,
        preferred_width: 3.6,
        preferred_length: 4.2,
        priority: 1,
        quantity: 1,
        privacy_level: 'high',
        preferred_direction: 'SW',
        adjacent_to: []
      });
      remainingBeds--;
    }

    for (let i = 0; i < remainingBeds; i++) {
      reqs.push({
        id: `req-${reqId++}`,
        name: `Bedroom ${i + (hasMasterBedroom ? 2 : 1)}`,
        room_type: 'bedroom',
        min_width: 3.0,
        min_length: 3.3,
        preferred_width: 3.3,
        preferred_length: 3.6,
        priority: 2,
        quantity: 1,
        privacy_level: 'high',
        preferred_direction: i % 2 === 0 ? 'NW' : 'W',
        adjacent_to: []
      });
    }

    // 5. Washrooms / Bathrooms
    for (let i = 0; i < washroomCount; i++) {
      const isMasterAttached = i === 0 && hasMasterBedroom;
      reqs.push({
        id: `req-${reqId++}`,
        name: isMasterAttached ? 'Master Washroom (Attached)' : `Washroom ${i + 1}`,
        room_type: 'toilet',
        min_width: 1.5,
        min_length: 2.1,
        preferred_width: 1.8,
        preferred_length: 2.4,
        priority: 1,
        quantity: 1,
        privacy_level: 'high',
        preferred_direction: 'NW',
        adjacent_to: isMasterAttached ? ['master_bedroom'] : []
      });
    }

    // 6. Parking & Porch
    reqs.push({
      id: `req-${reqId++}`,
      name: 'Parking & Porch',
      room_type: 'parking',
      min_width: 3.0,
      min_length: 4.5,
      preferred_width: 3.3,
      preferred_length: 4.8,
      priority: 2,
      quantity: 1,
      privacy_level: 'low',
      preferred_direction: 'NW',
      adjacent_to: []
    });

    // 7. Mandatory Main Staircase
    reqs.push({
      id: `req-${reqId++}`,
      name: 'Main Staircase (Mandatory)',
      room_type: 'staircase',
      min_width: 2.2,
      min_length: 3.2,
      preferred_width: 2.4,
      preferred_length: 3.5,
      priority: 1,
      quantity: 1,
      privacy_level: 'low',
      preferred_direction: 'S',
      adjacent_to: ['living']
    });

    return reqs;
  };

  const [requirements, setRequirements] = useState<RoomRequirement[]>(DEMO_REQUIREMENTS);

  // Auto-sync requirements whenever direct input counts change
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

  const handleAddCustomRoom = () => {
    const newRoom: RoomRequirement = {
      id: `req-${Date.now()}`,
      name: 'Additional Room',
      room_type: 'bedroom',
      min_width: 2.7,
      min_length: 3.0,
      preferred_width: 3.3,
      preferred_length: 3.6,
      priority: 2,
      quantity: 1,
      privacy_level: 'medium',
      preferred_direction: 'NW',
      adjacent_to: []
    };
    setRequirements([...requirements, newRoom]);
  };

  const handleRemoveRoom = (id: string) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  const handleGenerate = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };


  const [configMode, setConfigMode] = useState<'Room' | 'House' | 'Custom'>('Room');

  const handleUpdateRoomRequirement = (id: string, updates: Partial<RoomRequirement>) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-950 py-6 px-4 md:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up">
        
        {/* LEFT PANEL: Room & Layout Configurator */}
        <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-6 border border-slate-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Floor Plan Generator</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Customize rooms, plot dimensions and building rules</p>
            </div>
            
            <span className="bg-blue-50 text-blue-700 text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border border-blue-200">
              AI ENGINE
            </span>
          </div>

          {/* Mode Selector Tabs (Room | House | Custom) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-3 gap-1">
            {(['Room', 'House', 'Custom'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setConfigMode(mode)}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                  configMode === mode
                    ? 'bg-white text-blue-600 shadow-md scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>

          {/* Unit Selector Pills (Square Meters | Square Feet) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Measurement Unit</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUnitChange('meter')}
                className={`py-3 rounded-2xl border text-xs font-extrabold transition-all ${
                  unit === 'meter'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Square Meters (m)
              </button>
              <button
                onClick={() => handleUnitChange('feet')}
                className={`py-3 rounded-2xl border text-xs font-extrabold transition-all ${
                  unit === 'feet'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Square Feet (ft)
              </button>
            </div>
          </div>

          {/* MODE CONTENT */}
          {configMode === 'Room' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Configured Rooms ({requirements.length})</span>
                <button
                  onClick={handleAddCustomRoom}
                  className="flex items-center space-x-1 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              </div>

              {/* Rooms List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {requirements.map((req) => (
                  <div key={req.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      
                      {/* Room Type Selector */}
                      <div className="col-span-5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Room Type</label>
                        <select
                          value={req.room_type}
                          onChange={(e) => handleUpdateRoomRequirement(req.id, { room_type: e.target.value, name: e.target.options[e.target.selectedIndex].text })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="master_bedroom">Master Bedroom</option>
                          <option value="bedroom">Bedroom</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="living">Living Room</option>
                          <option value="dining">Dining Room</option>
                          <option value="puja">Puja Room</option>
                          <option value="toilet">Bathroom / Toilet</option>
                          <option value="parking">Parking & Porch</option>
                        </select>
                      </div>

                      {/* Width Input */}
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Width ({unit === 'feet' ? 'ft' : 'm'})</label>
                        <input
                          type="number"
                          step="0.1"
                          value={unit === 'feet' ? Math.round(req.preferred_width * 3.28) : req.preferred_width}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const valMeters = unit === 'feet' ? val / 3.28 : val;
                            handleUpdateRoomRequirement(req.id, { preferred_width: valMeters });
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Length Input */}
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Length ({unit === 'feet' ? 'ft' : 'm'})</label>
                        <input
                          type="number"
                          step="0.1"
                          value={unit === 'feet' ? Math.round(req.preferred_length * 3.28) : req.preferred_length}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const valMeters = unit === 'feet' ? val / 3.28 : val;
                            handleUpdateRoomRequirement(req.id, { preferred_length: valMeters });
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-1 flex justify-end pt-3">
                        <button
                          onClick={() => handleRemoveRoom(req.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                          title="Remove Room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {configMode === 'House' && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Number of Floors</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFloorsCount(f)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        floorsCount === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {f} Story
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Bedrooms Count</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBedroomCount(b)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        bedroomCount === b ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {b} Bed
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Washrooms Count</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWashroomCount(w)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        washroomCount === w ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {w} Bath
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input type="checkbox" checked={hasPujaRoom} onChange={(e) => setHasPujaRoom(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                  <span>Puja Room</span>
                </label>
                <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input type="checkbox" checked={hasMasterBedroom} onChange={(e) => setHasMasterBedroom(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                  <span>Master Suite</span>
                </label>
              </div>
            </div>
          )}

          {configMode === 'Custom' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Plot Length ({unit})</label>
                <input
                  type="number"
                  value={plotLengthUnit}
                  onChange={(e) => setPlotLengthUnit(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Plot Width ({unit})</label>
                <input
                  type="number"
                  value={plotWidthUnit}
                  onChange={(e) => setPlotWidthUnit(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono"
                />
              </div>
            </div>
          )}

          {/* Vastu Mode & Plot Orientation Selector Card */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Vastu Engine Preferences</span>
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                INTEGRATED
              </span>
            </div>

            {/* Vastu Modes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Vastu Compliance Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { mode: 'STRICT', label: 'Strict', desc: '60% Weight' },
                  { mode: 'BALANCED', label: 'Balanced', desc: '35% Weight' },
                  { mode: 'FLEXIBLE', label: 'Flexible', desc: '15% Weight' }
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setVastuMode(item.mode as any)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      vastuMode === item.mode
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-black'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50 font-bold'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className={`text-[9px] ${vastuMode === item.mode ? 'text-amber-100' : 'text-slate-400'}`}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Plot Facing / Orientation & Custom North Angle */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Plot Road Facing</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="N">North Facing Plot</option>
                  <option value="NE">North-East Facing Plot</option>
                  <option value="E">East Facing Plot</option>
                  <option value="SE">South-East Facing Plot</option>
                  <option value="S">South Facing Plot</option>
                  <option value="SW">South-West Facing Plot</option>
                  <option value="W">West Facing Plot</option>
                  <option value="NW">North-West Facing Plot</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">North Angle (°)</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={northAngle}
                  onChange={(e) => setNorthAngle(Number(e.target.value))}
                  placeholder="0° (Default Top)"
                  className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* AI Multiple Unique Floor Plans & Layout Diversity Engine */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-5 rounded-3xl border border-indigo-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
                    <span>Layout Diversity Engine</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Generate multiple genuinely different architectural typologies</p>
                </div>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-extrabold px-2 py-0.5 rounded-md border border-cyan-500/30 font-mono">
                ZERO DUPLICATES
              </span>
            </div>

            {/* Number of Plans Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex justify-between">
                <span>Number of Unique Floor Plans</span>
                <span className="text-cyan-400 font-bold">{numPlans} Distinct Options</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumPlans(count)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                      numPlans === count
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30 scale-[1.02]'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {count} Plans
                  </button>
                ))}
              </div>
            </div>

            {/* Vastu Strictness */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex justify-between">
                <span>Vastu Diversity Strictness</span>
                <span className="text-emerald-400 font-bold">{vastuStrictness}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['BALANCED', 'STRICT', 'FLEXIBLE'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setVastuStrictness(mode)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      vastuStrictness === mode
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'BALANCED' ? 'Balanced' : mode === 'STRICT' ? 'Strict' : 'Flexible'}
                  </button>
                ))}
              </div>
            </div>

            {/* Similarity Rejection Threshold */}
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-indigo-900/50">
              <div className="flex justify-between text-[10px] font-extrabold text-slate-300">
                <span>Max Allowable Similarity:</span>
                <span className="text-amber-400 font-mono font-black">{similarityThreshold}% (Rejection Threshold)</span>
              </div>
              <input
                type="range"
                min="50"
                max="85"
                step="5"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[9px] text-slate-400 leading-tight">
                Rejects candidate layouts that share over {similarityThreshold}% spatial or visual structure.
              </p>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2.5 border border-blue-400/40"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating {numPlans} Unique Architectural Layouts...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white stroke-none animate-pulse" />
                <span>Generate {numPlans} Unique Floor Plans</span>
              </>
            )}
          </button>

        </div>


        {/* RIGHT PANEL: Live Blueprint Preview & Canvas */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-6 flex flex-col justify-between min-h-[640px]">
          
          {/* Top Canvas Header Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl">
              <button className="px-4 py-1.5 bg-white text-blue-600 font-extrabold text-xs rounded-xl shadow-sm">
                Examples
              </button>
              <button className="px-4 py-1.5 text-slate-500 font-bold text-xs rounded-xl hover:text-slate-900">
                History
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('editor2d')}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold rounded-xl hover:bg-blue-100 transition-colors"
              >
                2D Blueprint
              </button>
              <button
                onClick={() => setActiveTab('viewer3d')}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                3D Model
              </button>
            </div>
          </div>

          {/* Title Header */}
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>✦ Create Your Dream Floor Plan ✦</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Turn your ideas into a functional, Vastu-compliant architectural floor plan with AI.</p>
          </div>

          {/* Main Blueprint Preview Card */}
          <div className="relative flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-4 flex items-center justify-center min-h-[380px] shadow-inner overflow-hidden">
            
            {/* Live 2D Editor Canvas */}
            <div className="w-full h-full">
              <FloorPlanEditor2D />
            </div>

          </div>

          {/* Footer Pagination Dots */}
          <div className="flex justify-center items-center space-x-2 pt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>

        </div>

      </div>
    </div>
  );
};
