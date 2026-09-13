import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Cloud,
  Database,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  GraduationCap,
  Calendar,
  Sparkles,
  RotateCcw,
  Sliders,
  ArrowRight,
  LogOut,
  Edit2,
  Check,
  Plus,
  BookOpen,
  Archive
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProfileSyncView = () => {
  const {
    data,
    updateProfile,
    syncStatus,
    triggerSync,
    startDayOfMonth,
    setIsCycleModalOpen,
    resetToCleanData,
    resetToDemoData,
    activeSemester,
    unlockedSemesters,
    changeActiveSemester,
    unlockNewSemester,
    user,
    session,
    logout,
    cumulativeGpa
  } = useApp();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(data.profile?.fullName || '');
  const [university, setUniversity] = useState(data.profile?.university || '');
  const [major, setMajor] = useState(data.profile?.major || '');
  const [targetGpa, setTargetGpa] = useState(data.profile?.targetGpa || 3.80);

  // New semester modal state
  const [isNewSemesterModalOpen, setIsNewSemesterModalOpen] = useState(false);

  const nextSemesterNumber = (Math.max(activeSemester, ...(unlockedSemesters || [1])) || 1) + 1;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      fullName: fullName.trim() || 'Mahasiswa',
      university: university.trim() || 'Universitas',
      major: major.trim() || 'Program Studi',
      targetGpa: Number(targetGpa) || 3.80
    });
    setIsEditingProfile(false);
  };

  const handleUnlockNextSemester = async () => {
    await unlockNewSemester(nextSemesterNumber);
    setIsNewSemesterModalOpen(false);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleExportBackup = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `myuang_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.profile) {
          localStorage.setItem('myuang_app_data', JSON.stringify(parsed));
          alert('Backup berhasil dipulihkan! Halaman akan dimuat ulang.');
          window.location.reload();
        } else {
          alert('Format file backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="main-content" style={{ paddingTop: '16px' }}>
      {/* 1. DIGITAL STUDENT CARD (KTM DIGITAL) */}
      <div className="ktm-digital-card">
        <div className="ktm-digital-top">
          <div className="ktm-digital-badge">KARTU MAHASISWA DIGITAL</div>
          <button
            type="button"
            className="ktm-edit-btn"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            title="Edit Rincian Profil"
          >
            <Edit2 size={13} />
            <span>{isEditingProfile ? 'Batal' : 'Edit Profil'}</span>
          </button>
        </div>

        {!isEditingProfile ? (
          <div className="ktm-digital-content">
            <div className="ktm-avatar-box">🎓</div>
            <div className="ktm-meta-info">
              <h3 className="ktm-name-text">{data.profile.fullName}</h3>
              <p className="ktm-univ-text">{data.profile.university}</p>
              <p className="ktm-major-text">{data.profile.major}</p>
              <div className="ktm-tags-row">
                <span className="ktm-sem-badge">Semester {activeSemester} Aktif ⭐</span>
                <span className="ktm-ipk-badge">IPK: {cumulativeGpa.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="ktm-edit-form">
            <div className="form-field">
              <label className="form-label" style={{ color: '#E2E8F0' }}>Nama Lengkap</label>
              <input
                type="text"
                className="auth-input"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ color: '#E2E8F0' }}>Kampus / Universitas</label>
              <input
                type="text"
                className="auth-input"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ color: '#E2E8F0' }}>Program Studi / Jurusan</label>
              <input
                type="text"
                className="auth-input"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ color: '#E2E8F0' }}>Target IPK Kelulusan</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.00"
                className="auth-input"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="ktm-save-btn"
            >
              <Check size={16} />
              <span>Simpan Perubahan Profil</span>
            </button>
          </form>
        )}
      </div>

      {/* 2. PUSAT MANAJEMEN SEMESTER (CENTRAL SEMESTER MANAGEMENT) */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div className="section-header-row">
          <div>
            <h3 className="section-title">
              <GraduationCap size={18} style={{ color: '#1665D8' }} />
              Pusat Manajemen Semester
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Atur semester aktif dan arsipkan perkuliahan lampau
            </p>
          </div>
          <button
            type="button"
            className="semester-action-add-btn"
            onClick={() => setIsNewSemesterModalOpen(true)}
            title="Buka Semester Baru"
          >
            <Plus size={14} />
            <span>Semester Baru</span>
          </button>
        </div>

        {/* Current Active Semester Card */}
        <div className="active-sem-highlight-card">
          <div>
            <div className="sem-status-indicator">
              <span className="status-dot green" />
              <span>SEMESTER AKTIF SAAT INI</span>
            </div>
            <div className="active-sem-title">Semester {activeSemester}</div>
            <div className="active-sem-desc">
              Semua pencatatan jadwal, tugas baru, dan presensi otomatis diarahkan ke semester ini.
            </div>
          </div>

          <div className="sem-quick-switch-box">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Ganti Aktif:</span>
            <select
              value={activeSemester}
              onChange={(e) => changeActiveSemester(Number(e.target.value))}
              className="sem-select-input"
            >
              {(unlockedSemesters || [1]).map((semNum) => (
                <option key={semNum} value={semNum}>
                  Semester {semNum} {semNum === activeSemester ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Riwayat Semester Mahasiswa */}
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
            Daftar Semester yang Telah Dibuka:
          </div>
          <div className="sem-history-grid">
            {(unlockedSemesters || [1]).map((s) => {
              const isActive = s === activeSemester;
              const courseCount = (data.courses || []).filter(c => (c.semester || 1) === s).length;
              return (
                <div
                  key={s}
                  className={`sem-history-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (!isActive) changeActiveSemester(s);
                  }}
                  title={isActive ? 'Semester ini sedang aktif' : 'Klik untuk jadikan semester aktif'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="sem-history-number">Semester {s}</span>
                    <span className={`sem-history-tag ${isActive ? 'active' : 'archive'}`}>
                      {isActive ? '⭐ Aktif' : '📁 Arsip'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    {courseCount} Mata Kuliah Tercatat
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL / SHEET BUKA SEMESTER BARU */}
      {isNewSemesterModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewSemesterModalOpen(false)}>
          <div className="modal-bottom-sheet" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar" />
            <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚀</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Buka Semester {nextSemesterNumber}?
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginTop: '6px' }}>
                Lembar kerja baru untuk <strong>Semester {nextSemesterNumber}</strong> akan dibuka dalam kondisi bersih (fresh).
              </p>
            </div>

            <div className="tip-box-clean" style={{ textAlign: 'left', marginBottom: '16px' }}>
              <Archive size={20} style={{ color: '#1665D8', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#334155' }}>
                Seluruh data mata kuliah, tugas, dan presensi di <strong>Semester {activeSemester}</strong> akan otomatis tersimpan aman di arsip dan rekap IPK tetap terjaga utuh.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setIsNewSemesterModalOpen(false)}
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                type="button"
                className="modal-primary-btn"
                onClick={handleUnlockNextSemester}
                style={{ flex: 1.5 }}
              >
                Buka Semester {nextSemesterNumber}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SIKLUS KEUANGAN & ANGGARAN */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div className="section-header-row">
          <h3 className="section-title">
            <Calendar size={18} style={{ color: '#1665D8' }} />
            Siklus & Anggaran Keuangan
          </h3>
          <button
            type="button"
            className="section-action-link"
            onClick={() => setIsCycleModalOpen(true)}
          >
            Ubah Siklus
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Hari Gajian / Mulai Siklus</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Tanggal perputaran anggaran bulanan</div>
          </div>
          <span className="badge-cycle-day">Setiap Tanggal {startDayOfMonth}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Alokasi Budget Periode Ini</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Batas belanja yang direncanakan</div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1665D8' }}>
            Rp {(data.budget?.totalBudget || 1500000).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* 4. AKUN & CLOUD SYNC SUPABASE */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div className="section-header-row">
          <h3 className="section-title">
            <Cloud size={18} style={{ color: '#1665D8' }} />
            Akun & Cloud Database
          </h3>
          <span className={`sync-status-pill ${syncStatus.mode}`}>
            {syncStatus.mode === 'online' ? 'Cloud Terhubung' : 'Offline'}
          </span>
        </div>

        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
          Akun: <strong>{user?.email || 'Tamu / Akun Lokal'}</strong>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          marginBottom: '14px'
        }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
              Auto-Sync Cloud Database Aktif
            </div>
            <div style={{ fontSize: '11px', color: '#15803D', lineHeight: '1.4' }}>
              Seluruh perubahan (matakuliah, tugas, presensi, dompet, dan transaksi) otomatis tersinkronisasi ke cloud database tanpa perlu tombol sinkron manual.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="action-btn-clean secondary"
            onClick={handleExportBackup}
          >
            <Download size={14} />
            <span>Ekspor JSON</span>
          </button>
          <label className="action-btn-clean secondary" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={14} />
            <span>Pulihkan JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>
        </div>

        {/* LOGOUT BUTTON */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            className="logout-action-btn"
            onClick={() => {
              if (window.confirm('Yakin ingin keluar dari akun ini?')) {
                logout();
              }
            }}
          >
            <LogOut size={16} />
            <span>Keluar Akun (Sign Out)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSyncView;
