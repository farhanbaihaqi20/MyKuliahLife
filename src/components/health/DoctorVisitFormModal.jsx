import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';

const SPECIALTY_OPTIONS = [
  'Umum', 'Gigi', 'Mata', 'THT', 'Kulit', 'Penyakit Dalam',
  'Kandungan', 'Anak', 'Psikolog / Konseling', 'Lainnya'
];

export const DoctorVisitFormModal = ({ isOpen, onClose, initialData = null }) => {
  const { data, addDoctorVisit, editDoctorVisit } = useApp();

  const [visitDate, setVisitDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [specialty, setSpecialty] = useState('Umum');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [hasNextVisit, setHasNextVisit] = useState(false);
  const [trackCost, setTrackCost] = useState(false);
  const [costStr, setCostStr] = useState('');
  const [accountName, setAccountName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setVisitDate(initialData.visitDate || new Date().toISOString().split('T')[0]);
      setDoctorName(initialData.doctorName || '');
      setFacilityName(initialData.facilityName || '');
      setSpecialty(initialData.specialty || 'Umum');
      setDiagnosis(initialData.diagnosis || '');
      setNotes(initialData.notes || '');
      setNextVisitDate(initialData.nextVisitDate || '');
      setHasNextVisit(Boolean(initialData.nextVisitDate));
      setTrackCost(false);
      setCostStr(initialData.cost ? formatRupiahNumber(initialData.cost) : '');
      setAccountName(initialData.accountName || data.accounts?.[0]?.name || '');
    } else {
      setVisitDate(new Date().toISOString().split('T')[0]);
      setDoctorName('');
      setFacilityName('');
      setSpecialty('Umum');
      setDiagnosis('');
      setNotes('');
      setNextVisitDate('');
      setHasNextVisit(false);
      setTrackCost(false);
      setCostStr('');
      setAccountName(data.accounts?.find(a => a.isPrimary)?.name || data.accounts?.[0]?.name || '');
    }
    setErrorMsg('');
  }, [initialData, isOpen, data.accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorName.trim() && !facilityName.trim()) {
      setErrorMsg('Isi minimal nama dokter atau fasilitas kesehatan');
      return;
    }

    const numericCost = trackCost && !initialData ? parseRupiahNumber(costStr) : 0;

    const payload = {
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      doctorName: doctorName.trim(),
      facilityName: facilityName.trim(),
      specialty,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      nextVisitDate: hasNextVisit && nextVisitDate ? nextVisitDate : null
    };

    if (initialData) {
      editDoctorVisit(initialData.id, payload);
    } else {
      await addDoctorVisit({
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
              {initialData ? 'Edit Kunjungan' : 'Catat Kunjungan Dokter'}
            </h3>
            <span className="health-modal-sub">
              {initialData ? 'Perbarui detail kunjungan' : 'Riwayat periksa ke fasilitas kesehatan'}
            </span>
          </div>
          <button type="button" className="health-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="health-form-body">
          <div className="health-form-row-2col">
            <div className="health-form-group">
              <label className="health-form-label">Tanggal Kunjungan</label>
              <input
                type="date"
                className="health-input"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
            </div>
            <div className="health-form-group">
              <label className="health-form-label">Spesialis</label>
              <select
                className="health-select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                {SPECIALTY_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="health-form-group">
            <label className="health-form-label">Nama Dokter</label>
            <input
              type="text"
              className="health-input"
              placeholder="Contoh: dr. Siti Rahma, Sp.PD"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="health-form-group">
            <label className="health-form-label">Fasilitas Kesehatan</label>
            <input
              type="text"
              className="health-input"
              placeholder="Contoh: Klinik Kampus, RSUD, Puskesmas..."
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
            />
          </div>

          <div className="health-form-group">
            <label className="health-form-label">Diagnosis / Keluhan (Opsional)</label>
            <input
              type="text"
              className="health-input"
              placeholder="Contoh: Flu & demam, sakit gigi, kontrol rutin..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="health-form-group">
            <label className="health-form-label">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              className="health-input"
              placeholder="Saran dokter, hal yang perlu diperhatikan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Kontrol ulang */}
          <div className="health-form-group">
            <label className="health-form-label health-label-toggle">
              <input
                type="checkbox"
                checked={hasNextVisit}
                onChange={(e) => setHasNextVisit(e.target.checked)}
              />
              <span>Jadwalkan kontrol ulang</span>
            </label>
            {hasNextVisit && (
              <input
                type="date"
                className="health-input"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
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
                <span>Catat biaya berobat ke keuangan</span>
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

export default DoctorVisitFormModal;
