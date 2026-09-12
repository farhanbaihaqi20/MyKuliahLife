import React from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, User, ArrowDown, ArrowUp, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';

export const Header = () => {
  const {
    data,
    totalBalance,
    cycleIncome,
    cycleExpenses,
    isBalanceVisible,
    setIsBalanceVisible,
    syncStatus,
    setActiveTab,
    financialCycle,
    setIsCycleModalOpen,
    activeSemester
  } = useApp();

  const formattedBalance = isBalanceVisible
    ? `Rp +${totalBalance.toLocaleString('id-ID')}`
    : 'Rp ••••••••';

  const formattedIncome = isBalanceVisible
    ? `Rp ${cycleIncome.toLocaleString('id-ID')}`
    : 'Rp ••••';

  const formattedExpense = isBalanceVisible
    ? `Rp ${cycleExpenses.toLocaleString('id-ID')}`
    : 'Rp ••••';

  return (
    <header className="app-header-blue">
      {/* Top Bar: User Greeting, Semester Badge & Avatar */}
      <div className="header-top-row">
        <div className="user-greeting">
          <span style={{ fontSize: '22px' }}>👋</span>
          <div>
            <div className="greeting-text">Hai {data.profile.fullName ? data.profile.fullName.split(' ')[0] : 'Mahasiswa'}!</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <GraduationCap size={12} />
              <span>Semester {activeSemester} Aktif</span>
            </div>
          </div>
        </div>

        <button
          className="user-avatar-btn"
          onClick={() => setActiveTab('profile')}
          title="Buka Pengaturan & Akun"
        >
          <User size={20} />
          <span
            className={`sync-status-dot ${syncStatus.mode === 'online' ? 'online' : 'offline'}`}
            title={syncStatus.message}
          />
        </button>
      </div>

      {/* Period Filter & Pill Selector with Dynamic Payday/Cycle Picker */}
      <div className="header-pill-tabs">
        <button
          className="pill-btn active"
          onClick={() => setIsCycleModalOpen(true)}
          title="Klik untuk ubah tanggal siklus / hari gajian"
        >
          <span>{financialCycle.label}</span>
          <ChevronDown size={14} />
        </button>
        <button className="pill-btn" onClick={() => setActiveTab('finance')}>
          <span>Total Saldo</span>
        </button>
      </div>

      {/* Hero Financial Balance Card */}
      <div className="hero-balance-box">
        {/* Mascot Flair (Bottom-Right, non-blocking) */}
        <div
          className="mascot-student-badge"
          style={{
            position: 'absolute',
            right: '16px',
            bottom: '16px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.12)',
            padding: '4px 10px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <span style={{ fontSize: '16px' }}>🤖</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>Mahasiswa ⭐</span>
        </div>

        <div className="hero-balance-top">
          <div className="balance-status-tag">
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#6EE7B7', display: 'inline-block' }}></span>
            <span>SISA KEUANGAN POSITIF</span>
          </div>
          <button
            type="button"
            className="balance-visibility-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsBalanceVisible(!isBalanceVisible);
            }}
            title={isBalanceVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              zIndex: 10,
              position: 'relative'
            }}
          >
            {isBalanceVisible ? <Eye size={15} /> : <EyeOff size={15} />}
            <span>{isBalanceVisible ? 'Intip' : 'Tutup'}</span>
          </button>
        </div>

        {/* Big Balance */}
        <div className="main-balance-display">
          <div className="main-balance-text">{formattedBalance}</div>
          <ChevronRight size={22} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }} />
        </div>

        <div className="balance-sub-label">
          <span>Dompet Aktif: {data.accounts.length} Akun</span>
          <span>•</span>
          <span>{syncStatus.mode === 'online' ? 'Cloud Synced ☁️' : 'Offline Mode 💾'}</span>
        </div>

        {/* Income & Expense Summary Pills (Dynamic to active cycle) */}
        <div className="income-expense-row">
          <div className="summary-pill-card">
            <div className="summary-pill-icon income">
              <ArrowDown size={16} />
            </div>
            <div className="summary-pill-info">
              <span className="summary-pill-label">Pemasukan</span>
              <span className="summary-pill-amount">{formattedIncome}</span>
            </div>
          </div>

          <div className="summary-pill-card">
            <div className="summary-pill-icon expense">
              <ArrowUp size={16} />
            </div>
            <div className="summary-pill-info">
              <span className="summary-pill-label">Pengeluaran</span>
              <span className="summary-pill-amount">{formattedExpense}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
