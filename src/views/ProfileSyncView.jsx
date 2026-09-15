import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { maskMoney } from '../utils/formatters';
import {
  Camera,
  Trash2,
  Edit2,
  X,
  Check,
  GraduationCap,
  Wallet,
  Calendar,
  Cloud,
  LogOut,
  Sparkles,
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProfileSyncView = () => {
  const {
    data,
    updateProfile,
    syncStatus,
    startDayOfMonth,
    setIsCycleModalOpen,
    activeSemester,
    changeActiveSemester,
    user,
    logout,
    cumulativeGpa,
    totalBalance,
    cycleExpenses,
    totalBudget,
    isBalanceVisible,
    localAvatar,
    saveLocalAvatar
  } = useApp();

  const fileInputRef = useRef(null);

  // Edit Profile Form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(data.profile?.fullName || '');
  const [university, setUniversity] = useState(data.profile?.university || '');
  const [major, setMajor] = useState(data.profile?.major || '');
  const [targetGpa, setTargetGpa] = useState(data.profile?.targetGpa || 3.80);
  const [selectedSemester, setSelectedSemester] = useState(activeSemester || data.profile?.semester || 1);

  // Prepare when opening edit modal
  const handleOpenEdit = () => {
    setFullName(data.profile?.fullName || '');
    setUniversity(data.profile?.university || '');
    setMajor(data.profile?.major || '');
    setTargetGpa(data.profile?.targetGpa || 3.80);
    setSelectedSemester(activeSemester || data.profile?.semester || 1);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const semNum = Number(selectedSemester) || 1;

    updateProfile({
      fullName: fullName.trim() || 'Mahasiswa',
      university: university.trim() || 'Universitas',
      major: major.trim() || 'Program Studi',
      targetGpa: Number(targetGpa) || 3.80,
      semester: semNum
    });

    if (semNum !== activeSemester) {
      changeActiveSemester(semNum);
    }

    setIsEditingProfile(false);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  // Local Avatar Upload (Stored strictly in browser localStorage)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Crop & scale to square 256x256 via canvas for ultra lightweight storage (~20KB)
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');

        const minEdge = Math.min(img.width, img.height);
        const startX = (img.width - minEdge) / 2;
        const startY = (img.height - minEdge) / 2;

        ctx.drawImage(img, startX, startY, minEdge, minEdge, 0, 0, maxDim, maxDim);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveLocalAvatar(compressedDataUrl);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.5 } });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    if (window.confirm('Hapus foto profil dari browser?')) {
      saveLocalAvatar('');
    }
  };

  // ----------------------------------------------------
  // EXECUTIVE METRIC HIGHLIGHT CALCULATIONS
  // ----------------------------------------------------
  // Academic metrics for active semester
  const activeSemesterCourses = (data.courses || []).filter(
    c => (c.semester || 1) === activeSemester
  );
  const activeSemesterSks = activeSemesterCourses.reduce(
    (sum, c) => sum + (Number(c.sks) || 0),
    0
  );
  const pendingAssignments = (data.assignments || []).filter(
    a => (a.semester || 1) === activeSemester && a.status !== 'completed'
  );

  const gpaPredicate = cumulativeGpa >= 3.51
    ? 'Cum Laude 🏆'
    : cumulativeGpa >= 3.0
    ? 'Sangat Memuaskan ✨'
    : cumulativeGpa >= 2.75
    ? 'Memuaskan 👍'
    : 'Cukup';

  // Financial metrics
  const unpaidBills = (data.bills || []).filter(b => !b.isPaid);
  const unpaidBillsTotal = unpaidBills.reduce((s, b) => s + (b.amount || 0), 0);
  const budgetUsagePercent = totalBudget > 0
    ? Math.min(100, Math.round((cycleExpenses / totalBudget) * 100))
    : 0;

  const totalSavingsCollected = (data.savingsTargets || []).reduce(
    (s, t) => s + (t.currentAmount || 0),
    0
  );

  return (
    <div className="main-content" style={{ paddingTop: '16px' }}>
      {/* 1. DIGITAL STUDENT CARD (KTM DIGITAL FRESH & MINIMALIST) */}
      <div className="ktm-digital-card">
        <div className="ktm-digital-top">
          <div className="ktm-digital-badge">KARTU MAHASISWA DIGITAL</div>
          <button
            type="button"
            className="ktm-edit-btn"
            onClick={handleOpenEdit}
            title="Edit Rincian Profil & Semester"
          >
            <Edit2 size={13} />
            <span>Edit Profil</span>
          </button>
        </div>

        <div className="ktm-digital-content">
          {/* Avatar Box with Local Photo & Camera Button */}
          <div className="ktm-avatar-box">
            {localAvatar ? (
              <img
                src={localAvatar}
                alt="Foto Profil Mahasiswa"
                className="ktm-avatar-img"
              />
            ) : (
              <div style={{ fontSize: '26px' }}>🎓</div>
            )}

            {/* Quick Camera Upload Button */}
            <button
              type="button"
              className="ktm-photo-badge-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Pasang / Ganti Foto Profil (Tersimpan Lokal)"
            >
              <Camera size={12} />
            </button>

            {/* Remove Photo Button if photo exists */}
            {localAvatar && (
              <button
                type="button"
                className="ktm-photo-remove-btn"
                onClick={handleRemovePhoto}
                title="Hapus Foto Profil"
              >
                <Trash2 size={10} />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Student Meta Details */}
          <div className="ktm-meta-info">
            <h3 className="ktm-name-text">
              {data.profile?.fullName || 'Mahasiswa'}
            </h3>
            <p className="ktm-univ-text">
              {data.profile?.university || 'Universitas'}
            </p>
            <p className="ktm-major-text">
              {data.profile?.major || 'Program Studi'}
            </p>

            <div className="ktm-tags-row">
              <span className="ktm-sem-badge">
                Semester {activeSemester} Aktif ⭐
              </span>
              <span className="ktm-ipk-badge">
                IPK: {cumulativeGpa.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LAPORAN PENTING: RINGKASAN AKADEMIK */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <GraduationCap size={18} />
          </div>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Ringkasan Akademik
            </h3>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '1px 0 0 0' }}>
              Semester {activeSemester} & rekapan kumulatif
            </p>
          </div>
        </div>

        <div className="profile-metrics-grid">
          {/* IPK Metric */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>🎯 IPK Kumulatif</span>
            </div>
            <div className="profile-metric-value" style={{ color: '#1665D8' }}>
              {cumulativeGpa.toFixed(2)}
            </div>
            <div className="profile-metric-subtext">
              Target {data.profile?.targetGpa ? Number(data.profile.targetGpa).toFixed(2) : '3.80'} • {gpaPredicate}
            </div>
          </div>

          {/* SKS Semester Aktif */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>📚 Beban Studi</span>
            </div>
            <div className="profile-metric-value">
              {activeSemesterSks} SKS
            </div>
            <div className="profile-metric-subtext">
              Di Semester {activeSemester} aktif
            </div>
          </div>

          {/* Matakuliah Terdaftar */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>📝 Matakuliah</span>
            </div>
            <div className="profile-metric-value">
              {activeSemesterCourses.length} Mata Kuliah
            </div>
            <div className="profile-metric-subtext">
              Terjadwal semester ini
            </div>
          </div>

          {/* Tugas Kuliah Pending */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>⏳ Tugas Berjalan</span>
            </div>
            <div className="profile-metric-value" style={{ color: pendingAssignments.length > 0 ? '#E11D48' : '#10B981' }}>
              {pendingAssignments.length} Tugas
            </div>
            <div className="profile-metric-subtext">
              {pendingAssignments.length > 0 ? 'Perlu diselesaikan' : 'Semua tugas tuntas ✨'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LAPORAN PENTING: RINGKASAN KEUANGAN */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Ringkasan Keuangan
            </h3>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '1px 0 0 0' }}>
              Status total aset, belanja & tagihan
            </p>
          </div>
        </div>

        <div className="profile-metrics-grid">
          {/* Total Saldo Aset */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>💰 Total Akumulasi</span>
            </div>
            <div className="profile-metric-value" style={{ color: '#059669' }}>
              {maskMoney(totalBalance, isBalanceVisible)}
            </div>
            <div className="profile-metric-subtext">
              Dari {(data.accounts || []).length} dompet aktif
            </div>
          </div>

          {/* Pengeluaran Siklus Ini */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>📊 Belanja Siklus</span>
            </div>
            <div className="profile-metric-value" style={{ color: '#EF4444' }}>
              {maskMoney(cycleExpenses, isBalanceVisible)}
            </div>
            <div className="profile-metric-subtext">
              {budgetUsagePercent}% dari batas budget
            </div>
          </div>

          {/* Tagihan Belum Lunas */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>🧾 Tagihan Aktif</span>
            </div>
            <div className="profile-metric-value" style={{ color: unpaidBills.length > 0 ? '#F97316' : '#10B981' }}>
              {unpaidBills.length} Tagihan
            </div>
            <div className="profile-metric-subtext">
              {unpaidBills.length > 0
                ? `Rp ${unpaidBillsTotal.toLocaleString('id-ID')} belum bayar`
                : 'Bebas tagihan saat ini'}
            </div>
          </div>

          {/* Target Tabungan */}
          <div className="profile-metric-card">
            <div className="profile-metric-header">
              <span>🎯 Target Tabungan</span>
            </div>
            <div className="profile-metric-value">
              {(data.savingsTargets || []).length} Target
            </div>
            <div className="profile-metric-subtext">
              Terkumpul Rp {totalSavingsCollected.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SIKLUS & ANGGARAN KEUANGAN */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div className="section-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#1665D8' }} />
            <h3 className="section-title" style={{ margin: 0 }}>
              Siklus & Anggaran
            </h3>
          </div>
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
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Hari Gajian / Awal Siklus</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Tanggal perputaran anggaran bulanan</div>
          </div>
          <span className="badge-cycle-day">Setiap Tanggal {startDayOfMonth}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Alokasi Budget Periode Ini</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Batas belanja yang direncanakan</div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1665D8' }}>
            Rp {(data.budget?.totalBudget || 1500000).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* 5. STATUS AKUN & CLOUD SYNC */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={18} style={{ color: '#1665D8' }} />
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>
                Status Akun
              </h3>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>
                {user?.email || 'Tamu / Akun Lokal'}
              </div>
            </div>
          </div>

          <span className={`sync-status-pill ${syncStatus.mode}`}>
            {syncStatus.mode === 'online' ? 'Cloud Terhubung' : 'Offline Mode'}
          </span>
        </div>

        {/* LOGOUT BUTTON */}
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

      {/* 6. MODAL EDIT PROFIL TERPADU (TERMASUK GANTI SEMESTER) */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={() => setIsEditingProfile(false)} style={{ zIndex: 1250 }}>
          <div
            className="modal-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}
          >
            <div className="sheet-handle-bar" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Edit Profil Mahasiswa
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Perbarui biodata dan semester aktif
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Nama Lengkap */}
              <div className="input-group">
                <label className="input-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Farhan Baihaqi"
                  required
                />
              </div>

              {/* Kampus */}
              <div className="input-group">
                <label className="input-label">Kampus / Universitas</label>
                <input
                  type="text"
                  className="input-field"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Contoh: Universitas Indonesia"
                  required
                />
              </div>

              {/* Jurusan */}
              <div className="input-group">
                <label className="input-label">Program Studi / Jurusan</label>
                <input
                  type="text"
                  className="input-field"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Contoh: Teknik Informatika"
                  required
                />
              </div>

              {/* Semester Aktif (Pilihan Semester Langsung di Edit Profil) */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Semester Aktif Saat Ini</span>
                  <span style={{ color: '#2563EB', fontWeight: 700 }}>Semester {selectedSemester}</span>
                </label>
                <select
                  className="input-field"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  style={{ fontWeight: 700, color: '#1E40AF', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                    <option key={s} value={s}>
                      Semester {s} {s === activeSemester ? '(Aktif Saat Ini)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target IPK */}
              <div className="input-group">
                <label className="input-label">Target IPK Kelulusan</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  className="input-field"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  placeholder="Contoh: 3.85"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingProfile(false)}
                  style={{ flex: 1, padding: '12px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: '12px' }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSyncView;
