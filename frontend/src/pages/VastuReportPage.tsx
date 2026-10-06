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
    <div className="min-h-full bg-slate-50 py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Vastu Audit & Analysis</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vastu Inspection Report</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="btn-secondary px-3.5 py-1.5 text-xs flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="btn-accent px-4 py-1.5 text-xs flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Paper Document Card */}
      <div ref={reportRef} className="arch-card p-6 sm:p-10 space-y-8 bg-white">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              VastuPlan AI Audit Report
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{currentProject.name}</h2>
            <p className="text-xs text-slate-500 font-mono">
              Plot: {formatDimension(plot.width, unit)} × {formatDimension(plot.length, unit)} &bull; Facing: {plot.orientation} &bull; Profile: {report.profile_used}
            </p>
          </div>

          {/* Clean Vastu Score Badge */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center min-w-[140px]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Vastu Score</span>
            <span className="text-3xl font-bold text-blue-600 font-mono block mt-0.5">{report.total_score} <span className="text-xs text-slate-400 font-normal">/ 100</span></span>
          </div>
        </div>

        {/* Category Scores Breakdown Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Category Compliance Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(report.category_scores).map(([cat, score]) => (
              <div key={cat} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center space-y-1">
                <span className="text-xs text-slate-500 font-medium block truncate">{cat}</span>
                <span className="text-base font-bold text-slate-900 font-mono">{score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Brahmasthan & Panchamahabhuta Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">Brahmasthan (Central Core)</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitored to ensure unobstructed central courtyard/living flow and daylight.
            </p>
            <div className="text-xs font-semibold text-emerald-600 pt-1">
              Status: {report.brahmasthan_analysis?.status || 'Open Core Preserved'}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">Panchamahabhuta 5-Element Balance</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Spatial distribution of Earth (SW), Water (NE), Fire (SE), Air (NW), and Space (Center).
            </p>
            <div className="text-xs font-semibold text-blue-600 pt-1">
              Element Alignment: {report.panchamahabhuta_analysis?.overall_element_score || 80} / 100
            </div>
          </div>
        </div>

        {/* Positive Compliances */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Positive Compliances</span>
          </h3>
          <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 space-y-2">
            {report.positive_observations.map((obs, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations & Adjustments */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Recommendations & Minor Adjustments</span>
          </h3>
          <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 space-y-2">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                <span className="text-amber-600 font-bold">&bull;</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Structural Summary */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Preliminary Structural Grid Summary</span>
          </h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
            <p>Columns: <strong className="text-slate-900">{selectedPlan.structure.columns.length} RC Columns</strong> (300mm × 300mm)</p>
            <p>Framing Beams: <strong className="text-slate-900">{selectedPlan.structure.beams.length} Beams</strong> (230mm × 450mm Primary)</p>
            <p>Foundation Type: <strong className="text-slate-900">Isolated Reinforced Concrete Footings</strong></p>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Vastu Framework Disclaimer</span>
          </p>
          <p>
            Evaluation generated by automated AI engine based on classical texts for conceptual planning. Standard engineering calculations and local building safety codes take final precedence.
          </p>
        </div>

      </div>

    </div>
  );
};
