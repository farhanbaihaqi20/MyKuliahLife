import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';

const PRESET_AVATARS = ['🧑', '👩', '🧑‍💻', '🍲', '☕', '🛵', '📚', '🏠', '🛍️', '🤝'];

export const DebtFormModal = ({ isOpen, onClose, initialData = null }) => {
  const { data, addDebt, editDebt } = useApp();

  const [type, setType] = useState('receivable'); // 'receivable' | 'payable'
  const [personName, setPersonName] = useState('');
  const [personAvatar, setPersonAvatar] = useState('🧑');
  const [amountStr, setAmountStr] = useState('');
  const [accountName, setAccountName] = useState('');
  const [affectsBalance, setAffectsBalance] = useState(false); // Default to Kasbon (non-cash) when payable
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'receivable');
      setPersonName(initialData.personName || '');
      setPersonAvatar(initialData.personAvatar || '🧑');
      setAmountStr(initialData.totalAmount ? formatRupiahNumber(initialData.totalAmount) : '');
      setAccountName(initialData.accountName || data.accounts?.[0]?.name || '');
      setAffectsBalance(initialData.affectsBalance !== undefined ? Boolean(initialData.affectsBalance) : false);
      setDueDate(initialData.dueDate || '');
      setDescription(initialData.description || '');
    } else {
      setType('receivable');
      setPersonName('');
      setPersonAvatar('🧑');
      setAmountStr('');
      setAccountName(data.accounts?.find(a => a.isPrimary)?.name || data.accounts?.[0]?.name || '');
      setAffectsBalance(false);
      setDueDate('');
      setDescription('');
    }
    setErrorMsg('');
  }, [initialData, isOpen, data.accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = personName.trim();
    if (!cleanName) {
      setErrorMsg('Nama pihak atau orang wajib diisi');
      return;
    }

    const numericAmount = parseRupiahNumber(amountStr);
    if (numericAmount <= 0) {
      setErrorMsg('Nominal harus lebih dari Rp 0');
      return;
    }

    if (initialData) {
      editDebt(initialData.id, {
        personName: cleanName,
        personAvatar,
        description: description.trim(),
        dueDate: dueDate || null
      });
    } else {
      addDebt({
        type,
        personName: cleanName,
        personAvatar,
        totalAmount: numericAmount,
        accountName,
        affectsBalance: type === 'payable' ? affectsBalance : true,
        dueDate: dueDate || null,
        description: description.trim()
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
        {/* Header */}
        <div className="debt-modal-header">
          <div>
            <h3 className="debt-modal-title">
              {initialData ? 'Edit Catatan' : 'Catat Baru'}
            </h3>
            <span className="debt-modal-sub">
              {initialData ? 'Perbarui informasi catatan' : 'Utang atau piutang'}
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

        <form onSubmit={handleSubmit} className="debt-form-body">
          {/* Segmented Type Switcher */}
          {!initialData && (
            <div className="debt-segmented-control">
              <button
                type="button"
                className={`debt-segment-btn ${type === 'receivable' ? 'active' : ''}`}
                onClick={() => setType('receivable')}
              >
                Piutang (Orang Utang)
              </button>
              <button
                type="button"
                className={`debt-segment-btn ${type === 'payable' ? 'active' : ''}`}
                onClick={() => setType('payable')}
              >
                Utang (Saya Utang)
              </button>
            </div>
          )}

          {/* If Payable: Clean Sub-Type Segmented Control (Kasbon vs Tunai) */}
          {!initialData && type === 'payable' && (
            <div className="debt-form-group">
              <label className="debt-form-label">Sifat Utang</label>
              <div className="debt-segmented-sub">
                <button
                  type="button"
                  className={`debt-sub-btn ${!affectsBalance ? 'active' : ''}`}
                  onClick={() => setAffectsBalance(false)}
                >
                  Kasbon / Belanja (Non-Tunai)
                </button>
                <button
                  type="button"
                  className={`debt-sub-btn ${affectsBalance ? 'active' : ''}`}
                  onClick={() => setAffectsBalance(true)}
                >
                  Pinjaman Uang Tunai
                </button>
              </div>
            </div>
          )}

          {/* Name & Quick Avatars */}
          <div className="debt-form-group">
            <label className="debt-form-label">Nama Orang / Pihak</label>
            <input
              type="text"
              className="debt-input"
              placeholder="Contoh: Dimas, Warung Nasi, Andi..."
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              autoFocus
              required
            />
            {/* Minimal Avatar Chips */}
            <div className="debt-avatar-chips">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  className={`debt-avatar-chip ${personAvatar === av ? 'selected' : ''}`}
                  onClick={() => setPersonAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          {!initialData ? (
            <div className="debt-form-group">
              <label className="debt-form-label">Nominal (Rp)</label>
              <div className="debt-amount-wrapper">
                <span className="debt-currency-prefix">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="debt-input debt-amount-input"
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(formatRupiahNumber(e.target.value))}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="debt-form-row-summary">
              <span className="debt-row-label">Total Pinjaman</span>
              <span className="debt-row-val">Rp {formatRupiahNumber(initialData.totalAmount)}</span>
            </div>
          )}

          {/* Account Selector (Only when balance is affected) */}
          {!initialData && (type === 'receivable' || affectsBalance) && (
            <div className="debt-form-group">
              <label className="debt-form-label">
                {type === 'receivable' ? 'Sumber Akun Dompet' : 'Tujuan Akun Dompet'}
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
          )}

          {/* Due date & note in clean vertical group */}
          <div className="debt-form-group">
            <label className="debt-form-label">Jatuh Tempo (Opsional)</label>
            <input
              type="date"
              className="debt-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="debt-form-group">
            <label className="debt-form-label">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              className="debt-input"
              placeholder="Contoh: Modul kuliah, patungan makan, kasbon..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="debt-error-text">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
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
              {initialData ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtFormModal;
