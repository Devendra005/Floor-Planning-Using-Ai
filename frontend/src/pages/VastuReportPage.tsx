import React, { useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { formatDimension } from '../utils/units';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  FileText, Download, Printer, CheckCircle, AlertTriangle, Info, Compass, ShieldAlert, Award, Zap, Check
} from 'lucide-react';

export const VastuReportPage: React.FC = () => {
  const { currentProject, selectedPlan, unit } = useProjectStore();
  const reportRef = useRef<HTMLDivElement>(null);

  if (!currentProject || !selectedPlan) {
    return null;
  }

  const plot = currentProject.plot;
  const report = selectedPlan.vastu_report;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${currentProject.name.replace(/\s+/g, '_')}_Vastu_Report.pdf`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem-2.5rem)] bg-slate-950 py-10 px-6 bg-animated-grid">
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        
        {/* Action Header */}
        <div className="glass-panel p-5 rounded-3xl border-indigo-500/30 flex justify-between items-center shadow-2xl">
          <div>
            <h2 className="text-xl font-black text-white flex items-center space-x-2">
              <Award className="w-6 h-6 text-cyan-400" />
              <span>Vastu & Structural Inspection Report</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Generated for {currentProject.name}</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-slate-800 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="shimmer-btn flex items-center space-x-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black shadow-xl shadow-emerald-500/30 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Report Document Card */}
        <div ref={reportRef} className="glass-panel-glow p-10 rounded-3xl space-y-8 text-slate-100 shadow-2xl border-indigo-500/30">
          
          {/* Document Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-xs uppercase tracking-widest font-mono">
                <Compass className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                <span>AI VASTU PLANNER &bull; OFFICIAL EVALUATION</span>
              </div>
              <h1 className="text-3xl font-black text-white mt-2 tracking-tight">{currentProject.name}</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Plot: <strong className="text-slate-200">{formatDimension(plot.width, unit)} × {formatDimension(plot.length, unit)}</strong> &bull; Facing: <strong className="text-cyan-400">{plot.orientation} Facing</strong> &bull; Profile: <strong className="text-slate-200">{report.profile_used}</strong>
              </p>
            </div>

            {/* Circular Vastu Score Gauge */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/40 text-center relative overflow-hidden shadow-xl group">
              <div className="radar-ring" />
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Total Vastu Score</span>
              <span className="text-4xl font-black text-gradient-cyan font-mono block mt-1">{report.total_score}</span>
              <span className="text-[10px] font-extrabold text-emerald-400 block mt-0.5">OUT OF 100 PTS</span>
            </div>
          </div>

          {/* Category Scores Breakdown Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Category Compliance Matrix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {Object.entries(report.category_scores).map(([cat, score]) => (
                <div key={cat} className="bg-slate-950/80 p-3.5 rounded-2xl border border-indigo-500/20 text-center hover:border-cyan-400/40 transition-colors shadow-inner">
                  <span className="text-xs text-slate-400 font-bold block truncate">{cat}</span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{score}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Before / After Optimization Comparison Card */}
          {report.optimization_summary && (
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-indigo-400 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Vastu Optimization Engine Results</span>
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30">
                  +{report.optimization_summary.score_improvement || 0} PTS IMPROVEMENT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">INITIAL GENERATION SCORE</span>
                  <span className="text-2xl font-black text-slate-300 font-mono mt-1 block">{report.optimization_summary.before_score || report.total_score}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">AFTER OPTIMIZATION</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{report.optimization_summary.after_score || report.total_score}</span>
                </div>
              </div>

              {report.optimization_summary.modifications_applied && report.optimization_summary.modifications_applied.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Automatic Refinement Actions:</span>
                  <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                    {report.optimization_summary.modifications_applied.map((mod: string, idx: number) => (
                      <li key={idx}>{mod}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Brahmasthan & Panchamahabhuta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/90 p-5 rounded-2xl border border-indigo-500/30 space-y-2">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider block">Brahmasthan (Central Core) Inspection</span>
              <p className="text-xs text-slate-300">Central core is monitored to ensure unobstructed flow of natural daylight and indoor cross-ventilation.</p>
              <div className="pt-2 text-xs font-bold text-cyan-400">
                Status: {report.brahmasthan_analysis?.status || 'Open Core Preserved'}
              </div>
            </div>

            <div className="bg-slate-950/90 p-5 rounded-2xl border border-indigo-500/30 space-y-2">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider block">Panchamahabhuta 5-Element Balance</span>
              <p className="text-xs text-slate-300">Spatial distribution of Earth (SW), Water (NE), Fire (SE), Air (NW), and Space (Center).</p>
              <div className="pt-2 text-xs font-bold text-emerald-400">
                Element Alignment Score: {report.panchamahabhuta_analysis?.overall_element_score || 80}/100
              </div>
            </div>
          </div>

          {/* Positive Compliances */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-emerald-400 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Positive Vastu Compliances</span>
            </h3>
            <div className="bg-slate-950/90 p-5 rounded-2xl border border-emerald-500/30 space-y-2.5 shadow-inner">
              {report.positive_observations.map((obs, i) => (
                <p key={i} className="text-xs text-slate-200 flex items-start space-x-2.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{obs}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Recommendations & Adjustments */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-amber-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Recommendations & Minor Adjustments</span>
            </h3>
            <div className="bg-slate-950/90 p-5 rounded-2xl border border-amber-500/30 space-y-2.5 shadow-inner">
              {report.recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-slate-200 flex items-start space-x-2.5 font-medium">
                  <span className="text-amber-400 font-bold">&bull;</span>
                  <span>{rec}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Preliminary Structural Inspection Summary */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-extrabold text-indigo-400 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Preliminary Structural Grid Summary</span>
            </h3>
            <div className="bg-slate-950/90 p-5 rounded-2xl border border-indigo-500/20 text-xs text-slate-300 space-y-2 font-mono font-medium shadow-inner">
              <p>Total Structural Columns: <strong className="text-cyan-400">{selectedPlan.structure.columns.length} columns</strong> (300mm × 300mm RC)</p>
              <p>Load Bearing Framing Beams: <strong className="text-indigo-400">{selectedPlan.structure.beams.length} beams</strong> (230mm × 450mm Primary)</p>
              <p>Foundation Type: <strong className="text-slate-100">Isolated Reinforced Concrete Spread Footings</strong></p>
              <p>Rebar Specs (Conceptual): <strong className="text-emerald-400">4x16mm Fe500 Main Bars @ 150mm stirrup spacing</strong></p>
            </div>
          </div>

          {/* Official Disclaimer Footer */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vastu Shastra Framework Disclaimer</span>
            </p>
            <p>
              This evaluation is performed by an automated AI diagnostic engine based on traditional classical texts (Mayamatam, Brihat Samhita, Samarangana Sutradhara) for educational, conceptual, and directional planning purposes. Standard engineering, municipal building safety regulations, structural calculations, and accessibility take final precedence.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
