import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { maskMoney } from '../../utils/formatters';
import { getAccountTypeIcon, getAccountBrandInfo } from '../../utils/accountBrand';
import {
  X,
  Copy,
  Check,
  Plus,
  Edit3,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Wifi,
  FileText,
  Star
} from 'lucide-react';

export const AccountDetailModal = ({
  account,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onQuickAdd
}) => {
  const { data, isBalanceVisible, totalBalance, setPrimaryAccount } = useApp();
  const [copied, setCopied] = useState(false);
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'expense' | 'income'
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, account?.id]);

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

  const cardThemeClass = isBank
    ? 'digital-card-bank'
    : isEwallet
    ? 'digital-card-ewallet'
    : isCash
    ? 'digital-card-cash'
    : 'digital-card-other';

  const typeLabel = isBank
    ? 'DEBIT CARD'
    : isEwallet
    ? 'E-WALLET PASS'
    : isCash
    ? 'DOMPET TUNAI'
    : 'PORTOFOLIO';

  const brand = getAccountBrandInfo(account);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="account-hub-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Handle Bar & Sticky Modal Header */}
        <div className="account-hub-top-header">
          <div className="sheet-handle-bar" />
          <div className="account-hub-header">
            <div className="account-hub-title-box">
              <div
                className="hub-header-icon"
                style={{
                  backgroundColor: `${brand.color}15`,
                  color: brand.color
                }}
              >
                <img
                  src={getAccountTypeIcon(account.type)}
                  alt={account.name}
                  style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h3 className="account-hub-title">{account.name}</h3>
                  {account.isPrimary && (
                    <span className="primary-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={10} fill="currentColor" /> Utama
                    </span>
                  )}
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
                </div>
                <p className="account-hub-subtitle">
                  {isBank ? 'Rekening Bank' : isEwallet ? 'Akun E-Wallet' : isCash ? 'Uang Tunai' : 'Dompet Digital'}
                  {stats.portfolioPct > 0 ? ` • ${stats.portfolioPct}% dari total aset` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="account-hub-close-btn"
              onClick={onClose}
              title="Tutup"
              aria-label="Tutup Detail"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="account-hub-body" ref={scrollRef}>
          {/* 1. ULTRA-SLEEK LUXURY MINIMALIST CARD */}
          <div className={`digital-wallet-card ${cardThemeClass}`} style={{ borderLeft: `3.5px solid ${brand.color}` }}>
            {/* Ambient Sheen Overlay */}
            <div className="digital-card-sheen" />

            {/* Card Top: Type & Contactless Emblem */}
            <div className="digital-card-top">
              <div className="digital-card-brand">
                <img
                  src={getAccountTypeIcon(account.type)}
                  alt={account.name}
                  style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                />
                <span className="digital-card-inst">{account.name}</span>
                {account.isPrimary && (
                  <span className="primary-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
                    <Star size={9} fill="currentColor" /> Utama
                  </span>
                )}
              </div>
              <div className="digital-card-top-right">
                <span className="digital-card-type-badge">{typeLabel}</span>
                <Wifi size={16} className="contactless-svg" />
              </div>
            </div>

            {/* Card Center: Clean Account / Phone Number with 1-Tap Copy */}
            <div className="digital-card-center">
              {account.accountNumber ? (
                <div className="card-number-glass-box">
                  <span className="card-number-code">{account.accountNumber}</span>
                  <button
                    type="button"
                    className={`card-copy-pill ${copied ? 'copied' : ''}`}
                    onClick={handleCopyNumber}
                    title="Salin Nomor Rekening / HP"
                  >
                    {copied ? (
                      <>
                        <Check size={11} strokeWidth={2.5} />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="card-add-number-pill"
                  onClick={() => {
                    onClose();
                    onEdit(account);
                  }}
                  title="Tambah nomor rekening atau HP"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Tambah No. Rekening / HP</span>
                </button>
              )}
            </div>

            {/* Card Bottom: Holder Name & Balance */}
            <div className="digital-card-bottom">
              <div className="card-col-left">
                <span className="card-meta-label">PEMILIK DOMPET</span>
                <span className="card-holder-name">
                  {data?.profile?.fullName ? data.profile.fullName.toUpperCase() : 'MAHASISWA'}
                </span>
              </div>
              <div className="card-col-right">
                <span className="card-meta-label">SALDO AKTIF</span>
                <span className="card-balance-val">
                  {maskMoney(account.balance, isBalanceVisible)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. REFINED MINIMALIST ACTIONS ROW */}
          <div className="account-quick-actions-row">
            <button
              type="button"
              className="hub-action-pill primary"
              onClick={() => {
                onClose();
                if (onQuickAdd) onQuickAdd('expense', account.name);
              }}
              title="Catat transaksi pengeluaran/pemasukan dari dompet ini"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Catat Transaksi</span>
            </button>

            {!account.isPrimary ? (
              <button
                type="button"
                className="hub-action-pill highlight"
                onClick={() => setPrimaryAccount(account.id)}
                title="Jadikan akun ini sebagai pilihan utama saat mencatat transaksi"
                style={{
                  background: '#FEF3C7',
                  color: '#B45309',
                  borderColor: '#FDE68A'
                }}
              >
                <Star size={14} />
                <span>Jadikan Utama</span>
              </button>
            ) : (
              <div
                className="hub-action-pill highlight"
                title="Akun ini adalah akun default transaksi"
                style={{
                  background: '#ECFDF5',
                  color: '#047857',
                  borderColor: '#A7F3D0',
                  cursor: 'default'
                }}
              >
                <Star size={14} fill="#047857" />
                <span>Akun Utama</span>
              </div>
            )}

            <button
              type="button"
              className="hub-action-pill secondary"
              onClick={() => {
                onClose();
                onEdit(account);
              }}
              title="Edit detail, nama, atau saldo dompet"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              className="hub-action-pill danger"
              onClick={() => {
                onClose();
                onDelete(account.id, account.name);
              }}
              title="Hapus dompet ini"
              aria-label="Hapus Dompet"
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* 3. OPTIONAL NOTES / PERUNTUKAN */}
          {account.notes && (
            <div className="account-notes-card">
              <div className="notes-card-title">
                <FileText size={13} style={{ color: '#2563EB' }} />
                <span>Catatan / Peruntukan Dompet</span>
              </div>
              <p className="notes-card-desc">{account.notes}</p>
            </div>
          )}

          {/* 4. CASHFLOW SUMMARY (CLEAN & MINIMALIST METRICS, NO BOX-IN-A-BOX) */}
          <div className="account-cashflow-card">
            <div className="cashflow-card-head">
              <span className="cashflow-head-title">Ringkasan Arus Kas Dompet</span>
              <span className="cashflow-portfolio-tag">{stats.portfolioPct}% Portofolio</span>
            </div>

            <div className="cashflow-metrics-row">
              <div className="cashflow-metric-item">
                <span className="metric-label">
                  <span className="metric-dot income" /> Masuk
                </span>
                <span className="metric-number income">
                  +{maskMoney(stats.totalIncome, isBalanceVisible)}
                </span>
              </div>

              <div className="cashflow-metric-divider" />

              <div className="cashflow-metric-item">
                <span className="metric-label">
                  <span className="metric-dot expense" /> Keluar
                </span>
                <span className="metric-number expense">
                  -{maskMoney(stats.totalExpense, isBalanceVisible)}
                </span>
              </div>

              <div className="cashflow-metric-divider" />

              <div className="cashflow-metric-item">
                <span className="metric-label">
                  {stats.netFlow >= 0 ? (
                    <TrendingUp size={12} style={{ color: '#10B981' }} />
                  ) : (
                    <TrendingDown size={12} style={{ color: '#EF4444' }} />
                  )}
                  <span>Arus Bersih</span>
                </span>
                <span className={`metric-number ${stats.netFlow >= 0 ? 'income' : 'expense'}`}>
                  {stats.netFlow >= 0 ? '+' : ''}{maskMoney(stats.netFlow, isBalanceVisible)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. TRANSACTION MUTATION HISTORY */}
          <div className="account-history-container">
            <div className="history-header-row">
              <h4 className="history-section-title">Riwayat Mutasi</h4>
              <div className="history-segmented-tabs">
                <button
                  type="button"
                  className={`history-tab ${txFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTxFilter('all')}
                >
                  Semua
                </button>
                <button
                  type="button"
                  className={`history-tab ${txFilter === 'expense' ? 'active' : ''}`}
                  onClick={() => setTxFilter('expense')}
                >
                  Keluar
                </button>
                <button
                  type="button"
                  className={`history-tab ${txFilter === 'income' ? 'active' : ''}`}
                  onClick={() => setTxFilter('income')}
                >
                  Masuk
                </button>
              </div>
            </div>

            <div className="account-tx-scroll-list">
              {accountTransactions.length === 0 ? (
                <div className="empty-account-tx">
                  <div className="empty-tx-icon">☕</div>
                  <div className="empty-tx-text">
                    Belum ada transaksi tercatat untuk dompet ini.
                  </div>
                  <button
                    type="button"
                    className="empty-tx-add-btn"
                    onClick={() => {
                      onClose();
                      if (onQuickAdd) onQuickAdd('expense', account.name);
                    }}
                  >
                    + Catat Transaksi Baru
                  </button>
                </div>
              ) : (
                accountTransactions.map((tx) => {
                  const isOutgoing = tx.type === 'expense' || tx.type === 'debt_out' || (tx.type === 'transfer' && tx.accountName === account.name);
                  const isIncoming = tx.type === 'income' || tx.type === 'debt_in' || (tx.type === 'transfer' && tx.toAccountName === account.name);

                  let txTitle = tx.merchant || tx.category || 'Transaksi';
                  let txSub = `${tx.date} • ${tx.category || (isOutgoing ? 'Pengeluaran' : 'Pemasukan')}`;

                  if (tx.type === 'transfer') {
                    if (tx.accountName === account.name) {
                      txTitle = tx.merchant || `Transfer ke ${tx.toAccountName || 'Akun Lain'}`;
                      txSub = `${tx.date} • Transfer Keluar ke ${tx.toAccountName || 'Akun Lain'}${tx.note ? ` (${tx.note})` : ''}`;
                    } else {
                      txTitle = tx.merchant || `Transfer dari ${tx.accountName || 'Akun Lain'}`;
                      txSub = `${tx.date} • Transfer Masuk dari ${tx.accountName || 'Akun Lain'}${tx.note ? ` (${tx.note})` : ''}`;
                    }
                  }

                  return (
                    <div key={tx.id} className="modern-tx-row">
                      <div className="modern-tx-left">
                        <div className={`modern-tx-circle ${isOutgoing ? 'expense' : isIncoming ? 'income' : 'transfer'}`}>
                          {isOutgoing ? (
                            <ArrowUpRight size={14} />
                          ) : isIncoming ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowLeftRight size={14} />
                          )}
                        </div>
                        <div className="modern-tx-meta">
                          <span className="modern-tx-merchant">
                            {txTitle}
                          </span>
                          <span className="modern-tx-subtitle">
                            {txSub}
                          </span>
                        </div>
                      </div>

                      <div className={`modern-tx-amount ${isOutgoing ? 'expense' : 'income'}`}>
                        {isOutgoing ? '-' : '+'}{maskMoney(tx.amount, isBalanceVisible)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Clean Footer */}
        <div className="account-hub-footer">
          <button
            type="button"
            className="hub-footer-close-btn"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
