import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { BarBendingScheduleItem } from '../../types';
import { Search, FileSpreadsheet, CheckCircle2, Layers, Cpu, HardDrive } from 'lucide-react';

export const BarBendingSchedule: React.FC = () => {
  const { selectedPlan, selectedStructuralId, setSelectedStructuralId } = useProjectStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  if (!selectedPlan) return null;

  const schedule: BarBendingScheduleItem[] = selectedPlan.structure.bar_schedule || [];
  const summary = selectedPlan.structure.quantity_summary;

  const filtered = schedule.filter(item => {
    const matchesSearch = item.bar_mark.toLowerCase().includes(search.toLowerCase()) ||
                          item.member_id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = typeFilter === 'ALL' || item.member_type === typeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExportCsv = () => {
    const headers = ['Bar Mark', 'Member ID', 'Member Type', 'Floor', 'Bar Type', 'Diameter (mm)', 'Grade', 'Quantity', 'Spacing (mm)', 'Cut Length (m)', 'Total Length (m)', 'Shape Code', 'Weight (kg)'];
    const rows = filtered.map(i => [
      i.bar_mark, i.member_id, i.member_type, i.floor, i.bar_type, i.diameter_mm, i.grade, i.quantity, i.spacing_mm, i.individual_length_m, i.total_length_m, i.shape_code, i.weight_kg
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Bar_Bending_Schedule_BBS.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Structural Tonnage Summary Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-extrabold uppercase tracking-widest block">Total Steel Tonnage</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-cyan-400 font-mono">{summary.total_weight_tonnes}</span>
            <span className="text-xs text-slate-400 font-bold">Metric Tonnes</span>
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">({summary.total_weight_kg} kg total)</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-extrabold uppercase tracking-widest block">Column Reinforcement</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-400 font-mono">{summary.column_weight_kg}</span>
            <span className="text-xs text-slate-400 font-bold">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">Fe500 Column Cages</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-extrabold uppercase tracking-widest block">Beam Reinforcement</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-blue-400 font-mono">{summary.beam_weight_kg}</span>
            <span className="text-xs text-slate-400 font-bold">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">Fe500 Beam Cages</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-extrabold uppercase tracking-widest block">Slabs & Footings</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {(summary.slab_weight_kg + summary.footing_weight_kg).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-bold">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">Mesh & Footing Mats</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter Bar Mark or Member ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono font-bold"
          >
            <option value="ALL">All Structural Members</option>
            <option value="COLUMN">Columns Only</option>
            <option value="BEAM">Beams Only</option>
            <option value="SLAB">Slabs Only</option>
            <option value="FOOTING">Footings Only</option>
          </select>
        </div>

        <button
          onClick={handleExportCsv}
          className="shimmer-btn flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-950"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export BBS (CSV Table)</span>
        </button>
      </div>

      {/* BBS Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="p-3.5">Bar Mark</th>
                <th className="p-3.5">Member ID</th>
                <th className="p-3.5">Member Type</th>
                <th className="p-3.5">Dia (mm)</th>
                <th className="p-3.5">Grade</th>
                <th className="p-3.5">Qty</th>
                <th className="p-3.5">Spacing</th>
                <th className="p-3.5">Cut Len (m)</th>
                <th className="p-3.5">Tot Len (m)</th>
                <th className="p-3.5">Shape Code</th>
                <th className="p-3.5 font-mono text-cyan-400">Weight (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-medium">
              {filtered.map((item, idx) => {
                const isSelected = selectedStructuralId === item.bar_mark || selectedStructuralId === item.member_id;
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedStructuralId(isSelected ? null : item.bar_mark)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/80 border-l-4 border-cyan-400 text-white font-bold' : 'hover:bg-slate-950/60'
                    }`}
                  >
                    <td className="p-3.5 font-bold font-mono text-cyan-400 flex items-center space-x-1.5">
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 inline" />}
                      <span>{item.bar_mark}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-200">{item.member_id}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-800 font-mono text-slate-300">
                        {item.member_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">Ø{item.diameter_mm}</td>
                    <td className="p-3.5 font-mono">{item.grade}</td>
                    <td className="p-3.5 font-mono">{item.quantity}</td>
                    <td className="p-3.5 font-mono">{item.spacing_mm} mm</td>
                    <td className="p-3.5 font-mono">{item.individual_length_m.toFixed(2)} m</td>
                    <td className="p-3.5 font-mono">{item.total_length_m.toFixed(2)} m</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-purple-300">
                        {item.shape_code}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-extrabold">{item.weight_kg.toFixed(2)} kg</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
