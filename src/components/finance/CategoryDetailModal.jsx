import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Sliders
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
      >
        <div className="sheet-handle-bar" />

        {/* Modal Header */}
        <div className="cat-modal-header">
          <div className="cat-modal-header-left">
            <div
              className="cat-modal-avatar"
              style={{
                backgroundColor: `${categoryColor}14`,
                color: categoryColor,
                border: `1.5px solid ${categoryColor}28`
              }}
            >
              <span>{category.icon || '🏷️'}</span>
            </div>
            <div>
              <h3 className="cat-modal-title">{category.name}</h3>
              <div className="cat-modal-cycle">
                <Calendar size={11} />
                <span>{financialCycle?.periodLabel || 'Siklus Ini'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cat-modal-close"
            aria-label="Tutup"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="cat-modal-scroll-body">
          {/* Minimalist Summary Card */}
          <div className="cat-summary-card">
            <div className="cat-summary-top">
              <div>
                <span className="cat-summary-label">SISA BUDGET</span>
                <div className={`cat-summary-amount ${stats.isOver ? 'over' : ''}`}>
                  {stats.isOver
                    ? `Over ${maskMoney(stats.overAmount, isBalanceVisible)}`
                    : maskMoney(stats.remaining, isBalanceVisible)}
                </div>
              </div>

              <span className={`cat-summary-health-pill ${stats.isOver ? 'over' : stats.percentUsed > 80 ? 'warning' : 'safe'}`}>
                {stats.isOver
                  ? 'Melebihi Budget'
                  : isBalanceVisible
                  ? `${stats.percentUsed}% terpakai`
                  : '••%'}
              </span>
            </div>

            {/* Sleek Progress Track */}
            <div className="cat-summary-track">
              <div
                className="cat-summary-fill"
                style={{
                  width: `${Math.min(100, stats.percentUsed)}%`,
                  background: stats.isOver
                    ? '#EF4444'
                    : stats.percentUsed > 80
                    ? '#F59E0B'
                    : '#10B981'
                }}
              />
            </div>

            {/* Bottom Metrics Bar */}
            <div className="cat-summary-bottom">
              <div className="cat-metric-item">
                <span className="cat-metric-label">Terpakai:</span>
                <strong className="cat-metric-val">{maskMoney(stats.spentCycle, isBalanceVisible)}</strong>
              </div>
              <div className="cat-metric-item align-right">
                <span className="cat-metric-label">Plafon:</span>
                <strong className="cat-metric-val">{maskMoney(budget, isBalanceVisible)}</strong>
                {onOpenBudgetSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBudgetSettings();
                    }}
                    className="cat-metric-edit-btn"
                    title="Ubah Alokasi"
                  >
                    <Sliders size={10} /> Ubah
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Over Budget Notice */}
          {stats.isOver && (
            <div className="cat-overbudget-alert">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>Budget kategori ini terlampaui sebesar <strong>{maskMoney(stats.overAmount, isBalanceVisible)}</strong>.</span>
            </div>
          )}

          {/* Section: Riwayat Transaksi */}
          <div className="cat-tx-section-header">
            <span className="cat-tx-section-title">
              Riwayat Pengeluaran
            </span>
            {/* Filter Pills */}
            <div className="cat-filter-pills">
              <button
                type="button"
                className={`cat-filter-pill-btn ${filterPeriod === 'cycle' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('cycle')}
              >
                Siklus Ini
              </button>
              <button
                type="button"
                className={`cat-filter-pill-btn ${filterPeriod === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('all')}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Transaction List */}
          {categoryTransactions.length === 0 ? (
            <div className="cat-empty-state">
              <div className="cat-empty-icon">
                {category.icon || '🛍️'}
              </div>
              <p className="cat-empty-title">
                {filterPeriod === 'cycle'
                  ? 'Belum ada pengeluaran di siklus ini'
                  : 'Belum ada riwayat transaksi'}
              </p>
              <p className="cat-empty-desc">
                {filterPeriod === 'cycle'
                  ? `Pengeluaran untuk ${category.name} pada siklus ini akan tercatat otomatis di sini.`
                  : `Setiap transaksi ${category.name} akan tersimpan rapi di sini.`}
              </p>
              <button
                type="button"
                className="cat-empty-cta"
                onClick={() => onAddTransactionForCategory(category.name)}
              >
                <Plus size={14} />
                <span>Catat Pengeluaran</span>
              </button>
            </div>
          ) : (
            <div className="cat-tx-list">
              {categoryTransactions.map((tx) => {
                const formattedDate = new Date(tx.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short'
                });

                const txTitle = tx.merchant || tx.note || category.name;

                return (
                  <div
                    key={tx.id}
                    className="cat-tx-card"
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cat-tx-left">
                      <div className="cat-tx-icon-box">
                        <span>{tx.icon || category.icon || '🍜'}</span>
                      </div>
                      <div className="cat-tx-content">
                        <span className="cat-tx-name" title={txTitle}>
                          {txTitle}
                        </span>
                        <div className="cat-tx-meta-line">
                          <span>{formattedDate}</span>
                          {tx.accountName && (
                            <>
                              <span className="meta-sep">•</span>
                              <span className="meta-acc">{tx.accountName}</span>
                            </>
                          )}
                          {tx.note && tx.note !== txTitle && (
                            <>
                              <span className="meta-sep">•</span>
                              <span className="meta-note" title={tx.note}>{tx.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="cat-tx-right">
                      <span className="cat-tx-nominal">
                        -{maskMoney(tx.amount, isBalanceVisible)}
                      </span>
                      <div className="cat-tx-actions" onClick={(e) => e.stopPropagation()}>
                        {onEditTransaction && (
                          <button
                            type="button"
                            className="cat-tx-action-btn edit"
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Transaksi"
                          >
                            <Edit2 size={11} />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            className="cat-tx-action-btn delete"
                            onClick={() => {
                              if (window.confirm(`Hapus transaksi "${txTitle}" senilai ${formatRupiahNumber(tx.amount)}?`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={11} />
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
        <div className="cat-modal-footer">
          <button
            type="button"
            className="cat-add-btn"
            onClick={() => onAddTransactionForCategory(category.name)}
          >
            <Plus size={15} />
            <span>Tambah Pengeluaran {category.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
