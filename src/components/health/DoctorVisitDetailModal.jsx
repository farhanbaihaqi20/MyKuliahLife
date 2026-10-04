import React from 'react';
import { X, Pencil, Trash2, CalendarClock, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { maskMoney } from '../../utils/formatters';

const formatDateLong = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const DoctorVisitDetailModal = ({ visit, onClose, onEdit }) => {
  const { deleteDoctorVisit, isBalanceVisible } = useApp();

  if (!visit) return null;

  const handleDelete = () => {
    if (window.confirm('Hapus riwayat kunjungan ini? Transaksi biaya tertaut juga akan dihapus.')) {
      deleteDoctorVisit(visit.id);
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
            <span className="health-detail-emoji">🩺</span>
            <div>
              <h3 className="health-modal-title">
                {visit.facilityName || visit.doctorName || 'Kunjungan Dokter'}
              </h3>
              <span className="health-modal-sub">{formatDateLong(visit.visitDate)}</span>
            </div>
          </div>
          <button type="button" className="health-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="health-detail-body">
          <div className="health-detail-rows">
            {visit.doctorName && (
              <div className="health-detail-row">
                <span className="health-detail-row-label">Dokter</span>
                <span className="health-detail-row-value">{visit.doctorName}</span>
              </div>
            )}
            {visit.facilityName && (
              <div className="health-detail-row">
                <span className="health-detail-row-label">Fasilitas</span>
                <span className="health-detail-row-value">{visit.facilityName}</span>
              </div>
            )}
            {visit.specialty && (
              <div className="health-detail-row">
                <span className="health-detail-row-label">Spesialis</span>
                <span className="health-detail-row-value">{visit.specialty}</span>
              </div>
            )}
            {visit.diagnosis && (
              <div className="health-detail-row">
                <span className="health-detail-row-label">Diagnosis</span>
                <span className="health-detail-row-value">{visit.diagnosis}</span>
              </div>
            )}
            {visit.notes && (
              <div className="health-detail-row">
                <span className="health-detail-row-label">Catatan</span>
                <span className="health-detail-row-value">{visit.notes}</span>
              </div>
            )}
          </div>

          {Number(visit.cost) > 0 && (
            <div className="health-detail-cost-box">
              <Receipt size={14} className="health-detail-cost-icon" />
              <span className="health-detail-cost-label">Biaya berobat</span>
              <span className="health-detail-cost-value">
                {maskMoney(visit.cost, isBalanceVisible)}
              </span>
            </div>
          )}

          {visit.nextVisitDate && (
            <div className="health-next-visit is-in-modal">
              <CalendarClock size={14} className="health-next-visit-icon" />
              <div className="health-next-visit-text">
                <span className="health-next-visit-title">Kontrol berikutnya</span>
                <span className="health-next-visit-desc">{formatDateLong(visit.nextVisitDate)}</span>
              </div>
            </div>
          )}

          <div className="health-modal-actions">
            <button type="button" className="health-btn-danger" onClick={handleDelete}>
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
            <button type="button" className="health-btn-submit" onClick={() => onEdit?.(visit)}>
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorVisitDetailModal;
