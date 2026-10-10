import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { BusesPage } from './pages/BusesPage.tsx';
import { RoutesMapPage } from './pages/RoutesMapPage.tsx';
import { CountersPage } from './pages/CountersPage.tsx';
import { CompaniesPage } from './pages/CompaniesPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { BusDetailModal } from './components/BusDetailModal.tsx';
import { CorrectionModal } from './components/CorrectionModal.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  
  // Correction modal state
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionEntity, setCorrectionEntity] = useState<{ name: string; id: string }>({ name: '', id: '' });

  // Filter params passed when navigating from home to buses or counters
  const [busFilterParams, setBusFilterParams] = useState<any>({});
  const [counterUpazilaParam, setCounterUpazilaParam] = useState<string>('all');

  const handleNavigateTab = (tab: string, filterParams?: any) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tab === 'buses' && filterParams) {
      setBusFilterParams(filterParams);
    }
    if (tab === 'counters' && filterParams?.upazila) {
      setCounterUpazilaParam(filterParams.upazila);
    }
  };

  const handleOpenCorrection = (name: string = '', id: string = '') => {
    setCorrectionEntity({ name, id });
    setCorrectionModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleNavigateTab}
        onOpenCorrection={() => handleOpenCorrection()}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-16 md:pb-8">
        {currentTab === 'home' && (
          <HomePage
            onSelectBus={(id) => setSelectedBusId(id)}
            onNavigateTab={handleNavigateTab}
            onOpenCorrection={handleOpenCorrection}
          />
        )}

        {currentTab === 'buses' && (
          <BusesPage
            initialSearch={busFilterParams?.search || ''}
            initialCrossingOnly={busFilterParams?.is_pabna_crossing === '1'}
            onSelectBus={(id) => setSelectedBusId(id)}
            onOpenCorrection={handleOpenCorrection}
          />
        )}

        {currentTab === 'routes-map' && (
          <RoutesMapPage
            onSelectBus={(id) => setSelectedBusId(id)}
          />
        )}

        {currentTab === 'counters' && (
          <CountersPage
            initialUpazila={counterUpazilaParam}
            onOpenCorrection={handleOpenCorrection}
          />
        )}

        {currentTab === 'companies' && (
          <CompaniesPage
            onNavigateTab={handleNavigateTab}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Footer */}
      <Footer
        onTabChange={handleNavigateTab}
        onOpenCorrection={() => handleOpenCorrection()}
      />

      {/* Mobile Bottom Thumb Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={handleNavigateTab}
      />

      {/* Modals */}
      <BusDetailModal
        busId={selectedBusId}
        onClose={() => setSelectedBusId(null)}
        onOpenCorrection={handleOpenCorrection}
      />

      <CorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        defaultEntityName={correctionEntity.name}
        defaultEntityId={correctionEntity.id}
      />
    </div>
  );
}
