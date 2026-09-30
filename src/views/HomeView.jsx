import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { maskMoney, getRelativeDateInfo } from '../utils/formatters';
import { SmartBudgetTipCard } from '../components/finance/SmartBudgetTipCard';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { MascotEmptyState } from '../components/common/MascotEmptyState';
import iconReport from '../assets/quick-actions/finance-report.png';
import iconSchedule from '../assets/quick-actions/class-schedule.png';
import iconTarget from '../assets/quick-actions/savings-target.png';
import iconBills from '../assets/quick-actions/bills-record.png';
import iconAssignments from '../assets/quick-actions/assignments.png';
import iconAttendance from '../assets/quick-actions/attendance.png';
import iconNotes from '../assets/quick-actions/lecture-notes.png';
import iconExtras from '../assets/quick-actions/extras-more.png';
import {
  Calendar,
  Clock,
  BookOpen,
  ChevronRight,
  AlertCircle,
  MapPin,
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

  // Today's day name in Indonesian (Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();
  const todayDayName = indonesianDays[now.getDay()];
  const formattedTodayDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  const todayClasses = useMemo(() => {
    return currentCourses
      .filter(c => c.dayOfWeek?.trim().toLowerCase() === todayDayName.toLowerCase())
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  }, [currentCourses, todayDayName]);

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
      {/* 1. Quick Actions Grid (3D Custom Unified Icons) */}
      <div className="quick-action-grid">
        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('finance', 'report')}
          title="Buka Laporan & Grafik Keuangan"
        >
          <div className="action-icon-box">
            <img src={iconReport} alt="Laporan Keuangan" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Laporan Keuangan</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'schedule')}
          title="Buka Jadwal Kuliah"
        >
          <div className="action-icon-box">
            <img src={iconSchedule} alt="Jadwal Kuliah" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Jadwal Kuliah</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('finance', 'targets')}
          title="Buka Target Celengan / Nabung"
        >
          <div className="action-icon-box">
            <img src={iconTarget} alt="Target Nabung" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Target Nabung</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('finance', 'bills')}
          title="Buka Daftar Tagihan"
        >
          <div className="action-icon-box">
            <img src={iconBills} alt="Catat Tagihan" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Catat Tagihan</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'assignments')}
          title="Buka Daftar Tugas Kuliah"
        >
          <div className="action-icon-box">
            <img src={iconAssignments} alt="Tugas Kuliah" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Tugas Kuliah</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'attendance')}
          title="Buka Presensi 16 Pertemuan Kuliah"
        >
          <div className="action-icon-box">
            <img src={iconAttendance} alt="Presensi Cepat" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Presensi Cepat</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('academic', 'notes')}
          title="Buka Catatan Materi Kuliah"
        >
          <div className="action-icon-box">
            <img src={iconNotes} alt="Catatan Kuliah" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Catatan Kuliah</span>
        </button>

        <button
          type="button"
          className="quick-action-item"
          onClick={() => navigateTo('extras')}
          title="Buka Menu Fitur Lainnya"
        >
          <div className="action-icon-box">
            <img src={iconExtras} alt="Lainnya" className="action-icon-img" loading="eager" />
          </div>
          <span className="action-icon-label">Lainnya</span>
        </button>
      </div>

      {/* 2. Smart Daily Budget Mascot Tip Card */}
      <SmartBudgetTipCard />

      {/* 3. Jadwal Kuliah Hari Ini */}
      <div className="card-standard">
        <div className="section-header-row" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="section-title">
              <Calendar size={18} style={{ color: '#1665D8' }} />
              Jadwal Kuliah Hari Ini
            </h3>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block', marginTop: '2px' }}>
              {formattedTodayDate}
            </span>
          </div>
          <span
            className="section-action-link"
            onClick={() => navigateTo('academic', 'schedule')}
            style={{ cursor: 'pointer' }}
          >
            Lihat Semua <ChevronRight size={14} />
          </span>
        </div>

        {todayClasses.length === 0 ? (
          <MascotEmptyState
            mascot="relax"
            mascotSize={92}
            title="Tidak ada jadwal kuliah hari ini"
            description={
              todayDayName === 'Minggu'
                ? 'Selamat berlibur! Siapkan energimu untuk perkuliahan besok.'
                : 'Hari ini kosong. Waktunya belajar mandiri atau santai sejenak!'
            }
            actionText="Lihat Semua Jadwal"
            actionIcon={<Calendar size={13} />}
            onAction={() => navigateTo('academic', 'schedule')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayClasses.map(crs => {
              // Status determination
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const [startH, startM] = (crs.startTime || '00:00').split(':').map(Number);
              const [endH, endM] = (crs.endTime || '00:00').split(':').map(Number);
              const startMinutes = (startH || 0) * 60 + (startM || 0);
              const endMinutes = (endH || 0) * 60 + (endM || 0);

              let statusBadge = null;
              if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                statusBadge = { text: 'Sedang Berlangsung', bg: '#DCFCE7', color: '#166534', dot: true };
              } else if (currentMinutes > endMinutes) {
                statusBadge = { text: 'Selesai', bg: '#F1F5F9', color: '#64748B', dot: false };
              } else {
                statusBadge = { text: 'Akan Datang', bg: '#EFF6FF', color: '#1665D8', dot: false };
              }

              return (
                <div
                  key={crs.id}
                  onClick={() => navigateTo('academic', 'schedule')}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: '1px solid #E2E8F0',
                    borderLeft: `4px solid ${crs.color || '#1665D8'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Ketuk untuk buka jadwal kuliah lengkap"
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '6px',
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {statusBadge.dot && (
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: statusBadge.color,
                              display: 'inline-block'
                            }}
                          />
                        )}
                        {statusBadge.text}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {crs.name}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {crs.startTime} - {crs.endTime}
                      </span>
                      {crs.room && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {crs.room}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="course-badge"
                    style={{
                      background: '#EFF6FF',
                      color: '#1665D8',
                      border: '1px solid #BFDBFE',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {crs.sks} SKS
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Tugas Kuliah Mendesak */}
      <div className="card-standard">
        <div className="section-header-row">
          <h3 className="section-title">
            <Clock size={17} style={{ color: pendingAssignments.length > 0 ? '#EF4444' : '#10B981' }} />
            Tugas Kuliah
          </h3>
          <span
            className="section-action-link"
            onClick={() => navigateTo('academic', 'assignments')}
            style={{ cursor: 'pointer' }}
          >
            Semua Tugas <ChevronRight size={14} />
          </span>
        </div>

        {pendingAssignments.length > 0 ? (
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
        ) : (
          <MascotEmptyState
            mascot="task"
            mascotSize={88}
            title="Tidak Ada Tugas Mendesak"
            description="Semua tugas beres atau belum ada deadline baru. Waktunya santai dulu!"
            actionText="Buka Semua Tugas"
            actionIcon={<ChevronRight size={13} />}
            onAction={() => navigateTo('academic', 'assignments')}
            style={{ background: 'transparent', border: '1px dashed #E2E8F0', padding: '16px 12px' }}
          />
        )}
      </div>

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
                  <div className="category-icon-box has-3d-icon">
                    <CategoryIcon category={tx.category} icon={tx.icon} size={36} />
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
            <MascotEmptyState
              mascot="wallet"
              mascotSize={92}
              title="Belum Ada Transaksi Hari Ini"
              description="Catat pengeluaran atau pemasukanmu hari ini agar arus kas tetap rapi."
              actionText="+ Catat Transaksi"
              onAction={() => {
                setQuickAddType('expense');
                setIsQuickAddOpen(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
