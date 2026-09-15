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
import { AuthView } from './views/AuthView';
import { ArrowLeft } from 'lucide-react';
import './styles/app.css';

const MainScreen = () => {
  const { activeTab, setActiveTab } = useApp();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'academic': return 'Akademik & Perkuliahan';
      case 'finance': return 'Keuangan & Dompet';
      case 'grades': return 'Rekap Nilai & IPK';
      case 'profile': return 'Profil & Pengaturan';
      default: return 'MyKuliahLife';
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

const AppContent = () => {
  const { session, isGuestMode, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="mobile-device-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '620px' }}>
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ fontSize: '38px', marginBottom: '12px' }}>🎓</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>MyKuliahLife</div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>Menghubungkan ke Supabase Cloud...</div>
        </div>
      </div>
    );
  }

  // Mandatory Login Gate
  if (!session && !isGuestMode) {
    return (
      <div className="mobile-device-frame">
        <AuthView />
      </div>
    );
  }

  return <MainScreen />;
};

export default function App() {
  return (
    <div className="app-viewport">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </div>
  );
}
