import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import { recommendSchedule, canAddTime, FREQ_OPTIONS } from '../../utils/medScheduler';

const FORM_OPTIONS = [
  { id: 'tablet', label: 'Tablet', emoji: '💊' },
  { id: 'kapsul', label: 'Kapsul', emoji: '💊' },
  { id: 'sirup', label: 'Sirup', emoji: '🧴' },
  { id: 'salep', label: 'Salep', emoji: '🩹' },
  { id: 'injeksi', label: 'Injeksi', emoji: '💉' },
  { id: 'lainnya', label: 'Lainnya', emoji: '🩺' }
];

export const MedicationFormModal = ({ isOpen, onClose, initialData = null }) => {
  const { data, addMedication, editMedication } = useApp();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('tablet');
  const [instructions, setInstructions] = useState('');
  const [frequency, setFrequency] = useState(1);
  const [scheduleTimes, setScheduleTimes] = useState([]);
  const [newTime, setNewTime] = useState('08:00');
  const [recommendReason, setRecommendReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [trackStock, setTrackStock] = useState(false);
  const [stockStr, setStockStr] = useState('');
  const [trackCost, setTrackCost] = useState(false);
  const [costStr, setCostStr] = useState('');
  const [accountName, setAccountName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDosage(initialData.dosage || '');
      setForm(initialData.form || 'tablet');
      setInstructions(initialData.instructions || '');
      const existingTimes = Array.isArray(initialData.scheduleTimes) ? [...initialData.scheduleTimes] : [];
      setScheduleTimes(existingTimes);
      setFrequency(Math.max(1, Math.min(4, existingTimes.length || 1)));
      setRecommendReason('');
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(initialData.endDate || '');
      setHasEndDate(Boolean(initialData.endDate));
      setTrackStock(initialData.stockRemaining !== null && initialData.stockRemaining !== undefined);
      setStockStr(initialData.stockRemaining !== null && initialData.stockRemaining !== undefined ? String(initialData.stockRemaining) : '');
      setTrackCost(false);
      setCostStr(initialData.cost ? formatRupiahNumber(initialData.cost) : '');
      setAccountName(initialData.accountName || data.accounts?.[0]?.name || '');
    } else {
      setName('');
      setDosage('');
      setForm('tablet');
      setInstructions('');
      setScheduleTimes([]);
      setFrequency(1);
      setRecommendReason('');
      setNewTime('08:00');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setHasEndDate(false);
      setTrackStock(false);
      setStockStr('');
      setTrackCost(false);
      setCostStr('');
      setAccountName(data.accounts?.find(a => a.isPrimary)?.name || data.accounts?.[0]?.name || '');
    }
    setErrorMsg('');
  }, [initialData, isOpen, data.accounts]);

  if (!isOpen) return null;

  // Rekomendasi jadwal pintar berdasarkan frekuensi & jadwal obat lain
  const applySmartSchedule = (freq, { force = false } = {}) => {
    const result = recommendSchedule({
      frequency: freq,
      medications: data.medications || [],
      excludeMedId: initialData?.id || null,
      currentTimes: scheduleTimes
    });
    if (force || result.changed) {
      setScheduleTimes(result.times);
      setRecommendReason(result.reason);
    } else {
      setRecommendReason(result.reason);
    }
  };

  const handleFrequencyChange = (freq) => {
    const f = Number(freq);
    setFrequency(f);
    applySmartSchedule(f);
  };

  const handleAddTime = () => {
    if (!newTime) return;
    if (scheduleTimes.includes(newTime)) {
      setErrorMsg(`Jam ${newTime} sudah ada di jadwal`);
      return;
    }
    if (!canAddTime(scheduleTimes, newTime)) {
      setErrorMsg('Jarak antar jam minum minimal 1 jam');
      return;
    }
    setErrorMsg('');
    setScheduleTimes(prev => [...prev, newTime].sort());
    setRecommendReason('');
  };

  const handleRemoveTime = (t) => {
    setScheduleTimes(prev => prev.filter(x => x !== t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Nama obat wajib diisi');
      return;
    }
    if (scheduleTimes.length === 0) {
      setErrorMsg('Tambahkan minimal satu jam minum obat');
      return;
    }
    if (scheduleTimes.length !== frequency) {
      setErrorMsg(`Frekuensi ${frequency}x sehari membutuhkan tepat ${frequency} jam minum (saat ini ${scheduleTimes.length})`);
      return;
    }

    const numericCost = trackCost && !initialData ? parseRupiahNumber(costStr) : 0;
    const stock = trackStock && stockStr !== '' ? Math.max(0, parseInt(stockStr, 10) || 0) : null;

    const payload = {
      name: cleanName,
      dosage: dosage.trim(),
      form,
      instructions: instructions.trim(),
      scheduleTimes: [...scheduleTimes].sort(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: hasEndDate && endDate ? endDate : null,
      stockRemaining: stock
    };

    if (initialData) {
      editMedication(initialData.id, payload);
    } else {
      await addMedication({
        ...payload,
        cost: numericCost,
        accountName: numericCost > 0 ? accountName : null
      });
    }

    onClose();
  };

  return (
    <div className="health-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="health-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="health-modal-header">
          <div>
            <h3 className="health-modal-title">
              {initialData ? 'Edit Obat' : 'Tambah Obat'}
            </h3>
            <span className="health-modal-sub">
              {initialData ? 'Perbarui detail & jadwal obat' : 'Lengkapi info dan jam minumnya'}
            </span>
          </div>
          <button type="button" className="health-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="health-form-body">
          {/* Nama & Dosis */}
          <div className="health-form-group">
            <label className="health-form-label">Nama Obat</label>
            <input
              type="text"
              className="health-input"
              placeholder="Contoh: Paracetamol, Amoxicillin, Vitamin C..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="health-form-row-2col">
            <div className="health-form-group">
              <label className="health-form-label">Dosis (Opsional)</label>
              <input
                type="text"
                className="health-input"
                placeholder="500 mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div className="health-form-group">
              <label className="health-form-label">Bentuk</label>
              <select
                className="health-select"
                value={form}
                onChange={(e) => setForm(e.target.value)}
              >
                {FORM_OPTIONS.map(f => (
                  <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="health-form-group">
            <label className="health-form-label">Instruksi (Opsional)</label>
            <input
              type="text"
              className="health-input"
              placeholder="Contoh: Sesudah makan, sebelum tidur..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Jadwal Jam — Frekuensi + Rekomendasi Pintar */}
          <div className="health-form-group">
            <label className="health-form-label">Frekuensi Minum</label>
            <div className="health-freq-row">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`health-freq-chip ${frequency === opt.value ? 'active' : ''}`}
                  onClick={() => handleFrequencyChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="health-form-group">
            <div className="health-schedule-head">
              <label className="health-form-label">Jam Minum Obat</label>
              <button
                type="button"
                className="health-smart-btn"
                onClick={() => applySmartSchedule(frequency, { force: true })}
                title="Hitung ulang jam optimal berdasarkan frekuensi & jadwal obat lain"
              >
                <Sparkles size={12} />
                <span>Rekomendasi Pintar</span>
              </button>
            </div>
            <div className="health-time-add-row">
              <input
                type="time"
                className="health-input health-time-input"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <button
                type="button"
                className="health-time-add-btn"
                onClick={handleAddTime}
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
            {recommendReason && (
              <span className="health-smart-reason">
                <Sparkles size={10} /> {recommendReason}
              </span>
            )}
            {scheduleTimes.length > 0 && (
              <div className="health-time-chips">
                {scheduleTimes.map(t => (
                  <span key={t} className="health-time-chip">
                    {t}
                    <button
                      type="button"
                      className="health-time-chip-remove"
                      onClick={() => handleRemoveTime(t)}
                      aria-label={`Hapus jam ${t}`}
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <span className="health-form-hint">
              {scheduleTimes.length}/{frequency} jam terisi — sistem menyarankan jam optimal yang selaras dengan obat lain
            </span>
          </div>

          {/* Periode */}
          <div className="health-form-row-2col">
            <div className="health-form-group">
              <label className="health-form-label">Mulai</label>
              <input
                type="date"
                className="health-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="health-form-group">
              <label className="health-form-label health-label-toggle">
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                />
                <span>Ada tanggal selesai</span>
              </label>
              {hasEndDate && (
                <input
                  type="date"
                  className="health-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Stok (opsional) */}
          <div className="health-form-group">
            <label className="health-form-label health-label-toggle">
              <input
                type="checkbox"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
              />
              <span>Lacak sisa stok obat</span>
            </label>
            {trackStock && (
              <input
                type="number"
                min="0"
                className="health-input"
                placeholder="Jumlah stok saat ini (mis. 30)"
                value={stockStr}
                onChange={(e) => setStockStr(e.target.value)}
              />
            )}
          </div>

          {/* Biaya (opsional, hanya saat tambah baru) */}
          {!initialData && (
            <div className="health-form-group">
              <label className="health-form-label health-label-toggle">
                <input
                  type="checkbox"
                  checked={trackCost}
                  onChange={(e) => setTrackCost(e.target.checked)}
                />
                <span>Catat biaya pembelian ke keuangan</span>
              </label>
              {trackCost && (
                <>
                  <div className="health-amount-wrapper">
                    <span className="health-currency-prefix">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="health-input health-amount-input"
                      placeholder="0"
                      value={costStr}
                      onChange={(e) => setCostStr(formatRupiahNumber(e.target.value))}
                    />
                  </div>
                  <select
                    className="health-select"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    style={{ marginTop: 8 }}
                  >
                    {data.accounts?.map((acc) => (
                      <option key={acc.id} value={acc.name}>
                        {acc.icon} {acc.name} (Rp {formatRupiahNumber(acc.balance)})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}

          {errorMsg && <div className="health-error-text">{errorMsg}</div>}

          <div className="health-modal-actions">
            <button type="button" className="health-btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="health-btn-submit">
              {initialData ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicationFormModal;
