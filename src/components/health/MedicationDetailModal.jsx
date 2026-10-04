import React, { useMemo } from 'react';
import { X, Pencil, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FORM_EMOJI = {
  tablet: '💊',
  kapsul: '💊',
  sirup: '🧴',
  salep: '🩹',
  injeksi: '💉',
  lainnya: '🩺'
};

export const MedicationDetailModal = ({ med, onClose, onEdit }) => {
  const { deleteMedication } = useApp();

  const stats = useMemo(() => {
    if (!med) return { taken: 0, skipped: 0, adherence: 0 };
    const logs = Array.isArray(med.doseLogs) ? med.doseLogs : [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const recent = logs.filter(l => l.date >= cutoffStr);
    const taken = recent.filter(l => l.status === 'taken').length;
    const skipped = recent.filter(l => l.status === 'skipped').length;
    const total = taken + skipped;
    return {
      taken,
      skipped,
      adherence: total > 0 ? Math.round((taken / total) * 100) : 0
    };
  }, [med]);

  if (!med) return null;

  const recentLogs = (Array.isArray(med.doseLogs) ? med.doseLogs : [])
    .slice()
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    .slice(0, 14);

  const handleDelete = () => {
    if (window.confirm(`Hapus obat "${med.name}" beserta riwayatnya?`)) {
      deleteMedication(med.id);
      onClose();
    }
  };

  return (
    <div className="health-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="health-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="health-modal-header">
          <div className="health-detail-title-wrap">
            <span className="health-detail-emoji">{FORM_EMOJI[med.form] || '💊'}</span>
            <div>
              <h3 className="health-modal-title">{med.name}</h3>
              <span className="health-modal-sub">
                {med.dosage ? `${med.dosage} · ` : ''}{med.form}
                {med.instructions ? ` · ${med.instructions}` : ''}
              </span>
            </div>
          </div>
          <button type="button" className="health-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="health-detail-body">
          {/* Jadwal */}
          <div className="health-detail-section">
            <span className="health-detail-label">Jadwal Minum</span>
            <div className="health-time-chips">
              {(med.scheduleTimes || []).map(t => (
                <span key={t} className="health-time-chip">{t}</span>
              ))}
            </div>
            <span className="health-detail-meta">
              Mulai {med.startDate ? new Date(med.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              {med.endDate ? ` · Selesai ${new Date(med.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ' · Rutin berkelanjutan'}
              {med.stockRemaining !== null && med.stockRemaining !== undefined ? ` · Stok ${med.stockRemaining}` : ''}
            </span>
          </div>

          {/* Statistik 30 hari */}
          <div className="health-detail-stats">
            <div className="health-detail-stat-box">
              <span className="health-detail-stat-num">{stats.adherence}%</span>
              <span className="health-detail-stat-cap">Kepatuhan 30 hari</span>
            </div>
            <div className="health-detail-stat-box">
              <span className="health-detail-stat-num is-green">{stats.taken}</span>
              <span className="health-detail-stat-cap">Diminum</span>
            </div>
            <div className="health-detail-stat-box">
              <span className="health-detail-stat-num is-amber">{stats.skipped}</span>
              <span className="health-detail-stat-cap">Dilewati</span>
            </div>
          </div>

          {/* Riwayat terakhir */}
          {recentLogs.length > 0 && (
            <div className="health-detail-section">
              <span className="health-detail-label">Riwayat Terakhir</span>
              <div className="health-log-list">
                {recentLogs.map((log, idx) => (
                  <div key={`${log.date}-${log.time}-${idx}`} className="health-log-row">
                    {log.status === 'taken'
                      ? <CheckCircle2 size={13} className="health-log-icon taken" />
                      : log.status === 'skipped'
                        ? <XCircle size={13} className="health-log-icon skipped" />
                        : <Clock size={13} className="health-log-icon" />
                    }
                    <span className="health-log-date">
                      {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="health-log-time">{log.time}</span>
                    <span className={`health-log-status ${log.status}`}>
                      {log.status === 'taken' ? 'Diminum' : 'Dilewati'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="health-modal-actions">
            <button type="button" className="health-btn-danger" onClick={handleDelete}>
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
            <button type="button" className="health-btn-submit" onClick={() => onEdit?.(med)}>
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationDetailModal;
