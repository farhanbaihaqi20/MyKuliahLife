import React, { useState } from 'react';
import { X, Settings, RefreshCw, Check, Globe, Bike, Sliders, DollarSign, Info, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Daftar Provinsi Populer di Indonesia untuk API nasgunawann/bensin-api
const INDONESIA_PROVINCES = [
  { slug: 'jawa-timur', name: 'Jawa Timur' },
  { slug: 'dki-jakarta', name: 'DKI Jakarta' },
  { slug: 'jawa-barat', name: 'Jawa Barat' },
  { slug: 'jawa-tengah', name: 'Jawa Tengah' },
  { slug: 'di-yogyakarta', name: 'D.I. Yogyakarta' },
  { slug: 'banten', name: 'Banten' },
  { slug: 'bali', name: 'Bali' },
  { slug: 'sumatera-utara', name: 'Sumatera Utara' },
  { slug: 'sumatera-barat', name: 'Sumatera Barat' },
  { slug: 'sumatera-selatan', name: 'Sumatera Selatan' },
  { slug: 'riau', name: 'Riau' },
  { slug: 'lampung', name: 'Lampung' },
  { slug: 'kalimantan-timur', name: 'Kalimantan Timur' },
  { slug: 'kalimantan-barat', name: 'Kalimantan Barat' },
  { slug: 'kalimantan-selatan', name: 'Kalimantan Selatan' },
  { slug: 'sulawesi-selatan', name: 'Sulawesi Selatan' },
  { slug: 'sulawesi-utara', name: 'Sulawesi Utara' },
  { slug: 'nusa-tenggara-barat', name: 'Nusa Tenggara Barat' },
  { slug: 'nusa-tenggara-timur', name: 'Nusa Tenggara Timur' }
];

// Preset Motor Populer Indonesia
const MOTOR_PRESETS = [
  { name: 'Beat / Scoopy', capacity: 4.2, type: 'Matic' },
  { name: 'Vario 125 / 160', capacity: 5.5, type: 'Matic' },
  { name: 'NMAX / Aerox', capacity: 7.1, type: 'Matic' },
  { name: 'PCX 160', capacity: 8.1, type: 'Matic' },
  { name: 'CB150R / Vixion', capacity: 12.0, type: 'Sport' },
  { name: 'CBR / R15', capacity: 11.0, type: 'Sport' },
  { name: 'Supra X / Revo', capacity: 4.0, type: 'Bebek' }
];

export const FuelSettingsModal = ({ isOpen, onClose, fuelSettings }) => {
  const { updateFuelSettings, fetchFuelPrices } = useApp();

  const [activeSubtab, setActiveSubtab] = useState('motor'); // 'motor' | 'prices'
  const [motorName, setMotorName] = useState(fuelSettings?.motorName || 'Motor Saya');
  const [motorType, setMotorType] = useState(fuelSettings?.motorType || 'Matic');
  const [tankCapacity, setTankCapacity] = useState(String(fuelSettings?.tankCapacity || 4.2));
  const [currentTankLevel, setCurrentTankLevel] = useState(Number(fuelSettings?.currentTankLevel) || 50);
  const [currentOdometer, setCurrentOdometer] = useState(String(fuelSettings?.currentOdometer || 0));

  const [provinceSlug, setProvinceSlug] = useState(fuelSettings?.provinceSlug || 'jawa-timur');
  const [manualOverride, setManualOverride] = useState(false);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const [customPrices, setCustomPrices] = useState({
    pertalite: fuelSettings?.fuelPrices?.pertalite || 10000,
    pertamax_90: fuelSettings?.fuelPrices?.pertamax_90 || 15950,
    pertamax_green: fuelSettings?.fuelPrices?.pertamax_green || 19150,
    pertamax_turbo: fuelSettings?.fuelPrices?.pertamax_turbo || 19600
  });

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setTankCapacity(String(preset.capacity));
    setMotorType(preset.type);
    if (motorName === 'Motor Saya' || motorName === '') {
      setMotorName(preset.name.split('/')[0].trim());
    }
  };

  const handlePriceSync = async () => {
    setIsFetchingPrices(true);
    setSyncFeedback(null);
    try {
      const res = await fetchFuelPrices(provinceSlug);
      if (res.success) {
        setCustomPrices(res.prices);
        setSyncFeedback({ type: 'success', message: 'Harga BBM berhasil disinkronkan resmi Pertamina!' });
      } else {
        setSyncFeedback({ type: 'error', message: res.error || 'Gagal mengambil data harga BBM.' });
      }
    } catch {
      setSyncFeedback({ type: 'error', message: 'Koneksi gagal saat menghubungi API.' });
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const selProvince = INDONESIA_PROVINCES.find((p) => p.slug === provinceSlug);

    updateFuelSettings({
      motorName: motorName.trim() || 'Motor Saya',
      motorType,
      tankCapacity: Number(tankCapacity) || 4.2,
      currentTankLevel: Number(currentTankLevel),
      currentOdometer: Number(currentOdometer) || 0,
      provinceSlug,
      provinceName: selProvince?.name || 'Jawa Timur',
      fuelPrices: customPrices
    });

    onClose();
  };

  return (
    <div className="modal-backdrop-fuel" onClick={onClose}>
      <div
        className="modal-content-fuel sheet-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle-bar" />

        {/* Header Modal */}
        <div className="modal-header-fuel">
          <div className="header-title-flex">
            <div className="header-icon-fuel">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="modal-title-fuel">Pengaturan BBM & Kendaraan</h2>
              <p className="modal-subtitle-fuel">Atur tipe motor, kapasitas tangki, dan harga bensin</p>
            </div>
          </div>
          <button className="btn-close-fuel" onClick={onClose} aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>

        {/* Nav Tabs */}
        <div className="fuel-modal-nav">
          <button
            type="button"
            className={`fuel-modal-tab ${activeSubtab === 'motor' ? 'active' : ''}`}
            onClick={() => setActiveSubtab('motor')}
          >
            <Bike size={15} />
            <span>Profil & Tangki Motor</span>
          </button>
          <button
            type="button"
            className={`fuel-modal-tab ${activeSubtab === 'prices' ? 'active' : ''}`}
            onClick={() => setActiveSubtab('prices')}
          >
            <DollarSign size={15} />
            <span>Harga BBM</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="fuel-form-body">
          {/* TAB 1: PROFIL & TANGKI MOTOR */}
          {activeSubtab === 'motor' && (
            <div className="space-y-4">
              {/* Nama Motor */}
              <div className="form-group-fuel">
                <label className="form-label-fuel">Nama Kendaraan</label>
                <input
                  type="text"
                  className="input-text-fuel"
                  placeholder="Contoh: Honda Beat Deluxe / CB150R"
                  value={motorName}
                  onChange={(e) => setMotorName(e.target.value)}
                  required
                />
              </div>

              {/* Pemilih Tipe Motor Visual (Matic, Sport, Bebek) */}
              <div className="form-group-fuel">
                <label className="form-label-fuel">Tipe Motor (Mempengaruhi Visual & Posisi Tangki)</label>
                <div className="motor-type-selector-grid">
                  <button
                    type="button"
                    className={`motor-type-card-btn ${motorType === 'Matic' ? 'active' : ''}`}
                    onClick={() => setMotorType('Matic')}
                  >
                    <span className="motor-card-emoji">🛵</span>
                    <span className="motor-card-name">Skuter Matic</span>
                    <span className="motor-card-desc">Dek Rata</span>
                  </button>

                  <button
                    type="button"
                    className={`motor-type-card-btn ${motorType === 'Sport' ? 'active' : ''}`}
                    onClick={() => setMotorType('Sport')}
                  >
                    <span className="motor-card-emoji">🏍️</span>
                    <span className="motor-card-name">Motor Sport</span>
                    <span className="motor-card-tag-sport">Tangki Depan</span>
                  </button>

                  <button
                    type="button"
                    className={`motor-type-card-btn ${motorType === 'Bebek' ? 'active' : ''}`}
                    onClick={() => setMotorType('Bebek')}
                  >
                    <span className="motor-card-emoji">🚲</span>
                    <span className="motor-card-name">Motor Bebek</span>
                    <span className="motor-card-desc">Sayap Depan</span>
                  </button>
                </div>
              </div>

              {/* Kapasitas Tangki Full & Preset */}
              <div className="form-group-fuel">
                <div className="capacity-label-row">
                  <label className="form-label-fuel mb-0">
                    Kapasitas Full Tangki (Liter)
                  </label>
                  <span className="capacity-value-display">
                    {tankCapacity} Liter
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="40"
                  className="input-text-fuel text-base font-bold"
                  placeholder="Contoh: 4.2 atau 12.0"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(e.target.value)}
                  required
                />

                {/* Preset Motor Populer */}
                <div className="preset-section-wrap">
                  <span className="preset-label-heading">
                    <Sparkles size={11} className="text-sky-500" />
                    Pilih Cepat Sesuai Motor Kamu:
                  </span>
                  <div className="motor-preset-flex">
                    {MOTOR_PRESETS.map((mp) => {
                      const isMatch = Number(tankCapacity) === mp.capacity && motorType === mp.type;
                      return (
                        <button
                          key={mp.name}
                          type="button"
                          className={`preset-chip-btn ${isMatch ? 'active' : ''}`}
                          onClick={() => handleApplyPreset(mp)}
                        >
                          {mp.name} ({mp.capacity}L)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slider Level Tangki Saat Ini */}
              <div className="form-group-fuel pt-1">
                <div className="tank-level-slider-header">
                  <label className="form-label-fuel mb-0">Level Tangki Saat Ini</label>
                  <span className="tank-slider-level-text">
                    {currentTankLevel}% (~{((currentTankLevel / 100) * Number(tankCapacity)).toFixed(1)} L)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentTankLevel}
                  onChange={(e) => setCurrentTankLevel(Number(e.target.value))}
                  className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="slider-ticks-row">
                  <span>E (Kosong)</span>
                  <span>½ (Setengah)</span>
                  <span>F (Penuh)</span>
                </div>
              </div>

              {/* Odometer */}
              <div className="form-group-fuel">
                <label className="form-label-fuel">Odometer Terakhir (km)</label>
                <input
                  type="number"
                  min="0"
                  className="input-text-fuel"
                  placeholder="Contoh: 14640"
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: HARGA BBM & AUTO-SYNC */}
          {activeSubtab === 'prices' && (
            <div className="space-y-3.5">
              <div className="bg-sky-50/70 dark:bg-sky-950/30 p-3 rounded-xl border border-sky-100 dark:border-sky-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-200">
                    <Globe size={15} className="text-sky-500" />
                    <span>Sinkronisasi Otomatis Pertamina</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePriceSync}
                    disabled={isFetchingPrices}
                    className="btn-refresh-price"
                  >
                    <RefreshCw size={13} className={isFetchingPrices ? 'animate-spin' : ''} />
                    <span>{isFetchingPrices ? 'Sinkron...' : 'Perbarui'}</span>
                  </button>
                </div>

                <div className="form-group-fuel mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Provinsi Wilayah SPBU
                  </label>
                  <select
                    className="select-fuel-account text-xs py-1.5"
                    value={provinceSlug}
                    onChange={(e) => setProvinceSlug(e.target.value)}
                  >
                    {INDONESIA_PROVINCES.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {syncFeedback && (
                  <div
                    className={`mt-2 text-xs p-2 rounded-lg flex items-center gap-1.5 ${
                      syncFeedback.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {syncFeedback.type === 'success' ? <Check size={14} /> : <Info size={14} />}
                    <span>{syncFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Price list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="form-label-fuel mb-0">Harga Per Liter Aktif (Rp)</label>
                  <button
                    type="button"
                    onClick={() => setManualOverride(!manualOverride)}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Sliders size={12} />
                    <span>{manualOverride ? 'Kunci Otomatis' : 'Edit Manual'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="price-input-box">
                    <span className="price-tag-name text-emerald-600">Pertalite (RON 90)</span>
                    <input
                      type="number"
                      disabled={!manualOverride}
                      value={customPrices.pertalite}
                      onChange={(e) =>
                        setCustomPrices({ ...customPrices, pertalite: Number(e.target.value) })
                      }
                      className="price-input-val"
                    />
                  </div>

                  <div className="price-input-box">
                    <span className="price-tag-name text-sky-600">Pertamax (RON 92)</span>
                    <input
                      type="number"
                      disabled={!manualOverride}
                      value={customPrices.pertamax_90}
                      onChange={(e) =>
                        setCustomPrices({ ...customPrices, pertamax_90: Number(e.target.value) })
                      }
                      className="price-input-val"
                    />
                  </div>

                  <div className="price-input-box">
                    <span className="price-tag-name text-teal-600">Green 95 (RON 95)</span>
                    <input
                      type="number"
                      disabled={!manualOverride}
                      value={customPrices.pertamax_green}
                      onChange={(e) =>
                        setCustomPrices({ ...customPrices, pertamax_green: Number(e.target.value) })
                      }
                      className="price-input-val"
                    />
                  </div>

                  <div className="price-input-box">
                    <span className="price-tag-name text-rose-600">Turbo (RON 98)</span>
                    <input
                      type="number"
                      disabled={!manualOverride}
                      value={customPrices.pertamax_turbo}
                      onChange={(e) =>
                        setCustomPrices({ ...customPrices, pertamax_turbo: Number(e.target.value) })
                      }
                      className="price-input-val"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="fuel-form-actions pt-2">
            <button type="button" className="btn-cancel-fuel" onClick={onClose}>
              Tutup
            </button>
            <button type="submit" className="btn-submit-fuel">
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelSettingsModal;
