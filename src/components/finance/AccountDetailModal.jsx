import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { maskMoney, formatRupiahNumber } from '../../utils/formatters';
import {
  X,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  ArrowDown,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Wallet,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const AccountDetailModal = ({
  account,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onQuickAdd
}) => {
  const { data, isBalanceVisible, totalBalance } = useApp();
  const [copied, setCopied] = useState(false);
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'expense' | 'income'

  // Filter transactions for this specific account
  const accountTransactions = useMemo(() => {
    if (!account) return [];
    const txs = (data?.transactions || []).filter(
      t => t.accountName === account.name || t.toAccountName === account.name
    );
    if (txFilter === 'all') return txs;
    return txs.filter(t => t.type === txFilter);
  }, [data?.transactions, account?.name, txFilter]);

  // Statistics for this account
  const stats = useMemo(() => {
    if (!account) return { totalIncome: 0, totalExpense: 0, netFlow: 0, portfolioPct: 0 };
    const allAccountTxs = (data?.transactions || []).filter(
      t => t.accountName === account.name || t.toAccountName === account.name
    );
    const totalIncome = allAccountTxs
      .filter(t => t.type === 'income' || (t.type === 'transfer' && t.toAccountName === account.name))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allAccountTxs
      .filter(t => t.type === 'expense' || (t.type === 'transfer' && t.accountName === account.name))
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalIncome - totalExpense;
    const portfolioPct = totalBalance > 0 ? Math.max(0, Math.round(((account.balance || 0) / totalBalance) * 100)) : 0;

    return { totalIncome, totalExpense, netFlow, portfolioPct };
  }, [data?.transactions, account?.name, account?.balance, totalBalance]);

  if (!isOpen || !account) return null;

  // Handle Copy Account Number / ID
  const handleCopyNumber = (e) => {
    e.stopPropagation();
    if (!account.accountNumber) return;
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBank = account.type === 'bank';
  const isEwallet = account.type === 'ewallet';
  const isCash = account.type === 'cash';

  const cardThemeClass = isBank ? 'digital-card-bank' : isEwallet ? 'digital-card-ewallet' : isCash ? 'digital-card-cash' : 'digital-card-other';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="account-hub-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />

        {/* Modal Header */}
        <div className="account-hub-header">
          <div className="account-hub-title-box">
            <div className="hub-header-icon" style={{ backgroundColor: `${account.color || '#1665D8'}20`, color: account.color || '#1665D8' }}>
              {account.icon || '💳'}
            </div>
            <div>
              <h3 className="account-hub-title">Detail & Hub Dompet</h3>
              <p className="account-hub-subtitle">Info saldo, mutasi, dan nomor rekening</p>
            </div>
          </div>
          <button type="button" className="account-hub-close-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* 1. ATM / DIGITAL WALLET HERO CARD */}
        <div className={`digital-wallet-card ${cardThemeClass}`}>
          {/* Card Top Row: EMV Chip & Type Badge */}
          <div className="digital-card-top">
            <div className="digital-emv-chip">
              <div className="emv-line" />
              <div className="emv-line" />
              <span className="contactless-icon">📶</span>
            </div>
            <div className="digital-card-type-pill">
              <span>{isBank ? 'DEBIT CARD' : isEwallet ? 'E-WALLET PASS' : isCash ? 'DOMPET FISIK' : 'INVESTASI'}</span>
            </div>
          </div>

          {/* Card Middle: Account Name & Number */}
          <div className="digital-card-middle">
            <div className="digital-card-name">{account.name}</div>
            
            {/* Account / Phone Number with Copy Feature */}
            <div className="digital-card-number-row">
              {account.accountNumber ? (
                <div className="card-number-wrapper">
                  <span className="card-number-text">{account.accountNumber}</span>
                  <button
                    type="button"
                    className="card-copy-btn"
                    onClick={handleCopyNumber}
                    title="Salin Nomor Rekening / HP"
                  >
                    {copied ? (
                      <>
                        <Check size={12} style={{ color: '#6EE7B7' }} />
                        <span style={{ color: '#6EE7B7' }}>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="card-add-number-btn"
                  onClick={() => onEdit(account)}
                  title="Tambah Nomor Rekening / HP"
                >
                  <Plus size={12} />
                  <span>+ Tambah No. Rekening / No. HP</span>
                </button>
              )}
            </div>
          </div>

          {/* Card Bottom: Holder Name, Balance, and Primary Badge */}
          <div className="digital-card-bottom">
            <div>
              <div className="card-label">PEMILIK DOMPET</div>
              <div className="card-holder-name">
                {data.profile.fullName ? data.profile.fullName.toUpperCase() : 'MAHASISWA'}
              </div>
            </div>

            <div className="card-balance-right">
              <div className="card-label">SALDO AKTIF</div>
              <div className="card-balance-amount">
                {maskMoney(account.balance, isBalanceVisible)}
              </div>
            </div>
          </div>
        </div>

        {/* 2. NOTES & PERUNTUKAN (JIKA ADA) */}
        {account.notes && (
          <div className="account-notes-box">
            <div className="notes-header">
              <span>📝 Catatan / Peruntukan Dompet</span>
            </div>
            <div className="notes-content">{account.notes}</div>
          </div>
        )}

        {/* 3. QUICK ACTION BAR */}
        <div className="account-quick-actions-row">
          <button
            type="button"
            className="hub-action-btn primary"
            onClick={() => {
              onClose();
              if (onQuickAdd) onQuickAdd('expense', account.name);
            }}
            title="Catat transaksi dari dompet ini"
          >
            <Plus size={15} />
            <span>Catat Transaksi</span>
          </button>

          <button
            type="button"
            className="hub-action-btn secondary"
            onClick={() => {
              onClose();
              onEdit(account);
            }}
            title="Edit Detail & Saldo Dompet"
          >
            <Edit2 size={14} />
            <span>Edit Dompet</span>
          </button>

          <button
            type="button"
            className="hub-action-btn danger"
            onClick={() => {
              onDelete(account.id, account.name);
              onClose();
            }}
            title="Hapus Dompet Ini"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* 4. CASHFLOW STATISTICS */}
        <div className="account-stats-section">
          <div className="stats-section-title">
            <span>RINGKASAN ARUS KAS DOMPET</span>
            <span className="stats-portfolio-badge">{stats.portfolioPct}% Portofolio</span>
          </div>

          <div className="account-stats-grid">
            <div className="account-stat-item income">
              <div className="stat-item-header">
                <span className="stat-dot income" />
                <span>Pemasukan</span>
              </div>
              <div className="stat-item-amount">
                +{maskMoney(stats.totalIncome, isBalanceVisible)}
              </div>
            </div>

            <div className="account-stat-item expense">
              <div className="stat-item-header">
                <span className="stat-dot expense" />
                <span>Pengeluaran</span>
              </div>
              <div className="stat-item-amount">
                -{maskMoney(stats.totalExpense, isBalanceVisible)}
              </div>
            </div>

            <div className="account-stat-item net">
              <div className="stat-item-header">
                <TrendingUp size={12} style={{ color: stats.netFlow >= 0 ? '#10B981' : '#EF4444' }} />
                <span>Arus Kas Bersih</span>
              </div>
              <div className="stat-item-amount" style={{ color: stats.netFlow >= 0 ? '#10B981' : '#EF4444' }}>
                {stats.netFlow >= 0 ? '+' : ''}{maskMoney(stats.netFlow, isBalanceVisible)}
              </div>
            </div>
          </div>
        </div>

        {/* 5. FILTERED TRANSACTIONS HISTORY */}
        <div className="account-history-section">
          <div className="history-section-header">
            <span className="history-title">Riwayat Mutasi Dompet</span>
            <div className="history-filter-tabs">
              <button
                type="button"
                className={`history-tab-btn ${txFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTxFilter('all')}
              >
                Semua
              </button>
              <button
                type="button"
                className={`history-tab-btn ${txFilter === 'expense' ? 'active' : ''}`}
                onClick={() => setTxFilter('expense')}
              >
                Keluar
              </button>
              <button
                type="button"
                className={`history-tab-btn ${txFilter === 'income' ? 'active' : ''}`}
                onClick={() => setTxFilter('income')}
              >
                Masuk
              </button>
            </div>
          </div>

          <div className="account-tx-list">
            {accountTransactions.length === 0 ? (
              <div className="empty-tx-box">
                <p>Belum ada transaksi tercatat untuk dompet ini.</p>
              </div>
            ) : (
              accountTransactions.slice(0, 10).map((tx) => {
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="account-tx-item">
                    <div className="tx-item-left">
                      <div className={`tx-item-icon-circle ${tx.type}`}>
                        {isExpense ? <ArrowUp size={14} /> : isIncome ? <ArrowDown size={14} /> : '🔄'}
                      </div>
                      <div>
                        <div className="tx-item-merchant">{tx.merchant || tx.category || 'Transaksi'}</div>
                        <div className="tx-item-date">{tx.date} • {tx.category}</div>
                      </div>
                    </div>
                    <div className={`tx-item-amount ${tx.type}`}>
                      {isExpense ? '-' : '+'}{maskMoney(tx.amount, isBalanceVisible)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Close CTA */}
        <div className="account-hub-footer">
          <button
            type="button"
            className="btn-primary w-full"
            style={{ padding: '12px', borderRadius: '14px', fontWeight: 700 }}
            onClick={onClose}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
