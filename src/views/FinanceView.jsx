import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DonutChart } from '../components/charts/DonutChart';
import { formatRupiahNumber, parseRupiahNumber, maskMoney } from '../utils/formatters';
import SwipeableItem from '../components/common/SwipeableItem';
import EditTransactionModal from '../components/finance/EditTransactionModal';
import { AccountDetailModal } from '../components/finance/AccountDetailModal';
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
  ShieldCheck
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
    setIsQuickAddOpen,
    setQuickAddType,
    setIsCycleModalOpen,
    isBalanceVisible,
    financeSubtab,
    setFinanceSubtab
  } = useApp();

  const [reportFilter, setReportFilter] = useState('kategori'); // kategori | akun | merchant

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
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccIcon, setNewAccIcon] = useState('💳');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccNotes, setNewAccNotes] = useState('');

  const [editingAccount, setEditingAccount] = useState(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccBalance, setEditAccBalance] = useState('');
  const [editAccNumber, setEditAccNumber] = useState('');
  const [editAccNotes, setEditAccNotes] = useState('');

  // Group transactions by date
  const groupedTransactions = data.transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  // Data for Donut Chart (Strictly filtered to active financial cycle)
  const getDonutData = () => {
    const expenses = data.transactions.filter(t => t.type === 'expense' && financialCycle.isDateInCycle(t.date));
    const colorPalette = ['#F97316', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#EAB308', '#64748B'];

    if (reportFilter === 'kategori') {
      const catMap = {};
      expenses.forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
      return Object.entries(catMap).map(([label, amount], i) => ({
        label,
        amount,
        color: colorPalette[i % colorPalette.length]
      }));
    } else if (reportFilter === 'akun') {
      const accMap = {};
      expenses.forEach(t => {
        const aName = t.accountName || 'Lainnya';
        accMap[aName] = (accMap[aName] || 0) + t.amount;
      });
      return Object.entries(accMap).map(([label, amount], i) => ({
        label,
        amount,
        color: colorPalette[i % colorPalette.length]
      }));
    } else {
      const merchMap = {};
      expenses.forEach(t => {
        const m = t.merchant || 'Lainnya';
        merchMap[m] = (merchMap[m] || 0) + t.amount;
      });
      return Object.entries(merchMap).map(([label, amount], i) => ({
        label,
        amount,
        color: colorPalette[i % colorPalette.length]
      }));
    }
  };

  const donutItems = getDonutData();

  const bankTotal = useMemo(() => (data.accounts || []).filter(a => a.type === 'bank').reduce((s, a) => s + a.balance, 0), [data.accounts]);
  const ewalletTotal = useMemo(() => (data.accounts || []).filter(a => a.type === 'ewallet').reduce((s, a) => s + a.balance, 0), [data.accounts]);
  const cashTotal = useMemo(() => (data.accounts || []).filter(a => a.type === 'cash').reduce((s, a) => s + a.balance, 0), [data.accounts]);
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
      name: newAccName,
      type: newAccType,
      balance: parseRupiahNumber(newAccBalance) || 0,
      accountNumber: newAccNumber.trim(),
      notes: newAccNotes.trim(),
      icon: newAccType === 'bank' ? '🏦' : (newAccType === 'ewallet' ? '📱' : '💵')
    });

    setIsAddAccountOpen(false);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccNumber('');
    setNewAccNotes('');
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccBalance(formatRupiahNumber(acc.balance));
    setEditAccNumber(acc.accountNumber || '');
    setEditAccNotes(acc.notes || '');
  };

  const handleSaveEditAccount = (e) => {
    e.preventDefault();
    if (!editingAccount) return;

    const updatedData = {
      name: editAccName,
      balance: parseRupiahNumber(editAccBalance) || 0,
      accountNumber: editAccNumber.trim(),
      notes: editAccNotes.trim()
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
          className={`subtab-btn ${financeSubtab === 'budget' ? 'active' : ''}`}
          onClick={() => setFinanceSubtab('budget')}
        >
          <span>📊</span>
          <span>Budget</span>
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'history' ? 'active' : ''}`}
          onClick={() => setFinanceSubtab('history')}
        >
          <span>🕒</span>
          <span>Riwayat</span>
          {data.transactions.length > 0 && (
            <span className="subtab-btn-badge">{data.transactions.length}</span>
          )}
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'report' ? 'active' : ''}`}
          onClick={() => setFinanceSubtab('report')}
        >
          <span>📈</span>
          <span>Laporan</span>
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'bills' ? 'active' : ''}`}
          onClick={() => setFinanceSubtab('bills')}
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
          onClick={() => setFinanceSubtab('targets')}
        >
          <span>🎯</span>
          <span>Target</span>
          {data.savingsTargets.length > 0 && (
            <span className="subtab-btn-badge">{data.savingsTargets.length}</span>
          )}
        </button>
        <button
          className={`subtab-btn ${financeSubtab === 'accounts' ? 'active' : ''}`}
          onClick={() => setFinanceSubtab('accounts')}
        >
          <span>💳</span>
          <span>Dompet</span>
          <span className="subtab-btn-badge">{data.accounts.length}</span>
        </button>
      </div>

      {/* 1. BUDGET BULANAN (Dinamis sesuai siklus gajian) */}
      {financeSubtab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card Sisa Budget */}
          <div className="card-standard" style={{ background: 'linear-gradient(135deg, #1665D8 0%, #0F4FA8 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Sisa Budget Periode Ini
              </span>
              <button
                onClick={() => setIsCycleModalOpen(true)}
                style={{
                  fontSize: '11px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
                title="Ubah tanggal gajian/siklus"
              >
                {financialCycle.label} ⚙️
              </button>
            </div>

            <div style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0' }}>
              {maskMoney(remainingBudget, isBalanceVisible)}
            </div>

            <div className="progress-bar-container" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${percentUsed}%`,
                  background: percentUsed > 90 ? '#EF4444' : '#10B981'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              <span>Terpakai {maskMoney(cycleExpenses, isBalanceVisible)}</span>
              <span>Total {maskMoney(totalBudget, isBalanceVisible)} ({isBalanceVisible ? `${percentUsed}%` : '••%'})</span>
            </div>
          </div>

          {/* Smart Daily Tip Box */}
          <div className="smart-tip-card">
            <span style={{ fontSize: '28px' }}>💡</span>
            <div>
              <div className="smart-tip-title">Alokasi Harian Direkomendasikan</div>
              <div className="smart-tip-desc">
                Tersisa <strong>{financialCycle.daysRemaining} hari</strong> dalam siklus ini. Batasi belanja harianmu maksimal <strong>{maskMoney(dailyAllowance, isBalanceVisible)} / hari</strong>.
              </div>
            </div>
          </div>

          {/* Kategori Budget */}
          <div>
            <div className="section-header-row">
              <h3 className="section-title">Kategori Budget</h3>
              <button
                className="section-action-link"
                style={{ background: 'none', border: 'none' }}
                onClick={() => {
                  setQuickAddType('transaction');
                  setIsQuickAddOpen(true);
                }}
              >
                + Tambah Transaksi
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.budget.categories.map(cat => {
                const spentInCat = data.transactions
                  .filter(t => t.type === 'expense' && t.category === cat.name && financialCycle.isDateInCycle(t.date))
                  .reduce((sum, t) => sum + t.amount, 0);

                const catPercent = Math.min(100, Math.round((spentInCat / cat.budget) * 100));
                const catRemaining = Math.max(0, cat.budget - spentInCat);
                const isOver = spentInCat > cat.budget;

                return (
                  <div key={cat.id} className="card-standard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: isOver ? '#EF4444' : '#10B981' }}>
                        {catPercent}% terpakai
                      </span>
                    </div>

                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${catPercent}%`,
                          background: isOver ? '#EF4444' : '#10B981'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      <div>
                        <div>Sisa:</div>
                        <strong style={{ color: '#0F172A' }}>Rp {catRemaining.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <div>Terpakai:</div>
                        <strong style={{ color: '#EF4444' }}>Rp {spentInCat.toLocaleString('id-ID')}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>Budget:</div>
                        <strong style={{ color: '#0F172A' }}>Rp {cat.budget.toLocaleString('id-ID')}</strong>
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
          <div className="section-header-row">
            <h3 className="section-title">Semua Transaksi</h3>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              Total: {data.transactions.length} transaksi
            </span>
          </div>

          {data.transactions.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-circle">💸</div>
              <h4 className="empty-title">Belum Ada Transaksi Tercatat</h4>
              <p className="empty-desc">
                Semua catatan pemasukan dan pengeluaran harianmu akan otomatis tersusun rapi per tanggal di sini.
              </p>
              <button
                type="button"
                className="btn-primary empty-cta-btn"
                onClick={() => {
                  setQuickAddType('expense');
                  setIsQuickAddOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Catat Transaksi Pertama</span>
              </button>
            </div>
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

              {Object.entries(groupedTransactions).map(([date, txs]) => {
                const dayExpense = txs
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0);

                const formattedDate = new Date(date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                return (
                  <div key={date} className="transaction-group">
                    <div className="group-date-header">
                      <span>{formattedDate}</span>
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
                              <div className="category-icon-box" style={{ background: '#F1F5F9' }}>
                                {tx.icon}
                              </div>
                              <div>
                                <div className="transaction-title">{tx.category}</div>
                                <div className="transaction-subtitle">
                                  <span className="account-badge-micro">{tx.accountName}</span>
                                  <span>{tx.merchant} {tx.note ? `• ${tx.note}` : ''}</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* 3. LAPORAN & GRAFIK DONUT */}
      {financeSubtab === 'report' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className="pill-btn"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: reportFilter === 'kategori' ? '#1665D8' : '#F1F5F9',
                color: reportFilter === 'kategori' ? '#FFFFFF' : '#475569',
                borderColor: 'transparent'
              }}
              onClick={() => setReportFilter('kategori')}
            >
              Kategori
            </button>
            <button
              className="pill-btn"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: reportFilter === 'akun' ? '#1665D8' : '#F1F5F9',
                color: reportFilter === 'akun' ? '#FFFFFF' : '#475569',
                borderColor: 'transparent'
              }}
              onClick={() => setReportFilter('akun')}
            >
              Akun
            </button>
            <button
              className="pill-btn"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: reportFilter === 'merchant' ? '#1665D8' : '#F1F5F9',
                color: reportFilter === 'merchant' ? '#FFFFFF' : '#475569',
                borderColor: 'transparent'
              }}
              onClick={() => setReportFilter('merchant')}
            >
              Merchant
            </button>
          </div>

          {donutItems.length === 0 ? (
            <div className="card-standard" style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Belum Ada Pengeluaran Periode Ini</h4>
              <p style={{ fontSize: '12px', marginTop: '4px', lineHeight: '1.5' }}>
                Transaksi pengeluaran pada periode <strong>{financialCycle.label}</strong> akan otomatis dirangkum dan divisualisasikan dalam grafik ini.
              </p>
            </div>
          ) : (
            <>
              <div className="card-standard">
                <h4 style={{ fontSize: '15px', fontWeight: 800, textAlign: 'center', color: '#0F172A' }}>
                  Breakdown Pengeluaran ({reportFilter.toUpperCase()})
                </h4>

                <DonutChart
                  items={donutItems}
                  totalAmount={cycleExpenses}
                  centerLabel={`Total ${reportFilter}`}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donutItems.map((item, idx) => (
                  <div key={idx} className="card-standard" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {cycleExpenses > 0 ? Math.round((item.amount / cycleExpenses) * 100) : 0}% dari siklus ini
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                      Rp {item.amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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

      {/* 6. DAFTAR SEMUA AKUN / DOMPET (ROMBAK TOTAL: MINIMALIS, MODERN & KEREN) */}
      {financeSubtab === 'accounts' && (
        <div className="accounts-management-view">
          {/* Hero Wealth Overview Banner */}
            <div className="accounts-hero-banner">
              <div className="accounts-hero-header">
                <div className="accounts-hero-tag">
                  <Sparkles size={13} style={{ color: '#FCD34D' }} />
                  <span>TOTAL AKUMULASI SELURUH ASET</span>
                </div>
                <div className="accounts-sync-pill">
                  <span>● Terhubung Cloud</span>
                </div>
              </div>

              <div className="accounts-hero-amount">
                {maskMoney(totalBalance, isBalanceVisible)}
              </div>

              <div className="accounts-hero-subtitle">
                Portofolio gabungan dari {data.accounts.length} dompet & rekening aktif
              </div>

              {/* Assets Distribution Strip */}
              <div className="accounts-distribution-row">
                <div className="distribution-chip">
                  <span className="chip-icon">🏦</span>
                  <div className="chip-info">
                    <span className="chip-label">Bank</span>
                    <span className="chip-val">{maskMoney(bankTotal, isBalanceVisible)}</span>
                  </div>
                </div>

                <div className="distribution-chip">
                  <span className="chip-icon">📱</span>
                  <div className="chip-info">
                    <span className="chip-label">E-Wallet</span>
                    <span className="chip-val">{maskMoney(ewalletTotal, isBalanceVisible)}</span>
                  </div>
                </div>

                <div className="distribution-chip">
                  <span className="chip-icon">💵</span>
                  <div className="chip-info">
                    <span className="chip-label">Tunai</span>
                    <span className="chip-val">{maskMoney(cashTotal, isBalanceVisible)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Header & Add Account CTA */}
            <div className="accounts-section-header">
              <div>
                <h3 className="section-title">Daftar Dompet & Rekening</h3>
                <p className="section-subtitle">Kelola saldo, edit detail, atau tambah dompet baru</p>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="add-account-btn"
              >
                <Plus size={15} />
                <span>Tambah Dompet</span>
              </button>
            </div>

            {/* Smart Pocket Cards Grid */}
            <div className="smart-pocket-grid">
              {data.accounts.length === 0 ? (
                <div className="empty-state-card" style={{ gridColumn: '1 / -1', padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>💳</div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Belum Ada Dompet</h4>
                  <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '320px', margin: '4px auto 16px' }}>
                    Tambahkan rekening bank, e-wallet, atau uang tunai untuk mulai mencatat keuangan Anda.
                  </p>
                  <button
                    onClick={() => setIsAddAccountOpen(true)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '12px' }}
                  >
                    <Plus size={14} style={{ marginRight: '6px' }} /> Tambah Dompet Pertama
                  </button>
                </div>
              ) : (
                data.accounts.map(acc => {
                  const pct = totalBalance > 0 ? Math.max(0, Math.round((acc.balance / totalBalance) * 100)) : 0;
                  const isBank = acc.type === 'bank';
                  const isEwallet = acc.type === 'ewallet';
                  const isCash = acc.type === 'cash';

                  const themeClass = isBank ? 'theme-bank' : isEwallet ? 'theme-ewallet' : isCash ? 'theme-cash' : 'theme-other';
                  const accentColor = isBank ? '#2563EB' : isEwallet ? '#8B5CF6' : isCash ? '#059669' : '#64748B';

                  return (
                    <div
                      key={acc.id}
                      className={`smart-pocket-card ${themeClass}`}
                      onClick={() => setSelectedAccountDetail(acc)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Top Row: Icon, Tag & Actions */}
                      <div className="pocket-card-top">
                        <div className="pocket-card-badge">
                          <span className="pocket-icon">{acc.icon || (isBank ? '🏦' : isEwallet ? '📱' : '💵')}</span>
                          <span className="pocket-type-tag">
                            {isBank ? 'REKENING BANK' : isEwallet ? 'E-WALLET' : isCash ? 'UANG TUNAI' : 'INVESTASI'}
                          </span>
                        </div>

                        <div className="pocket-card-actions">
                          <button
                            type="button"
                            className="pocket-action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(acc);
                            }}
                            title="Edit Dompet"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pocket-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAccount(acc.id, acc.name);
                            }}
                            title="Hapus Dompet"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Account Name & Status */}
                      <div className="pocket-card-body">
                        <div className="pocket-name">
                          <span>{acc.name}</span>
                          {acc.isPrimary && <span className="primary-star-badge" title="Dompet Utama">⭐ Utama</span>}
                        </div>
                        <div className="pocket-status-info">
                          <span className="pocket-status-dot"></span>
                          <span>{acc.accountNumber ? `${acc.accountNumber} • ` : ''}{acc.updated || 'Tersinkron'}</span>
                        </div>
                        <div className="pocket-click-hint">
                          <span>Ketuk untuk rincian & riwayat ➔</span>
                        </div>
                      </div>

                      {/* Bottom: Big Balance & Portfolio Share Progress */}
                      <div className="pocket-card-footer">
                        <div className="pocket-balance-label">SALDO TERSEDIA</div>
                        <div className="pocket-balance-value">
                          {maskMoney(acc.balance, isBalanceVisible)}
                        </div>

                        <div className="pocket-progress-wrap">
                          <div className="pocket-progress-label">
                            <span>Porsi Portofolio</span>
                            <span className="pocket-progress-pct">{pct}%</span>
                          </div>
                          <div className="pocket-progress-track">
                            <div
                              className="pocket-progress-fill"
                              style={{ width: `${pct}%`, backgroundColor: accentColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Minimalist Advice / Tip Strip */}
            <div className="accounts-tip-card">
              <ShieldCheck size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
              <div>
                <strong>Tips Manajemen Dompet:</strong> Saldo dompet Anda otomatis disinkronkan ke Supabase Cloud dan langsung terpotong saat mencatat pengeluaran atau bertambah saat pemasukan.
              </div>
            </div>

            {/* Modal Tambah Dompet Baru */}
          {isAddAccountOpen && (
            <div className="modal-overlay" onClick={() => setIsAddAccountOpen(false)}>
              <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle-bar" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Tambah Dompet / Akun Baru</h3>
                <form onSubmit={handleCreateAccount}>
                  <div className="input-group">
                    <label className="input-label">Nama Dompet / Bank</label>
                    <input
                      type="text"
                      placeholder="cth: Bank Mandiri, OVO, ShopeePay"
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

                  <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
                    Simpan Dompet
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal Edit Dompet */}
          {editingAccount && (
            <div className="modal-overlay" onClick={() => setEditingAccount(null)}>
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
        onAddTransaction={() => {
          setSelectedAccountDetail(null);
          setQuickAddType('expense');
          setIsQuickAddOpen(true);
        }}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
      />
    </div>
  );
};
