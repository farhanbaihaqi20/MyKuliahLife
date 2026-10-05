import React, { useState, useMemo } from 'react';
import { ArrowLeft, Scale, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const BMI_CATEGORIES = {
  underweight: { label: 'Berat Kurang', color: '#3B82F6', badgeClass: 'bmi-underweight', min: 0, max: 18.4 },
  normal: { label: 'Ideal (Normal)', color: '#10B981', badgeClass: 'bmi-normal', min: 18.5, max: 24.9 },
  overweight: { label: 'Berat Berlebih', color: '#F59E0B', badgeClass: 'bmi-overweight', min: 25.0, max: 29.9 },
  obesity: { label: 'Obesitas', color: '#EF4444', badgeClass: 'bmi-obesity', min: 30.0, max: 100 }
};

export const BmiCalculatorView = ({ onBack }) => {
  const {
    bmiLogs = [],
    latestBmi,
    addBmiLog,
    deleteBmiLog
  } = useApp();

  const [height, setHeight] = useState(latestBmi?.height || '');
  const [weight, setWeight] = useState(latestBmi?.weight || '');
  const [notes, setNotes] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Live calculation
  const calculation = useMemo(() => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;

    const heightM = h / 100;
    const bmiVal = Math.round((w / (heightM * heightM)) * 10) / 10;

    let catKey = 'normal';
    if (bmiVal < 18.5) catKey = 'underweight';
    else if (bmiVal < 25) catKey = 'normal';
    else if (bmiVal < 30) catKey = 'overweight';
    else catKey = 'obesity';

    // Ideal weight range based on normal BMI 18.5 - 24.9
    const minIdeal = Math.round(18.5 * heightM * heightM * 10) / 10;
    const maxIdeal = Math.round(24.9 * heightM * heightM * 10) / 10;

    // Position on a 15 - 35 scale for gauge
    const gaugePct = Math.max(0, Math.min(100, Math.round(((bmiVal - 15) / (35 - 15)) * 100)));

    return {
      bmi: bmiVal,
      category: BMI_CATEGORIES[catKey],
      minIdeal,
      maxIdeal,
      gaugePct
    };
  }, [height, weight]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!height || !weight) return;
    addBmiLog({
      height,
      weight,
      notes
    });
    setNotes('');
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="wellness-subview animate-fade-in">
      {/* Header */}
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
          <h2 className="wellness-subview-title">Kalkulator BMI</h2>
          <span className="wellness-subview-sub">Indeks massa tubuh & berat badan ideal</span>
        </div>
      </div>

      {/* Input Card */}
      <div className="wellness-hero-card bmi-hero">
        <form onSubmit={handleSave} className="bmi-form">
          <div className="bmi-inputs-row">
            <div className="bmi-input-col">
              <label className="bmi-input-label">Tinggi Badan</label>
              <div className="bmi-input-wrapper">
                <input
                  type="number"
                  min="50"
                  max="250"
                  step="0.5"
                  placeholder="170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bmi-text-input"
                  required
                />
                <span className="bmi-input-unit">cm</span>
              </div>
            </div>

            <div className="bmi-input-col">
              <label className="bmi-input-label">Berat Badan</label>
              <div className="bmi-input-wrapper">
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="0.5"
                  placeholder="60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bmi-text-input"
                  required
                />
                <span className="bmi-input-unit">kg</span>
              </div>
            </div>
          </div>

          {/* Result Preview */}
          {calculation ? (
            <div className="bmi-result-card animate-fade-in">
              <div className="bmi-result-top">
                <div className="bmi-result-score-block">
                  <span className="bmi-result-label">Skor BMI</span>
                  <span className="bmi-result-score">{calculation.bmi}</span>
                </div>
                <div className="bmi-result-status-block">
                  <span className={`bmi-status-badge ${calculation.category.badgeClass}`}>
                    {calculation.category.label}
                  </span>
                  <span className="bmi-ideal-range-hint">
                    Ideal: {calculation.minIdeal} - {calculation.maxIdeal} kg
                  </span>
                </div>
              </div>

              {/* Minimal Bar Gauge */}
              <div className="bmi-gauge-track">
                <div className="bmi-gauge-zone under" title="Kurang (< 18.5)" />
                <div className="bmi-gauge-zone normal" title="Ideal (18.5 - 24.9)" />
                <div className="bmi-gauge-zone over" title="Berlebih (25 - 29.9)" />
                <div className="bmi-gauge-zone obese" title="Obesitas (>= 30)" />
                <div
                  className="bmi-gauge-marker"
                  style={{ left: `${calculation.gaugePct}%` }}
                />
              </div>

              {/* Optional note */}
              <div className="bmi-note-row">
                <input
                  type="text"
                  placeholder="Catatan (opsional, misal: target diet)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="wellness-note-input"
                  maxLength={50}
                />
              </div>

              <button
                type="submit"
                className="bmi-save-btn"
              >
                {isSavedRecently ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Tersimpan di Riwayat!</span>
                  </>
                ) : (
                  <>
                    <Scale size={15} />
                    <span>Simpan ke Riwayat</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bmi-placeholder-box">
              <span>Masukkan tinggi & berat badan untuk melihat hasil kalkulasi BMI</span>
            </div>
          )}
        </form>
      </div>

      {/* History */}
      <div className="wellness-section">
        <h3 className="wellness-section-title">Riwayat Pengukuran ({bmiLogs.length})</h3>
        {bmiLogs.length === 0 ? (
          <div className="wellness-empty-card">
            <span>Belum ada pengukuran tersimpan. Hitung dan simpan BMI pertamamu!</span>
          </div>
        ) : (
          <div className="wellness-log-list">
            {bmiLogs.slice(0, 10).map((log) => {
              const cat = BMI_CATEGORIES[log.category] || BMI_CATEGORIES.normal;
              return (
                <div key={log.id} className="wellness-log-item">
                  <div className="wellness-log-left">
                    <span className="wellness-log-icon">⚖️</span>
                    <div className="wellness-log-info">
                      <div className="bmi-log-title-row">
                        <span className="wellness-log-main">{log.bmi} BMI</span>
                        <span className={`bmi-status-badge ${cat.badgeClass}`}>{cat.label}</span>
                      </div>
                      <span className="wellness-log-sub">
                        {formatDateShort(log.date)} · {log.weight} kg · {log.height} cm
                        {log.notes ? ` · ${log.notes}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="wellness-log-del-btn"
                    onClick={() => deleteBmiLog(log.id)}
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BmiCalculatorView;
