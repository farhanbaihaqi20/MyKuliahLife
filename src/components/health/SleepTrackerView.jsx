import React, { useState, useMemo } from 'react';
import { ArrowLeft, Moon, Sun, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const QUALITY_OPTIONS = [
  { id: 'kurang', label: 'Kurang', emoji: '🥱', desc: '< 6 jam / sering terbangun' },
  { id: 'cukup', label: 'Cukup', emoji: '😊', desc: '6 - 7 jam cukup segar' },
  { id: 'nyenyak', label: 'Nyenyak', emoji: '🌟', desc: '7 - 9 jam sangat pulas' }
];

export const SleepTrackerView = ({ onBack }) => {
  const {
    sleepLogs = [],
    todaySleepLog,
    addSleepLog,
    deleteSleepLog
  } = useApp();

  const [sleepTime, setSleepTime] = useState(todaySleepLog?.sleepTime || '23:30');
  const [wakeTime, setWakeTime] = useState(todaySleepLog?.wakeTime || '06:30');
  const [quality, setQuality] = useState(todaySleepLog?.quality || 'cukup');
  const [notes, setNotes] = useState(todaySleepLog?.notes || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Calculate live preview of duration
  const durationPreview = useMemo(() => {
    try {
      const [sh, sm] = (sleepTime || '23:00').split(':').map(Number);
      const [wh, wm] = (wakeTime || '07:00').split(':').map(Number);
      let sMinutes = sh * 60 + sm;
      let wMinutes = wh * 60 + wm;
      if (wMinutes < sMinutes) {
        wMinutes += 24 * 60;
      }
      const diff = wMinutes - sMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return { hours, mins, totalHours: Math.round((diff / 60) * 10) / 10 };
    } catch {
      return { hours: 7, mins: 0, totalHours: 7 };
    }
  }, [sleepTime, wakeTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addSleepLog({
      sleepTime,
      wakeTime,
      quality,
      notes
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
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
          <h2 className="wellness-subview-title">Pola Tidur</h2>
          <span className="wellness-subview-sub">Catat jam tidur & evaluasi istirahat</span>
        </div>
      </div>

      {/* Input Card */}
      <div className="wellness-hero-card sleep-hero">
        <form onSubmit={handleSubmit} className="sleep-form">
          <div className="sleep-time-inputs">
            {/* Sleep Time */}
            <div className="sleep-time-col">
              <label className="sleep-time-label">
                <Moon size={14} className="sleep-label-icon moon" />
                <span>Mulai Tidur</span>
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="sleep-time-input"
                required
              />
            </div>

            <div className="sleep-time-arrow">→</div>

            {/* Wake Time */}
            <div className="sleep-time-col">
              <label className="sleep-time-label">
                <Sun size={14} className="sleep-label-icon sun" />
                <span>Bangun</span>
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="sleep-time-input"
                required
              />
            </div>
          </div>

          {/* Duration Summary */}
          <div className="sleep-duration-pill">
            <Clock size={14} />
            <span>
              Durasi tidur: <strong>{durationPreview.hours} jam {durationPreview.mins > 0 ? `${durationPreview.mins} menit` : ''}</strong>
            </span>
          </div>

          {/* Quality Options */}
          <div className="sleep-quality-section">
            <span className="sleep-quality-title">Kualitas Istirahat</span>
            <div className="sleep-quality-grid">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`sleep-quality-chip ${quality === opt.id ? 'active' : ''}`}
                  onClick={() => setQuality(opt.id)}
                >
                  <span className="sleep-quality-emoji">{opt.emoji}</span>
                  <span className="sleep-quality-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="sleep-notes-group">
            <input
              type="text"
              placeholder="Catatan (opsional, misal: abis begadang nugas)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="wellness-note-input"
              maxLength={60}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="sleep-submit-btn"
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 size={16} />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Catatan Tidur</span>
            )}
          </button>
        </form>
      </div>

      {/* Sleep History */}
      <div className="wellness-section">
        <h3 className="wellness-section-title">Riwayat Tidur ({sleepLogs.length})</h3>
        {sleepLogs.length === 0 ? (
          <div className="wellness-empty-card">
            <span>Belum ada riwayat tidur tercatat. Catat jam tidur pertamamu di atas!</span>
          </div>
        ) : (
          <div className="wellness-log-list">
            {sleepLogs.slice(0, 10).map((log) => {
              const qOpt = QUALITY_OPTIONS.find(q => q.id === log.quality);
              return (
                <div key={log.id} className="wellness-log-item">
                  <div className="wellness-log-left">
                    <span className="wellness-log-icon">{qOpt?.emoji || '💤'}</span>
                    <div className="wellness-log-info">
                      <div className="sleep-log-title-row">
                        <span className="wellness-log-main">{log.durationHours} Jam</span>
                        <span className="sleep-log-quality-badge">{qOpt?.label || log.quality}</span>
                      </div>
                      <span className="wellness-log-sub">
                        {formatDateShort(log.date)} · {log.sleepTime} - {log.wakeTime}
                        {log.notes ? ` · ${log.notes}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="wellness-log-del-btn"
                    onClick={() => deleteSleepLog(log.id)}
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

export default SleepTrackerView;
