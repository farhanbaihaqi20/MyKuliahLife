import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Eye,
  EyeOff,
  User,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  X,
  Sparkles,
  Wallet,
  Calendar,
  Layers
} from 'lucide-react';

export const Header = () => {
  const {
    data,
    totalBalance,
    cycleIncome,
    cycleExpenses,
    todayIncome,
    todayExpenses,
    todayNet,
    todayTxCount,
    isBalanceVisible,
    setIsBalanceVisible,
    syncStatus,
    navigateTo,
    financialCycle,
    setIsCycleModalOpen,
    activeSemester
  } = useApp();

  // Header Tab: 'cycle' = Arus Kas Periode (Kas Harian & Siklus), 'total' = Kotak Total Saldo Akumulatif
  const [headerTab, setHeaderTab] = useState('cycle');
  // Slide state inside cycle: 0 = Arus Kas Hari Ini (Default), 1 = Siklus Keuangan Bulanan
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAccumulativeModalOpen, setIsAccumulativeModalOpen] = useState(false);

  // Touch swipe gesture handlers
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 45;

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      // Swiped left -> show Slide 1 (Siklus Bulanan)
      setActiveSlide(1);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> show Slide 0 (Kas Hari Ini)
      setActiveSlide(0);
    }
  };

  // Formatted date for today
  const formattedTodayDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Formatted numbers for Slide 1 (Siklus Keuangan)
  const formattedCycleBalance = isBalanceVisible
    ? `Rp +${totalBalance.toLocaleString('id-ID')}`
    : 'Rp ••••••••';

  const formattedCycleIncome = isBalanceVisible
    ? `Rp ${cycleIncome.toLocaleString('id-ID')}`
    : 'Rp ••••';

  const formattedCycleExpense = isBalanceVisible
    ? `Rp ${cycleExpenses.toLocaleString('id-ID')}`
    : 'Rp ••••';

  // Formatted numbers for Slide 0 (Kas Hari Ini - DEFAULT)
  const formattedTodayNet = isBalanceVisible
    ? (todayNet >= 0
        ? `Rp +${todayNet.toLocaleString('id-ID')}`
        : `-Rp ${Math.abs(todayNet).toLocaleString('id-ID')}`)
    : 'Rp ••••••••';

  const formattedTodayIncome = isBalanceVisible
    ? `Rp ${todayIncome.toLocaleString('id-ID')}`
    : 'Rp ••••';

  const formattedTodayExpense = isBalanceVisible
    ? `Rp ${todayExpenses.toLocaleString('id-ID')}`
    : 'Rp ••••';

  return (
    <header className="app-header-blue">
      {/* Top Bar: User Greeting, Semester Badge & Avatar */}
      <div className="header-top-row">
        <div className="user-greeting">
          <span style={{ fontSize: '24px' }}>🤖</span>
          <div>
            <div className="greeting-text">
              Hai {data.profile.fullName ? data.profile.fullName.split(' ')[0] : 'Mahasiswa'}!
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <GraduationCap size={12} />
              <span>Semester {activeSemester} Aktif</span>
              <span>•</span>
              <span style={{ color: '#FDE68A', fontWeight: 700 }}>Mahasiswa ⭐</span>
            </div>
          </div>
        </div>

        <button
          className="user-avatar-btn"
          onClick={() => navigateTo('profile')}
          title="Buka Pengaturan & Akun"
        >
          <User size={20} />
          <span
            className={`sync-status-dot ${syncStatus.mode === 'online' ? 'online' : 'offline'}`}
            title={syncStatus.message}
          />
        </button>
      </div>

      {/* Period Filter & Pill Selector (Toggles between Flow Siklus & Total Saldo) */}
      <div className="header-pill-tabs">
        <button
          className={`pill-btn ${headerTab === 'cycle' ? 'active' : ''}`}
          onClick={() => {
            if (headerTab === 'cycle') {
              setIsCycleModalOpen(true);
            } else {
              setHeaderTab('cycle');
            }
          }}
          title="Klik untuk tampilkan Arus Kas / ubah tanggal siklus"
        >
          <span>{financialCycle.label}</span>
          <ChevronDown size={14} />
        </button>
        <button
          className={`pill-btn ${headerTab === 'total' ? 'active' : ''}`}
          onClick={() => setHeaderTab('total')}
          title="Klik untuk tampilkan Kotak Total Saldo Akumulatif di Beranda"
        >
          <Wallet size={13} style={{ marginRight: '2px' }} />
          <span>Total Saldo</span>
        </button>
      </div>

      {/* TAMPILAN KOTAK DI BERANDA: TOTAL SALDO VS ARUS KAS (DEFAULT: KAS HARI INI DULU) */}
      {headerTab === 'total' ? (
        /* 1. KOTAK TOTAL SALDO AKUMULATIF DI BERANDA */
        <div className="hero-balance-box total-saldo-card">
          <div className="hero-balance-top">
            <div className="balance-status-tag" style={{ color: '#FCD34D' }}>
              <Sparkles size={14} style={{ color: '#FCD34D' }} />
              <span>TOTAL SALDO AKUMULATIF</span>
            </div>
            <button
              type="button"
              className="balance-visibility-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsBalanceVisible(!isBalanceVisible);
              }}
              title={isBalanceVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              {isBalanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{isBalanceVisible ? 'Intip' : 'Tutup'}</span>
            </button>
          </div>

          {/* Big Total Balance */}
          <div
            className="main-balance-display"
            onClick={() => setIsAccumulativeModalOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Klik untuk lihat rincian lengkap seluruh dompet"
          >
            <div className="main-balance-text">{formattedCycleBalance}</div>
            <ChevronRight size={22} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }} />
          </div>

          <div
            className="balance-sub-label"
            onClick={() => setIsAccumulativeModalOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Klik untuk rincian semua dompet"
          >
            <span>Total dari {data.accounts.length} Dompet Aktif</span>
            <span>•</span>
            <span>{syncStatus.mode === 'online' ? 'Cloud Synced ☁️' : 'Offline Mode 💾'}</span>
          </div>

          {/* Account Summary Pills */}
          <div className="income-expense-row">
            <div
              className="summary-pill-card"
              onClick={() => setIsAccumulativeModalOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Lihat Dompet Terdaftar"
            >
              <div className="summary-pill-icon" style={{ backgroundColor: '#2563EB' }}>
                <Wallet size={16} />
              </div>
              <div className="summary-pill-info">
                <span className="summary-pill-label">Dompet Aktif</span>
                <span className="summary-pill-amount">{data.accounts.length} Akun</span>
              </div>
            </div>

            <div
              className="summary-pill-card"
              onClick={() => setIsAccumulativeModalOpen(true)}
              style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.22)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
              title="Buka Rincian Lengkap Saldo"
            >
              <div className="summary-pill-icon" style={{ backgroundColor: '#7C3AED' }}>
                <Layers size={16} />
              </div>
              <div className="summary-pill-info">
                <span className="summary-pill-label">Rincian Lengkap</span>
                <span className="summary-pill-amount" style={{ fontSize: '13px', color: '#FDE68A' }}>Buka Detail ➔</span>
              </div>
            </div>
          </div>

          {/* Banner Button to open detailed modal */}
          <button
            type="button"
            className="total-breakdown-banner-btn"
            onClick={() => setIsAccumulativeModalOpen(true)}
            title="Tampilkan rincian saldo per rekening / dompet"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={15} style={{ color: '#FCD34D' }} />
              <span>Lihat Rincian Lengkap Semua Dompet</span>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        /* 2. SWIPEABLE HERO FINANCIAL BALANCE & CASHFLOW CAROUSEL (DEFAULT: KAS HARI INI DULU) */
        <div
          className="hero-carousel-wrapper"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="hero-carousel-track"
            style={{ transform: `translateX(-${activeSlide * 50}%)` }}
          >
            {/* SLIDE 0: ARUS KAS HARI INI (DEFAULT POSISI PERTAMA) */}
            <div className="hero-slide">
              <div className="hero-balance-box today-card">
                <div className="hero-balance-top">
                  <div className="balance-status-tag today-tag">
                    <span className="pulsing-cyan-dot"></span>
                    <span>ARUS KAS HARI INI</span>
                  </div>
                  <button
                    type="button"
                    className="balance-visibility-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBalanceVisible(!isBalanceVisible);
                    }}
                    title={isBalanceVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
                  >
                    {isBalanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{isBalanceVisible ? 'Intip' : 'Tutup'}</span>
                  </button>
                </div>

                {/* Big Today's Net Flow */}
                <div
                  className="main-balance-display"
                  onClick={() => navigateTo('finance', 'history')}
                  style={{ cursor: 'pointer' }}
                  title="Lihat Riwayat Transaksi Hari Ini"
                >
                  <div className="main-balance-text">{formattedTodayNet}</div>
                  <ChevronRight size={22} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }} />
                </div>

                <div className="balance-sub-label">
                  <Calendar size={12} style={{ opacity: 0.8 }} />
                  <span>{formattedTodayDate}</span>
                  <span>•</span>
                  <span>{todayTxCount} Transaksi</span>
                </div>

                {/* Income & Expense Summary Pills for Today */}
                <div className="income-expense-row">
                  <div
                    className="summary-pill-card"
                    onClick={() => navigateTo('finance', 'history')}
                    style={{ cursor: 'pointer' }}
                    title="Lihat Pemasukan Hari Ini"
                  >
                    <div className="summary-pill-icon income">
                      <ArrowDown size={16} />
                    </div>
                    <div className="summary-pill-info">
                      <span className="summary-pill-label">Pemasukan Hari Ini</span>
                      <span className="summary-pill-amount">{formattedTodayIncome}</span>
                    </div>
                  </div>

                  <div
                    className="summary-pill-card"
                    onClick={() => navigateTo('finance', 'history')}
                    style={{ cursor: 'pointer' }}
                    title="Lihat Pengeluaran Hari Ini"
                  >
                    <div className="summary-pill-icon expense">
                      <ArrowUp size={16} />
                    </div>
                    <div className="summary-pill-info">
                      <span className="summary-pill-label">Pengeluaran Hari Ini</span>
                      <span className="summary-pill-amount">{formattedTodayExpense}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 1: SIKLUS KEUANGAN BULANAN (POSISI KEDUA KETIKA DIGESER) */}
            <div className="hero-slide">
              <div className="hero-balance-box">
                <div className="hero-balance-top">
                  <div className="balance-status-tag">
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#6EE7B7', display: 'inline-block' }}></span>
                    <span>SISA KEUANGAN SIKLUS</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="balance-visibility-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBalanceVisible(!isBalanceVisible);
                      }}
                      title={isBalanceVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
                    >
                      {isBalanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{isBalanceVisible ? 'Intip' : 'Tutup'}</span>
                    </button>
                  </div>
                </div>

                {/* Big Balance */}
                <div
                  className="main-balance-display"
                  onClick={() => setIsAccumulativeModalOpen(true)}
                  style={{ cursor: 'pointer' }}
                  title="Klik untuk lihat rincian akun"
                >
                  <div className="main-balance-text">{formattedCycleBalance}</div>
                  <ChevronRight size={22} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }} />
                </div>

                <div
                  className="balance-sub-label"
                  onClick={() => setIsCycleModalOpen(true)}
                  style={{ cursor: 'pointer' }}
                  title="Klik untuk ubah tanggal siklus"
                >
                  <span>Siklus: {financialCycle.label}</span>
                  <span>•</span>
                  <span>{financialCycle.daysRemaining} Hari Tersisa</span>
                </div>

                {/* Income & Expense Summary Pills for Active Cycle */}
                <div className="income-expense-row">
                  <div
                    className="summary-pill-card"
                    onClick={() => navigateTo('finance', 'history')}
                    style={{ cursor: 'pointer' }}
                    title="Lihat Riwayat Transaksi (Pemasukan Siklus)"
                  >
                    <div className="summary-pill-icon income">
                      <ArrowDown size={16} />
                    </div>
                    <div className="summary-pill-info">
                      <span className="summary-pill-label">Pemasukan Siklus</span>
                      <span className="summary-pill-amount">{formattedCycleIncome}</span>
                    </div>
                  </div>

                  <div
                    className="summary-pill-card"
                    onClick={() => navigateTo('finance', 'history')}
                    style={{ cursor: 'pointer' }}
                    title="Lihat Riwayat Transaksi (Pengeluaran Siklus)"
                  >
                    <div className="summary-pill-icon expense">
                      <ArrowUp size={16} />
                    </div>
                    <div className="summary-pill-info">
                      <span className="summary-pill-label">Pengeluaran Siklus</span>
                      <span className="summary-pill-amount">{formattedCycleExpense}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Slide Indicators & Hint Bar */}
          <div className="carousel-controls-bar">
            <div className="carousel-dots">
              <button
                type="button"
                className={`carousel-dot ${activeSlide === 0 ? 'active' : ''}`}
                onClick={() => setActiveSlide(0)}
                title="Lihat Arus Kas Hari Ini"
              />
              <button
                type="button"
                className={`carousel-dot ${activeSlide === 1 ? 'active' : ''}`}
                onClick={() => setActiveSlide(1)}
                title="Lihat Siklus Bulanan"
              />
            </div>

            <button
              type="button"
              className="carousel-hint-btn"
              onClick={() => setActiveSlide(activeSlide === 0 ? 1 : 0)}
              title="Klik atau geser untuk beralih info"
            >
              {activeSlide === 0 ? (
                <>
                  <span>Geser info Siklus Bulanan</span>
                  <span style={{ fontSize: '12px' }}>👉</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '12px' }}>👈</span>
                  <span>Geser info Kas Hari Ini</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal / Bottom Sheet Total Saldo Akumulatif (Tetap di Home) */}
      {isAccumulativeModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsAccumulativeModalOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="accumulative-balance-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="accumulative-modal-header">
              <div className="accumulative-modal-title-box">
                <div className="accumulative-icon-badge">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="accumulative-modal-title">Total Saldo Akumulatif</h3>
                  <p className="accumulative-modal-subtitle">Total gabungan dari seluruh rekening & dompet aktif</p>
                </div>
              </div>
              <button
                type="button"
                className="accumulative-modal-close"
                onClick={() => setIsAccumulativeModalOpen(false)}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Hero Card Total Saldo */}
            <div className="accumulative-hero-box">
              <div className="accumulative-hero-tag">
                <Sparkles size={13} style={{ color: '#FCD34D' }} />
                <span>TOTAL DANA GABUNGAN</span>
                <span className="accumulative-pill-live">Realtime</span>
              </div>
              <div className="accumulative-hero-balance">
                {isBalanceVisible
                  ? `Rp ${totalBalance.toLocaleString('id-ID')}`
                  : 'Rp ••••••••••'}
              </div>
              <div className="accumulative-hero-desc">
                <span>Dihitung dari {data.accounts.length} dompet/rekening terdaftar</span>
              </div>
            </div>

            {/* List Breakdown Per Akun */}
            <div className="accumulative-breakdown-section">
              <div className="accumulative-section-title">
                <span>RINCIAN SALDO PER AKUN</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{data.accounts.length} Dompet</span>
              </div>

              <div className="accumulative-account-list">
                {data.accounts.length === 0 ? (
                  <div className="empty-account-notice">
                    <p>Belum ada dompet terdaftar.</p>
                  </div>
                ) : (
                  data.accounts.map((acc) => {
                    const percentage = totalBalance > 0 ? Math.max(0, Math.round((acc.balance / totalBalance) * 100)) : 0;
                    return (
                      <div key={acc.id} className="accumulative-account-item">
                        <div className="accumulative-item-left">
                          <div
                            className="accumulative-item-icon"
                            style={{
                              backgroundColor: `${acc.color || '#1665D8'}18`,
                              color: acc.color || '#1665D8',
                              border: `1px solid ${acc.color || '#1665D8'}30`
                            }}
                          >
                            {acc.icon || '💳'}
                          </div>
                          <div>
                            <div className="accumulative-item-name">
                              {acc.name}
                              {acc.isPrimary && <span className="primary-pill">Utama</span>}
                            </div>
                            <div className="accumulative-item-type">
                              {acc.type === 'bank' ? 'Rekening Bank' : acc.type === 'ewallet' ? 'E-Wallet' : acc.type === 'cash' ? 'Dompet Tunai' : 'Investasi'}
                            </div>
                          </div>
                        </div>

                        <div className="accumulative-item-right">
                          <div className="accumulative-item-balance">
                            {isBalanceVisible
                              ? `Rp ${acc.balance.toLocaleString('id-ID')}`
                              : 'Rp ••••••'}
                          </div>
                          <div className="accumulative-item-pct">
                            <span>{percentage}%</span>
                            <div className="accumulative-pct-bar-bg">
                              <div
                                className="accumulative-pct-bar-fill"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: acc.color || '#1665D8'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Notice & Close Button */}
            <div className="accumulative-footer">
              <div className="accumulative-notice-card">
                <Layers size={15} style={{ color: '#0284C7', flexShrink: 0 }} />
                <span>
                  Ini adalah total akumulatif murni dari semua dompet. Anda tetap berada di halaman Beranda.
                </span>
              </div>
              <button
                type="button"
                className="btn-primary w-full"
                style={{ padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                onClick={() => setIsAccumulativeModalOpen(false)}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

