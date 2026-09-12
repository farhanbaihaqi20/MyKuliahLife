import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { QuickAddModal } from './components/common/QuickAddModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { CycleDatePickerModal } from './components/common/CycleDatePickerModal';
import { HomeView } from './views/HomeView';
import { AcademicView } from './views/AcademicView';
import { FinanceView } from './views/FinanceView';
import { GradesView } from './views/GradesView';
import { ProfileSyncView } from './views/ProfileSyncView';
import { ArrowLeft } from 'lucide-react';
import './styles/app.css';

const MainScreen = () => {
  const { activeTab, setActiveTab } = useApp();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'academic': return 'Akademik & Perkuliahan';
      case 'finance': return 'Keuangan & Dompet';
      case 'grades': return 'Rekap Nilai & IPK';
      case 'profile': return 'Profil & Sinkronisasi';
      default: return 'MyUang';
    }
  };

  return (
    <div className="mobile-device-frame">
      {/* If Home, show rich fintech Header. If other tabs, show clean subpage header */}
      {activeTab === 'home' ? (
        <Header />
      ) : (
        <div
          style={{
            background: '#1665D8',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <button
            onClick={() => setActiveTab('home')}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ fontSize: '17px', fontWeight: 800 }}>{getPageTitle()}</h2>
        </div>
      )}

      {/* View router */}
      {activeTab === 'home' && <HomeView />}
      {activeTab === 'academic' && <AcademicView />}
      {activeTab === 'finance' && <FinanceView />}
      {activeTab === 'grades' && <GradesView />}
      {activeTab === 'profile' && <ProfileSyncView />}

      {/* Floating Bottom Navigation */}
      <BottomNav />

      {/* Global Quick Add Bottom Sheet Modal */}
      <QuickAddModal />

      {/* Global Cycle Date Picker Modal */}
      <CycleDatePickerModal />

      {/* First-Time / Reset Onboarding Setup Wizard */}
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <div className="app-viewport">
      <AppProvider>
        <MainScreen />
      </AppProvider>
    </div>
  );
}
