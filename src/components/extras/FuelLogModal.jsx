import React, { useState, useEffect } from 'react';
import { X, Fuel, Check, Sparkles, Wallet, Info, Calendar, Gauge, Edit3, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getLocalDateString } from '../../utils/formatters';

export const FuelLogModal = ({
  isOpen,
  onClose,
  fuelSettings,
  initialFuelType = 'pertalite',
  editingLog = null
}) => {
  const { data, addFuelLog, updateFuelLog, findLinkedTransaction } = useApp();

  const isEditMode = Boolean(editingLog);

  const prices = fuelSettings?.fuelPrices || {
    pertalite: 10000,
    pertamax_90: 15950,
    pertamax_green: 19150,
    pertamax_turbo: 19600
  };

  const [fuelType, setFuelType] = useState(initialFuelType || 'pertalite');
  const [nominalStr, setNominalStr] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [station, setStation] = useState('SPBU Pertamina');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [customPrice, setCustomPrice] = useState(null);
  const [customLiters, setCustomLiters] = useState('');
  const [isManualLiters, setIsManualLiters] = useState(false);
  const [syncTransaction, setSyncTransaction] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal opens or editingLog changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingLog) {
      const logFuelType = editingLog.fuelType || 'pertalite';
      setFuelType(logFuelType);
      setNominalStr(editingLog.amount ? Number(editingLog.amount).toLocaleString('id-ID') : '');
      setDate(editingLog.date || getLocalDateString());
      setStation(editingLog.station || 'SPBU Pertamina');
      setOdometer(
        editingLog.odometer !== null && editingLog.odometer !== undefined
          ? String(editingLog.odometer)
          : ''
      );
      setNote(editingLog.note || '');
      setCustomPrice(editingLog.pricePerLiter ? Number(editingLog.pricePerLiter) : null);
      setCustomLiters(editingLog.liters ? String(editingLog.liters) : '');
      setIsManualLiters(false);
      setSyncTransaction(true);

      // Resolve selected account
      if (editingLog.accountName) {
        setSelectedAccount(editingLog.accountName);
      } else {
        const linkedTx = findLinkedTransaction(data.transactions, editingLog);
        if (linkedTx?.accountName) {
          setSelectedAccount(linkedTx.accountName);
        } else if (data.accounts && data.accounts.length > 0) {
          const primary = data.accounts.find(a => a.isPrimary) || data.accounts[0];
          setSelectedAccount(primary.name);
        }
      }
    } else {
      setFuelType(initialFuelType || 'pertalite');
      setNominalStr('');
      setDate(getLocalDateString());
      setStation('SPBU Pertamina');
      setOdometer('');
      setNote('');
      setCustomPrice(null);
      setCustomLiters('');
      setIsManualLiters(false);
      setSyncTransaction(true);

      if (data.accounts && data.accounts.length > 0) {
        const primary = data.accounts.find(a => a.isPrimary) || data.accounts[0];
        setSelectedAccount(primary.name);
      }
    }
  }, [isOpen, editingLog, initialFuelType]);

  if (!isOpen) return null;

  const currentPrice = customPrice || prices[fuelType] || 10000;
  const nominalNum = Number(nominalStr.replace(/\D/g, '')) || 0;
  
  // Calculate liters (either manual input or calculated from nominal / price)
  const calculatedLiters = isManualLiters && customLiters
    ? Number(customLiters) || 0
    : currentPrice > 0 ? Number((nominalNum / currentPrice).toFixed(3)) : 0;

  // Handle format rupiah input
  const handleNominalChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setNominalStr('');
      return;
    }
    const val = Number(raw);
    setNominalStr(val.toLocaleString('id-ID'));
  };

  const handleQuickNominal = (val) => {
    setNominalStr(val.toLocaleString('id-ID'));
  };

  const handleFullTank = () => {
    const cap = Number(fuelSettings?.tankCapacity) || 4.2;
    const currentLiters = ((Number(fuelSettings?.currentTankLevel) || 50) / 100) * cap;
    const neededLiters = Math.max(0.5, cap - currentLiters);
    const approxNominal = Math.ceil((neededLiters * currentPrice) / 1000) * 1000;
    setNominalStr(approxNominal.toLocaleString('id-ID'));
  };

  const handleSelectFuelType = (typeId) => {
    setFuelType(typeId);
    // If switching fuel type, update pricePerLiter to current official price
    if (!isEditMode || typeId !== editingLog?.fuelType) {
      setCustomPrice(null);
    } else if (editingLog?.pricePerLiter) {
      setCustomPrice(Number(editingLog.pricePerLiter));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nominalNum <= 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        date,
        fuelType,
        amount: nominalNum,
        liters: Number(calculatedLiters),
        pricePerLiter: currentPrice,
        station: station.trim() || 'SPBU Pertamina',
        odometer: odometer !== '' && !isNaN(Number(odometer)) ? Number(odometer) : null,
        accountName: selectedAccount,
        note: note.trim()
      };

      if (isEditMode) {
        await updateFuelLog(editingLog.id, payload, syncTransaction);
      } else {
        await addFuelLog(payload, syncTransaction);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save fuel log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fuelOptions = [
    { id: 'pertalite', name: 'Pertalite', oktan: 'RON 90', color: '#10B981', price: prices.pertalite },
    { id: 'pertamax_90', name: 'Pertamax', oktan: 'RON 92', color: '#0284C7', price: prices.pertamax_90 },
    { id: 'pertamax_green', name: 'Green 95', oktan: 'RON 95', color: '#059669', price: prices.pertamax_green },
    { id: 'pertamax_turbo', name: 'Turbo', oktan: 'RON 98', color: '#DC2626', price: prices.pertamax_turbo }
  ];

  return (
    <div className="modal-backdrop-fuel" onClick={onClose}>
      <div
        className="modal-content-fuel sheet-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Sheet */}
        <div className="sheet-handle-bar" />

        {/* Header Modal */}
        <div className="modal-header-fuel">
          <div className="header-title-flex">
            <div className={`header-icon-fuel ${isEditMode ? 'edit-mode' : ''}`}>
              {isEditMode ? <Edit3 size={20} /> : <Fuel size={20} />}
            </div>
            <div>
              <h2 className="modal-title-fuel">
                {isEditMode ? 'Edit Riwayat Bensin' : 'Catat Isi Bensin'}
              </h2>
              <p className="modal-subtitle-fuel">
                {isEditMode
                  ? 'Perbarui rincian pengisian & sinkronkan data transaksi'
                  : 'Otomatis catat pengeluaran & update sisa tangki'}
              </p>
            </div>
          </div>
          <button className="btn-close-fuel" onClick={onClose} aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>

        {/* Form Isi / Edit Bensin */}
        <form onSubmit={handleSubmit} className="fuel-form-body">
          {/* 1. Tanggal Pengisian */}
          <div className="form-group-fuel">
            <label className="form-label-fuel">
              <Calendar size={14} className="inline mr-1 text-slate-500" />
              Tanggal Pengisian <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              className="input-date-fuel"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* 2. Pilih Jenis BBM */}
          <div className="form-group-fuel">
            <label className="form-label-fuel">Jenis Bahan Bakar</label>
            <div className="fuel-type-grid">
              {fuelOptions.map((opt) => {
                const isSelected = fuelType === opt.id;
                const displayPrice = isSelected && customPrice ? customPrice : opt.price;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`fuel-type-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectFuelType(opt.id)}
                    style={{
                      borderColor: isSelected ? opt.color : undefined
                    }}
                  >
                    <div className="fuel-btn-top">
                      <span className="fuel-name">{opt.name}</span>
                      <span className="fuel-ron" style={{ color: opt.color }}>{opt.oktan}</span>
                    </div>
                    <span className="fuel-price">
                      Rp {displayPrice?.toLocaleString('id-ID')}/L
                    </span>
                    {isSelected && (
                      <div className="fuel-checked-pill" style={{ background: opt.color }}>
                        <Check size={11} strokeWidth={3} color="#fff" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Nominal Rupiah */}
          <div className="form-group-fuel">
            <label className="form-label-fuel">
              Nominal Pengisian (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="nominal-input-wrap">
              <span className="rp-prefix">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                className="input-nominal-fuel"
                placeholder="0"
                value={nominalStr}
                onChange={handleNominalChange}
                required
                autoFocus={!isEditMode}
              />
            </div>

            {/* Quick Nominal Chips */}
            <div className="quick-chips-row">
              {[20000, 30000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="btn-quick-chip"
                  onClick={() => handleQuickNominal(val)}
                >
                  {val >= 1000 ? `${val / 1000}rb` : val}
                </button>
              ))}
              <button
                type="button"
                className="btn-quick-chip chip-highlight"
                onClick={handleFullTank}
              >
                <Sparkles size={12} className="mr-1" /> Full Tank
              </button>
            </div>
          </div>

          {/* Live Calculation Liters Box */}
          <div className="liters-calc-banner">
            <div className="liters-banner-left">
              <span className="liters-banner-label">
                {isManualLiters ? 'Volume Liter:' : 'Estimasi Didapat:'}
              </span>
              <span className="liters-banner-val">
                <strong>{nominalNum > 0 ? Number(calculatedLiters).toFixed(3) : '0.000'}</strong> Liter
              </span>
            </div>
            <div className="text-right">
              <span className="liters-calc-rate">
                @ Rp {currentPrice.toLocaleString('id-ID')}/L
              </span>
            </div>
          </div>

          {/* 4. Akun Pembayaran (Dompet/Rekening) */}
          <div className="form-group-fuel">
            <label className="form-label-fuel">
              <Wallet size={15} className="inline mr-1 text-slate-500" />
              Bayar Pakai Dompet / Rekening
            </label>
            <select
              className="select-fuel-account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {(data.accounts || []).map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.icon} {acc.name} (Saldo: Rp {Number(acc.balance || 0).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Lokasi SPBU & Odometer (2 Kolom) */}
          <div className="form-grid-two">
            <div className="form-group-fuel">
              <label className="form-label-fuel">Lokasi SPBU</label>
              <input
                type="text"
                className="input-text-fuel"
                placeholder="SPBU Pertamina..."
                value={station}
                onChange={(e) => setStation(e.target.value)}
              />
            </div>

            <div className="form-group-fuel">
              <label className="form-label-fuel">
                Odometer (km)
                {fuelSettings?.currentOdometer > 0 && (
                  <span className="last-odo-badge">
                    Tercatat: {Number(fuelSettings.currentOdometer).toLocaleString('id-ID')}
                  </span>
                )}
              </label>
              <input
                type="number"
                className="input-text-fuel"
                placeholder={fuelSettings?.currentOdometer ? String(fuelSettings.currentOdometer) : "Contoh: 14640"}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>
          </div>

          {/* 6. Catatan Tambahan (Opsional) */}
          <div className="form-group-fuel">
            <label className="form-label-fuel">Catatan (Opsional)</label>
            <input
              type="text"
              className="input-text-fuel"
              placeholder="Contoh: Isi sebelum tugas akhir / mudik"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* 7. Checkbox Sinkronisasi Transaksi Keuangan */}
          <label className="sync-tx-checkbox-wrap">
            <input
              type="checkbox"
              checked={syncTransaction}
              onChange={(e) => setSyncTransaction(e.target.checked)}
            />
            <div className="sync-tx-checkbox-text">
              <span className="sync-tx-title">
                {isEditMode
                  ? 'Sinkronkan dengan Transaksi Keuangan'
                  : 'Otomatis Masukkan ke Jurnal Pengeluaran'}
              </span>
              <p className="sync-tx-desc">
                {isEditMode
                  ? `Catatan pengeluaran kategori Transport & Bensin serta saldo rekening ${selectedAccount || 'Tunai'} akan diperbarui otomatis.`
                  : `Tercatat otomatis di kategori Transport & Bensin pada rekening ${selectedAccount || 'Tunai'}.`}
              </p>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="fuel-form-actions">
            <button
              type="button"
              className="btn-cancel-fuel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-submit-fuel"
              disabled={nominalNum <= 0 || isSubmitting}
            >
              {isSubmitting
                ? 'Menyimpan...'
                : isEditMode
                ? 'Simpan Perubahan'
                : 'Simpan & Masukkan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelLogModal;
