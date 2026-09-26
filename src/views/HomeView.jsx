import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { maskMoney, getRelativeDateInfo } from '../utils/formatters';
import {
  PieChart,
  Calendar,
  Target,
  FileCheck2,
  Clock,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';

export const HomeView = () => {
  const {
    data,
    navigateTo,
    setIsQuickAddOpen,
    setQuickAddType,
    totalBudget,
    remainingBudget,
    cycleExpenses,
    percentUsed,
    dailyAllowance,
    financialCycle,
    activeSemester,
    isBalanceVisible
  } = useApp();

  // Current active semester courses
  const currentSemesterNum = activeSemester || data.activeSemester || data.profile?.semester || 1;
  const currentCourses = (data.courses || []).filter(c => !c.semester || c.semester === currentSemesterNum);
  const todayClasses = currentCourses.slice(0, 2);

  // Urgent pending assignments
  const pendingAssignments = (data.assignments || [])
    .filter(a => (!a.semester || a.semester === currentSemesterNum) && a.status !== 'completed')
    .slice(0, 2);

  // Transactions for today only
  const todayTransactions = useMemo(() => {
    return (data.transactions || []).filter(tx => {
      if (!tx.date) return false;
      const rel = getRelativeDateInfo(tx.date);
      return rel.isToday;
    });
  }, [data.transactions]);

  const displayedTransactions = todayTransactions.slice(0, 5);

  return (
    <div className="main-content">
      {/* 1. Quick Actions Grid (Inspirasi TataLetakFitur.png) */}
      <div className="quick-action-grid">
        <button
          className="quick-action-item"
          onClick={() => navigateTo('finance', 'report')}
          title="Buka Laporan & Grafik Keuangan"
        >
          <div className="action-icon-circle" style={{ background: '#EFF6FF', color: '#1665D8' }}>
            <PieChart size={22} />
          </div>
          <span className="action-icon-label">Laporan Keuangan</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'schedule')}
          title="Buka Jadwal Kuliah"
        >
          <div className="action-icon-circle" style={{ background: '#ECFDF5', color: '#059669' }}>
            <Calendar size={22} />
          </div>
          <span className="action-icon-label">Jadwal Kuliah</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('finance', 'targets')}
          title="Buka Target Celengan / Nabung"
        >
          <div className="action-icon-circle" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Target size={22} />
          </div>
          <span className="action-icon-label">Target Nabung</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('finance', 'bills')}
          title="Buka Daftar Tagihan"
        >
          <div className="action-icon-circle" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <FileCheck2 size={22} />
          </div>
          <span className="action-icon-label">Catat Tagihan</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'assignments')}
          title="Buka Daftar Tugas Kuliah"
        >
          <div className="action-icon-circle" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
            <Clock size={22} />
          </div>
          <span className="action-icon-label">Tugas Kuliah</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'attendance')}
          title="Buka Presensi 16 Pertemuan Kuliah"
        >
          <div className="action-icon-circle" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <BookOpen size={22} />
          </div>
          <span className="action-icon-label">Presensi Cepat</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'notes')}
          title="Buka Catatan Materi Kuliah"
        >
          <div className="action-icon-circle" style={{ background: '#FCE7F3', color: '#DB2777' }}>
            <BookOpen size={22} />
          </div>
          <span className="action-icon-label">Catatan Kuliah</span>
        </button>

        <button
          className="quick-action-item"
          onClick={() => navigateTo('grades')}
          title="Buka Rekap Nilai & IPK"
        >
          <div className="action-icon-circle" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
            <GraduationCap size={22} />
          </div>
          <span className="action-icon-label">Rekap IPK</span>
        </button>
      </div>

      {/* 2. Smart Daily Budget Tip Card (Sesuai Budget.jpg) */}
      <div className="smart-tip-card">
        <div className="smart-tip-icon">🤑</div>
        <div>
          <div className="smart-tip-title">Masih aman banget, bro!</div>
          <div className="smart-tip-desc">
            Kamu bisa belanja rata-rata <strong>{maskMoney(dailyAllowance, isBalanceVisible)} / hari</strong> sampai akhir periode ini.
          </div>
        </div>
      </div>

      {/* 3. Kelas & Jadwal Kuliah Mendatang */}
      <div className="card-standard">
        <div className="section-header-row">
          <h3 className="section-title">
            <Calendar size={18} style={{ color: '#1665D8' }} />
            Jadwal Kuliah Terdekat
          </h3>
          <span
            className="section-action-link"
            onClick={() => navigateTo('academic', 'schedule')}
            style={{ cursor: 'pointer' }}
          >
            Lihat Semua <ChevronRight size={14} />
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {todayClasses.map(crs => (
            <div
              key={crs.id}
              onClick={() => navigateTo('academic', 'schedule')}
              style={{
                background: '#F8FAFC',
                borderRadius: '14px',
                padding: '12px 14px',
                borderLeft: `4px solid ${crs.color || '#1665D8'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              title="Buka Jadwal Kuliah"
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                  {crs.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {crs.dayOfWeek} • {crs.startTime} - {crs.endTime} • {crs.room}
                </div>
              </div>
              <span className="course-badge">{crs.sks} SKS</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tugas Kuliah Mendesak */}
      {pendingAssignments.length > 0 && (
        <div className="card-standard">
          <div className="section-header-row">
            <h3 className="section-title">
              <AlertCircle size={18} style={{ color: '#EF4444' }} />
              Tugas Mendekati Deadline
            </h3>
            <span
              className="section-action-link"
              onClick={() => navigateTo('academic', 'assignments')}
              style={{ cursor: 'pointer' }}
            >
              Buka Tugas <ChevronRight size={14} />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingAssignments.map(asg => (
              <div
                key={asg.id}
                onClick={() => navigateTo('academic', 'assignments')}
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                title="Buka Daftar Tugas Kuliah"
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B' }}>
                    {asg.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>
                    {asg.courseName} • Deadline: {new Date(asg.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <span className="priority-tag high">Prioritas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Keuangan Bulan Ini (Sesuai Home.jpg) */}
      <div
        className="card-standard"
        onClick={() => navigateTo('finance', 'budget')}
        style={{ cursor: 'pointer' }}
        title="Buka Budget Keuangan"
      >
        <div className="section-header-row">
          <h3 className="section-title">Keuangan Bulan Ini</h3>
          <span
            className="section-action-link"
            onClick={(e) => {
              e.stopPropagation();
              navigateTo('finance', 'budget');
            }}
          >
            Detail <ChevronRight size={14} />
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
          <span style={{ fontWeight: 700, color: '#475569' }}>Budget Bulanan</span>
          <span style={{ fontWeight: 800, color: '#10B981' }}>
            Sisa {maskMoney(remainingBudget, isBalanceVisible)}
          </span>
        </div>

        <div className="progress-bar-container">
          <div
            className={`progress-bar-fill ${percentUsed > 85 ? 'danger' : (percentUsed > 60 ? 'warning' : 'success')}`}
            style={{ width: `${percentUsed || 0}%` }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
          <span>Terpakai {maskMoney(cycleExpenses, isBalanceVisible)}</span>
          <span>dari {maskMoney(totalBudget, isBalanceVisible)} ({isBalanceVisible ? `${percentUsed || 0}%` : '••%'})</span>
        </div>
      </div>

      {/* 6. Transaksi Hari Ini */}
      <div>
        <div className="section-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="section-title">Transaksi Hari Ini</h3>
            {todayTransactions.length > 0 && (
              <span className="badge-date-pill today">Hari Ini</span>
            )}
          </div>
          <span
            className="section-action-link"
            onClick={() => navigateTo('finance', 'history')}
            style={{ cursor: 'pointer' }}
          >
            Lihat Semua <ChevronRight size={14} />
          </span>
        </div>

        <div className="transaction-group">
          {displayedTransactions.length > 0 ? (
            displayedTransactions.map(tx => (
              <div
                key={tx.id}
                className="transaction-card"
                onClick={() => navigateTo('finance', 'history')}
                style={{ cursor: 'pointer' }}
                title="Buka Riwayat Transaksi"
              >
                <div className="transaction-left">
                  <div className="category-icon-box" style={{ background: '#FEF3C7' }}>
                    {tx.icon}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-title">{tx.category}</div>
                    <div className="transaction-subtitle">
                      <span className="account-badge-micro">{tx.accountName}</span>
                      <span className="transaction-subtitle-text">{tx.merchant || tx.note}</span>
                    </div>
                  </div>
                </div>

                <div className="transaction-right">
                  <div className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'expense'
                      ? `-${maskMoney(tx.amount, isBalanceVisible)}`
                      : `+${maskMoney(tx.amount, isBalanceVisible)}`}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px dashed #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '26px' }}>☕</div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                  Belum Ada Transaksi Hari Ini
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                  Catat pengeluaran atau pemasukanmu hari ini
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickAddType('expense');
                  setIsQuickAddOpen(true);
                }}
                style={{
                  marginTop: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> + Catat Transaksi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
