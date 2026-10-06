import React from 'react';
import { useProjectStore, TabType } from '../../store/projectStore';
import {
  Compass, LayoutGrid, Box, Layers, FileText, Plus, Upload,
  Star, Image, Heart, Droplet, Layers2, ShieldCheck, Sparkles, SlidersHorizontal
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, selectedPlan, isMobileMenuOpen, setIsMobileMenuOpen } = useProjectStore();

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navItemClass = (tab: TabType, isDisabled: boolean = false) => {
    const isActive = activeTab === tab;
    if (isDisabled) {
      return 'w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 cursor-not-allowed select-none';
    }
    return `w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200 flex flex-col justify-between p-3 shrink-0 transition-transform duration-200 ease-in-out select-none md:static md:translate-x-0 md:z-30 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        <div className="space-y-4">
          
          {/* Quick Create Action */}
          <button
            onClick={() => handleNavClick('wizard')}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs transition-all border border-blue-600"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Floor Plan</span>
          </button>

          {/* Navigation Sections */}
          <div className="space-y-4 pt-1 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            
            {/* MAIN DASHBOARD */}
            <div>
              <button
                onClick={() => handleNavClick('home')}
                className={navItemClass('home')}
              >
                <Compass className={`w-4 h-4 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>Dashboard</span>
              </button>
            </div>

            {/* DESIGN WORKSPACES */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 block">
                Workspaces
              </span>
              <div className="space-y-0.5">
                <button
                  disabled={!selectedPlan}
                  onClick={() => handleNavClick('editor2d')}
                  className={navItemClass('editor2d', !selectedPlan)}
                >
                  <Image className={`w-4 h-4 ${activeTab === 'editor2d' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>2D Blueprint Studio</span>
                </button>

                <button
                  disabled={!selectedPlan}
                  onClick={() => handleNavClick('viewer3d')}
                  className={navItemClass('viewer3d', !selectedPlan)}
                >
                  <Box className={`w-4 h-4 ${activeTab === 'viewer3d' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>3D BIM Visualizer</span>
                </button>

                <button
                  disabled={!selectedPlan}
                  onClick={() => handleNavClick('comparison')}
                  className={navItemClass('comparison', !selectedPlan)}
                >
                  <Layers2 className={`w-4 h-4 ${activeTab === 'comparison' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>Plan Alternatives</span>
                </button>
              </div>
            </div>

            {/* ENGINEERING & ANALYTICS */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 block">
                Analysis & BIM
              </span>
              <div className="space-y-0.5">
                <button
                  disabled={!selectedPlan}
                  onClick={() => handleNavClick('report')}
                  className={navItemClass('report', !selectedPlan)}
                >
                  <Sparkles className={`w-4 h-4 ${activeTab === 'report' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>Vastu Analysis</span>
                </button>

                <button
                  disabled={!selectedPlan}
                  onClick={() => handleNavClick('steel')}
                  className={navItemClass('steel', !selectedPlan)}
                >
                  <Layers className={`w-4 h-4 ${activeTab === 'steel' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>Steel & Structural</span>
                </button>

                <button
                  disabled={!selectedPlan}
                  onClick={() => handleNavClick('plumbing')}
                  className={navItemClass('plumbing', !selectedPlan)}
                >
                  <Droplet className={`w-4 h-4 ${activeTab === 'plumbing' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>Plumbing Network</span>
                </button>
              </div>
            </div>

            {/* TOOLS & IMPORTS */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 block">
                Import & Tools
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleNavClick('vision')}
                  className={navItemClass('vision')}
                >
                  <Upload className={`w-4 h-4 ${activeTab === 'vision' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>Floor Plan OCR / CV</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* User Footer */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center space-x-2.5 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              AI
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-semibold text-slate-900 text-xs truncate">VastuPlan Workspace</p>
              <p className="text-[10px] text-slate-500 truncate">Vastu & Structural AI Engine</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

