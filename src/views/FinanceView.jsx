import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FinanceReportView } from '../components/finance/FinanceReportView';
import { formatRupiahNumber, parseRupiahNumber, maskMoney, formatCompactRupiah, getRelativeDateInfo } from '../utils/formatters';
import { getBudgetMascotState } from '../utils/budgetMascot';
import SwipeableItem from '../components/common/SwipeableItem';
import EditTransactionModal from '../components/finance/EditTransactionModal';
import { AccountDetailModal } from '../components/finance/AccountDetailModal';
import { CategoryDetailModal } from '../components/finance/CategoryDetailModal';
import { BudgetSettingsModal } from '../components/finance/BudgetSettingsModal';
import { FinancialStatementModal } from '../components/finance/FinancialStatementModal';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { MascotEmptyState } from '../components/common/MascotEmptyState';
import { getAccountTypeIcon, getAccountBrandInfo, COLOR_SWATCHES } from '../utils/accountBrand';
import {
  Wallet,
  Receipt,
  PieChart,
  Calendar,
  Target,
  Plus,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ChevronRight,
  Trash2,
  Edit2,
  MoreVertical,
  Sparkles,
  ShieldCheck,
  Sliders,
  X,
  Printer,
  FileText,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FinanceView = () => {
  const {
    data,
    totalBalance,
    cycleExpenses,
    cycleIncome,
    totalBudget,
    remainingBudget,
    percentUsed,
    dailyAllowance,
    financialCycle,
    toggleBillPaid,
    addBill,
    deleteBill,
    addSavingsTarget,
    depositToTarget,
    deleteSavingsTarget,
    deleteTransaction,
    addAccount,
    editAccount,
    deleteAccount,
    setPrimaryAccount,
    setIsQuickAddOpen,
    setQuickAddType,
    setQuickAddCategory,
    setIsCycleModalOpen,
    isBalanceVisible,
    financeSubtab,
    setFinanceSubtab,
    updateBudget
  } = useApp();

  const mascotState = useMemo(() => {
    return getBudgetMascotState({
      totalBudget,
      remainingBudget,
      cycleExpenses,
      percentUsed,
      dailyAllowance,
      financialCycle
    });
  }, [totalBudget, remainingBudget, cycleExpenses, percentUsed, dailyAllowance, financialCycle]);

  // Edit transaction modal state
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Deposit modal state
  const [depositModalTarget, setDepositModalTarget] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  // Target Form modal
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newTargetDeadline, setNewTargetDeadline] = useState('');

  // Bill Form modal
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDate, setNewBillDate] = useState('');
  const [newBillCategory, setNewBillCategory] = useState('Kost & Rumah');

  // Account Form modals & Interactive Detail Modal
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccIcon, setNewAccIcon] = useState('💳');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccNotes, setNewAccNotes] = useState('');
  const [newAccIsPrimary, setNewAccIsPrimary] = useState(false);
  const [newAccColor, setNewAccColor] = useState('');

  const [editingAccount, setEditingAccount] = useState(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccBalance, setEditAccBalance] = useState('');
  const [editAccNumber, setEditAccNumber] = useState('');
  const [editAccNotes, setEditAccNotes] = useState('');
  const [editAccIsPrimary, setEditAccIsPrimary] = useState(false);
  const [editAccColor, setEditAccColor] = useState('');

  // Group transactions by date & sort descending (Hari Ini on top)
  const groupedTransactions = useMemo(() => {
    return (data.transactions || []).reduce((acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    }, {});
  }, [data.transactions]);

  const sortedDateGroups = useMemo(() => {
    return Object.entries(groupedTransactions).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [groupedTransactions]);



  // Filter state for accounts tab: 'all' | 'bank' | 'ewallet' | 'cash' | 'other'
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');

  const bankAccounts = useMemo(() => (data.accounts || []).filter(a => a.type === 'bank'), [data.accounts]);
  const ewalletAccounts = useMemo(() => (data.accounts || []).filter(a => a.type === 'ewallet'), [data.accounts]);
  const cashAccounts = useMemo(() => (data.accounts || []).filter(a => a.type === 'cash'), [data.accounts]);
  const otherAccounts = useMemo(() => (data.accounts || []).filter(a => !['bank', 'ewallet', 'cash'].includes(a.type)), [data.accounts]);

  const bankTotal = useMemo(() => bankAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0), [bankAccounts]);
  const ewalletTotal = useMemo(() => ewalletAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0), [ewalletAccounts]);
  const cashTotal = useMemo(() => cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0), [cashAccounts]);
  const otherTotal = useMemo(() => otherAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0), [otherAccounts]);

  const pctBank = useMemo(() => totalBalance > 0 ? Math.round((bankTotal / totalBalance) * 100) : 0, [bankTotal, totalBalance]);
  const pctEwallet = useMemo(() => totalBalance > 0 ? Math.round((ewalletTotal / totalBalance) * 100) : 0, [ewalletTotal, totalBalance]);
  const pctOther = useMemo(() => totalBalance > 0 && otherTotal > 0 ? Math.round((otherTotal / totalBalance) * 100) : 0, [otherTotal, totalBalance]);
  const pctCash = useMemo(() => totalBalance > 0 ? Math.max(0, 100 - pctBank - pctEwallet - pctOther) : 0, [totalBalance, pctBank, pctEwallet, pctOther]);

  const filteredAccounts = useMemo(() => {
    if (accountTypeFilter === 'all') return data.accounts || [];
    if (accountTypeFilter === 'bank') return bankAccounts;
    if (accountTypeFilter === 'ewallet') return ewalletAccounts;
    if (accountTypeFilter === 'cash') return cashAccounts;
    if (accountTypeFilter === 'other') return otherAccounts;
    return data.accounts || [];
  }, [data.accounts, accountTypeFilter, bankAccounts, ewalletAccounts, cashAccounts, otherAccounts]);

  const unpaidBillsCount = useMemo(() => (data.bills || []).filter(b => !b.isPaid).length, [data.bills]);

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const rawAmount = parseRupiahNumber(depositAmount);
    if (!rawAmount || rawAmount <= 0 || !depositModalTarget) return;

    depositToTarget(depositModalTarget.id, rawAmount, depositNote || 'Setoran tabungan');
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    setDepositModalTarget(null);
    setDepositAmount('');
    setDepositNote('');
  };

  const handleCreateTarget = (e) => {
    e.preventDefault();
    const rawAmount = parseRupiahNumber(newTargetAmount);
    if (!newTargetTitle || !rawAmount) return;

    addSavingsTarget({
      title: newTargetTitle,
      targetAmount: rawAmount,
      currentAmount: 0,
      deadline: newTargetDeadline || '2026-12-31',
      category: 'Pendidikan',
      icon: '🎯'
    });

    setIsAddTargetOpen(false);
    setNewTargetTitle('');
    setNewTargetAmount('');
  };

  const handleCreateBill = (e) => {
    e.preventDefault();
    const rawAmount = parseRupiahNumber(newBillAmount);
    if (!newBillTitle || !rawAmount) return;

    addBill({
      title: newBillTitle,
      amount: rawAmount,
      dueDate: newBillDate || '2026-09-30',
      category: newBillCategory,
      recurrence: 'Bulanan',
      icon: '🧾'
    });

    setIsAddBillOpen(false);
    setNewBillTitle('');
    setNewBillAmount('');
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: parseRupiahNumber(newAccBalance) || 0,
      accountNumber: newAccNumber.trim(),
      notes: newAccNotes.trim(),
      isPrimary: newAccIsPrimary,
      color: newAccColor || undefined
    });

    setIsAddAccountOpen(false);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccNumber('');
    setNewAccNotes('');
    setNewAccIsPrimary(false);
    setNewAccColor('');
  };

  const openEditModal = (acc) => {
    setSelectedAccountDetail(null);
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccBalance(formatRupiahNumber(acc.balance));
    setEditAccNumber(acc.accountNumber || '');
    setEditAccNotes(acc.notes || '');
    setEditAccIsPrimary(Boolean(acc.isPrimary));
    setEditAccColor(acc.color || '');
  };

  const handleSaveEditAccount = (e) => {
    e.preventDefault();
    if (!editingAccount) return;

    const updatedData = {
      name: editAccName.trim(),
      balance: parseRupiahNumber(editAccBalance) || 0,
      accountNumber: editAccNumber.trim(),
      notes: editAccNotes.trim(),
      isPrimary: editAccIsPrimary,
      color: editAccColor || undefined
    };

    editAccount(editingAccount.id, updatedData);

    // If modal detail is currently open for this account, update it too
    if (selectedAccountDetail && selectedAccountDetail.id === editingAccount.id) {
      setSelectedAccountDetail(prev => ({
        ...prev,
        ...updatedData
      }));
    }

    setEditingAccount(null);
  };

  const handleDeleteAccount = (accId, accName) => {
    if (data.accounts.length <= 1) {
      alert('Kamu harus memiliki minimal satu dompet aktif!');
      return;
    }
    if (window.confirm(`Hapus dompet "${accName}"?`)) {
      deleteAccount(accId);
    }
  };

  const handleDeleteTransaction = (txId, note, amount) => {
    if (window.confirm(`Hapus transaksi "${note || 'Transaksi'}" sebesar Rp ${amount.toLocaleString('id-ID')}? Saldo dompet akan otomatis dikoreksi.`)) {
      deleteTransaction(txId, true);
    }
  };

  const handleDeleteBill = (billId, title) => {
    if (window.confirm(`Hapus tagihan "${title}"?`)) {
      deleteBill(billId);
    }
  };

  const handleDeleteTarget = (targetId, title) => {
    if (window.confirm(`Hapus target celengan "${title}"?`)) {
      deleteSavingsTarget(targetId);
    }
  };

  return (
    <div className="main-content" style={{ paddingTop: '16px' }}>
      {/* Subtab Bar (Modern Capsule Navigation) */}
      <div className="subtab-bar">
        <button
          className={`subtab-btn ${financeSubtab === 'accounts' ? 'active' : ''}`}
          onClick={(e) => {
            setFinanceSubtab('accounts');
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }}
        >
          <span>💳</span>
          <span>Dompet</span>
          <span className="subtab-btn-badge">{data.accounts.length}</span>
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'budget' ? 'active' : ''}`}
          onClick={(e) => {
            setFinanceSubtab('budget');
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }}
        >
          <span>📊</span>
          <span>Budget</span>
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'history' ? 'active' : ''}`}
          onClick={(e) => {
            setFinanceSubtab('history');
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }}
        >
          <span>🕒</span>
          <span>Riwayat</span>
          {data.transactions.length > 0 && (
            <span className="subtab-btn-badge">{data.transactions.length}</span>
          )}
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'report' ? 'active' : ''}`}
          onClick={(e) => {
            setFinanceSubtab('report');
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }}
        >
          <span>📈</span>
          <span>Laporan</span>
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'bills' ? 'active' : ''}`}
          onClick={(e) => {
            setFinanceSubtab('bills');
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }}
        >
          <span>🧾</span>
          <span>Tagihan</span>
          {unpaidBillsCount > 0 ? (
            <span className="subtab-btn-badge alert">{unpaidBillsCount}</span>
          ) : data.bills.length > 0 ? (
            <span className="subtab-btn-badge">{data.bills.length}</span>
          ) : null}
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'targets' ? 'active' : ''}`}
          onClick={(e) => {
            setFinanceSubtab('targets');
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }}
        >
          <span>🎯</span>
          <span>Target</span>
          {data.savingsTargets.length > 0 && (
            <span className="subtab-btn-badge">{data.savingsTargets.length}</span>
          )}
        </button>
      </div>

      {/* 1. BUDGET BULANAN (Dinamis sesuai siklus gajian) */}
      {financeSubtab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card Sisa Budget (Luxury Midnight Minimalist) */}
          <div className="budget-hero-card">
            <div className="budget-hero-header">
              <div className="budget-hero-tag">
                <span className="live-sync-dot" />
                <span>Sisa Budget Periode Ini</span>
              </div>
              <button
                onClick={() => setIsCycleModalOpen(true)}
                className="budget-hero-date-pill"
                title="Ubah tanggal siklus anggaran"
              >
                <Calendar size={11} />
                <span>{financialCycle.periodLabel || financialCycle.label}</span>
              </button>
            </div>

            <div className="budget-hero-amount-wrap">
              <div className="budget-hero-amount">
                {maskMoney(remainingBudget, isBalanceVisible)}
              </div>
              <span className={`budget-hero-health-pill ${percentUsed > 90 ? 'danger' : percentUsed > 75 ? 'warning' : 'safe'}`}>
                {isBalanceVisible ? `${Math.max(0, 100 - percentUsed)}% tersisa` : '••% sisa'}
              </span>
            </div>

            {/* Sleek Dynamic Progress Track */}
            <div className="budget-hero-track">
              <div
                className="budget-hero-fill"
                style={{
                  width: `${Math.min(100, percentUsed)}%`,
                  background: percentUsed > 90
                    ? 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
                    : percentUsed > 75
                    ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
                    : 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                }}
              />
            </div>

            <div className="budget-hero-metrics">
              <div className="budget-metric-item">
                <span className="budget-metric-label">Terpakai ({isBalanceVisible ? `${percentUsed}%` : '••%'})</span>
                <span className="budget-metric-val">{maskMoney(cycleExpenses, isBalanceVisible)}</span>
              </div>
              <div className="budget-metric-divider" />
              <div className="budget-metric-item align-right">
                <span className="budget-metric-label">Total Plafon</span>
                <span className="budget-metric-val">{maskMoney(totalBudget, isBalanceVisible)}</span>
              </div>
            </div>
          </div>

          {/* Smart Daily Allowance Insight - Minimalist & Compact with Mascot */}
          <div className={`smart-daily-insight-card smart-insight-${mascotState.status}`}>
            <div className={`smart-insight-icon-box smart-insight-avatar-${mascotState.status}`}>
              <img
                src={mascotState.mascotSrc}
                alt={mascotState.mascotAlt}
                className="smart-insight-mascot-img"
              />
            </div>
            <div className="smart-insight-content">
              <div className="smart-insight-top">
                <span className="smart-insight-title">{mascotState.title}</span>
                <span className={`smart-insight-days-badge badge-${mascotState.status}`}>
                  {financialCycle.daysRemaining} hari tersisa
                </span>
              </div>
              <div className="smart-insight-desc">
                {mascotState.isExceeded ? (
                  mascotState.descPrefix
                ) : (
                  <>
                    Alokasi belanja <strong className="smart-insight-highlight">{maskMoney(dailyAllowance, isBalanceVisible)}</strong> <span className="smart-insight-perday">/ hari</span> agar budget aman.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Kategori Budget */}
          <div>
            <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Kategori Budget</h3>
                <span className="budget-count-chip">{data.budget.categories.length}</span>
              </div>
              <button
                type="button"
                className="budget-manage-btn"
                onClick={() => setIsBudgetSettingsOpen(true)}
                title="Atur persentase & alokasi budget"
              >
                <Sliders size={12} strokeWidth={2} />
                <span>Atur Alokasi (%)</span>
              </button>
            </div>

            <div className="budget-categories-list">
              {data.budget.categories.map(cat => {
                const spentInCat = data.transactions
                  .filter(t => t.type === 'expense' && t.category?.toLowerCase() === cat.name?.toLowerCase() && financialCycle.isDateInCycle(t.date))
                  .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const catBudget = Number(cat.budget) || 0;
                const catPercent = catBudget > 0 ? Math.round((spentInCat / catBudget) * 100) : 0;
                const catRemaining = Math.max(0, catBudget - spentInCat);
                const isOver = spentInCat > catBudget;

                return (
                  <div
                    key={cat.id}
                    className="budget-category-card"
                    onClick={() => setSelectedCategoryDetail(cat)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCategoryDetail(cat);
                      }
                    }}
                  >
                    {/* Top Row: Identity & Status Badge */}
                    <div className="budget-cat-header-row">
                      <div className="budget-cat-identity">
                        <div className="budget-cat-icon-box has-3d-icon">
                          <CategoryIcon category={cat.name} icon={cat.icon} size={36} />
                        </div>
                        <span className="budget-cat-name" title={cat.name}>
                          {cat.name}
                        </span>
                      </div>

                      <div className="budget-cat-status-wrap">
                        <span
                          className={`budget-cat-pill ${
                            isOver ? 'over' : catPercent > 80 ? 'warning' : 'safe'
                          }`}
                        >
                          {isOver
                            ? 'Over Budget'
                            : isBalanceVisible
                            ? `${catPercent}%`
                            : '••%'}
                        </span>
                        <ChevronRight size={14} className="budget-cat-chevron" />
                      </div>
                    </div>

                    {/* Middle Row: Progress Bar */}
                    <div className="budget-cat-progress-track">
                      <div
                        className="budget-cat-progress-bar"
                        style={{
                          width: `${Math.min(100, catBudget > 0 ? catPercent : 0)}%`,
                          background: isOver
                            ? '#EF4444'
                            : catPercent > 80
                            ? '#F59E0B'
                            : '#10B981'
                        }}
                      />
                    </div>

                    {/* Bottom Row: Clear, dense financial figures */}
                    <div className="budget-cat-footer-row">
                      <div className="budget-cat-figure-col">
                        <span className="figure-label">Terpakai:</span>
                        <span className="figure-value spent">{maskMoney(spentInCat, isBalanceVisible)}</span>
                      </div>

                      <div className="budget-cat-figure-col align-right">
                        {isOver ? (
                          <>
                            <span className="figure-label over">Lebih:</span>
                            <span className="figure-value over">
                              +{maskMoney(spentInCat - catBudget, isBalanceVisible)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="figure-label">Sisa:</span>
                            <span className="figure-value remaining">
                              {maskMoney(catRemaining, isBalanceVisible)}
                            </span>
                            <span className="figure-subtotal">/ {maskMoney(catBudget, isBalanceVisible)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. RIWAYAT TRANSAKSI DENGAN OPSI HAPUS */}
      {financeSubtab === 'history' && (
        <div>
          <div className="section-header-row" style={{ alignItems: 'center' }}>
            <div>
              <h3 className="section-title">Semua Transaksi</h3>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                {data.transactions.length} transaksi tercatat
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

          {data.transactions.length === 0 ? (
            <MascotEmptyState
              mascot="wallet"
              mascotSize={110}
              title="Belum Ada Transaksi Tercatat"
              description="Semua catatan pemasukan dan pengeluaran harianmu akan otomatis tersusun rapi per tanggal di sini."
              actionText="Catat Transaksi Pertama"
              actionIcon={<Plus size={15} />}
              onAction={() => {
                setQuickAddType('expense');
                setIsQuickAddOpen(true);
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Gesture Hint Banner */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>💡</span>
                <span>
                  <strong>Tips:</strong> Geser kanan untuk <strong>Hapus</strong>, geser kiri untuk <strong>Edit</strong>, atau ketuk transaksi untuk koreksi data.
                </span>
              </div>

              {sortedDateGroups.map(([date, txs]) => {
                const dayExpense = txs
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0);

                const dateInfo = getRelativeDateInfo(date);

                return (
                  <div key={date} className="transaction-group">
                    <div className="group-date-header">
                      <div className="group-date-left">
                        {dateInfo.badgeText && (
                          <span className={`badge-date-pill ${dateInfo.isToday ? 'today' : dateInfo.isYesterday ? 'yesterday' : 'future'}`}>
                            {dateInfo.badgeText}
                          </span>
                        )}
                        <span className={`group-date-text ${dateInfo.isToday ? 'active-today' : ''}`}>
                          {dateInfo.badgeText ? dateInfo.dateText : dateInfo.fullLabel}
                        </span>
                      </div>
                      <span style={{ color: '#EF4444', fontWeight: 800 }}>
                        -{maskMoney(dayExpense, isBalanceVisible)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {txs.map(tx => (
                        <SwipeableItem
                          key={tx.id}
                          itemTitle={`${tx.category} (Rp ${formatRupiahNumber(tx.amount)})`}
                          showDots={false}
                          onEdit={() => setEditingTransaction(tx)}
                          onDelete={() => deleteTransaction(tx.id, true)}
                          onClick={() => setEditingTransaction(tx)}
                        >
                          <div className="transaction-card" style={{ margin: 0, cursor: 'pointer' }}>
                            <div className="transaction-left">
                              <div className="category-icon-box has-3d-icon">
                                <CategoryIcon category={tx.category} icon={tx.icon} size={36} />
                              </div>
                              <div className="transaction-info">
                                <div className="transaction-title">{tx.category}</div>
                                <div className="transaction-subtitle">
                                  <span className="account-badge-micro">{tx.accountName}</span>
                                  <span className="transaction-subtitle-text">{tx.merchant} {tx.note ? `• ${tx.note}` : ''}</span>
                                </div>
                              </div>
                            </div>

                            <div className="transaction-right">
                              <div className={`transaction-amount ${tx.type}`}>
                                {tx.type === 'expense'
                                  ? `-${maskMoney(tx.amount, isBalanceVisible)}`
                                  : `+${maskMoney(tx.amount, isBalanceVisible)}`}
                              </div>
                              <button
                                type="button"
                                className="dots-action-btn"
                                style={{ width: '28px', height: '28px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTransaction(tx);
                                }}
                                title="Edit Transaksi"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </div>
                          </div>
                        </SwipeableItem>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. LAPORAN KEUANGAN LENGKAP DENGAN DRILL-DOWN & KOMPARASI */}
      {financeSubtab === 'report' && (
        <FinanceReportView onEditTransaction={(tx) => setEditingTransaction(tx)} />
      )}

      {/* 4. TAGIHAN MAHASISWA DENGAN OPSI HAPUS */}
      {financeSubtab === 'bills' && (
        <div>
          <div className="section-header-row">
            <h3 className="section-title">Tagihan Mahasiswa</h3>
            <button
              onClick={() => setIsAddBillOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#1665D8',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Tambah Tagihan
            </button>
          </div>

          {data.bills.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-circle">🧾</div>
              <h4 className="empty-title">Belum Ada Tagihan Aktif</h4>
              <p className="empty-desc">
                Catat tagihan kos, SPP/UKT, Wi-Fi, atau langganan aplikasi agar kamu selalu ingat sebelum jatuh tempo dan bebas denda.
              </p>
              <button
                type="button"
                className="btn-primary empty-cta-btn"
                onClick={() => setIsAddBillOpen(true)}
              >
                <Plus size={15} />
                <span>Catat Tagihan Pertama</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.bills.map(bill => (
                <div key={bill.id} className="card-standard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>{bill.icon}</div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                        {bill.title}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Jatuh Tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {bill.category}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1665D8', marginTop: '4px' }}>
                        Rp {bill.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => toggleBillPaid(bill.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: bill.isPaid ? '#ECFDF5' : '#FEF2F2',
                        color: bill.isPaid ? '#047857' : '#B91C1C',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {bill.isPaid ? '✓ Lunas' : 'Bayar'}
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id, bill.title)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      title="Hapus Tagihan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Tambah Tagihan */}
          {isAddBillOpen && (
            <div className="modal-overlay" onClick={() => setIsAddBillOpen(false)}>
              <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle-bar" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Catat Tagihan Baru</h3>
                <form onSubmit={handleCreateBill}>
                  <div className="input-group">
                    <label className="input-label">Nama Tagihan</label>
                    <input
                      type="text"
                      placeholder="cth: Uang Kost, Wi-Fi, SPP/UKT"
                      className="input-field"
                      value={newBillTitle}
                      onChange={e => setNewBillTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nominal (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="850.000"
                      className="input-field"
                      value={newBillAmount}
                      onChange={e => setNewBillAmount(formatRupiahNumber(e.target.value))}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      className="input-field"
                      value={newBillDate}
                      onChange={e => setNewBillDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Kategori</label>
                    <select
                      className="input-field"
                      value={newBillCategory}
                      onChange={e => setNewBillCategory(e.target.value)}
                    >
                      <option value="Kost & Rumah">Kost & Rumah</option>
                      <option value="Pendidikan">Pendidikan / SPP / UKT</option>
                      <option value="Internet">Internet / Wi-Fi</option>
                      <option value="Langganan">Langganan Aplikasi</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
                    Simpan Tagihan
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TARGET TABUNGAN DENGAN OPSI HAPUS */}
      {financeSubtab === 'targets' && (
        <div>
          <div className="section-header-row">
            <h3 className="section-title">Target & Celengan Kamu</h3>
            <button
              onClick={() => setIsAddTargetOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#1665D8',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Buat Target
            </button>
          </div>

          {data.savingsTargets.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-circle">🎯</div>
              <h4 className="empty-title">Belum Ada Target Celengan</h4>
              <p className="empty-desc">
                Punya rencana beli laptop baru, liburan semester, atau dana darurat? Buat target celengan sekarang dan tabung sedikit demi sedikit.
              </p>
              <button
                type="button"
                className="btn-primary empty-cta-btn"
                onClick={() => setIsAddTargetOpen(true)}
              >
                <Plus size={15} />
                <span>Buat Target Nabung Pertama</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.savingsTargets.map(target => {
                const percent = Math.min(100, Math.round((target.currentAmount / target.targetAmount) * 100));
                const remaining = Math.max(0, target.targetAmount - target.currentAmount);

                return (
                  <div key={target.id} className="card-standard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '26px' }}>{target.icon}</span>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{target.title}</h4>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Target: {target.deadline}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1665D8' }}>
                          {percent}%
                        </span>
                        <button
                          onClick={() => handleDeleteTarget(target.id, target.title)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          title="Hapus Target"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="progress-bar-container">
                      <div className="progress-bar-fill success" style={{ width: `${percent}%` }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Terkumpul: </span>
                        <strong style={{ color: '#10B981' }}>Rp {target.currentAmount.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Kurang: </span>
                        <strong style={{ color: '#475569' }}>Rp {remaining.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setDepositModalTarget(target)}
                      style={{
                        width: '100%',
                        background: '#EFF6FF',
                        color: '#1665D8',
                        border: '1px solid #BFDBFE',
                        borderRadius: '12px',
                        padding: '10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        marginTop: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      + Tambah Setoran Tabungan
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Setoran */}
          {depositModalTarget && (
            <div className="modal-overlay" onClick={() => setDepositModalTarget(null)}>
              <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle-bar" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
                  Nabung untuk "{depositModalTarget.title}"
                </h3>
                <form onSubmit={handleDepositSubmit}>
                  <div className="input-group">
                    <label className="input-label">Nominal Setoran (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="50.000"
                      className="input-field"
                      value={depositAmount}
                      onChange={e => setDepositAmount(formatRupiahNumber(e.target.value))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Keterangan / Sumber Uang</label>
                    <input
                      type="text"
                      placeholder="cth: Sisa jajan minggu ini"
                      className="input-field"
                      value={depositNote}
                      onChange={e => setDepositNote(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                    Konfirmasi Setoran Tabungan
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal Buat Target */}
          {isAddTargetOpen && (
            <div className="modal-overlay" onClick={() => setIsAddTargetOpen(false)}>
              <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle-bar" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Buat Target Celengan Baru</h3>
                <form onSubmit={handleCreateTarget}>
                  <div className="input-group">
                    <label className="input-label">Nama Target Impian</label>
                    <input
                      type="text"
                      placeholder="cth: Beli Laptop Baru"
                      className="input-field"
                      value={newTargetTitle}
                      onChange={e => setNewTargetTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Target Nominal (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="5.000.000"
                      className="input-field"
                      value={newTargetAmount}
                      onChange={e => setNewTargetAmount(formatRupiahNumber(e.target.value))}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Target Tanggal Capaian</label>
                    <input
                      type="date"
                      className="input-field"
                      value={newTargetDeadline}
                      onChange={e => setNewTargetDeadline(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
                    Simpan Target
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. DAFTAR SEMUA AKUN / DOMPET (MINIMALIST & ELEGAN) */}
      {financeSubtab === 'accounts' && (
        <div className="accounts-management-view">
          {/* Minimalist Hero Wealth Banner */}
          <div className="accounts-hero-banner">
            <div className="accounts-hero-header">
              <div className="accounts-hero-tag">
                <span className="live-sync-dot" />
                <span>TOTAL ASET & DOMPET</span>
              </div>
              <button
                type="button"
                className="hero-add-wallet-btn"
                onClick={() => {
                  if (accountTypeFilter !== 'all' && ['bank', 'ewallet', 'cash'].includes(accountTypeFilter)) {
                    setNewAccType(accountTypeFilter);
                  }
                  setIsAddAccountOpen(true);
                }}
                title="Tambah dompet baru"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Tambah</span>
              </button>
            </div>

            <div className="accounts-hero-amount">
              {maskMoney(totalBalance, isBalanceVisible)}
            </div>

            <div className="accounts-hero-subtitle">
              {accountTypeFilter !== 'all'
                ? `Menampilkan ${filteredAccounts.length} akun ${accountTypeFilter === 'bank' ? 'Bank' : accountTypeFilter === 'ewallet' ? 'E-Wallet' : accountTypeFilter === 'cash' ? 'Tunai' : 'Lainnya'}`
                : `${(data.accounts || []).length} akun aktif terhubung`}
            </div>

            {/* Dynamic Minimalist Allocation Strip */}
            <div className="accounts-dynamic-allocation">
              {/* Thin Multi-Segment Allocation Bar */}
              <div className="dynamic-bar-track">
                {pctBank > 0 && (
                  <div
                    className={`dynamic-bar-seg seg-bank ${accountTypeFilter === 'bank' ? 'active' : ''}`}
                    style={{ width: `${pctBank}%` }}
                    onClick={() => setAccountTypeFilter(prev => prev === 'bank' ? 'all' : 'bank')}
                    title={`Bank: ${maskMoney(bankTotal, isBalanceVisible)} (${pctBank}%)`}
                  />
                )}
                {pctEwallet > 0 && (
                  <div
                    className={`dynamic-bar-seg seg-ewallet ${accountTypeFilter === 'ewallet' ? 'active' : ''}`}
                    style={{ width: `${pctEwallet}%` }}
                    onClick={() => setAccountTypeFilter(prev => prev === 'ewallet' ? 'all' : 'ewallet')}
                    title={`E-Wallet: ${maskMoney(ewalletTotal, isBalanceVisible)} (${pctEwallet}%)`}
                  />
                )}
                {pctCash > 0 && (
                  <div
                    className={`dynamic-bar-seg seg-cash ${accountTypeFilter === 'cash' ? 'active' : ''}`}
                    style={{ width: `${pctCash}%` }}
                    onClick={() => setAccountTypeFilter(prev => prev === 'cash' ? 'all' : 'cash')}
                    title={`Tunai: ${maskMoney(cashTotal, isBalanceVisible)} (${pctCash}%)`}
                  />
                )}
                {pctOther > 0 && (
                  <div
                    className={`dynamic-bar-seg seg-other ${accountTypeFilter === 'other' ? 'active' : ''}`}
                    style={{ width: `${pctOther}%` }}
                    onClick={() => setAccountTypeFilter(prev => prev === 'other' ? 'all' : 'other')}
                    title={`Lainnya: ${maskMoney(otherTotal, isBalanceVisible)} (${pctOther}%)`}
                  />
                )}
              </div>

              {/* Clean Category Allocation Pills */}
              <div className="allocation-tags-row">
                <button
                  type="button"
                  className={`allocation-tag-item ${accountTypeFilter === 'bank' ? 'active' : ''}`}
                  onClick={() => setAccountTypeFilter(prev => prev === 'bank' ? 'all' : 'bank')}
                  title="Filter Bank"
                >
                  <span className="allocation-tag-dot bank-dot" />
                  <span className="allocation-tag-name">Bank {pctBank}%</span>
                  <span className="allocation-tag-amount">{formatCompactRupiah(bankTotal, isBalanceVisible)}</span>
                </button>

                <button
                  type="button"
                  className={`allocation-tag-item ${accountTypeFilter === 'ewallet' ? 'active' : ''}`}
                  onClick={() => setAccountTypeFilter(prev => prev === 'ewallet' ? 'all' : 'ewallet')}
                  title="Filter E-Wallet"
                >
                  <span className="allocation-tag-dot ewallet-dot" />
                  <span className="allocation-tag-name">E-Wallet {pctEwallet}%</span>
                  <span className="allocation-tag-amount">{formatCompactRupiah(ewalletTotal, isBalanceVisible)}</span>
                </button>

                <button
                  type="button"
                  className={`allocation-tag-item ${accountTypeFilter === 'cash' ? 'active' : ''}`}
                  onClick={() => setAccountTypeFilter(prev => prev === 'cash' ? 'all' : 'cash')}
                  title="Filter Tunai"
                >
                  <span className="allocation-tag-dot cash-dot" />
                  <span className="allocation-tag-name">Tunai {pctCash}%</span>
                  <span className="allocation-tag-amount">{formatCompactRupiah(cashTotal, isBalanceVisible)}</span>
                </button>

                {otherTotal > 0 && (
                  <button
                    type="button"
                    className={`allocation-tag-item ${accountTypeFilter === 'other' ? 'active' : ''}`}
                    onClick={() => setAccountTypeFilter(prev => prev === 'other' ? 'all' : 'other')}
                    title="Filter Lainnya"
                  >
                    <span className="allocation-tag-dot other-dot" />
                    <span className="allocation-tag-name">Lainnya {pctOther}%</span>
                    <span className="allocation-tag-amount">{formatCompactRupiah(otherTotal, isBalanceVisible)}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Clean Segmented Filter Bar */}
          <div className="accounts-filter-bar">
            <button
              type="button"
              className={`accounts-filter-pill ${accountTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setAccountTypeFilter('all')}
            >
              <span>Semua</span>
              <span className="pill-badge">{data.accounts.length}</span>
            </button>
            <button
              type="button"
              className={`accounts-filter-pill ${accountTypeFilter === 'bank' ? 'active' : ''}`}
              onClick={() => setAccountTypeFilter(prev => prev === 'bank' ? 'all' : 'bank')}
            >
              <img src="/assets/accounts/account-bank.png" alt="Bank" className="filter-pill-img" />
              <span>Bank</span>
              <span className="pill-badge">{bankAccounts.length}</span>
            </button>
            <button
              type="button"
              className={`accounts-filter-pill ${accountTypeFilter === 'ewallet' ? 'active' : ''}`}
              onClick={() => setAccountTypeFilter(prev => prev === 'ewallet' ? 'all' : 'ewallet')}
            >
              <img src="/assets/accounts/account-ewallet.png" alt="E-Wallet" className="filter-pill-img" />
              <span>E-Wallet</span>
              <span className="pill-badge">{ewalletAccounts.length}</span>
            </button>
            <button
              type="button"
              className={`accounts-filter-pill ${accountTypeFilter === 'cash' ? 'active' : ''}`}
              onClick={() => setAccountTypeFilter(prev => prev === 'cash' ? 'all' : 'cash')}
            >
              <img src="/assets/accounts/account-cash.png" alt="Tunai" className="filter-pill-img" />
              <span>Tunai</span>
              <span className="pill-badge">{cashAccounts.length}</span>
            </button>
            {otherAccounts.length > 0 && (
              <button
                type="button"
                className={`accounts-filter-pill ${accountTypeFilter === 'other' ? 'active' : ''}`}
                onClick={() => setAccountTypeFilter(prev => prev === 'other' ? 'all' : 'other')}
              >
                <span>📈 Lainnya</span>
                <span className="pill-badge">{otherAccounts.length}</span>
              </button>
            )}
          </div>

          {/* Minimalist Smart Pocket Cards Grid */}
          <div className="smart-pocket-grid">
            {filteredAccounts.length === 0 ? (
              <div className="empty-state-card" style={{ gridColumn: '1 / -1', padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>💳</div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  {accountTypeFilter !== 'all'
                    ? `Belum Ada ${accountTypeFilter === 'bank' ? 'Rekening Bank' : accountTypeFilter === 'ewallet' ? 'E-Wallet' : 'Uang Tunai'}`
                    : 'Belum Ada Dompet'}
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '320px', margin: '4px auto 16px' }}>
                  {accountTypeFilter !== 'all'
                    ? `Kamu belum memiliki dompet atau rekening di kategori ini.`
                    : 'Tambahkan rekening bank, e-wallet, atau uang tunai untuk mulai mencatat keuangan.'}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {accountTypeFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setAccountTypeFilter('all')}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px' }}
                    >
                      Lihat Semua
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (accountTypeFilter !== 'all' && ['bank', 'ewallet', 'cash'].includes(accountTypeFilter)) {
                        setNewAccType(accountTypeFilter);
                      }
                      setIsAddAccountOpen(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
                  >
                    <Plus size={14} style={{ marginRight: '6px' }} /> Tambah Dompet
                  </button>
                </div>
              </div>
            ) : (
              filteredAccounts.map(acc => {
                const pct = totalBalance > 0 ? Math.max(0, Math.round((acc.balance / totalBalance) * 100)) : 0;
                const isBank = acc.type === 'bank';
                const isEwallet = acc.type === 'ewallet';
                const isCash = acc.type === 'cash';

                const themeClass = isBank ? 'theme-bank' : isEwallet ? 'theme-ewallet' : isCash ? 'theme-cash' : 'theme-other';
                const brand = getAccountBrandInfo(acc);

                return (
                  <div
                    key={acc.id}
                    className={`smart-pocket-card ${themeClass}`}
                    onClick={() => setSelectedAccountDetail(acc)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: `3.5px solid ${brand.color}`
                    }}
                    role="button"
                    tabIndex={0}
                    title="Klik untuk lihat detail & transaksi dompet"
                  >
                    {/* Left: Avatar & Identity */}
                    <div className="pocket-left-section">
                      <div className="pocket-avatar-wrapper">
                        <img
                          src={getAccountTypeIcon(acc.type)}
                          alt={acc.name}
                          className="pocket-avatar-img"
                        />
                        <span
                          className="pocket-avatar-brand-dot"
                          style={{
                            backgroundColor: brand.color,
                            color: '#FFFFFF'
                          }}
                          title={brand.label}
                        >
                          {brand.shortCode || brand.label.slice(0, 2)}
                        </span>
                      </div>

                      <div className="pocket-info">
                        <div className="pocket-name-row">
                          <span className="pocket-name">{acc.name}</span>
                          {acc.isPrimary && (
                            <span className="primary-pill" title="Dompet Utama Transaksi">
                              <Star size={9} fill="currentColor" /> Utama
                            </span>
                          )}
                        </div>
                        <div className="pocket-meta-row">
                          <span className="pocket-type-badge">
                            {isBank ? 'Bank' : isEwallet ? 'E-Wallet' : isCash ? 'Tunai' : 'Lainnya'}
                          </span>
                          <span
                            className="pocket-brand-pill"
                            style={{
                              color: brand.color,
                              backgroundColor: `${brand.color}14`,
                              borderColor: `${brand.color}30`
                            }}
                          >
                            {brand.label}
                          </span>
                          {acc.accountNumber && (
                            <span className="pocket-acc-number">
                              • {acc.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Balance, Allocation & Chevron */}
                    <div className="pocket-right-section">
                      <div className="pocket-balance-value">
                        {maskMoney(acc.balance, isBalanceVisible)}
                      </div>
                      <div className="pocket-sub-info">
                        <span className="pocket-pct-badge">{pct}% aset</span>
                        <ChevronRight size={15} className="pocket-chevron" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Minimalist Advice / Tip Strip */}
          <div className="accounts-tip-card">
            <ShieldCheck size={16} style={{ color: '#2563EB', flexShrink: 0 }} />
            <div>
              <strong>Sinkron Cloud Otomatis:</strong> Saldo dompet terhubung aman & diperbarui secara real-time saat transaksi dicatat.
            </div>
          </div>

          {/* Modal Tambah Dompet Baru */}
          {isAddAccountOpen && (
            <div className="modal-overlay" onClick={() => setIsAddAccountOpen(false)} style={{ zIndex: 1300 }}>
              <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle-bar" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Tambah Dompet / Akun Baru</h3>
                <form onSubmit={handleCreateAccount}>
                  <div className="input-group">
                    <label className="input-label">Nama Dompet / Bank</label>
                    <input
                      type="text"
                      placeholder="cth: Bank Mandiri, OVO, ShopeePay, SeaBank"
                      className="input-field"
                      value={newAccName}
                      onChange={e => setNewAccName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Tipe Akun</label>
                    <select
                      className="input-field"
                      value={newAccType}
                      onChange={e => setNewAccType(e.target.value)}
                    >
                      <option value="bank">Rekening Bank</option>
                      <option value="ewallet">E-Wallet</option>
                      <option value="cash">Uang Tunai / Cash</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Saldo Awal (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="input-field"
                      value={newAccBalance}
                      onChange={e => setNewAccBalance(formatRupiahNumber(e.target.value))}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      No. Rekening / No. HP E-Wallet <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cth: 1234567890 / 08123456789"
                      className="input-field"
                      value={newAccNumber}
                      onChange={e => setNewAccNumber(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Catatan Peruntukan <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Rekening beasiswa, Tabungan darurat, Jajan harian"
                      className="input-field"
                      value={newAccNotes}
                      onChange={e => setNewAccNotes(e.target.value)}
                    />
                  </div>

                  {/* Aksen Warna & Brand Swatches */}
                  <div className="input-group">
                    <label className="input-label">
                      Aksen Warna & Brand <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {COLOR_SWATCHES.map(sw => (
                        <button
                          key={sw.hex}
                          type="button"
                          onClick={() => setNewAccColor(sw.hex)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: sw.hex,
                            border: newAccColor === sw.hex ? '2.5px solid #0F172A' : '1.5px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transform: newAccColor === sw.hex ? 'scale(1.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={sw.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Opsi Jadikan Dompet Utama */}
                  <div style={{ margin: '14px 0 10px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                      <input
                        type="checkbox"
                        checked={newAccIsPrimary}
                        onChange={e => setNewAccIsPrimary(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#1665D8', cursor: 'pointer' }}
                      />
                      <span>Jadikan Dompet Utama (Default Transaksi)</span>
                    </label>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 24px' }}>
                      Dompet ini akan otomatis dipilih pertama kali saat kamu mencatat transaksi baru.
                    </p>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
                    Simpan Dompet
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal Edit Dompet */}
          {editingAccount && (
            <div className="modal-overlay" onClick={() => setEditingAccount(null)} style={{ zIndex: 1300 }}>
              <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle-bar" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Edit Dompet: {editingAccount.name}</h3>
                <form onSubmit={handleSaveEditAccount}>
                  <div className="input-group">
                    <label className="input-label">Nama Dompet</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editAccName}
                      onChange={e => setEditAccName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Koreksi Saldo (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input-field"
                      value={editAccBalance}
                      onChange={e => setEditAccBalance(formatRupiahNumber(e.target.value))}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      No. Rekening / No. HP E-Wallet <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cth: 1234567890 / 08123456789"
                      className="input-field"
                      value={editAccNumber}
                      onChange={e => setEditAccNumber(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Catatan Peruntukan <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Rekening beasiswa, Tabungan darurat, Jajan harian"
                      className="input-field"
                      value={editAccNotes}
                      onChange={e => setEditAccNotes(e.target.value)}
                    />
                  </div>

                  {/* Aksen Warna & Brand Swatches */}
                  <div className="input-group">
                    <label className="input-label">
                      Aksen Warna & Brand <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {COLOR_SWATCHES.map(sw => (
                        <button
                          key={sw.hex}
                          type="button"
                          onClick={() => setEditAccColor(sw.hex)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: sw.hex,
                            border: editAccColor === sw.hex ? '2.5px solid #0F172A' : '1.5px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transform: editAccColor === sw.hex ? 'scale(1.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={sw.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Opsi Jadikan Dompet Utama */}
                  <div style={{ margin: '14px 0 10px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                      <input
                        type="checkbox"
                        checked={editAccIsPrimary}
                        onChange={e => setEditAccIsPrimary(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#1665D8', cursor: 'pointer' }}
                      />
                      <span>Jadikan Dompet Utama (Default Transaksi)</span>
                    </label>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 24px' }}>
                      Dompet ini akan otomatis dipilih pertama kali saat kamu mencatat transaksi baru.
                    </p>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
                    Simpan Perubahan
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Detail Modal Hub */}
      <AccountDetailModal
        account={selectedAccountDetail ? (data.accounts.find(a => a.id === selectedAccountDetail.id) || selectedAccountDetail) : null}
        isOpen={Boolean(selectedAccountDetail)}
        onClose={() => setSelectedAccountDetail(null)}
        transactions={data.transactions}
        totalBalance={totalBalance}
        isBalanceVisible={isBalanceVisible}
        onEdit={(acc) => openEditModal(acc)}
        onDelete={(accId, accName) => {
          handleDeleteAccount(accId, accName);
          setSelectedAccountDetail(null);
        }}
        onQuickAdd={(type) => {
          setSelectedAccountDetail(null);
          setQuickAddType(type || 'expense');
          setIsQuickAddOpen(true);
        }}
      />

      {/* Category Detail Modal */}
      <CategoryDetailModal
        category={selectedCategoryDetail ? (data.budget.categories.find(c => c.id === selectedCategoryDetail.id) || selectedCategoryDetail) : null}
        isOpen={Boolean(selectedCategoryDetail)}
        onClose={() => setSelectedCategoryDetail(null)}
        transactions={data.transactions}
        financialCycle={financialCycle}
        isBalanceVisible={isBalanceVisible}
        onEditTransaction={(tx) => {
          setSelectedCategoryDetail(null);
          setEditingTransaction(tx);
        }}
        onDeleteTransaction={(txId) => {
          deleteTransaction(txId);
        }}
        onAddTransactionForCategory={(catName) => {
          setSelectedCategoryDetail(null);
          if (setQuickAddCategory) setQuickAddCategory(catName);
          setQuickAddType('transaction');
          setIsQuickAddOpen(true);
        }}
        onOpenBudgetSettings={() => {
          setSelectedCategoryDetail(null);
          setIsBudgetSettingsOpen(true);
        }}
      />

      {/* Budget Settings & Allocation Modal */}
      <BudgetSettingsModal
        isOpen={isBudgetSettingsOpen}
        onClose={() => setIsBudgetSettingsOpen(false)}
        totalBudget={totalBudget}
        categories={data.budget.categories}
        onSave={(newTotal, updatedCategories) => {
          updateBudget(newTotal, updatedCategories);
        }}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Financial Statement & Official Export Modal */}
      <FinancialStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        data={data}
        totalBalance={totalBalance}
        activeCycle={financialCycle}
      />
    </div>
  );
};
