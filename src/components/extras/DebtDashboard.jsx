import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, maskMoney } from '../../utils/formatters';
import { MascotEmptyState } from '../common/MascotEmptyState';
import DebtFormModal from './DebtFormModal';
import DebtPaymentModal from './DebtPaymentModal';
import DebtDetailModal from './DebtDetailModal';

export const DebtDashboard = ({ onBack }) => {
  const {
    debts = [],
    totalReceivable = 0,
    totalPayable = 0,
    isBalanceVisible
  } = useApp();

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'receivable' | 'payable' | 'settled'
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [paymentModalDebt, setPaymentModalDebt] = useState(null);
  const [detailModalDebt, setDetailModalDebt] = useState(null);

  const activeReceivableCount = useMemo(() => {
    return debts.filter(d => d.type === 'receivable' && (d.status !== 'settled' && d.remainingAmount > 0)).length;
  }, [debts]);

  const activePayableCount = useMemo(() => {
    return debts.filter(d => d.type === 'payable' && (d.status !== 'settled' && d.remainingAmount > 0)).length;
  }, [debts]);

  const settledCount = useMemo(() => {
    return debts.filter(d => d.status === 'settled' || d.remainingAmount === 0).length;
  }, [debts]);

  const netBalance = totalReceivable - totalPayable;

  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      const isSettled = d.status === 'settled' || d.remainingAmount === 0;

      if (filterTab === 'receivable' && (d.type !== 'receivable' || isSettled)) return false;
      if (filterTab === 'payable' && (d.type !== 'payable' || isSettled)) return false;
      if (filterTab === 'settled' && !isSettled) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = d.personName?.toLowerCase().includes(query);
        const descMatch = d.description?.toLowerCase().includes(query);
        const accMatch = d.accountName?.toLowerCase().includes(query);
        return nameMatch || descMatch || accMatch;
      }

      return true;
    });
  }, [debts, filterTab, searchQuery]);

  return (
    <div className="debt-dashboard-root animate-fade-in">
      {/* Topbar: Clean, purposeful, generous breathing room with notch clearance */}
      <header className="debt-header">
        <div className="debt-header-left">
          <button
            type="button"
            className="debt-icon-btn"
            onClick={onBack}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="debt-header-text">
            <h1 className="debt-title">Utang & Piutang</h1>
            <span className="debt-subtitle">
              {debts.length > 0 ? `${debts.length} catatan tersimpan` : 'Kelola pinjaman & kasbon'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="debt-add-btn"
          onClick={() => {
            setEditingDebt(null);
            setIsFormOpen(true);
          }}
          title="Catat Baru"
        >
          <Plus size={16} />
          <span>Baru</span>
        </button>
      </header>

      {/* Unified Minimalist Net Balance Card */}
      <section className="debt-balance-card">
        <div className="debt-balance-hero">
          <div className="debt-net-label">
            <span>Posisi Bersih</span>
            <span className={`debt-net-badge ${netBalance >= 0 ? 'is-positive' : 'is-negative'}`}>
              {netBalance >= 0 ? 'Surplus Piutang' : 'Defisit Utang'}
            </span>
          </div>
          <div className="debt-net-amount">
            {netBalance >= 0 ? '+' : ''}{maskMoney(netBalance, isBalanceVisible)}
          </div>
        </div>

        <div className="debt-metrics-split">
          <div className="debt-metric-col">
            <div className="debt-metric-head">
              <span className="debt-dot green" />
              <span className="debt-metric-label">Piutang Saya</span>
              <span className="debt-metric-count">{activeReceivableCount}</span>
            </div>
            <div className="debt-metric-val">
              {maskMoney(totalReceivable, isBalanceVisible)}
            </div>
          </div>

          <div className="debt-metric-divider" />

          <div className="debt-metric-col">
            <div className="debt-metric-head">
              <span className="debt-dot amber" />
              <span className="debt-metric-label">Utang Saya</span>
              <span className="debt-metric-count">{activePayableCount}</span>
            </div>
            <div className="debt-metric-val">
              {maskMoney(totalPayable, isBalanceVisible)}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Segmented Control */}
      <nav className="debt-filter-bar">
        <button
          type="button"
          className={`debt-filter-pill ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          Semua ({debts.length})
        </button>
        <button
          type="button"
          className={`debt-filter-pill ${filterTab === 'receivable' ? 'active' : ''}`}
          onClick={() => setFilterTab('receivable')}
        >
          Piutang ({activeReceivableCount})
        </button>
        <button
          type="button"
          className={`debt-filter-pill ${filterTab === 'payable' ? 'active' : ''}`}
          onClick={() => setFilterTab('payable')}
        >
          Utang ({activePayableCount})
        </button>
        <button
          type="button"
          className={`debt-filter-pill ${filterTab === 'settled' ? 'active' : ''}`}
          onClick={() => setFilterTab('settled')}
        >
          Lunas ({settledCount})
        </button>
      </nav>

      {/* Search Input (Quiet & Minimal) */}
      <div className="debt-search-wrapper">
        <Search size={15} className="debt-search-icon" />
        <input
          type="text"
          className="debt-search-input"
          placeholder="Cari nama atau catatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="debt-search-clear"
            onClick={() => setSearchQuery('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Debt List */}
      {filteredDebts.length === 0 ? (
        <div className="debt-empty-state">
          <MascotEmptyState
            mascot="wallet"
            mascotSize={88}
            title={searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Catatan'}
            description={
              searchQuery
                ? `Tidak ditemukan catatan dengan kata kunci "${searchQuery}".`
                : 'Catat utang atau piutang agar aliran kas tetap terpantau rapi.'
            }
            actionText={searchQuery ? 'Reset Pencarian' : 'Buat Catatan Pertama'}
            actionIcon={<Plus size={14} />}
            onAction={() => {
              if (searchQuery) setSearchQuery('');
              else {
                setEditingDebt(null);
                setIsFormOpen(true);
              }
            }}
          />
        </div>
      ) : (
        <div className="debt-list">
          {filteredDebts.map((debt) => {
            const isRec = debt.type === 'receivable';
            const total = Number(debt.totalAmount) || 0;
            const remaining = Number(debt.remainingAmount) || 0;
            const paid = total - remaining;
            const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
            const isSettled = debt.status === 'settled' || remaining === 0;

            let isOverdue = false;
            let daysLeft = null;
            if (debt.dueDate && !isSettled) {
              const due = new Date(debt.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              due.setHours(0, 0, 0, 0);
              const diffTime = due.getTime() - today.getTime();
              daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (daysLeft < 0) isOverdue = true;
            }

            return (
              <article
                key={debt.id}
                className="debt-item-card"
                onClick={() => setDetailModalDebt(debt)}
              >
                {/* Header row */}
                <div className="debt-item-header">
                  <div className="debt-person-box">
                    <span className="debt-person-avatar">{debt.personAvatar || '🧑'}</span>
                    <div className="debt-person-info">
                      <div className="debt-person-name-row">
                        <span className="debt-person-name">{debt.personName}</span>
                        <span className={`debt-type-tag ${isRec ? 'is-rec' : 'is-pay'}`}>
                          {isRec ? 'Piutang' : 'Utang'}
                        </span>
                        {!isRec && debt.affectsBalance === false && (
                          <span className="debt-sub-tag">Kasbon</span>
                        )}
                        {isSettled && (
                          <span className="debt-settled-tag">Lunas</span>
                        )}
                      </div>
                      <div className="debt-person-meta">
                        <span>{debt.accountName || 'Dompet'}</span>
                        {debt.description && (
                          <>
                            <span className="debt-meta-bullet">•</span>
                            <span className="debt-meta-desc">{debt.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="debt-amount-box">
                    <span className={`debt-amount-primary ${isSettled ? 'is-settled' : ''}`}>
                      {maskMoney(remaining, isBalanceVisible)}
                    </span>
                    {total > remaining && (
                      <span className="debt-amount-total">
                        dari {maskMoney(total, isBalanceVisible)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sleek Minimal Progress line (only shown if partially paid) */}
                {total > remaining && !isSettled && (
                  <div className="debt-progress-container">
                    <div className="debt-progress-track">
                      <div
                        className="debt-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="debt-progress-text">{pct}%</span>
                  </div>
                )}

                {/* Footer row */}
                <div className="debt-item-footer">
                  <div className="debt-footer-date">
                    {debt.dueDate ? (
                      <span className={`debt-due-text ${isOverdue ? 'is-overdue' : ''}`}>
                        <Calendar size={12} />
                        {isOverdue
                          ? `Lewat ${Math.abs(daysLeft)} hari (${debt.dueDate})`
                          : daysLeft === 0
                          ? 'Jatuh tempo hari ini'
                          : `${debt.dueDate}`}
                      </span>
                    ) : (
                      <span className="debt-created-text">
                        {debt.createdDate}
                      </span>
                    )}
                  </div>

                  <div className="debt-footer-action" onClick={(e) => e.stopPropagation()}>
                    {!isSettled ? (
                      <button
                        type="button"
                        className={`debt-action-pill ${isRec ? 'rec' : 'pay'}`}
                        onClick={() => setPaymentModalDebt(debt)}
                      >
                        {isRec ? 'Terima' : 'Bayar'}
                      </button>
                    ) : (
                      <span className="debt-done-pill">
                        <CheckCircle2 size={12} /> Selesai
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DebtFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDebt(null);
        }}
        initialData={editingDebt}
      />

      <DebtPaymentModal
        isOpen={Boolean(paymentModalDebt)}
        onClose={() => setPaymentModalDebt(null)}
        debt={paymentModalDebt}
      />

      <DebtDetailModal
        isOpen={Boolean(detailModalDebt)}
        onClose={() => setDetailModalDebt(null)}
        debt={detailModalDebt}
        onEdit={(debtToEdit) => {
          setEditingDebt(debtToEdit);
          setIsFormOpen(true);
        }}
        onPay={(debtToPay) => {
          setPaymentModalDebt(debtToPay);
        }}
      />
    </div>
  );
};

export default DebtDashboard;
