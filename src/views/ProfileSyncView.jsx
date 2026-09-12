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
  ArrowRight
} from 'lucide-react';

export const ProfileSyncView = () => {
  const {
    data,
    updateProfile,
    syncStatus,
    triggerSync,
    startDayOfMonth,
    setIsCycleModalOpen,
    setIsOnboardingOpen,
    resetToCleanData,
    resetToDemoData,
    activeSemester,
    promoteToNextSemester
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(data.profile.fullName);
  const [university, setUniversity] = useState(data.profile.university);
  const [major, setMajor] = useState(data.profile.major);
  const [semester, setSemester] = useState(data.profile.semester);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      fullName,
      university,
      major,
      semester: Number(semester)
    });
    setIsEditing(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    const res = await triggerSync();
    setSyncing(false);
    setSyncMessage(res.message);
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
        if (parsed.profile && parsed.transactions) {
          localStorage.setItem('myuang_app_data_v1', JSON.stringify(parsed));
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
    <div className="main-content" style={{ paddingTop: '20px' }}>
      {/* 1. Profil Mahasiswa Card */}
      <div className="card-standard" style={{ textAlign: 'center', padding: '24px 20px' }}>
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1665D8 0%, #3B82F6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 18px rgba(22, 101, 216, 0.25)',
            fontSize: '32px'
          }}
        >
          🎓
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
          {data.profile.fullName}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
          {data.profile.major} • {data.profile.university}
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#1665D8', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, marginTop: '10px' }}>
          <GraduationCap size={14} /> Semester {data.profile.semester} Aktif
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '100%',
              background: '#F1F5F9',
              color: '#334155',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              marginTop: '16px',
              cursor: 'pointer'
            }}
          >
            Ubah Data Mahasiswa
          </button>
        ) : (
          <form onSubmit={handleSaveProfile} style={{ marginTop: '16px', textAlign: 'left' }}>
            <div className="input-group">
              <label className="input-label">Nama Lengkap</label>
              <input
                type="text"
                className="input-field"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Perguruan Tinggi / Kampus</label>
              <input
                type="text"
                className="input-field"
                value={university}
                onChange={e => setUniversity(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Program Studi / Jurusan</label>
              <input
                type="text"
                className="input-field"
                value={major}
                onChange={e => setMajor(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Semester Saat Ini</label>
              <input
                type="number"
                min="1"
                max="14"
                className="input-field"
                value={semester}
                onChange={e => setSemester(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Sinkronisasi Cloud (Supabase Multi-Device) */}
      <div className="card-standard">
        <div className="section-header-row">
          <h3 className="section-title">
            <Cloud size={18} style={{ color: '#1665D8' }} />
            Sinkronisasi Antar-Perangkat
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '8px',
              background: syncStatus.mode === 'online' ? '#ECFDF5' : '#F1F5F9',
              color: syncStatus.mode === 'online' ? '#059669' : '#64748B'
            }}
          >
            {syncStatus.mode === 'online' ? '🟢 Online Cloud' : '💾 Offline Lokal'}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
          Aplikasi menggunakan sistem <strong>Offline-First</strong>: semua pencatatan tersimpan aman di HP/laptop Anda tanpa bergantung internet. Saat terhubung Supabase, data disinkronkan otomatis.
        </p>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', margin: '12px 0', fontSize: '12px', color: '#64748B' }}>
          <div><strong>Status:</strong> {syncStatus.message}</div>
          {syncStatus.lastSynced && (
            <div style={{ marginTop: '4px' }}><strong>Terakhir Sinkron:</strong> {syncStatus.lastSynced}</div>
          )}
        </div>

        {syncMessage && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px', borderRadius: '10px', fontSize: '12px', color: '#1D4ED8', marginBottom: '12px' }}>
            {syncMessage}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleManualSync}
          disabled={syncing}
          style={{ width: '100%', marginBottom: '10px' }}
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
        </button>

        <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
          File konfigurasi: <code>.env.local</code> & Skrip SQL: <code>supabase_schema.sql</code>
        </div>
      </div>

      {/* 3. Cadangkan & Pulihkan Data Mandiri (JSON Backup) */}
      <div className="card-standard">
        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Cadangkan Data Lokal (Offline Backup)
        </h4>
        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
          Unduh seluruh data keuangan dan akademik Anda ke file JSON untuk cadangan manual atau dipindahkan ke perangkat lain.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handleExportBackup}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1665D8',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Download size={15} /> Unduh Backup
          </button>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#475569',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Upload size={15} /> Pulihkan JSON
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportBackup}
            />
          </label>
        </div>
      </div>

      {/* 4. Pengaturan Siklus Keuangan */}
      <div className="card-standard">
        <div className="section-header-row">
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            <Calendar size={18} style={{ color: '#1665D8', display: 'inline', marginRight: '6px' }} />
            Siklus Keuangan Bulanan
          </h4>
          <span style={{ fontSize: '12px', fontWeight: 700, background: '#EFF6FF', color: '#1665D8', padding: '3px 10px', borderRadius: '12px' }}>
            Tgl {startDayOfMonth} tiap bulan
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, marginBottom: '14px' }}>
          Sesuaikan tanggal awal reset anggaran bulanan Anda (misal tanggal gajian atau kiriman ortu). Anggaran harian dan sisa hari akan otomatis menyesuaikan siklus ini.
        </p>
        <button
          onClick={() => setIsCycleModalOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            color: '#1E293B',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Sliders size={16} /> Ubah Tanggal Siklus / Gajian
        </button>
      </div>

      {/* 5. Pengaturan Semester Akademik */}
      <div className="card-standard">
        <div className="section-header-row">
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            <GraduationCap size={18} style={{ color: '#1665D8', display: 'inline', marginRight: '6px' }} />
            Sistem Semester Akademik
          </h4>
          <span style={{ fontSize: '12px', fontWeight: 700, background: '#ECFDF5', color: '#059669', padding: '3px 10px', borderRadius: '12px' }}>
            Semester {activeSemester} Aktif
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, marginBottom: '14px' }}>
          Jadwal, tugas, dan presensi terisolasi per semester. Membuka semester baru akan memberi lembar kerja baru tanpa menghapus riwayat semester lama.
        </p>
        <button
          onClick={() => {
            if (window.confirm(`Buka lembar kerja Semester ${activeSemester + 1}? Semua jadwal & tugas semester ${activeSemester} tetap tersimpan aman di arsip.`)) {
              promoteToNextSemester();
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1665D8',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowRight size={16} /> Buka Semester Baru (Semester {activeSemester + 1})
        </button>
      </div>

      {/* 6. Setup Akun & Reset Data */}
      <div className="card-standard" style={{ border: '1px solid #FED7AA', background: '#FFFDF7' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#9A3412', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={17} color="#D97706" /> Pengaturan Data Akun & Wizard
        </h4>
        <p style={{ fontSize: '12px', color: '#78350F', lineHeight: 1.5, marginBottom: '14px' }}>
          Kelola format data akun Anda. Anda dapat memulai ulang panduan setup (onboarding), membersihkan data sampel, atau memuat ulang data demo kapan saja.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#D97706',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} /> Buka Wizard Setup Awal (Onboarding)
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset aplikasi ke data akun baru yang bersih tanpa data demo? Wizard setup akan langsung terbuka untuk mengatur akun Anda.')) {
                resetToCleanData();
              }
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} /> Reset ke Akun Baru Bersih
          </button>

          <button
            onClick={() => {
              if (window.confirm('Muat ulang data contoh / demo mahasiswa? Data saat ini akan digantikan dengan data demo.')) {
                resetToDemoData();
              }
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#475569',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Muat Kembali Data Contoh (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};
