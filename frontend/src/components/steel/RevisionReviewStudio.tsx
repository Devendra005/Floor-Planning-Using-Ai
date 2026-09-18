import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { VerificationStatusType } from '../../types';
import { Award, ShieldCheck, Clock, FileText, Check } from 'lucide-react';

export const RevisionReviewStudio: React.FC = () => {
  const { selectedPlan } = useProjectStore();
  const [reviewerName, setReviewerName] = useState('Er. R. Sharma (PE #48291)');
  const [reviewStatus, setReviewStatus] = useState<VerificationStatusType>('PRELIMINARY');
  const [notes, setNotes] = useState('Preliminary structural grid & rebar detailing reviewed against IS 456 & IS 13920 seismic standards.');

  if (!selectedPlan) return null;

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Engineer Review & Verification Workflow</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Track structural revision history and certification status</p>
          </div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold font-mono">
            STATUS: {reviewStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Reviewing Engineer Name / Reg. No.</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Verification Status</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as VerificationStatusType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
            >
              <option value="AI_GENERATED">AI_GENERATED (Unverified)</option>
              <option value="USER_EDITED">USER_EDITED (Draft)</option>
              <option value="PRELIMINARY">PRELIMINARY (Conceptual Visualizer)</option>
              <option value="ENGINEER_REVIEWED">ENGINEER_REVIEWED (In Review)</option>
              <option value="ENGINEER_VERIFIED">ENGINEER_VERIFIED (Certified)</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Reviewer Comments / Engineering Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Revision History Log */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Structural Revision Log</span>
        </h4>

        <div className="space-y-2 text-xs">
          {[
            { ver: 'v1.2', date: '2026-08-18 20:15', note: 'Column rebar sizing updated to 4x16mm Fe500', author: 'AI Layout Solver' },
            { ver: 'v1.1', date: '2026-08-18 19:40', note: 'Structural grid lines A-B-C / 1-2-3 generated', author: 'System' }
          ].map((rev) => (
            <div key={rev.ver} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-400 font-mono">{rev.ver}</span> &bull; <span className="text-slate-200">{rev.note}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">By {rev.author} on {rev.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
