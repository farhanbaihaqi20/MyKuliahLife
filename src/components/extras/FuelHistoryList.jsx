import React from 'react';
import { Fuel, Calendar, MapPin, Gauge, Trash2, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FuelHistoryList = ({ fuelLogs = [] }) => {
  const { deleteFuelLog } = useApp();

  const getFuelBadge = (type) => {
    switch (type) {
      case 'pertamax_turbo':
        return { name: 'Turbo (RON 98)', bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626' };
      case 'pertamax_green':
        return { name: 'Green (RON 95)', bg: 'rgba(5, 150, 105, 0.12)', color: '#059669' };
      case 'pertamax_90':
        return { name: 'Pertamax (RON 92)', bg: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' };
      case 'pertalite':
      default:
        return { name: 'Pertalite (RON 90)', bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const totalSpent = fuelLogs.reduce((sum, log) => sum + (Number(log.amount) || 0), 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + (Number(log.liters) || 0), 0);

  if (fuelLogs.length === 0) {
    return (
      <div className="fuel-history-empty">
        <div className="empty-icon-fuel">
          <Fuel size={36} />
        </div>
        <h4>Belum Ada Catatan Bensin</h4>
        <p>Mulai catat saat pertama kali isi bensin untuk melihat riwayat dan efisiensi motor.</p>
      </div>
    );
  }

  return (
    <div className="fuel-history-section">
      {/* Summary Header */}
      <div className="fuel-history-summary">
        <div>
          <span className="summary-label">Total Pengeluaran Bensin</span>
          <h4 className="summary-val">Rp {totalSpent.toLocaleString('id-ID')}</h4>
        </div>
        <div className="text-right">
          <span className="summary-label">Total Konsumsi</span>
          <h4 className="summary-val text-sky-600">{totalLiters.toFixed(2)} Liter</h4>
        </div>
      </div>

      {/* History Items */}
      <div className="fuel-history-list">
        {fuelLogs.map((log) => {
          const badge = getFuelBadge(log.fuelType);
          return (
            <div key={log.id} className="fuel-history-item">
              <div className="fuel-item-top">
                <div className="fuel-item-main">
                  <span
                    className="fuel-type-tag"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.name}
                  </span>
                  <span className="fuel-date">
                    <Calendar size={12} className="inline mr-1 opacity-70" />
                    {formatDate(log.date)}
                  </span>
                </div>
                <div className="fuel-item-amount">
                  <span className="fuel-rp">Rp {Number(log.amount).toLocaleString('id-ID')}</span>
                  <span className="fuel-liters-badge">+{Number(log.liters).toFixed(2)} L</span>
                </div>
              </div>

              <div className="fuel-item-meta">
                {log.station && (
                  <span className="meta-station">
                    <MapPin size={12} className="inline mr-0.5 text-slate-400" />
                    {log.station}
                  </span>
                )}
                {log.odometer && (
                  <span className="meta-odo">
                    <Gauge size={12} className="inline mr-0.5 text-slate-400" />
                    {Number(log.odometer).toLocaleString('id-ID')} km
                  </span>
                )}
                <span className="meta-price">
                  @ Rp {Number(log.pricePerLiter).toLocaleString('id-ID')}/L
                </span>
              </div>

              {log.note && (
                <div className="fuel-item-note">
                  <Tag size={11} className="inline mr-1 text-slate-400" />
                  {log.note}
                </div>
              )}

              <button
                className="btn-delete-fuel-item"
                onClick={() => {
                  if (window.confirm('Hapus riwayat pengisian ini? Transaksi di jurnal keuangan tidak akan terhapus otomatis.')) {
                    deleteFuelLog(log.id);
                  }
                }}
                title="Hapus riwayat"
                aria-label="Hapus riwayat bensin"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FuelHistoryList;
