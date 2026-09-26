import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingDown,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { maskMoney, formatRupiahNumber } from '../../utils/formatters';

export const CategoryDetailModal = ({
  category,
  isOpen,
  onClose,
  transactions = [],
  financialCycle,
  isBalanceVisible = true,
  onEditTransaction,
  onDeleteTransaction,
  onAddTransactionForCategory,
  onOpenBudgetSettings
}) => {
  const [filterPeriod, setFilterPeriod] = useState('cycle'); // 'cycle' | 'all'

  // Calculate statistics for this category
  const stats = useMemo(() => {
    if (!category) return { spentCycle: 0, spentAll: 0, percentUsed: 0, remaining: 0, isOver: false, overAmount: 0 };

    const catExpenseTxs = transactions.filter(
      t => t.type === 'expense' && t.category?.toLowerCase() === category.name?.toLowerCase()
    );

    const spentCycle = catExpenseTxs
      .filter(t => financialCycle ? financialCycle.isDateInCycle(t.date) : true)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const spentAll = catExpenseTxs
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const budget = Number(category.budget) || 0;
    const remaining = Math.max(0, budget - spentCycle);
    const percentUsed = budget > 0 ? Math.round((spentCycle / budget) * 100) : 0;
    const isOver = spentCycle > budget;
    const overAmount = isOver ? spentCycle - budget : 0;

    return {
      spentCycle,
      spentAll,
      remaining,
      percentUsed,
      isOver,
      overAmount
    };
  }, [category, transactions, financialCycle]);

  // Filtered transactions list
  const categoryTransactions = useMemo(() => {
    if (!category) return [];

    let filtered = transactions.filter(
      t => t.type === 'expense' && t.category?.toLowerCase() === category.name?.toLowerCase()
    );

    if (filterPeriod === 'cycle' && financialCycle) {
      filtered = filtered.filter(t => financialCycle.isDateInCycle(t.date));
    }

    // Sort by date descending
    return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [category, transactions, filterPeriod, financialCycle]);

  if (!isOpen || !category) return null;

  const categoryColor = category.color || '#1665D8';
  const budget = Number(category.budget) || 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-bottom-sheet category-detail-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="sheet-handle-bar" />

        {/* Modal Header */}
        <div className="category-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="category-modal-icon-badge"
              style={{
                backgroundColor: `${categoryColor}18`,
                color: categoryColor,
                border: `1.5px solid ${categoryColor}35`
              }}
            >
              <span>{category.icon || '🏷️'}</span>
            </div>
            <div>
              <h3 className="category-modal-title">{category.name}</h3>
              <div className="category-modal-cycle-badge">
                <Calendar size={11} style={{ display: 'inline', marginRight: '4px' }} />
                <span>{financialCycle?.periodLabel || 'Siklus Aktif'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="category-modal-close-btn"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="category-modal-body">
          {/* Summary Card */}
          <div className="category-modal-summary-card">
            <div className="category-modal-summary-grid">
              <div className="summary-stat-item">
                <span className="summary-stat-label">Sisa Budget</span>
                <span
                  className="summary-stat-val"
                  style={{ color: stats.isOver ? '#EF4444' : '#10B981' }}
                >
                  {maskMoney(stats.remaining, isBalanceVisible)}
                </span>
              </div>
              <div className="summary-stat-item">
                <span className="summary-stat-label">Terpakai</span>
                <span className="summary-stat-val" style={{ color: '#0F172A' }}>
                  {maskMoney(stats.spentCycle, isBalanceVisible)}
                </span>
              </div>
              <div
                className="summary-stat-item"
                style={{ textAlign: 'right', cursor: onOpenBudgetSettings ? 'pointer' : 'default' }}
                onClick={() => onOpenBudgetSettings && onOpenBudgetSettings()}
                title={onOpenBudgetSettings ? 'Klik untuk atur alokasi (%)' : undefined}
              >
                <span className="summary-stat-label">
                  Alokasi {onOpenBudgetSettings && <span style={{ fontSize: '9px', color: '#1665D8' }}>⚙️</span>}
                </span>
                <span className="summary-stat-val" style={{ color: '#475569' }}>
                  {maskMoney(budget, isBalanceVisible)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                  Realisasi Pengeluaran
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: stats.isOver ? '#FEE2E2' : stats.percentUsed > 80 ? '#FEF3C7' : '#ECFDF5',
                    color: stats.isOver ? '#B91C1C' : stats.percentUsed > 80 ? '#B45309' : '#047857'
                  }}
                >
                  {isBalanceVisible ? `${stats.percentUsed}%` : '••%'} terpakai
                </span>
              </div>

              <div className="progress-bar-container" style={{ height: '7px', background: '#F1F5F9' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, stats.percentUsed)}%`,
                    background: stats.isOver ? '#EF4444' : stats.percentUsed > 80 ? '#F59E0B' : '#10B981'
                  }}
                />
              </div>
            </div>

            {/* Over Budget Notice */}
            {stats.isOver && (
              <div className="category-overbudget-alert">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Budget kategori ini terlampaui sebesar <strong>{maskMoney(stats.overAmount, isBalanceVisible)}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Section: Transaction Filter Switcher */}
          <div style={{ marginTop: '18px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Riwayat Transaksi
              </h4>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                {categoryTransactions.length} transaksi
              </span>
            </div>

            {/* Switcher Pills */}
            <div className="category-filter-switcher">
              <button
                type="button"
                className={`category-filter-btn ${filterPeriod === 'cycle' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('cycle')}
              >
                Siklus Ini
              </button>
              <button
                type="button"
                className={`category-filter-btn ${filterPeriod === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('all')}
              >
                Semua Waktu
              </button>
            </div>
          </div>

          {/* Transaction List */}
          {categoryTransactions.length === 0 ? (
            <div className="category-empty-state">
              <div className="category-empty-icon">
                {category.icon || '🛍️'}
              </div>
              <p className="category-empty-title">
                {filterPeriod === 'cycle'
                  ? 'Belum ada pengeluaran di siklus ini'
                  : 'Belum ada riwayat transaksi'}
              </p>
              <p className="category-empty-desc">
                {filterPeriod === 'cycle'
                  ? `Belanja untuk kategori ${category.name} pada periode ${financialCycle?.periodLabel || 'ini'} akan muncul di sini.`
                  : `Setiap transaksi bertipe ${category.name} akan tercatat rapi di sini.`}
              </p>
              <button
                type="button"
                className="category-empty-action-btn"
                onClick={() => onAddTransactionForCategory(category.name)}
              >
                <Plus size={14} style={{ marginRight: '6px' }} />
                Catat Pengeluaran Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {categoryTransactions.map((tx) => {
                const formattedDate = new Date(tx.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={tx.id}
                    className="category-tx-item"
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div className="category-tx-icon-wrap">
                        {tx.icon || category.icon || '💸'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="category-tx-title">
                          {tx.merchant || tx.note || category.name}
                        </div>
                        <div className="category-tx-meta">
                          <span>{formattedDate}</span>
                          {tx.accountName && (
                            <>
                              <span className="meta-dot">•</span>
                              <span className="pocket-tag">{tx.accountName}</span>
                            </>
                          )}
                          {tx.note && tx.merchant && (
                            <>
                              <span className="meta-dot">•</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tx.note}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="category-tx-amount">
                          -{maskMoney(tx.amount, isBalanceVisible)}
                        </div>
                      </div>

                      <div className="category-tx-actions" onClick={(e) => e.stopPropagation()}>
                        {onEditTransaction && (
                          <button
                            type="button"
                            className="category-tx-icon-btn edit"
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Transaksi"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            className="category-tx-icon-btn delete"
                            onClick={() => {
                              if (window.confirm(`Hapus transaksi "${tx.merchant || tx.note || category.name}" senilai ${formatRupiahNumber(tx.amount)}?`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Action */}
        <div className="category-modal-footer">
          <button
            type="button"
            className="category-add-tx-btn"
            onClick={() => onAddTransactionForCategory(category.name)}
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Tambah Transaksi {category.name}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
