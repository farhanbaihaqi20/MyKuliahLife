import React from 'react';
import { Fuel, Calendar, MapPin, Gauge, Trash2, Tag, Pencil, Wallet, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FuelHistoryList = ({ fuelLogs = [], onEditLog }) => {
  const { deleteFuelLog, data, findLinkedTransaction } = useApp();

  const getFuelConfig = (type) => {
    switch (type) {
      case 'pertamax_turbo':
        return {
          name: 'Turbo',
          ron: 'RON 98',
          color: '#DC2626',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.2)'
        };
      case 'pertamax_green':
        return {
          name: 'Green 95',
          ron: 'RON 95',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.1)',
          border: 'rgba(13, 148, 136, 0.2)'
        };
      case 'pertamax_90':
        return {
          name: 'Pertamax',
          ron: 'RON 92',
          color: '#0284C7',
          bg: 'rgba(2, 132, 199, 0.1)',
          border: 'rgba(2, 132, 199, 0.2)'
        };
      case 'pertalite':
      default:
        return {
          name: 'Pertalite',
          ron: 'RON 90',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.2)'
        };
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

  const handleDelete = (log) => {
    const linkedTx = findLinkedTransaction(data.transactions, log);
    const dateFormatted = formatDate(log.date);

    if (!window.confirm(`Hapus catatan bensin tanggal ${dateFormatted} sebesar Rp ${Number(log.amount).toLocaleString('id-ID')}?`)) {
      return;
    }

    if (linkedTx) {
      const deleteTx = window.confirm(
        `Catatan ini terhubung dengan transaksi pengeluaran di rekening ${linkedTx.accountName}.\n\nApakah Anda juga ingin menghapus transaksi keuangan tersebut dan mengembalikan saldo dompet Anda?`
      );
      deleteFuelLog(log.id, deleteTx);
    } else {
      deleteFuelLog(log.id, false);
    }
  };

  if (fuelLogs.length === 0) {
    return (
      <div className="fuel-history-empty">
        <div className="empty-icon-fuel">
          <Fuel size={32} />
        </div>
        <h4>Belum Ada Catatan Bensin</h4>
        <p>Mulai catat saat pertama kali isi bensin untuk melihat riwayat dan efisiensi motor.</p>
      </div>
    );
  }

  return (
    <div className="fuel-history-section">
      {/* Minimalist Summary Strip */}
      <div className="fuel-summary-minimal">
        <div className="fuel-summary-col">
          <span className="fuel-summary-label">Total Pengeluaran</span>
          <span className="fuel-summary-val-main">Rp {totalSpent.toLocaleString('id-ID')}</span>
        </div>
        <div className="fuel-summary-divider" />
        <div className="fuel-summary-col">
          <span className="fuel-summary-label">Total Konsumsi</span>
          <span className="fuel-summary-val-sub">{totalLiters.toFixed(2)} Liter</span>
        </div>
      </div>

      {/* History Cards */}
      <div className="fuel-history-list">
        {fuelLogs.map((log) => {
          const config = getFuelConfig(log.fuelType);
          const linkedTx = findLinkedTransaction(data?.transactions, log);
          const accountUsed = log.accountName || linkedTx?.accountName;

          return (
            <div key={log.id} className="fuel-minimal-card">
              {/* Row 1: Brand & Volume / Price */}
              <div className="fuel-card-top-row">
                <div className="fuel-card-brand-group">
                  <div
                    className="fuel-brand-icon-box"
                    style={{ backgroundColor: config.bg, color: config.color }}
                  >
                    <Fuel size={17} strokeWidth={2.4} />
                  </div>
                  <div className="fuel-brand-meta">
                    <div className="fuel-brand-title-wrap">
                      <span className="fuel-brand-title">{config.name}</span>
                      <span
                        className="fuel-ron-chip"
                        style={{ color: config.color, backgroundColor: config.bg }}
                      >
                        {config.ron}
                      </span>
                    </div>
                    <span className="fuel-brand-subtitle">
                      {formatDate(log.date)}
                      {log.station ? ` • ${log.station}` : ''}
                    </span>
                  </div>
                </div>

                <div className="fuel-card-price-group">
                  <div className="fuel-card-price">
                    <small>Rp</small> {Number(log.amount).toLocaleString('id-ID')}
                  </div>
                  <div className="fuel-card-volume">
                    +{Number(log.liters).toFixed(2)} L
                    {log.pricePerLiter ? (
                      <span className="fuel-card-rate">
                        {' '}@ {Number(log.pricePerLiter / 1000).toFixed(log.pricePerLiter % 1000 === 0 ? 0 : 1)}rb
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Row 2: Note (if any) */}
              {log.note && (
                <div className="fuel-card-note-box">
                  <Tag size={10} className="fuel-note-icon shrink-0" />
                  <span className="fuel-note-text">{log.note}</span>
                </div>
              )}

              {/* Row 3: Metadata Tags & Ghost Actions */}
              <div className="fuel-card-bottom-row">
                <div className="fuel-card-pills-row">
                  {accountUsed && (
                    <span className="fuel-meta-pill" title={`Dibayar pakai ${accountUsed}`}>
                      <Wallet size={11} className="shrink-0" />
                      <span className="pill-text-truncate">{accountUsed}</span>
                    </span>
                  )}
                  {log.odometer !== null && log.odometer !== undefined && (
                    <span className="fuel-meta-pill">
                      <Gauge size={11} className="shrink-0" />
                      <span>{Number(log.odometer).toLocaleString('id-ID')} km</span>
                    </span>
                  )}
                  {linkedTx && (
                    <span className="fuel-meta-pill pill-synced" title="Tersinkron dengan transaksi keuangan">
                      <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
                      <span>Tersinkron</span>
                    </span>
                  )}
                </div>

                <div className="fuel-card-ghost-actions">
                  <button
                    type="button"
                    className="btn-ghost-fuel edit"
                    onClick={() => onEditLog && onEditLog(log)}
                    title="Edit riwayat"
                    aria-label="Edit riwayat bensin"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-fuel delete"
                    onClick={() => handleDelete(log)}
                    title="Hapus riwayat"
                    aria-label="Hapus riwayat bensin"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FuelHistoryList;
