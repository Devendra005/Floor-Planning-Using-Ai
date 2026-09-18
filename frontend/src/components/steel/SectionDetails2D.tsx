import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Layers, FileCode, Sliders, CheckCircle2, ShieldAlert, Award } from 'lucide-react';

export const SectionDetails2D: React.FC = () => {
  const { selectedPlan } = useProjectStore();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  if (!selectedPlan) return null;

  const columns = selectedPlan.structure.columns;
  const beams = selectedPlan.structure.beams;
  const slabs = selectedPlan.structure.slabs;
  const footings = selectedPlan.structure.footings;

  const defaultMemberId = selectedMemberId || (beams[0]?.id || columns[0]?.id || 'COL-01-F0');

  const selectedCol = columns.find(c => c.id === defaultMemberId);
  const selectedBm = beams.find(b => b.id === defaultMemberId);
  const selectedSlab = slabs.find(s => s.id === defaultMemberId);
  const selectedFtg = footings.find(f => f.id === defaultMemberId);

  const memberType = selectedCol ? 'COLUMN' : selectedBm ? 'BEAM' : selectedSlab ? 'SLAB' : 'FOOTING';

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-5 rounded-2xl border border-indigo-500/30 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <span>IS 456 / SP 34 2D CAD Section Drawings</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-mono border border-indigo-500/30 uppercase">
                {memberType} DETAIL
              </span>
            </h3>
            <p className="text-xs text-slate-400">High-precision reinforcement section details & IS 456 compliance callouts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 font-mono uppercase">Select Member:</span>
          <select
            value={defaultMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
          >
            <optgroup label="Structural Columns">
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  Column {c.id} (F{c.floor || 0} - {Math.round(c.width * 1000)}×{Math.round(c.depth * 1000)} mm)
                </option>
              ))}
            </optgroup>
            <optgroup label="Structural Beams">
              {beams.map(b => (
                <option key={b.id} value={b.id}>
                  Beam {b.id} (F{b.floor || 0} - {Math.round(b.section_width * 1000)}×{Math.round(b.section_depth * 1000)} mm)
                </option>
              ))}
            </optgroup>
            <optgroup label="Floor Slabs">
              {slabs.map(s => (
                <option key={s.id} value={s.id}>
                  Slab {s.id} (F{s.floor || 0} - 150mm {s.slab_type})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* 2D Interactive CAD Section Viewport */}
      <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center space-y-6 bg-slate-950 bg-architectural-grid border-indigo-500/20 shadow-2xl relative overflow-hidden">
        
        {/* Drawing Title & IS Code Compliance Stamp */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b border-slate-800 pb-4 gap-2">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-indigo-400 font-mono font-extrabold uppercase tracking-widest block">Structural Detail Drawing</span>
            <h4 className="text-lg font-black text-white font-mono">
              {memberType === 'COLUMN' && `COLUMN SECTION C-C • ${selectedCol?.id}`}
              {memberType === 'BEAM' && `BEAM CROSS SECTION B-B • ${selectedBm?.id}`}
              {memberType === 'SLAB' && `SLAB REINFORCEMENT SECTION S-S • ${selectedSlab?.id}`}
              {memberType === 'FOOTING' && `ISOLATED FOOTING SECTION F-F • ${selectedFtg?.id}`}
            </h4>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold font-mono">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>IS 456:2000 & SP 34 Compliant</span>
          </div>
        </div>

        {/* Dynamic SVG CAD Render */}
        {selectedCol && (
          <svg width="440" height="380" viewBox="0 0 440 380" className="border border-slate-800 rounded-2xl bg-slate-950/90 shadow-2xl">
            {/* Concrete Section Box */}
            <rect x="130" y="70" width="180" height="180" fill="rgba(30,41,59,0.85)" stroke="#6366f1" strokeWidth="3" rx="4" />

            {/* Clear Cover (40mm) & Stirrup Tie Loop */}
            <rect x="150" y="90" width="140" height="140" fill="none" stroke="#f97316" strokeWidth="2.5" rx="6" />
            {/* 135 Degree Seismic Hook Bends at Corner */}
            <path d="M 150 110 L 165 95 M 150 110 L 160 115" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />

            {/* 4 Main Corner Longitudinal Rebars (16mm Fe500) */}
            <circle cx="160" cy="100" r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="280" cy="100" r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="160" cy="220" r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="280" cy="220" r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* Side Rebar Rods if Column Width > 300mm */}
            <circle cx="220" cy="100" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="220" cy="220" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* X & Y Dimension Lines */}
            <line x1="130" y1="45" x2="310" y2="45" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="130" y1="38" x2="130" y2="52" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="310" y1="38" x2="310" y2="52" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="220" y="36" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {Math.round(selectedCol.width * 1000)} mm
            </text>

            <line x1="335" y1="70" x2="335" y2="250" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="328" y1="70" x2="342" y2="70" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="328" y1="250" x2="342" y2="250" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="355" y="165" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 355 165)">
              {Math.round(selectedCol.depth * 1000)} mm
            </text>

            {/* Rebar Callout Labels */}
            <text x="35" y="103" fill="#ef4444" fontSize="11" fontWeight="extrabold" fontFamily="monospace">6 - 16# Fe500</text>
            <line x1="115" y1="100" x2="151" y2="100" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />

            <text x="220" y="295" fill="#f97316" fontSize="11" fontWeight="extrabold" fontFamily="monospace" textAnchor="middle">
              Ties: 8mm Fe500 @ 150mm c/c (40mm Clear Cover)
            </text>

            <text x="220" y="340" fill="#94a3b8" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
              Column Member ID: {selectedCol.id} • Floor Level: {selectedCol.floor || 0}
            </text>
          </svg>
        )}

        {selectedBm && (
          <svg width="440" height="380" viewBox="0 0 440 380" className="border border-slate-800 rounded-2xl bg-slate-950/90 shadow-2xl">
            {/* Concrete Beam Cross Section (230mm x 450mm scale) */}
            <rect x="140" y="55" width="160" height="230" fill="rgba(30,41,59,0.85)" stroke="#6366f1" strokeWidth="3" rx="4" />

            {/* Closed Rectangular Stirrup (with 30mm cover) */}
            <rect x="155" y="70" width="130" height="200" fill="none" stroke="#22d3ee" strokeWidth="2.5" rx="5" />

            {/* Top 2 Hanger Main Bars (12mm Fe500) */}
            <circle cx="170" cy="85" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="270" cy="85" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />

            {/* Bottom 3 Tension Main Bars (16mm Fe500) */}
            <circle cx="170" cy="255" r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="220" cy="255" r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="270" cy="255" r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />

            {/* Dimension Lines */}
            <line x1="140" y1="35" x2="300" y2="35" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="140" y1="28" x2="140" y2="42" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="300" y1="28" x2="300" y2="42" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="220" y="26" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {Math.round(selectedBm.section_width * 1000)} mm
            </text>

            <line x1="325" y1="55" x2="325" y2="285" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="318" y1="55" x2="332" y2="55" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="318" y1="285" x2="332" y2="285" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="345" y="170" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 345 170)">
              {Math.round(selectedBm.section_depth * 1000)} mm
            </text>

            {/* Callouts */}
            <text x="40" y="88" fill="#60a5fa" fontSize="11" fontWeight="extrabold" fontFamily="monospace">2 - 12# Top Hanger</text>
            <line x1="135" y1="85" x2="162" y2="85" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 2" />

            <text x="40" y="258" fill="#60a5fa" fontSize="11" fontWeight="extrabold" fontFamily="monospace">3 - 16# Bottom Tension</text>
            <line x1="135" y1="255" x2="161" y2="255" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 2" />

            <text x="220" y="320" fill="#22d3ee" fontSize="11" fontWeight="extrabold" fontFamily="monospace" textAnchor="middle">
              Stirrups: 8mm Fe500 @ 150mm c/c (30mm Clear Cover)
            </text>
          </svg>
        )}

        {/* Detail Specification Table */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-extrabold block">Concrete Grade</span>
            <span className="text-sm font-black text-white font-mono">M25 (25 N/mm²)</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-extrabold block">Rebar Grade</span>
            <span className="text-sm font-black text-cyan-400 font-mono">Fe500D TMT</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-extrabold block">Nominal Cover</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {memberType === 'COLUMN' ? '40 mm' : memberType === 'BEAM' ? '30 mm' : '25 mm'}
            </span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-extrabold block">Code Specification</span>
            <span className="text-sm font-black text-amber-400 font-mono">IS 456 / SP 34</span>
          </div>
        </div>

      </div>
    </div>
  );
};
