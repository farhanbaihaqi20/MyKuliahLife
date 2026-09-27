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
import { ExtrasView } from './views/ExtrasView';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';
import { ArrowLeft } from 'lucide-react';
import './styles/app.css';

const MainScreen = () => {
  const { activeTab, setActiveTab, extrasSubtab } = useApp();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'academic': return 'Akademik & Perkuliahan';
      case 'finance': return 'Keuangan & Dompet';
      case 'grades': return 'Rekap Nilai & IPK';
      case 'profile': return 'Profil & Pengaturan';
      case 'extras': return 'Menu Lainnya';
      default: return 'MyKuliahLife';
    }
  };

  const showGenericHeader = activeTab !== 'home' && !(activeTab === 'extras' && extrasSubtab === 'fuel');

  return (
    <div className="mobile-device-frame">
      {/* If Home, show rich fintech Header. If other tabs, show clean subpage header */}
      {activeTab === 'home' ? (
        <Header />
      ) : showGenericHeader ? (
        <div
          className="app-subpage-header"
          style={{
            background: '#1665D8',
            color: 'white',
            padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 18px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
            boxSizing: 'border-box'
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
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ fontSize: '16.5px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{getPageTitle()}</h2>
        </div>
      ) : null}

      {/* View router */}
      {activeTab === 'home' && <HomeView />}
      {activeTab === 'academic' && <AcademicView />}
      {activeTab === 'finance' && <FinanceView />}
      {activeTab === 'grades' && <GradesView />}
      {activeTab === 'profile' && <ProfileSyncView />}
      {activeTab === 'extras' && <ExtrasView />}

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
  const { session, isGuestMode, isAuthLoading, isResetPasswordModalOpen } = useApp();

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

  return (
    <>
      {!session && !isGuestMode ? (
        <div className="mobile-device-frame">
          <AuthView />
        </div>
      ) : (
        <MainScreen />
      )}
      {isResetPasswordModalOpen && <ResetPasswordModal />}
    </>
  );
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
