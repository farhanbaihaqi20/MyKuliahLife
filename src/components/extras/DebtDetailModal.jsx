import React, { useState } from 'react';
import {
  X,
  Calendar,
  Wallet,
  Trash2,
  Edit2,
  Share2,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber } from '../../utils/formatters';

export const DebtDetailModal = ({ isOpen, onClose, debt, onEdit, onPay }) => {
  const { deleteDebt } = useApp();
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  if (!isOpen || !debt) return null;

  const isReceivable = debt.type === 'receivable';
  const total = Number(debt.totalAmount) || 0;
  const remaining = Number(debt.remainingAmount) || 0;
  const paid = total - remaining;
  const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
  const isSettled = debt.status === 'settled' || remaining === 0;

  let isOverdue = false;
  let daysDiff = null;
  if (debt.dueDate && !isSettled) {
    const due = new Date(debt.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) isOverdue = true;
  }

  const handleCopyReminder = () => {
    let text = '';
    if (isReceivable) {
      text = `Halo ${debt.personName}, maaf mengganggu waktunya ya 🙏. Mau sekadar mengingatkan catatan pinjaman sebesar Rp ${formatRupiahNumber(remaining)}${debt.dueDate ? ` dengan jatuh tempo ${debt.dueDate}` : ''}. Kalau sudah luang kabari ya, terima kasih banyak! 😊`;
    } else {
      text = `Halo ${debt.personName}, ini catatan utangku sebesar Rp ${formatRupiahNumber(remaining)}${debt.dueDate ? ` dengan target pelunasan ${debt.dueDate}` : ''}. InsyaAllah segera aku lunasi ya, terima kasih sudah bantu! 🙏`;
    }

    navigator.clipboard.writeText(text);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  const handleDelete = () => {
    deleteDebt(debt.id);
    onClose();
  };

  return (
    <div className="debt-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="debt-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="debt-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="debt-detail-avatar">{debt.personAvatar || '🧑'}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 className="debt-modal-title">{debt.personName}</h3>
                <span className={`debt-type-tag ${isReceivable ? 'is-rec' : 'is-pay'}`}>
                  {isReceivable ? 'Piutang' : 'Utang'}
                </span>
                {!isReceivable && debt.affectsBalance === false && (
                  <span className="debt-sub-tag">Kasbon</span>
                )}
                {isSettled && (
                  <span className="debt-settled-tag">Lunas</span>
                )}
              </div>
              <span className="debt-modal-sub">
                {debt.createdDate} • {debt.accountName || 'Dompet'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="debt-modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Minimal metrics row */}
        <div className="debt-detail-metrics">
          <div className="debt-detail-metric">
            <span className="debt-detail-metric-lbl">Total</span>
            <span className="debt-detail-metric-val">Rp {formatRupiahNumber(total)}</span>
          </div>
          <div className="debt-detail-metric">
            <span className="debt-detail-metric-lbl">Terbayar</span>
            <span className="debt-detail-metric-val">Rp {formatRupiahNumber(paid)}</span>
          </div>
          <div className="debt-detail-metric">
            <span className="debt-detail-metric-lbl">Sisa</span>
            <span className={`debt-detail-metric-val ${isSettled ? '' : 'highlight'}`}>
              Rp {formatRupiahNumber(remaining)}
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="debt-detail-progress">
          <div className="debt-progress-track">
            <div className="debt-progress-fill" style={{ width: `${percentPaid}%` }} />
          </div>
          <div className="debt-detail-progress-info">
            <span>{percentPaid}% selesai</span>
            {debt.dueDate && (
              <span className={isOverdue ? 'debt-due-alert' : ''}>
                {isOverdue ? `Lewat ${Math.abs(daysDiff)} hari` : `Jatuh tempo: ${debt.dueDate}`}
              </span>
            )}
          </div>
        </div>

        {/* Description if present */}
        {debt.description && (
          <div className="debt-detail-desc">
            {debt.description}
          </div>
        )}

        {/* Payment History */}
        <div className="debt-history-section">
          <div className="debt-history-header">
            <span className="debt-history-title">Riwayat Pembayaran ({debt.payments?.length || 0})</span>
            {!isSettled && (
              <button
                type="button"
                className="debt-link-btn"
                onClick={() => {
                  onClose();
                  onPay(debt);
                }}
              >
                + Tambah
              </button>
            )}
          </div>

          {(!debt.payments || debt.payments.length === 0) ? (
            <div className="debt-history-empty">
              Belum ada riwayat cicilan
            </div>
          ) : (
            <div className="debt-history-list">
              {debt.payments.map((p, idx) => (
                <div key={p.id || idx} className="debt-history-row">
                  <div>
                    <div className="debt-history-note">{p.note || 'Pembayaran'}</div>
                    <div className="debt-history-date">{p.date} • {p.accountName}</div>
                  </div>
                  <div className="debt-history-amount">+Rp {formatRupiahNumber(p.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp reminder button */}
        <button
          type="button"
          onClick={handleCopyReminder}
          className="debt-btn-reminder"
        >
          {copiedReminder ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copiedReminder ? 'Teks WhatsApp Tersalin' : 'Salin Pesan WhatsApp Santun'}</span>
        </button>

        {/* Actions */}
        {isConfirmDelete ? (
          <div className="debt-delete-confirm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span>Hapus catatan ini?</span>
              <span style={{ fontSize: '10.5px', fontWeight: 500, color: '#B91C1C' }}>
                Riwayat transaksi di Finance & saldo akan dikembalikan
              </span>
            </div>
            <div className="debt-delete-confirm-btns">
              <button
                type="button"
                className="debt-btn-cancel"
                onClick={() => setIsConfirmDelete(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="debt-btn-danger"
                onClick={handleDelete}
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="debt-modal-actions">
            <button
              type="button"
              className="debt-btn-cancel"
              onClick={() => setIsConfirmDelete(true)}
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              className="debt-btn-cancel"
              onClick={() => {
                onClose();
                onEdit(debt);
              }}
              style={{ flex: 1 }}
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
            {!isSettled && (
              <button
                type="button"
                className="debt-btn-submit"
                onClick={() => {
                  onClose();
                  onPay(debt);
                }}
                style={{ flex: 1.5 }}
              >
                {isReceivable ? 'Terima' : 'Bayar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtDetailModal;
