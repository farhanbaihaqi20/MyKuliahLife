import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getFinancialCycle } from '../../utils/dateCycle';
import { maskMoney } from '../../utils/formatters';
import { DonutChart } from '../charts/DonutChart';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  Tag,
  CreditCard,
  Flame,
  Sparkles,
  X,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  FileText
} from 'lucide-react';
import { FinancialStatementModal } from './FinancialStatementModal';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAYS_CONFIG = [
  { id: 1, name: 'Senin', short: 'Sen' },
  { id: 2, name: 'Selasa', short: 'Sel' },
  { id: 3, name: 'Rabu', short: 'Rab' },
  { id: 4, name: 'Kamis', short: 'Kam' },
  { id: 5, name: 'Jumat', short: 'Jum' },
  { id: 6, name: 'Sabtu', short: 'Sab' },
  { id: 0, name: 'Minggu', short: 'Min' }
];

const COLOR_PALETTE = [
  '#F97316', '#3B82F6', '#10B981', '#EC4899',
  '#8B5CF6', '#EAB308', '#06B6D4', '#64748B',
  '#F43F5E', '#14B8A6', '#6366F1', '#D946EF'
];

export const FinanceReportView = ({ onEditTransaction }) => {
  const { data, isBalanceVisible, totalBalance } = useApp();

  // 0 = active/current month, 1 = 1 month ago, up to 11 = 11 months ago
  const [monthOffset, setMonthOffset] = useState(0);
  const [reportSubtab, setReportSubtab] = useState('kategori'); // 'kategori' | 'akun' | 'pola_hari'
  const [drillDownTarget, setDrillDownTarget] = useState(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Calculate cycle for chosen month offset
  const startDayOfMonth = data.budget?.startDayOfMonth || 1;

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    d.setDate(15); // safe middle of the month
    return d;
  }, [monthOffset]);

  const activeCycle = useMemo(() => {
    return getFinancialCycle(startDayOfMonth, targetDate);
  }, [startDayOfMonth, targetDate]);

  // Label for active month view
  const monthDisplayTitle = useMemo(() => {
    const m = targetDate.getMonth();
    const y = targetDate.getFullYear();
    return `${INDONESIAN_MONTHS[m]} ${y}`;
  }, [targetDate]);

  // Filter transactions for this specific month cycle (strictly expense)
  const monthExpenses = useMemo(() => {
    return (data.transactions || [])
      .filter(t => t.type === 'expense' && activeCycle.isDateInCycle(t.date))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [data.transactions, activeCycle]);

  const totalMonthExpense = useMemo(() => {
    return monthExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [monthExpenses]);

  // ----------------------------------------------------
  // 1. DATA KATEGORI
  // ----------------------------------------------------
  const categoryData = useMemo(() => {
    const map = {};
    monthExpenses.forEach(t => {
      const cat = t.category || 'Lainnya';
      if (!map[cat]) {
        map[cat] = { label: cat, amount: 0, count: 0, transactions: [] };
      }
      map[cat].amount += t.amount;
      map[cat].count += 1;
      map[cat].transactions.push(t);
    });

    const items = Object.values(map).sort((a, b) => b.amount - a.amount);

    return items.map((item, idx) => {
      // Find matching icon from budget categories if exists
      const matchCat = (data.budget?.categories || []).find(
        c => c.name.toLowerCase() === item.label.toLowerCase()
      );
      return {
        ...item,
        color: matchCat?.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
        icon: matchCat?.icon || '🏷️',
        percentage: totalMonthExpense > 0 ? Math.round((item.amount / totalMonthExpense) * 100) : 0
      };
    });
  }, [monthExpenses, data.budget?.categories, totalMonthExpense]);

  // ----------------------------------------------------
  // 2. DATA AKUN / DOMPET
  // ----------------------------------------------------
  const accountData = useMemo(() => {
    const map = {};
    monthExpenses.forEach(t => {
      const acc = t.accountName || 'Lainnya';
      if (!map[acc]) {
        map[acc] = { label: acc, amount: 0, count: 0, transactions: [] };
      }
      map[acc].amount += t.amount;
      map[acc].count += 1;
      map[acc].transactions.push(t);
    });

    const items = Object.values(map).sort((a, b) => b.amount - a.amount);

    return items.map((item, idx) => {
      const matchAcc = (data.accounts || []).find(
        a => a.name.toLowerCase() === item.label.toLowerCase()
      );
      return {
        ...item,
        color: matchAcc?.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
        icon: matchAcc?.icon || '💳',
        percentage: totalMonthExpense > 0 ? Math.round((item.amount / totalMonthExpense) * 100) : 0
      };
    });
  }, [monthExpenses, data.accounts, totalMonthExpense]);

  // ----------------------------------------------------
  // 3. DATA POLA HARI (Senin - Minggu)
  // ----------------------------------------------------
  const dayPatternData = useMemo(() => {
    // Initialize buckets for each day
    const map = {};
    DAYS_CONFIG.forEach(d => {
      map[d.id] = {
        id: d.id,
        label: d.name,
        short: d.short,
        amount: 0,
        count: 0,
        transactions: []
      };
    });

    monthExpenses.forEach(t => {
      if (!t.date) return;
      const parts = t.date.split('-');
      if (parts.length < 3) return;
      // Note: Month in Date constructor is 0-indexed
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 1 = Senin, ...
      if (map[dayOfWeek]) {
        map[dayOfWeek].amount += t.amount;
        map[dayOfWeek].count += 1;
        map[dayOfWeek].transactions.push(t);
      }
    });

    // Sort days by expenditure descending (terboros to terhemat)
    const sorted = Object.values(map).sort((a, b) => b.amount - a.amount);

    const highestDay = sorted.find(d => d.amount > 0);
    const lowestDay = [...sorted].reverse().find(d => d.amount > 0);

    return sorted.map((item, idx) => {
      const isTop = highestDay && item.id === highestDay.id && item.amount > 0;
      const isLowest = lowestDay && item.id === lowestDay.id && item.amount > 0 && item.id !== highestDay?.id;

      return {
        ...item,
        isHighlight: isTop,
        badge: isTop ? '🔥 Terboros' : isLowest ? '✨ Paling Hemat' : undefined,
        color: isTop ? '#E11D48' : idx === 1 ? '#F97316' : idx === 2 ? '#3B82F6' : '#94A3B8',
        sublabel: `${item.count} transaksi di hari ${item.label}`,
        percentage: totalMonthExpense > 0 ? Math.round((item.amount / totalMonthExpense) * 100) : 0
      };
    });
  }, [monthExpenses, totalMonthExpense]);

  // Top spending day for insight card
  const topDayInsight = useMemo(() => {
    return dayPatternData.find(d => d.amount > 0);
  }, [dayPatternData]);

  // ----------------------------------------------------
  // 4. DATA KOMPARASI 6 BULAN TERAKHIR
  // ----------------------------------------------------
  const comparisonData = useMemo(() => {
    const list = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const refD = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const cycle = getFinancialCycle(startDayOfMonth, refD);
      const cycleTxs = (data.transactions || []).filter(
        t => t.type === 'expense' && cycle.isDateInCycle(t.date)
      );
      const amount = cycleTxs.reduce((s, t) => s + (t.amount || 0), 0);
      const mIdx = refD.getMonth();
      const y = refD.getFullYear();

      list.push({
        offset: i,
        monthName: `${INDONESIAN_MONTHS_SHORT[mIdx]} ${y}`,
        fullLabel: `${INDONESIAN_MONTHS[mIdx]} ${y}`,
        amount,
        txCount: cycleTxs.length,
        cycleLabel: cycle.label,
        isCurrentSelected: i === monthOffset
      });
    }

    const maxSpend = Math.max(...list.map(l => l.amount), 0);
    const withSpending = list.filter(l => l.amount > 0);
    const avgSpend = withSpending.length > 0
      ? Math.round(withSpending.reduce((s, l) => s + l.amount, 0) / withSpending.length)
      : 0;

    const highestMonth = list.find(l => maxSpend > 0 && l.amount === maxSpend);

    return {
      items: list.map(item => ({
        ...item,
        isHighest: item.amount === maxSpend && maxSpend > 0,
        badge: item.amount === maxSpend && maxSpend > 0 ? '🔥 Terboros' : undefined,
        color: item.amount === maxSpend && maxSpend > 0 ? '#E11D48' : item.offset === monthOffset ? '#3B82F6' : '#94A3B8'
      })),
      maxSpend,
      avgSpend,
      highestMonth
    };
  }, [startDayOfMonth, data.transactions, monthOffset]);

  // Comparison insight for selected month vs average
  const selectedVsAverageInsight = useMemo(() => {
    if (comparisonData.avgSpend <= 0 || totalMonthExpense <= 0) return null;
    const diff = totalMonthExpense - comparisonData.avgSpend;
    const diffPct = Math.round(Math.abs(diff / comparisonData.avgSpend) * 100);

    if (diff > 0) {
      return {
        isHigher: true,
        diffPct,
        text: `${diffPct}% lebih boros dari rata-rata bulanan`
      };
    } else if (diff < 0) {
      return {
        isHigher: false,
        diffPct,
        text: `${diffPct}% lebih hemat dari rata-rata bulanan`
      };
    }
    return {
      isHigher: false,
      diffPct: 0,
      text: `Sama dengan rata-rata bulanan`
    };
  }, [totalMonthExpense, comparisonData.avgSpend]);

  // Open drill-down modal handler
  const handleOpenDrillDown = (type, item) => {
    if (!item || !item.transactions || item.transactions.length === 0) return;

    let title = item.label;
    let subtitle = `Periode ${monthDisplayTitle} • ${item.transactions.length} Transaksi`;
    let icon = item.icon || '📊';

    if (type === 'day') {
      title = `Hari ${item.label}`;
      subtitle = `Semua transaksi hari ${item.label} pada periode ${monthDisplayTitle}`;
      icon = '📅';
    } else if (type === 'category') {
      icon = item.icon || '🏷️';
    } else if (type === 'account') {
      icon = item.icon || '💳';
    }

    setDrillDownTarget({
      type,
      title,
      subtitle,
      icon,
      amount: item.amount,
      count: item.transactions.length,
      transactions: item.transactions
    });
  };

  return (
    <div className="finance-report-view">
      {/* 0. REPORT HEADER & EXPORT ACTION */}
      <div className="section-header-row" style={{ alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 className="section-title">Laporan Keuangan</h3>
          <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
            Ringkasan pengeluaran & mutasi rekening
          </span>
        </div>

        <button
          type="button"
          className="finance-export-pill"
          onClick={() => setIsStatementModalOpen(true)}
          title="Export Rekening Koran & Laporan Bank Resmi (PDF / Excel)"
        >
          <FileText size={13} className="export-pill-icon" />
          <span className="export-pill-text-full">Export Rekening Koran</span>
          <span className="export-pill-text-short">Export</span>
        </button>
      </div>

      {/* 1. MONTH SELECTOR (NAVIGASI BULAN) */}
      <div
        className="card-standard"
        style={{
          padding: '14px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <button
          type="button"
          onClick={() => setMonthOffset(prev => Math.min(11, prev + 1))}
          disabled={monthOffset >= 11}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            background: monthOffset >= 11 ? '#F8FAFC' : '#FFFFFF',
            color: monthOffset >= 11 ? '#CBD5E1' : '#0F172A',
            cursor: monthOffset >= 11 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Bulan sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Calendar size={14} style={{ color: '#3B82F6' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              {monthDisplayTitle}
            </span>
            {monthOffset === 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE'
                }}
              >
                Bulan Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {activeCycle.label} • {maskMoney(totalMonthExpense, isBalanceVisible)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
          disabled={monthOffset <= 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            background: monthOffset <= 0 ? '#F8FAFC' : '#FFFFFF',
            color: monthOffset <= 0 ? '#CBD5E1' : '#0F172A',
            cursor: monthOffset <= 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Bulan berikutnya"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 2. SUBTAB SELECTOR: KATEGORI | AKUN | POLA HARI */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className="pill-btn"
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '10px 8px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            background: reportSubtab === 'kategori' ? '#1665D8' : '#F1F5F9',
            color: reportSubtab === 'kategori' ? '#FFFFFF' : '#475569',
            borderColor: 'transparent',
            boxShadow: reportSubtab === 'kategori' ? '0 4px 12px rgba(22, 101, 216, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setReportSubtab('kategori')}
        >
          🏷️ Kategori
        </button>

        <button
          type="button"
          className="pill-btn"
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '10px 8px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            background: reportSubtab === 'akun' ? '#1665D8' : '#F1F5F9',
            color: reportSubtab === 'akun' ? '#FFFFFF' : '#475569',
            borderColor: 'transparent',
            boxShadow: reportSubtab === 'akun' ? '0 4px 12px rgba(22, 101, 216, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setReportSubtab('akun')}
        >
          💳 Akun
        </button>

        <button
          type="button"
          className="pill-btn"
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '10px 8px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            background: reportSubtab === 'pola_hari' ? '#1665D8' : '#F1F5F9',
            color: reportSubtab === 'pola_hari' ? '#FFFFFF' : '#475569',
            borderColor: 'transparent',
            boxShadow: reportSubtab === 'pola_hari' ? '0 4px 12px rgba(22, 101, 216, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setReportSubtab('pola_hari')}
        >
          🔥 Pola Hari
        </button>
      </div>

      {/* 3. KONTEN TAB: KATEGORI / AKUN / POLA HARI */}
      {totalMonthExpense <= 0 ? (
        <div
          className="card-standard"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748B',
            borderRadius: '16px'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📊</div>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Belum Ada Pengeluaran di Periode Ini
          </h4>
          <p style={{ fontSize: '12px', marginTop: '6px', lineHeight: '1.5', color: '#64748B' }}>
            Tidak ada transaksi pengeluaran pada rentang <strong>{activeCycle.label}</strong>.
            Gunakan tombol navigasi di atas untuk melihat bulan lainnya.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: KATEGORI */}
          {reportSubtab === 'kategori' && (
            <div>
              <div className="card-standard" style={{ borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Distribusi per Kategori
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    {categoryData.length} Kategori
                  </span>
                </div>

                <DonutChart
                  items={categoryData}
                  totalAmount={totalMonthExpense}
                  centerLabel="Total Kategori"
                  onSliceClick={(item) => handleOpenDrillDown('category', item)}
                />
              </div>

              {/* List Kartu Kategori Interaktif */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    Rincian Kategori (Klik untuk Riwayat)
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Urut nominal terbesar
                  </span>
                </div>

                {categoryData.map((item, idx) => (
                  <div
                    key={idx}
                    className="card-standard"
                    onClick={() => handleOpenDrillDown('category', item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenDrillDown('category', item);
                      }
                    }}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        className="has-3d-icon"
                        style={{
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <CategoryIcon category={item.label} icon={item.icon} size={38} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {item.count} transaksi • {item.percentage}% dari total
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                          {maskMoney(item.amount, isBalanceVisible)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                          Lihat riwayat →
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#94A3B8' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AKUN */}
          {reportSubtab === 'akun' && (
            <div>
              <div className="card-standard" style={{ borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Pengeluaran per Akun / Dompet
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    {accountData.length} Akun Terpakai
                  </span>
                </div>

                <DonutChart
                  items={accountData}
                  totalAmount={totalMonthExpense}
                  centerLabel="Total Akun"
                  onSliceClick={(item) => handleOpenDrillDown('account', item)}
                />
              </div>

              {/* List Kartu Akun Interaktif */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    Rincian Dompet (Klik untuk Riwayat)
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Urut nominal terbesar
                  </span>
                </div>

                {accountData.map((item, idx) => (
                  <div
                    key={idx}
                    className="card-standard"
                    onClick={() => handleOpenDrillDown('account', item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenDrillDown('account', item);
                      }
                    }}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          backgroundColor: `${item.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {item.count} transaksi • {item.percentage}% pengeluaran
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                          {maskMoney(item.amount, isBalanceVisible)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                          Lihat riwayat →
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#94A3B8' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: POLA HARI (PENGELUARAN TERBOROS PER HARI) */}
          {reportSubtab === 'pola_hari' && (
            <div>
              {/* Highlight Hero Card */}
              {topDayInsight && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
                    border: '1px solid #FECDD3',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#F43F5E',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0
                    }}
                  >
                    🔥
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9F1239', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Hari Paling Boros Bulan Ini
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#881337', marginTop: '2px' }}>
                      Hari {topDayInsight.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9F1239', marginTop: '2px' }}>
                      Total <strong>{maskMoney(topDayInsight.amount, isBalanceVisible)}</strong> ({topDayInsight.percentage}% dari seluruh pengeluaran)
                    </div>
                  </div>
                </div>
              )}

              {/* Bar Chart Horizontal Hari Terboros */}
              <div className="card-standard" style={{ borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      Ranking Hari Pengeluaran
                    </h4>
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Klik hari mana saja untuk melihat seluruh transaksi yang terjadi
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: '8px'
                    }}
                  >
                    7 Hari
                  </span>
                </div>

                <HorizontalBarChart
                  items={dayPatternData}
                  totalAmount={totalMonthExpense}
                  onItemClick={(item) => handleOpenDrillDown('day', item)}
                  unit="Rp"
                />
              </div>

              <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '10px' }}>
                💡 Tip: Pola hari membantu Anda mengontrol hari di mana pengeluaran impulsif paling sering terjadi.
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. SECTION: KOMPARASI BULAN (BULAN PALING BOROS) */}
      <div style={{ marginTop: '24px' }}>
        <div className="card-standard" style={{ borderRadius: '16px', padding: '18px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  Komparasi 6 Bulan Terakhir
                </h4>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                  Perbandingan nominal & tren bulan terboros
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                Rata-rata Pengeluaran
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                {maskMoney(comparisonData.avgSpend, isBalanceVisible)}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>
                Per bulan aktif
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3'
              }}
            >
              <div style={{ fontSize: '11px', color: '#9F1239', fontWeight: 600 }}>
                Bulan Paling Boros 🔥
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#E11D48', marginTop: '3px' }}>
                {comparisonData.highestMonth ? comparisonData.highestMonth.monthName : '-'}
              </div>
              <div style={{ fontSize: '10px', color: '#BE123C', marginTop: '1px' }}>
                {comparisonData.highestMonth
                  ? maskMoney(comparisonData.highestMonth.amount, isBalanceVisible)
                  : 'Rp 0'}
              </div>
            </div>
          </div>

          {/* Selected month status badge */}
          {selectedVsAverageInsight && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '16px',
                backgroundColor: selectedVsAverageInsight.isHigher ? '#FEF2F2' : '#F0FDF4',
                border: selectedVsAverageInsight.isHigher ? '1px solid #FCA5A5' : '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {selectedVsAverageInsight.isHigher ? (
                <TrendingUp size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
              ) : (
                <TrendingDown size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: selectedVsAverageInsight.isHigher ? '#991B1B' : '#166534'
                }}
              >
                <strong>{monthDisplayTitle}</strong>: {selectedVsAverageInsight.text}
              </span>
            </div>
          )}

          {/* Horizontal comparison bar rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {comparisonData.items.map((item, idx) => {
              const barWidth = comparisonData.maxSpend > 0
                ? Math.min(100, Math.max(0, (item.amount / comparisonData.maxSpend) * 100))
                : 0;
              const isSelected = item.offset === monthOffset;

              return (
                <div
                  key={idx}
                  onClick={() => setMonthOffset(item.offset)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMonthOffset(item.offset);
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isSelected ? '#EFF6FF' : '#F8FAFC',
                    border: isSelected ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Klik untuk melihat laporan ${item.fullLabel}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 700, color: isSelected ? '#1E40AF' : '#0F172A' }}>
                        {item.monthName}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '6px',
                            backgroundColor: '#3B82F6',
                            color: '#FFFFFF'
                          }}
                        >
                          Dilihat
                        </span>
                      )}
                      {item.isHighest && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '6px',
                            backgroundColor: '#E11D48',
                            color: '#FFFFFF'
                          }}
                        >
                          🔥 Terboros
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 800, color: item.isHighest ? '#E11D48' : '#0F172A' }}>
                      {maskMoney(item.amount, isBalanceVisible)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        backgroundColor: item.isHighest ? '#E11D48' : isSelected ? '#3B82F6' : '#94A3B8',
                        borderRadius: '10px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '12px' }}>
            💡 Klik salah satu bulan di atas untuk langsung beralih ke laporan bulan tersebut.
          </div>
        </div>
      </div>

      {/* 5. DRILL-DOWN TRANSAKSI MODAL (BOTTOM SHEET) */}
      {drillDownTarget && (
        <div
          className="modal-overlay"
          onClick={() => setDrillDownTarget(null)}
          style={{ zIndex: 1250 }}
        >
          <div
            className="modal-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 20px calc(var(--safe-bottom) + 20px)'
            }}
          >
            <div className="sheet-handle-bar" />

            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className="has-3d-icon"
                  style={{
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CategoryIcon category={drillDownTarget.title || drillDownTarget.label} icon={drillDownTarget.icon} size={42} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {drillDownTarget.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    {drillDownTarget.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrillDownTarget(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Highlight Summary Box */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                  Total Pengeluaran
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444', marginTop: '2px' }}>
                  {maskMoney(drillDownTarget.amount, isBalanceVisible)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                  Rata-rata per Transaksi
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {drillDownTarget.count > 0
                    ? maskMoney(Math.round(drillDownTarget.amount / drillDownTarget.count), isBalanceVisible)
                    : 'Rp 0'}
                </div>
              </div>
            </div>

            {/* List Transaksi Scrollable */}
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Daftar Transaksi ({drillDownTarget.transactions.length})
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '2px'
              }}
            >
              {drillDownTarget.transactions.map((tx, idx) => {
                // Parse and format date e.g. "12 Sep 2026"
                let dateDisplay = tx.date;
                try {
                  const parts = (tx.date || '').split('-');
                  if (parts.length === 3) {
                    const mName = INDONESIAN_MONTHS_SHORT[Number(parts[1]) - 1] || parts[1];
                    dateDisplay = `${parts[2]} ${mName} ${parts[0]}`;
                  }
                } catch (e) {
                  dateDisplay = tx.date;
                }

                return (
                  <div
                    key={tx.id || idx}
                    onClick={() => {
                      if (onEditTransaction) {
                        setDrillDownTarget(null);
                        onEditTransaction(tx);
                      }
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: onEditTransaction ? 'pointer' : 'default',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        className="has-3d-icon"
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <CategoryIcon category={tx.category || drillDownTarget.title} icon={tx.icon} size={28} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                          {tx.merchant || tx.category || 'Transaksi'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span>{dateDisplay}</span>
                          <span>•</span>
                          <span>{tx.accountName || 'Cash'}</span>
                          {tx.note && (
                            <>
                              <span>•</span>
                              <span style={{ fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                "{tx.note}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>
                        -{maskMoney(tx.amount, isBalanceVisible)}
                      </div>
                      {onEditTransaction && (
                        <div style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 600, marginTop: '2px' }}>
                          Edit
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Dismiss Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={() => setDrillDownTarget(null)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                background: '#0F172A',
                color: '#FFFFFF'
              }}
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* FINANCIAL STATEMENT & OFFICIAL BANK EXPORT MODAL */}
      <FinancialStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        data={data}
        totalBalance={totalBalance}
        activeCycle={activeCycle}
        currentMonthTitle={monthDisplayTitle}
      />
    </div>
  );
};
