import React from 'react';
import { useProjectStore, TabType } from '../../store/projectStore';
import {
  Compass, LayoutGrid, Box, Layers, FileText, Sparkles, Plus, Folder, Upload,
  Star, Layout, Heart, Video, Image, ShieldCheck, User, Droplet
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, selectedPlan } = useProjectStore();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 shadow-sm z-30 select-none">
      <div className="space-y-5">
        
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 pt-1 pb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
            <LayoutGrid className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight">Floor Plan</h1>
            <p className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase">AI Generator</p>
          </div>
        </div>

        {/* + New Button */}
        <button
          onClick={() => setActiveTab('wizard')}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-95 border border-blue-500"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ New Design</span>
        </button>

        {/* Navigation Sections */}
        <div className="space-y-4 pt-1 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
          
          {/* Main Home */}
          <div>
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'home'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Home Dashboard</span>
            </button>
          </div>

          {/* LIBRARY */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 block">
              LIBRARY
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('wizard')}
                className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Folder className="w-4 h-4 text-slate-500" />
                <span>My Designs</span>
              </button>

              <button
                onClick={() => setActiveTab('vision')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Uploads</span>
                </div>
                <span className="bg-amber-100 text-amber-800 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase border border-amber-300">NEW</span>
              </button>

              <button
                onClick={() => setActiveTab('editor2d')}
                className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Star className="w-4 h-4 text-slate-500" />
                <span>Favorites</span>
              </button>
            </div>
          </div>

          {/* EXPLORE */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 block">
              EXPLORE
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('wizard')}
                className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Layout className="w-4 h-4 text-slate-500" />
                <span>Templates</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Heart className="w-4 h-4 text-slate-500" />
                <span>Vastu Inspiration</span>
              </button>
            </div>
          </div>

          {/* VISUALIZE */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 block">
              VISUALIZE
            </span>
            <div className="space-y-0.5">
              <button
                disabled={!selectedPlan}
                onClick={() => setActiveTab('editor2d')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'editor2d'
                    ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200'
                    : !selectedPlan
                    ? 'text-slate-400 cursor-not-allowed opacity-40'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Image className="w-4 h-4 text-blue-600" />
                <span>2D Blueprint</span>
              </button>

              <button
                disabled={!selectedPlan}
                onClick={() => setActiveTab('viewer3d')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'viewer3d'
                    ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200'
                    : !selectedPlan
                    ? 'text-slate-400 cursor-not-allowed opacity-40'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Box className="w-4 h-4 text-indigo-600" />
                <span>3D Model</span>
              </button>

              <button
                disabled={!selectedPlan}
                onClick={() => setActiveTab('steel')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'steel'
                    ? 'bg-purple-50 text-purple-700 font-extrabold border border-purple-200'
                    : !selectedPlan
                    ? 'text-slate-400 cursor-not-allowed opacity-40'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Steel & BIM</span>
              </button>

              <button
                disabled={!selectedPlan}
                onClick={() => setActiveTab('plumbing')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'plumbing'
                    ? 'bg-cyan-50 text-cyan-700 font-extrabold border border-cyan-200'
                    : !selectedPlan
                    ? 'text-slate-400 cursor-not-allowed opacity-40'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Plumbing Planning</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Upgrade Card */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-xs font-extrabold text-slate-900">Full AI Access</p>
          <p className="text-[10px] text-slate-600 font-medium">Unlimited 2D & 3D floor plan layout generation.</p>
          <button
            onClick={() => setActiveTab('wizard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-1.5 rounded-xl transition-all shadow-sm"
          >
            Create New Plan
          </button>
        </div>

        <div className="flex items-center space-x-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-800 text-xs">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-xs">
            DEV
          </div>
          <div className="overflow-hidden">
            <p className="font-extrabold text-slate-900 text-[11px] truncate">Devendra</p>
            <p className="text-[9px] text-blue-600 font-extrabold font-mono">PRO MEMBER</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
