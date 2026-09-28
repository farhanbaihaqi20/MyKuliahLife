import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Link2,
  Unlink,
  RefreshCw
} from 'lucide-react';
import GoogleIcon from '../components/auth/GoogleIcon';
import confetti from 'canvas-confetti';
import { sanitizeImageUrl } from '../utils/security';

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
    saveLocalAvatar,
    uploadUserAvatar,
    removeUserAvatar,
    isGuestMode,
    linkGoogle,
    unlinkGoogle,
    getLinkedIdentities
  } = useApp();

  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);

  // Linked Identities State
  const [linkedIdentities, setLinkedIdentities] = useState([]);
  const [isLoadingIdentities, setIsLoadingIdentities] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);
  const [identityMessage, setIdentityMessage] = useState(null);

  const fetchIdentities = async () => {
    if (!user || isGuestMode) return;
    setIsLoadingIdentities(true);
    try {
      const list = await getLinkedIdentities();
      if (Array.isArray(list) && list.length > 0) {
        setLinkedIdentities(list);
      } else if (user?.identities && user.identities.length > 0) {
        setLinkedIdentities(user.identities);
      } else {
        setLinkedIdentities([]);
      }
    } catch (err) {
      console.warn('Gagal memuat daftar identitas akun:', err);
    } finally {
      setIsLoadingIdentities(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, [user, isGuestMode]);

  const handleConnectGoogle = async () => {
    setIdentityMessage(null);
    setIsLinkingGoogle(true);
    try {
      const res = await linkGoogle();
      if (!res.success) {
        setIdentityMessage({ type: 'error', text: res.error || 'Gagal memulai koneksi Google.' });
        setIsLinkingGoogle(false);
      }
    } catch (err) {
      setIdentityMessage({ type: 'error', text: err.message || 'Terjadi kesalahan saat menghubungkan akun.' });
      setIsLinkingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async (googleIdentity) => {
    if (!window.confirm('Yakin ingin memutuskan koneksi akun Google? Anda tetap dapat login menggunakan email dan password.')) {
      return;
    }
    setIdentityMessage(null);
    setIsUnlinkingGoogle(true);
    try {
      const res = await unlinkGoogle(googleIdentity);
      if (res.success) {
        setIdentityMessage({ type: 'success', text: 'Koneksi akun Google berhasil diputuskan.' });
        await fetchIdentities();
      } else {
        setIdentityMessage({ type: 'error', text: res.error || 'Gagal memutuskan akun Google.' });
      }
    } catch (err) {
      setIdentityMessage({ type: 'error', text: err.message || 'Gagal memutuskan akun Google.' });
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  const googleIdentity = linkedIdentities.find((i) => i.provider === 'google');
  const hasEmailIdentity = linkedIdentities.some((i) => i.provider === 'email') || (!googleIdentity && !!user?.email);

  // Edit Profile Form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(data.profile?.fullName || '');
  const [university, setUniversity] = useState(data.profile?.university || '');
  const [major, setMajor] = useState(data.profile?.major || '');
  const [targetGpa, setTargetGpa] = useState(data.profile?.targetGpa || 3.80);
  const [selectedSemester, setSelectedSemester] = useState(activeSemester || data.profile?.semester || 1);

  // Keep form fields synchronized with latest data when edit modal is closed
  useEffect(() => {
    if (!isEditingProfile) {
      setFullName(data.profile?.fullName || '');
      setUniversity(data.profile?.university || '');
      setMajor(data.profile?.major || '');
      setTargetGpa(data.profile?.targetGpa || 3.80);
      setSelectedSemester(activeSemester || data.profile?.semester || 1);
    }
  }, [
    data.profile?.fullName,
    data.profile?.university,
    data.profile?.major,
    data.profile?.targetGpa,
    data.profile?.semester,
    activeSemester,
    isEditingProfile
  ]);

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

    // Use existing profile data as fallback so user data is never wiped with placeholder defaults
    const newFullName = fullName.trim() || data.profile?.fullName || 'Mahasiswa';
    const newUniversity = university.trim() || data.profile?.university || '';
    const newMajor = major.trim() || data.profile?.major || '';
    const newTargetGpa = Number(targetGpa) || data.profile?.targetGpa || 3.80;

    updateProfile({
      fullName: newFullName,
      university: newUniversity,
      major: newMajor,
      targetGpa: newTargetGpa,
      semester: semNum,
      activeSemester: semNum
    });

    setIsEditingProfile(false);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  // Photo Upload & Cloud Storage Sync
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict MIME-type checking (Only JPG, PNG, and WebP raster images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      setPhotoMessage({
        type: 'error',
        text: 'Format file tidak diizinkan. Hanya file foto bertipe JPG, PNG, atau WebP yang diperbolehkan demi keamanan.'
      });
      e.target.value = '';
      return;
    }

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage({
        type: 'error',
        text: 'Ukuran file foto maksimal 5MB.'
      });
      e.target.value = '';
      return;
    }

    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setPhotoMessage({
        type: 'error',
        text: 'Gagal membaca file gambar.'
      });
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setIsUploadingPhoto(false);
        setPhotoMessage({
          type: 'error',
          text: 'File gambar rusak atau tidak valid.'
        });
      };

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

        // Convert canvas to blob for cloud storage
        canvas.toBlob(async (blob) => {
          try {
            const res = await uploadUserAvatar(blob, compressedDataUrl);
            if (res.cloudError) {
              setPhotoMessage({
                type: 'warning',
                text: 'Foto tersimpan secara lokal di perangkat ini. Terjadi kendala sinkronisasi cloud saat mengunggah foto profil.'
              });
            } else {
              setPhotoMessage({
                type: 'success',
                text: 'Foto profil berhasil diperbarui & tersinkronisasi ke seluruh perangkat!'
              });
            }
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.5 } });
          } catch (err) {
            console.warn('Gagal upload foto profil:', err);
            setPhotoMessage({
              type: 'error',
              text: 'Gagal mengunggah foto profil: ' + err.message
            });
          } finally {
            setIsUploadingPhoto(false);
          }
        }, 'image/jpeg', 0.85);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = async (e) => {
    e.stopPropagation();
    if (window.confirm('Hapus foto profil?')) {
      await removeUserAvatar();
      setPhotoMessage({
        type: 'info',
        text: 'Foto profil telah dihapus dari cloud & browser.'
      });
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
          {/* Avatar Box with Photo & Camera Button */}
          <div className="ktm-avatar-box">
            {isUploadingPhoto ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(239, 246, 255, 0.85)',
                  borderRadius: '16px'
                }}
              >
                <RefreshCw size={20} className="spin" style={{ color: '#2563EB' }} />
              </div>
            ) : sanitizeImageUrl(localAvatar) ? (
              <img
                src={sanitizeImageUrl(localAvatar)}
                alt="Foto Profil Mahasiswa"
                className="ktm-avatar-img"
                onError={() => {
                  saveLocalAvatar('');
                }}
              />
            ) : (
              <div style={{ fontSize: '26px' }}>🎓</div>
            )}

            {/* Quick Camera Upload Button */}
            <button
              type="button"
              className="ktm-photo-badge-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              title="Pasang / Ganti Foto Profil (Tersinkron Cloud)"
            >
              <Camera size={12} />
            </button>

            {/* Remove Photo Button if photo exists */}
            {localAvatar && !isUploadingPhoto && (
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

      {/* Notifikasi Status Sinkronisasi Foto Profil */}
      {photoMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            marginTop: '12px',
            backgroundColor: photoMessage.type === 'success' ? '#ECFDF5' : (photoMessage.type === 'warning' ? '#FFFBEB' : (photoMessage.type === 'error' ? '#FEF2F2' : '#EFF6FF')),
            color: photoMessage.type === 'success' ? '#065F46' : (photoMessage.type === 'warning' ? '#92400E' : (photoMessage.type === 'error' ? '#991B1B' : '#1E40AF')),
            border: `1px solid ${photoMessage.type === 'success' ? '#A7F3D0' : (photoMessage.type === 'warning' ? '#FDE68A' : (photoMessage.type === 'error' ? '#FECACA' : '#BFDBFE'))}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {photoMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{photoMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setPhotoMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* 5. AKUN TERHUBUNG & MULTI-LOGIN */}
      <div className="card-standard" style={{ marginTop: '16px' }}>
        <div className="section-header-row" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={18} style={{ color: '#1665D8' }} />
            <h3 className="section-title" style={{ margin: 0 }}>
              Akun Terhubung
            </h3>
          </div>
          {!isGuestMode && (
            <button
              type="button"
              className="section-action-link"
              onClick={fetchIdentities}
              disabled={isLoadingIdentities}
              title="Muat ulang status akun"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={isLoadingIdentities ? 'spin' : ''} />
              <span>Segarkan</span>
            </button>
          )}
        </div>

        {identityMessage && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: identityMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: identityMessage.type === 'success' ? '#065F46' : '#991B1B',
              border: `1px solid ${identityMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`
            }}
          >
            {identityMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{identityMessage.text}</span>
          </div>
        )}

        {isGuestMode ? (
          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Mode Tamu (Guest Mode)</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
              Anda saat ini sedang menggunakan akun tamu lokal. Keluar untuk masuk atau mendaftar akun resmi agar dapat menghubungkan Google.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Email & Password Identity */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    Email & Password
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {user?.email || 'Belum terkonfigurasi'}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: '#D1FAE5',
                  padding: '3px 8px',
                  borderRadius: '8px'
                }}
              >
                Aktif
              </span>
            </div>

            {/* Google Identity */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <GoogleIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    Akun Google
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {googleIdentity ? (
                      googleIdentity.identity_data?.email || user?.email || 'Terkoneksi'
                    ) : (
                      'Belum terhubung ke Google'
                    )}
                  </div>
                </div>
              </div>

              {googleIdentity ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#059669',
                      backgroundColor: '#D1FAE5',
                      padding: '3px 8px',
                      borderRadius: '8px'
                    }}
                  >
                    Terhubung
                  </span>
                  {hasEmailIdentity && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectGoogle(googleIdentity)}
                      disabled={isUnlinkingGoogle}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px'
                      }}
                      title="Putuskan sambungan Google"
                    >
                      <Unlink size={15} />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isLinkingGoogle}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1E293B',
                    cursor: isLinkingGoogle ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <GoogleIcon size={14} />
                  <span>{isLinkingGoogle ? 'Menghubungkan...' : 'Hubungkan'}</span>
                </button>
              )}
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#64748B',
                lineHeight: 1.45,
                marginTop: '4px',
                padding: '0 2px'
              }}
            >
              💡 Hubungkan Google agar Anda bisa login dengan Google maupun email & password ke akun yang sama secara fleksibel.
            </div>
          </div>
        )}
      </div>

      {/* 6. STATUS AKUN & CLOUD SYNC */}
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
