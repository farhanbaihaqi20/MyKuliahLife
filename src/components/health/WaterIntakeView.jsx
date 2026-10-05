import React, { useState } from 'react';
import { ArrowLeft, Droplets, Plus, Trash2, Settings2, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WaterIntakeView = ({ onBack }) => {
  const {
    waterIntakeLogs = [],
    waterIntakeTarget = 2000,
    todayWaterIntake = 0,
    addWaterIntake,
    deleteWaterIntake,
    updateWaterTarget
  } = useApp();

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [customTarget, setCustomTarget] = useState(waterIntakeTarget);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = waterIntakeLogs.filter(log => log.date === todayStr);

  const percentage = Math.min(100, Math.round((todayWaterIntake / (waterIntakeTarget || 2000)) * 100));

  const handleQuickAdd = (amount) => {
    addWaterIntake(amount);
  };

  const handleCustomAdd = (e) => {
    e.preventDefault();
    const amount = Number(customAmount);
    if (amount > 0) {
      addWaterIntake(amount);
      setCustomAmount('');
      setShowCustomModal(false);
    }
  };

  const handleSaveTarget = () => {
    const target = Number(customTarget);
    if (target >= 500 && target <= 6000) {
      updateWaterTarget(target);
      setIsEditingTarget(false);
    }
  };

  return (
    <div className="wellness-subview animate-fade-in">
      {/* Subview Header */}
      <div className="wellness-subview-header">
        <button
          type="button"
          className="health-icon-btn"
          onClick={onBack}
          aria-label="Kembali ke Wellness"
          title="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="wellness-subview-title-group">
          <h2 className="wellness-subview-title">Minum Air</h2>
          <span className="wellness-subview-sub">Target & asupan hidrasi harian</span>
        </div>
      </div>

      {/* Hero Card: Water Intake Progress */}
      <div className="wellness-hero-card water-hero">
        <div className="water-hero-header">
          <div className="water-hero-label">
            <Droplets size={14} className="water-drop-icon" />
            <span>Target Harian</span>
          </div>
          {!isEditingTarget ? (
            <button
              type="button"
              className="wellness-target-edit-btn"
              onClick={() => {
                setCustomTarget(waterIntakeTarget);
                setIsEditingTarget(true);
              }}
              title="Ubah Target"
            >
              <Settings2 size={13} />
              <span>{waterIntakeTarget} ml</span>
            </button>
          ) : (
            <div className="wellness-target-edit-form">
              <input
                type="number"
                min="500"
                max="6000"
                step="100"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="wellness-target-input"
                autoFocus
              />
              <button
                type="button"
                className="wellness-target-save-btn"
                onClick={handleSaveTarget}
                title="Simpan"
              >
                <Check size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="water-hero-stats">
          <div className="water-hero-main-num">
            <span className="water-num-current">{todayWaterIntake}</span>
            <span className="water-num-divider">/</span>
            <span className="water-num-target">{waterIntakeTarget}</span>
            <span className="water-num-unit">ml</span>
          </div>
          <span className="water-hero-pct-badge">{percentage}% tercapai</span>
        </div>

        {/* Progress Bar */}
        <div className="water-progress-track">
          <div
            className="water-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="wellness-section">
        <h3 className="wellness-section-title">Catat Cepat</h3>
        <div className="water-quick-grid">
          <button
            type="button"
            className="water-quick-btn"
            onClick={() => handleQuickAdd(200)}
          >
            <span className="water-quick-icon">🥛</span>
            <div className="water-quick-info">
              <span className="water-quick-amount">+200 ml</span>
              <span className="water-quick-label">Gelas Kecil</span>
            </div>
          </button>

          <button
            type="button"
            className="water-quick-btn"
            onClick={() => handleQuickAdd(330)}
          >
            <span className="water-quick-icon">🥤</span>
            <div className="water-quick-info">
              <span className="water-quick-amount">+330 ml</span>
              <span className="water-quick-label">Gelas Sedang</span>
            </div>
          </button>

          <button
            type="button"
            className="water-quick-btn"
            onClick={() => handleQuickAdd(600)}
          >
            <span className="water-quick-icon">🍶</span>
            <div className="water-quick-info">
              <span className="water-quick-amount">+600 ml</span>
              <span className="water-quick-label">Botol Tumblr</span>
            </div>
          </button>

          <button
            type="button"
            className="water-quick-btn custom-btn"
            onClick={() => setShowCustomModal(true)}
          >
            <span className="water-quick-icon">➕</span>
            <div className="water-quick-info">
              <span className="water-quick-amount">Kustom</span>
              <span className="water-quick-label">Input ml</span>
            </div>
          </button>
        </div>
      </div>

      {/* Custom Amount Modal */}
      {showCustomModal && (
        <div className="health-modal-backdrop animate-fade-in" onClick={() => setShowCustomModal(false)}>
          <div className="health-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="health-modal-header">
              <div>
                <h3 className="health-modal-title">Tambah Air Minum</h3>
                <span className="health-modal-sub">Masukkan jumlah dalam mililiter</span>
              </div>
            </div>

            <form onSubmit={handleCustomAdd} className="health-modal-form">
              <div className="health-form-group">
                <label className="health-form-label">Jumlah (ml)</label>
                <input
                  type="number"
                  min="50"
                  max="3000"
                  step="50"
                  placeholder="Contoh: 250"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="health-form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="health-modal-actions">
                <button
                  type="button"
                  className="health-btn-secondary"
                  onClick={() => setShowCustomModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="health-btn-primary"
                  disabled={!customAmount || Number(customAmount) <= 0}
                >
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today's Log List */}
      <div className="wellness-section">
        <h3 className="wellness-section-title">Riwayat Hari Ini ({todayLogs.length})</h3>
        {todayLogs.length === 0 ? (
          <div className="wellness-empty-card">
            <span>Belum ada catatan minum air hari ini. Tap tombol di atas untuk mencatat!</span>
          </div>
        ) : (
          <div className="wellness-log-list">
            {todayLogs.map((log) => (
              <div key={log.id} className="wellness-log-item">
                <div className="wellness-log-left">
                  <span className="wellness-log-icon">💧</span>
                  <div className="wellness-log-info">
                    <span className="wellness-log-main">{log.amount} ml</span>
                    <span className="wellness-log-sub">Pukul {log.time}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="wellness-log-del-btn"
                  onClick={() => deleteWaterIntake(log.id)}
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterIntakeView;
