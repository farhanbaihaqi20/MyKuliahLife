import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';

export const DebtPaymentModal = ({ isOpen, onClose, debt }) => {
  const { data, recordDebtPayment } = useApp();

  const [amountStr, setAmountStr] = useState('');
  const [accountName, setAccountName] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (debt) {
      setAmountStr(formatRupiahNumber(debt.remainingAmount || 0));
      setAccountName(debt.accountName || data.accounts?.find(a => a.isPrimary)?.name || data.accounts?.[0]?.name || '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setErrorMsg('');
    }
  }, [debt, isOpen, data.accounts]);

  if (!isOpen || !debt) return null;

  const isReceivable = debt.type === 'receivable';
  const remaining = Number(debt.remainingAmount) || 0;

  const handleQuickPercent = (pct) => {
    const val = Math.round((remaining * pct) / 100);
    setAmountStr(formatRupiahNumber(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = parseRupiahNumber(amountStr);
    if (numericAmount <= 0) {
      setErrorMsg('Nominal pembayaran harus lebih dari Rp 0');
      return;
    }

    if (numericAmount > remaining) {
      setErrorMsg(`Maksimal pembayaran Rp ${formatRupiahNumber(remaining)}`);
      return;
    }

    if (!accountName) {
      setErrorMsg('Pilih akun dompet / rekening');
      return;
    }

    await recordDebtPayment(debt.id, {
      amount: numericAmount,
      date: paymentDate || new Date().toISOString().split('T')[0],
      accountName,
      note: note.trim()
    });

    if (numericAmount >= remaining) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    onClose();
  };

  return (
    <div className="debt-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="debt-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="debt-modal-header">
          <div>
            <h3 className="debt-modal-title">
              {isReceivable ? 'Terima Pembayaran' : 'Bayar Utang'}
            </h3>
            <span className="debt-modal-sub">
              {debt.personAvatar} {debt.personName}
            </span>
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

        {/* Minimal Hero Remaining Box */}
        <div className="debt-payment-hero">
          <span className="debt-payment-hero-lbl">Sisa Tagihan</span>
          <span className="debt-payment-hero-val">
            Rp {formatRupiahNumber(remaining)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="debt-form-body">
          <div className="debt-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="debt-form-label" style={{ margin: 0 }}>Nominal {isReceivable ? 'Diterima' : 'Dibayar'}</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="debt-quick-chip"
                  onClick={() => handleQuickPercent(100)}
                >
                  100% Penuh
                </button>
                <button
                  type="button"
                  className="debt-quick-chip"
                  onClick={() => handleQuickPercent(50)}
                >
                  50%
                </button>
              </div>
            </div>

            <div className="debt-amount-wrapper">
              <span className="debt-currency-prefix">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                className="debt-input debt-amount-input"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(formatRupiahNumber(e.target.value))}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="debt-form-group">
            <label className="debt-form-label">
              {isReceivable ? 'Masuk ke Akun' : 'Dibayar dari Akun'}
            </label>
            <select
              className="debt-select"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            >
              {data.accounts?.map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.icon} {acc.name} (Rp {formatRupiahNumber(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="debt-form-group">
            <label className="debt-form-label">Tanggal Transaksi</label>
            <input
              type="date"
              className="debt-input"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="debt-form-group">
            <label className="debt-form-label">Keterangan (Opsional)</label>
            <input
              type="text"
              className="debt-input"
              placeholder="Contoh: Cicilan pertama..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="debt-error-text">
              {errorMsg}
            </div>
          )}

          <div className="debt-modal-actions">
            <button
              type="button"
              className="debt-btn-cancel"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="debt-btn-submit"
            >
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtPaymentModal;
