import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Pill,
  Stethoscope,
  CalendarClock,
  CheckCircle2,
  Clock,
  ChevronRight,
  SkipForward,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, maskMoney, getLocalDateString } from '../../utils/formatters';
import { MascotEmptyState } from '../common/MascotEmptyState';
import MedicationFormModal from './MedicationFormModal';
import DoctorVisitFormModal from './DoctorVisitFormModal';
import MedicationDetailModal from './MedicationDetailModal';
import DoctorVisitDetailModal from './DoctorVisitDetailModal';
import WellnessGrid from './WellnessGrid';

const FORM_EMOJI = {
  tablet: '💊',
  kapsul: '💊',
  sirup: '🧴',
  salep: '🩹',
  injeksi: '💉',
  lainnya: '🩺'
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

export const HealthDashboard = ({ onBack }) => {
  const {
    data,
    medications = [],
    doctorVisits = [],
    activeMedications = [],
    todayDoseSchedule = [],
    upcomingVisit,
    logMedicationDose,
    isBalanceVisible
  } = useApp();

  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'meds' | 'visits'
  const [isMedFormOpen, setIsMedFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [detailMed, setDetailMed] = useState(null);
  const [detailVisit, setDetailVisit] = useState(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const todayStr = useMemo(() => getLocalDateString(), []);

  const todayTaken = useMemo(
    () => todayDoseSchedule.filter(d => d.status === 'taken').length,
    [todayDoseSchedule]
  );
  const todayTotal = todayDoseSchedule.length;
  const todayPct = todayTotal > 0 ? Math.round((todayTaken / todayTotal) * 100) : 0;

  const handleAddNew = () => {
    setIsAddSheetOpen(true);
  };

  const openMedForm = () => {
    setIsAddSheetOpen(false);
    setEditingMed(null);
    setIsMedFormOpen(true);
  };

  const openVisitForm = () => {
    setIsAddSheetOpen(false);
    setEditingVisit(null);
    setIsVisitFormOpen(true);
  };

  return (
    <div className="health-dashboard-root animate-fade-in">
      {/* Header */}
      <header className="health-header">
        <div className="health-header-left">
          <button
            type="button"
            className="health-icon-btn"
            onClick={onBack}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="health-header-text">
            <h1 className="health-title">SehatKu</h1>
            <span className="health-subtitle">
              {activeMedications.length > 0
                ? `${activeMedications.length} obat aktif · ${doctorVisits.length} riwayat`
                : 'Kesehatan & pengingat obat'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="health-add-btn"
          onClick={handleAddNew}
          title="Tambah catatan kesehatan"
        >
          <Plus size={16} />
          <span>Baru</span>
        </button>
      </header>

      {/* Hero Card: Progress Hari Ini */}
      <section className="health-hero-card">
        <div className="health-hero-top">
          <div className="health-hero-label">
            <Activity size={13} className="health-hero-label-icon" />
            <span>Kepatuhan Hari Ini</span>
          </div>
          <span className="health-hero-date">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <div className="health-hero-main">
          <div className="health-hero-progress-wrap">
            <svg className="health-progress-ring" viewBox="0 0 84 84">
              <circle className="health-progress-track" cx="42" cy="42" r="36" />
              <circle
                className="health-progress-fill"
                cx="42"
                cy="42"
                r="36"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - (todayTotal > 0 ? todayPct : 0) / 100)}`}
              />
            </svg>
            <div className="health-progress-center">
              <span className="health-progress-num">{todayTotal > 0 ? `${todayTaken}/${todayTotal}` : '—'}</span>
              <span className="health-progress-cap">dosis</span>
            </div>
          </div>

          <div className="health-hero-stats">
            <div className="health-hero-stat">
              <span className="health-stat-label">Obat Aktif</span>
              <span className="health-stat-value">{activeMedications.length}</span>
            </div>
            <div className="health-hero-stat-divider" />
            <div className="health-hero-stat">
              <span className="health-stat-label">Riwayat Dokter</span>
              <span className="health-stat-value">{doctorVisits.length}</span>
            </div>
          </div>
        </div>

        {upcomingVisit && (
          <div className="health-next-visit">
            <CalendarClock size={14} className="health-next-visit-icon" />
            <div className="health-next-visit-text">
              <span className="health-next-visit-title">Kontrol berikutnya</span>
              <span className="health-next-visit-desc">
                {formatDateShort(upcomingVisit.nextVisitDate)}
                {upcomingVisit.doctorName ? ` · ${upcomingVisit.doctorName}` : ''}
                {upcomingVisit.facilityName ? ` · ${upcomingVisit.facilityName}` : ''}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Segmented Tabs */}
      <nav className="health-filter-bar">
        <button
          type="button"
          className={`health-filter-pill ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Hari Ini ({todayTotal})
        </button>
        <button
          type="button"
          className={`health-filter-pill ${activeTab === 'meds' ? 'active' : ''}`}
          onClick={() => setActiveTab('meds')}
        >
          Obat ({activeMedications.length})
        </button>
        <button
          type="button"
          className={`health-filter-pill ${activeTab === 'visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('visits')}
        >
          Riwayat ({doctorVisits.length})
        </button>
        <button
          type="button"
          className={`health-filter-pill ${activeTab === 'wellness' ? 'active' : ''}`}
          onClick={() => setActiveTab('wellness')}
        >
          Wellness
        </button>
      </nav>

      {/* TAB: HARI INI */}
      {activeTab === 'today' && (
        todayDoseSchedule.length === 0 ? (
          <div className="health-empty-state">
            <MascotEmptyState
              mascot="relax"
              mascotSize={88}
              title="Tidak Ada Jadwal Hari Ini"
              description="Tambahkan obat beserta jam minumnya agar jadwal harianmu terpantau rapi."
              actionText="Tambah Obat"
              actionIcon={<Pill size={14} />}
              onAction={() => {
                setEditingMed(null);
                setIsMedFormOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="health-dose-list">
            {todayDoseSchedule.map((dose, idx) => {
              const isTaken = dose.status === 'taken';
              const isSkipped = dose.status === 'skipped';
              return (
                <article
                  key={`${dose.medId}-${dose.time}-${idx}`}
                  className={`health-dose-card ${isTaken ? 'is-taken' : ''} ${isSkipped ? 'is-skipped' : ''}`}
                >
                  <div className="health-dose-time-col">
                    <Clock size={13} className="health-dose-clock" />
                    <span className="health-dose-time">{dose.time}</span>
                  </div>

                  <div className="health-dose-info">
                    <div className="health-dose-name-row">
                      <span className="health-dose-emoji">{FORM_EMOJI[dose.form] || '💊'}</span>
                      <span className="health-dose-name">{dose.medName}</span>
                      {dose.dosage && <span className="health-dose-dosage">{dose.dosage}</span>}
                    </div>
                    {dose.instructions && (
                      <span className="health-dose-instructions">{dose.instructions}</span>
                    )}
                    {isTaken && dose.takenAt && (
                      <span className="health-dose-taken-note">
                        Diminum {new Date(dose.takenAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {!isTaken && !isSkipped ? (
                    <div className="health-dose-actions">
                      <button
                        type="button"
                        className="health-dose-take-btn"
                        onClick={() => logMedicationDose(dose.medId, { date: todayStr, time: dose.time, status: 'taken' })}
                        title="Tandai sudah diminum"
                      >
                        <CheckCircle2 size={14} />
                        <span>Sudah</span>
                      </button>
                      <button
                        type="button"
                        className="health-dose-skip-btn"
                        onClick={() => logMedicationDose(dose.medId, { date: todayStr, time: dose.time, status: 'skipped' })}
                        title="Lewati dosis ini"
                      >
                        <SkipForward size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className={`health-dose-status-badge ${isTaken ? 'taken' : 'skipped'}`}>
                      {isTaken ? '✓ Selesai' : 'Dilewati'}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}

      {/* TAB: OBAT */}
      {activeTab === 'meds' && (
        medications.length === 0 ? (
          <div className="health-empty-state">
            <MascotEmptyState
              mascot="relax"
              mascotSize={88}
              title="Belum Ada Obat Tercatat"
              description="Catat obat rutin atau resep dokter agar tidak ada dosis yang terlewat."
              actionText="Tambah Obat Pertama"
              actionIcon={<Pill size={14} />}
              onAction={() => {
                setEditingMed(null);
                setIsMedFormOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="health-med-list">
            {medications.map((med) => {
              const isActive = med.status === 'active' && (!med.endDate || med.endDate >= todayStr);
              const lowStock = med.stockRemaining !== null && med.stockRemaining !== undefined && med.stockRemaining <= 5;
              return (
                <button
                  key={med.id}
                  type="button"
                  className={`health-med-card ${!isActive ? 'is-inactive' : ''}`}
                  onClick={() => setDetailMed(med)}
                >
                  <div className="health-med-icon">
                    {FORM_EMOJI[med.form] || '💊'}
                  </div>
                  <div className="health-med-body">
                    <div className="health-med-title-row">
                      <span className="health-med-name">{med.name}</span>
                      {med.dosage && <span className="health-med-dosage">{med.dosage}</span>}
                      {!isActive && <span className="health-med-badge-inactive">Selesai</span>}
                      {isActive && lowStock && <span className="health-med-badge-stock">Stok {med.stockRemaining}</span>}
                    </div>
                    <div className="health-med-schedule-chips">
                      {(med.scheduleTimes || []).map(t => (
                        <span key={t} className="health-schedule-chip">{t}</span>
                      ))}
                    </div>
                    {med.instructions && (
                      <span className="health-med-instructions">{med.instructions}</span>
                    )}
                  </div>
                  <ChevronRight size={16} className="health-med-chevron" />
                </button>
              );
            })}
          </div>
        )
      )}

      {/* TAB: RIWAYAT DOKTER */}
      {activeTab === 'visits' && (
        doctorVisits.length === 0 ? (
          <div className="health-empty-state">
            <MascotEmptyState
              mascot="study"
              mascotSize={88}
              title="Belum Ada Riwayat Dokter"
              description="Catat kunjungan ke dokter, klinik, atau puskesmas untuk memantau kondisi kesehatanmu."
              actionText="Catat Kunjungan Pertama"
              actionIcon={<Stethoscope size={14} />}
              onAction={() => {
                setEditingVisit(null);
                setIsVisitFormOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="health-visit-list">
            {doctorVisits.map((visit) => {
              const hasNext = visit.nextVisitDate && visit.nextVisitDate >= todayStr;
              return (
                <button
                  key={visit.id}
                  type="button"
                  className="health-visit-card"
                  onClick={() => setDetailVisit(visit)}
                >
                  <div className="health-visit-date-col">
                    <span className="health-visit-day">
                      {new Date(visit.visitDate).getDate()}
                    </span>
                    <span className="health-visit-month">
                      {new Date(visit.visitDate).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                  </div>

                  <div className="health-visit-body">
                    <div className="health-visit-title-row">
                      <span className="health-visit-facility">
                        {visit.facilityName || visit.doctorName || 'Kunjungan Dokter'}
                      </span>
                      {hasNext && <span className="health-visit-badge-next">Kontrol</span>}
                    </div>
                    {visit.doctorName && visit.facilityName && (
                      <span className="health-visit-doctor">
                        {visit.doctorName}{visit.specialty ? ` · ${visit.specialty}` : ''}
                      </span>
                    )}
                    {visit.diagnosis && (
                      <span className="health-visit-diagnosis">{visit.diagnosis}</span>
                    )}
                    {Number(visit.cost) > 0 && (
                      <span className="health-visit-cost">
                        {maskMoney(visit.cost, isBalanceVisible)}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={16} className="health-med-chevron" />
                </button>
              );
            })}
          </div>
        )
      )}

      {/* TAB: WELLNESS */}
      {activeTab === 'wellness' && (
        <WellnessGrid />
      )}

      {/* Add Action Sheet */}
      {isAddSheetOpen && (
        <div className="health-modal-backdrop animate-fade-in" onClick={() => setIsAddSheetOpen(false)}>
          <div
            className="health-modal-card health-add-sheet animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="health-modal-header">
              <div>
                <h3 className="health-modal-title">Tambah Catatan</h3>
                <span className="health-modal-sub">Pilih jenis catatan kesehatan</span>
              </div>
            </div>

            <div className="health-add-options">
              <button type="button" className="health-add-option" onClick={openMedForm}>
                <div className="health-add-option-icon is-med">
                  <Pill size={20} />
                </div>
                <div className="health-add-option-text">
                  <span className="health-add-option-title">Tambah Obat</span>
                  <span className="health-add-option-desc">Atur jadwal & pengingat minum obat</span>
                </div>
                <ChevronRight size={16} className="health-med-chevron" />
              </button>

              <button type="button" className="health-add-option" onClick={openVisitForm}>
                <div className="health-add-option-icon is-visit">
                  <Stethoscope size={20} />
                </div>
                <div className="health-add-option-text">
                  <span className="health-add-option-title">Catat Kunjungan Dokter</span>
                  <span className="health-add-option-desc">Riwayat periksa, diagnosis & kontrol</span>
                </div>
                <ChevronRight size={16} className="health-med-chevron" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MedicationFormModal
        isOpen={isMedFormOpen}
        onClose={() => {
          setIsMedFormOpen(false);
          setEditingMed(null);
        }}
        initialData={editingMed}
      />
      <DoctorVisitFormModal
        isOpen={isVisitFormOpen}
        onClose={() => {
          setIsVisitFormOpen(false);
          setEditingVisit(null);
        }}
        initialData={editingVisit}
      />
      <MedicationDetailModal
        med={detailMed}
        onClose={() => setDetailMed(null)}
        onEdit={(m) => {
          setDetailMed(null);
          setEditingMed(m);
          setIsMedFormOpen(true);
        }}
      />
      <DoctorVisitDetailModal
        visit={detailVisit}
        onClose={() => setDetailVisit(null)}
        onEdit={(v) => {
          setDetailVisit(null);
          setEditingVisit(v);
          setIsVisitFormOpen(true);
        }}
      />
    </div>
  );
};

export default HealthDashboard;
