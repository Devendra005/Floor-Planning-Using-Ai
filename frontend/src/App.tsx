import React from 'react';
import { useProjectStore } from './store/projectStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { HomePage } from './pages/HomePage';
import { WizardPage } from './pages/WizardPage';
import { VisionImportPage } from './pages/VisionImportPage';
import { FloorPlanEditor2D } from './components/editor2d/FloorPlanEditor2D';
import { BuildingViewer3D } from './components/viewer3d/BuildingViewer3D';
import { SteelPlanningPage } from './pages/SteelPlanningPage';
import { PlumbingReportPage } from './pages/PlumbingReportPage';
import { PlanComparisonPage } from './pages/PlanComparisonPage';
import { VastuReportPage } from './pages/VastuReportPage';

export const App: React.FC = () => {
  const { activeTab } = useProjectStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between overflow-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area with Left Navigation Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'home' && <HomePage />}
          {activeTab === 'wizard' && <WizardPage />}
          {activeTab === 'vision' && <VisionImportPage />}
          {activeTab === 'editor2d' && <FloorPlanEditor2D />}
          {activeTab === 'viewer3d' && <BuildingViewer3D />}
          {activeTab === 'steel' && <SteelPlanningPage />}
          {activeTab === 'plumbing' && <PlumbingReportPage />}
          {activeTab === 'comparison' && <PlanComparisonPage />}
          {activeTab === 'report' && <VastuReportPage />}
        </main>
      </div>

      {/* Bottom CAD Status Bar */}
      <StatusBar />
    </div>
  );
};

export default App;
