import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, ArrowDown, ArrowUp, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import { DEFAULT_BUDGET_CATEGORIES } from '../../constants/initialData';

const INCOME_CATEGORIES = [
  { name: 'Kiriman Ortu', icon: '💰' },
  { name: 'Gaji & Freelance', icon: '💼' },
  { name: 'Beasiswa', icon: '🎓' },
  { name: 'Hadiah / Bonus', icon: '🎁' },
  { name: 'Lainnya', icon: '💵' }
];

export default function EditTransactionModal({ transaction, isOpen, onClose }) {
  const { data, editTransaction } = useApp();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountName, setAccountName] = useState('');
  const [toAccountName, setToAccountName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('💸');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kategori pengeluaran bersumber konsisten dari kategori budget aktif
  const availableExpenseCategories = useMemo(() => {
    let list = (data.budget?.categories || []).map(c => ({
      name: c.name,
      icon: c.icon || '🏷️'
    }));

    if (list.length === 0) {
      list = DEFAULT_BUDGET_CATEGORIES.map(c => ({ name: c.name, icon: c.icon }));
    }

    // Jika transaksi yang diedit punya kategori khusus/lama, tetap pertahankan agar tidak hilang
    if (transaction?.category && transaction.type === 'expense') {
      const exists = list.some(c => c.name.toLowerCase() === transaction.category.toLowerCase());
      if (!exists) {
        list.push({
          name: transaction.category,
          icon: transaction.icon || '🏷️'
        });
      }
    }

    return list;
  }, [data.budget?.categories, transaction]);

  useEffect(() => {
    if (isOpen && transaction) {
      setType(transaction.type || 'expense');
      setAmount(transaction.amount ? formatRupiahNumber(transaction.amount) : '');
      setCategory(transaction.category || 'Makanan & minuman');
      setAccountName(transaction.accountName || (data.accounts[0]?.name || 'Tunai'));
      setToAccountName(transaction.toAccountName || (data.accounts[1]?.name || ''));
      setMerchant(transaction.merchant === '-' ? '' : (transaction.merchant || ''));
      setNote(transaction.note || '');
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setIcon(transaction.icon || '💸');
      setIsSubmitting(false);
    }
  }, [isOpen, transaction?.id]);

  if (!isOpen || !transaction) return null;

  const handleAmountChange = (e) => {
    const rawDigits = e.target.value.replace(/[^0-9]/g, '');
    if (!rawDigits) {
      setAmount('');
      return;
    }
    setAmount(formatRupiahNumber(parseInt(rawDigits, 10)));
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat.name);
    setIcon(cat.icon);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawAmount = parseRupiahNumber(amount);
    if (!rawAmount || rawAmount <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await editTransaction(transaction.id, {
        type,
        amount: rawAmount,
        category: type === 'transfer' ? 'Transfer Antar Akun' : category,
        accountName,
        toAccountName: type === 'transfer' ? toAccountName : undefined,
        merchant: merchant.trim() || '-',
        note: note.trim(),
        date,
        icon: type === 'transfer' ? '🔄' : icon
      });

      onClose();
    } catch (err) {
      console.error('Error saving edited transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hub-modal-overlay" onClick={onClose}>
      <div className="hub-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Edit Transaksi</h3>
            <p style={{ fontSize: '11px', color: '#64748B' }}>Saldo akun otomatis disesuaikan secara akurat</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          {/* Type Selector */}
          <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const defaultCat = availableExpenseCategories[0] || { name: 'Makanan & minuman', icon: '🍜' };
                setCategory(defaultCat.name);
                setIcon(defaultCat.icon);
              }}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                background: type === 'expense' ? '#EF4444' : 'transparent',
                color: type === 'expense' ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <ArrowDown size={12} /> Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory(INCOME_CATEGORIES[0].name);
                setIcon(INCOME_CATEGORIES[0].icon);
              }}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                background: type === 'income' ? '#10B981' : 'transparent',
                color: type === 'income' ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <ArrowUp size={12} /> Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                background: type === 'transfer' ? '#1665D8' : 'transparent',
                color: type === 'transfer' ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <ArrowRightLeft size={12} /> Transfer
            </button>
          </div>

          {/* Amount Field */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Nominal (Rp) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94A3B8' }}>
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="input-field"
                style={{ paddingLeft: '42px', fontSize: '18px', fontWeight: 800 }}
              />
            </div>
          </div>

          {/* Category Selector */}
          {type !== 'transfer' && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Kategori</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {(type === 'expense' ? availableExpenseCategories : INCOME_CATEGORIES).map(cat => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #1665D8' : '1px solid #E2E8F0',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        color: isSelected ? '#1665D8' : '#334155',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{type === 'transfer' ? 'Dari Akun' : 'Akun / Dompet'}</label>
              <select
                className="input-field"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              >
                {data.accounts.map(acc => (
                  <option key={acc.id} value={acc.name}>
                    {acc.icon || '💳'} {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Ke Akun Tujuan</label>
                <select
                  className="input-field"
                  value={toAccountName}
                  onChange={(e) => setToAccountName(e.target.value)}
                >
                  {data.accounts.filter(acc => acc.name !== accountName).map(acc => (
                    <option key={acc.id} value={acc.name}>
                      {acc.icon || '💳'} {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">
                  {type === 'expense' ? 'Nama Pengeluaran / Transaksi' : 'Sumber / Keterangan'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder={type === 'expense' ? 'cth: Cilok, Kantin Rektorat, Alfamart...' : 'cth: Gaji, Kiriman, dll...'}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Tanggal</label>
              <input
                type="date"
                required
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Catatan</label>
              <input
                type="text"
                className="input-field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} /> Simpan Transaksi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
