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
import { ResetPasswordView } from './views/ResetPasswordView';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
      <div className="mobile-device-frame app-splash-frame">
        <div className="app-splash-container">
          <div className="app-splash-icon-box">
            <img src="/logo.png" alt="MyKuliahLife Logo" className="app-splash-logo-img" />
          </div>

          <div className="app-splash-brand">
            <h1 className="app-splash-title">MyKuliahLife</h1>
            <p className="app-splash-tagline">Student Financial & Academic OS</p>
          </div>

          <div className="app-splash-loader-wrap">
            <div className="app-splash-bar-track">
              <div className="app-splash-bar-fill" />
            </div>
            <span className="app-splash-status">Menyiapkan ruang kerja Anda...</span>
          </div>

          <div className="app-splash-security-tag">
            <ShieldCheck size={12} strokeWidth={2.4} />
            <span>Sesi Terenkripsi & Terproteksi Cloud</span>
          </div>
        </div>
      </div>
    );
  }

  // Jika sedang memulihkan kata sandi, tampilkan halaman khusus Buat Kata Sandi Baru (bebas dari tampilan dashboard)
  if (isResetPasswordModalOpen) {
    return (
      <div className="mobile-device-frame">
        <ResetPasswordView />
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
