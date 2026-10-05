import React, { useState } from 'react';
import { ArrowLeft, Smile, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Sangat Buruk', sub: 'Burnout / Sedih' },
  { value: 2, emoji: '😕', label: 'Kurang Baik', sub: 'Lelah / Gelisah' },
  { value: 3, emoji: '😐', label: 'Biasa Aja', sub: 'Cukup netral' },
  { value: 4, emoji: '😊', label: 'Baik', sub: 'Semangat & segar' },
  { value: 5, emoji: '🤩', label: 'Sangat Baik', sub: 'Luar biasa senang' }
];

export const MoodCheckinView = ({ onBack }) => {
  const {
    moodLogs = [],
    todayMood,
    setTodayMood,
    deleteMoodLog
  } = useApp();

  const [selectedMood, setSelectedMood] = useState(todayMood?.mood || 4);
  const [notes, setNotes] = useState(todayMood?.notes || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTodayMood({
      mood: selectedMood,
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
          <h2 className="wellness-subview-title">Mood Harian</h2>
          <span className="wellness-subview-sub">Refleksi kondisi mental & emosional</span>
        </div>
      </div>

      {/* Mood Selector Card */}
      <div className="wellness-hero-card mood-hero">
        <form onSubmit={handleSubmit} className="mood-form">
          <span className="mood-form-title">Bagaimana perasaanmu hari ini?</span>

          <div className="mood-selector-grid">
            {MOOD_OPTIONS.map((opt) => {
              const isSelected = selectedMood === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`mood-option-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedMood(opt.value)}
                >
                  <span className="mood-emoji">{opt.emoji}</span>
                  <span className="mood-label">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mood-notes-group">
            <input
              type="text"
              placeholder="Ceritakan sedikit tentang harimu (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="wellness-note-input"
              maxLength={70}
            />
          </div>

          <button
            type="submit"
            className="mood-submit-btn"
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 size={16} />
                <span>Tersimpan untuk Hari Ini!</span>
              </>
            ) : (
              <>
                <Smile size={15} />
                <span>{todayMood ? 'Perbarui Mood Hari Ini' : 'Simpan Mood Hari Ini'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="wellness-section">
        <h3 className="wellness-section-title">Riwayat Mood ({moodLogs.length})</h3>
        {moodLogs.length === 0 ? (
          <div className="wellness-empty-card">
            <span>Belum ada catatan mood. Mulai catat bagaimana harimu berjalan!</span>
          </div>
        ) : (
          <div className="wellness-log-list">
            {moodLogs.slice(0, 14).map((log) => {
              const opt = MOOD_OPTIONS.find(m => m.value === Number(log.mood)) || MOOD_OPTIONS[2];
              return (
                <div key={log.id} className="wellness-log-item">
                  <div className="wellness-log-left">
                    <span className="wellness-log-icon">{opt.emoji}</span>
                    <div className="wellness-log-info">
                      <div className="mood-log-title-row">
                        <span className="wellness-log-main">{opt.label}</span>
                      </div>
                      <span className="wellness-log-sub">
                        {formatDateShort(log.date)}
                        {log.notes ? ` · "${log.notes}"` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="wellness-log-del-btn"
                    onClick={() => deleteMoodLog(log.id)}
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

export default MoodCheckinView;
