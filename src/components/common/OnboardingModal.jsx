import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import {
  Sparkles,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Wallet,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  X,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

const POPULAR_ACCOUNTS = [
  // Banks
  { name: 'BCA', type: 'bank', icon: '🏦', color: '#0052CC', defaultBal: 0 },
  { name: 'Bank Mandiri', type: 'bank', icon: '🏦', color: '#0284C7', defaultBal: 0 },
  { name: 'BRI', type: 'bank', icon: '🏦', color: '#00529C', defaultBal: 0 },
  { name: 'BNI', type: 'bank', icon: '🏦', color: '#F15A24', defaultBal: 0 },
  { name: 'Bank Jago', type: 'bank', icon: '🏦', color: '#FF7A00', defaultBal: 0 },
  { name: 'SeaBank', type: 'bank', icon: '🏦', color: '#EA580C', defaultBal: 0 },
  { name: 'BSI Syariah', type: 'bank', icon: '🏦', color: '#00A39D', defaultBal: 0 },
  { name: 'CIMB Niaga', type: 'bank', icon: '🏦', color: '#8B0000', defaultBal: 0 },
  // E-Wallets
  { name: 'GoPay', type: 'ewallet', icon: '📱', color: '#00AED6', defaultBal: 0 },
  { name: 'DANA', type: 'ewallet', icon: '📱', color: '#10B981', defaultBal: 0 },
  { name: 'OVO', type: 'ewallet', icon: '📱', color: '#4C3494', defaultBal: 0 },
  { name: 'ShopeePay', type: 'ewallet', icon: '🛍️', color: '#EE4D2D', defaultBal: 0 },
  // Cash
  { name: 'Uang Tunai / Cash', type: 'cash', icon: '💵', color: '#059669', defaultBal: 0 }
];

export const OnboardingModal = () => {
  const {
    isOnboardingOpen,
    completeOnboarding,
    data,
    user
  } = useApp();

  const [step, setStep] = useState(1);

  // Safe Name Resolver: Only use Google OAuth metadata if authentic, never hardcoded dummy names
  const getInitialFullName = () => {
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
    if (metaName && metaName !== 'Mahasiswa' && metaName !== 'Mahasiswa Demo' && metaName !== 'Han (Farhan)') {
      return metaName;
    }
    const profName = data?.profile?.fullName || '';
    if (profName && profName !== 'Mahasiswa' && profName !== 'Mahasiswa Baru' && profName !== 'Mahasiswa Demo' && profName !== 'Han (Farhan)') {
      return profName;
    }
    return '';
  };

  // Form states - Guaranteed empty and clean for new users
  const [fullName, setFullName] = useState(() => getInitialFullName());
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState(1);
  const [startDayOfMonth, setStartDayOfMonth] = useState(1);
  const [initialBudget, setInitialBudget] = useState('1.500.000');

  // Wallets - Start with clean single cash account with Rp 0
  const [accounts, setAccounts] = useState([
    { id: 'acc-init-1', name: 'Dompet Utama / Tunai', type: 'cash', balance: 0, isPrimary: true, icon: '💵', color: '#10B981' }
  ]);

  // Custom Wallet Creation state in Step 3
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customAccName, setCustomAccName] = useState('');
  const [customAccBal, setCustomAccBal] = useState('');
  const [customAccType, setCustomAccType] = useState('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Always reset to pristine clean state whenever the onboarding modal opens
  useEffect(() => {
    if (isOnboardingOpen) {
      setStep(1);
      setFullName(getInitialFullName());
      setUniversity('');
      setMajor('');
      setSemester(1);
      setStartDayOfMonth(1);
      setInitialBudget('1.500.000');
      setAccounts([
        { id: 'acc-init-1', name: 'Dompet Utama / Tunai', type: 'cash', balance: 0, isPrimary: true, icon: '💵', color: '#10B981' }
      ]);
      setIsAddingCustom(false);
      setCustomAccName('');
      setCustomAccBal('');
      setCustomAccType('bank');
    }
  }, [isOnboardingOpen, user]);

  if (!isOnboardingOpen) return null;

  const handleAddPopularAccount = (item) => {
    if (accounts.some(a => a.name.toLowerCase() === item.name.toLowerCase())) return;
    setAccounts([
      ...accounts,
      {
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        type: item.type,
        balance: 0,
        isPrimary: accounts.length === 0,
        icon: item.icon,
        color: item.color
      }
    ]);
  };

  const handleAddCustomAccount = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customAccName.trim()) return;

    const typeIcons = {
      bank: '🏦',
      ewallet: '📱',
      cash: '💵',
      other: '💳'
    };
    const typeColors = {
      bank: '#1665D8',
      ewallet: '#00AED6',
      cash: '#10B981',
      other: '#8B5CF6'
    };

    setAccounts([
      ...accounts,
      {
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: customAccName.trim(),
        type: customAccType,
        balance: parseRupiahNumber(customAccBal) || 0,
        isPrimary: accounts.length === 0,
        icon: typeIcons[customAccType] || '💳',
        color: typeColors[customAccType] || '#1665D8'
      }
    ]);
    setCustomAccName('');
    setCustomAccBal('');
    setIsAddingCustom(false);
  };

  const handleRemoveAccount = (id) => {
    if (accounts.length <= 1) {
      alert('Kamu harus memiliki minimal satu akun dompet aktif.');
      return;
    }
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const handleUpdateBalance = (id, rawValue) => {
    setAccounts(accounts.map(a => {
      if (a.id === id) {
        return { ...a, balance: parseRupiahNumber(rawValue) || 0 };
      }
      return a;
    }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    const chosenSem = Number(semester) || 1;
    try {
      await completeOnboarding({
        profile: {
          fullName: fullName.trim() || 'Mahasiswa',
          university: university.trim() || 'Universitas',
          major: major.trim() || 'Program Studi',
          semester: chosenSem
        },
        startDayOfMonth: Number(startDayOfMonth) || 1,
        initialAccounts: accounts,
        initialBudget: parseRupiahNumber(initialBudget) || 1500000
      });
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Onboarding completion error:', err);
      alert('Terjadi kendala saat menyimpan setup. Namun data telah dicadangkan di penyimpanan lokal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetNum = parseRupiahNumber(initialBudget) || 1500000;
  const estimatedDaily = Math.round(budgetNum / 30);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-sheet">
        {/* Header Segmented Progress Bar */}
        <div className="onboarding-progress-header">
          <div className="progress-segmented-bar">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`progress-segment ${step === s ? 'active' : step > s ? 'completed' : ''}`}
              />
            ))}
          </div>

          <div>
            <span className="onboarding-step-badge">
              Langkah {step} dari 4
            </span>
            <h3 className="onboarding-step-title">
              {step === 1 && 'Identitas & Semester Mahasiswa'}
              {step === 2 && 'Siklus & Anggaran Belanja'}
              {step === 3 && 'Atur Dompet & Saldo Awal'}
              {step === 4 && 'Selamat Datang di MyKuliahLife!'}
            </h3>
            <p className="onboarding-step-subtitle">
              {step === 1 && 'Lengkapi data studi dan tentukan semester aktif pertamamu.'}
              {step === 2 && 'Atur batas budget bulanan dan tanggal kiriman uang bulanan.'}
              {step === 3 && 'Tambahkan rekening bank atau dompet aktif beserta saldo awalmu.'}
              {step === 4 && 'Semua siap! Kartu mahasiswa digital dan dompetmu siap digunakan.'}
            </p>
          </div>
        </div>

        {/* Content Body per Step */}
        <div className="onboarding-content-body">
          {/* STEP 1: IDENTITAS */}
          {step === 1 && (
            <div className="onboarding-form-step">
              <div className="onboarding-field">
                <label className="onboarding-label">
                  Nama Lengkap
                </label>
                <div className="onboarding-input-wrap">
                  <span className="onboarding-input-icon">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="onboarding-modern-input"
                    placeholder="Contoh: Muhammad Farhan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="onboarding-field">
                <label className="onboarding-label">
                  Kampus / Universitas
                </label>
                <div className="onboarding-input-wrap">
                  <span className="onboarding-input-icon">
                    <GraduationCap size={16} />
                  </span>
                  <input
                    type="text"
                    className="onboarding-modern-input"
                    placeholder="Contoh: Universitas Indonesia"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>
              </div>

              <div className="onboarding-field">
                <label className="onboarding-label">
                  Program Studi / Jurusan
                </label>
                <div className="onboarding-input-wrap">
                  <span className="onboarding-input-icon">
                    <BookOpen size={16} />
                  </span>
                  <input
                    type="text"
                    className="onboarding-modern-input"
                    placeholder="Contoh: Teknik Informatika"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                  />
                </div>
              </div>

              <div className="onboarding-field">
                <label className="onboarding-label">
                  <span>Semester Aktif Saat Ini</span>
                  <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 600 }}>
                    Semester {semester}
                  </span>
                </label>
                <div className="semester-pill-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`semester-choice-pill ${semester === s ? 'active' : ''}`}
                      onClick={() => setSemester(s)}
                    >
                      <span>Sem {s}</span>
                      {semester === s && <Check size={13} style={{ color: '#2563EB' }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SIKLUS & ANGGARAN */}
          {step === 2 && (
            <div className="onboarding-form-step">
              <div className="onboarding-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="onboarding-label" style={{ margin: 0 }}>
                    Hari Kiriman Uang / Mulai Siklus
                  </label>
                  <span className="badge-cycle-day">
                    <Calendar size={13} />
                    <span>Tgl {startDayOfMonth}</span>
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px' }}>
                  Aplikasi akan mereset grafik dan kuota budget bulanan setiap tanggal ini.
                </p>

                <input
                  type="range"
                  min="1"
                  max="28"
                  value={startDayOfMonth}
                  onChange={(e) => setStartDayOfMonth(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
                />

                <div className="cycle-preset-row">
                  {[
                    { day: 1, label: 'Tgl 1 (Awal Bulan)' },
                    { day: 5, label: 'Tgl 5' },
                    { day: 25, label: 'Tgl 25 (Kiriman)' },
                    { day: 28, label: 'Tgl 28' }
                  ].map((p) => (
                    <button
                      key={p.day}
                      type="button"
                      className={`cycle-preset-btn ${startDayOfMonth === p.day ? 'active' : ''}`}
                      onClick={() => setStartDayOfMonth(p.day)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="onboarding-field" style={{ marginTop: '4px' }}>
                <label className="onboarding-label">
                  Target Alokasi Budget Bulanan
                </label>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>
                  Batas pengeluaran maksimal kamu dalam 1 periode bulanan.
                </p>

                <div className="budget-chip-row">
                  {['1.000.000', '1.500.000', '2.000.000', '2.500.000', '3.000.000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`budget-chip ${initialBudget === amt ? 'active' : ''}`}
                      onClick={() => setInitialBudget(amt)}
                    >
                      Rp {amt}
                    </button>
                  ))}
                </div>

                <div className="budget-custom-input-box">
                  <span>Rp</span>
                  <input
                    type="text"
                    value={initialBudget}
                    onChange={(e) => setInitialBudget(formatRupiahNumber(e.target.value))}
                    placeholder="1.500.000"
                  />
                </div>
              </div>

              <div className="tip-box-clean">
                <Sparkles size={20} style={{ color: '#2563EB', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    Alokasi Saku Harian Aman
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                    Kamu bisa belanja rata-rata <strong>Rp {estimatedDaily.toLocaleString('id-ID')} / hari</strong> agar pengeluaran tetap terkontrol sampai akhir bulan.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DOMPET & SALDO AWAL */}
          {step === 3 && (
            <div className="onboarding-form-step">
              <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.4' }}>
                Atur saldo awal pada akun atau dompet yang kamu gunakan sehari-hari:
              </div>

              {/* List Dompet Aktif */}
              <div className="account-setup-list">
                {accounts.map((acc) => (
                  <div key={acc.id} className="account-setup-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div className="acc-icon-box">
                        {acc.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.name}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#64748B', textTransform: 'capitalize' }}>
                          {acc.type}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <div className="input-nominal-clean">
                        <span>Rp</span>
                        <input
                          type="text"
                          value={formatRupiahNumber(acc.balance)}
                          onChange={(e) => handleUpdateBalance(acc.id, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          className="delete-acc-btn-subtle"
                          onClick={() => handleRemoveAccount(acc.id)}
                          title="Hapus dompet ini"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Tambah Dompet Kustom */}
              <div>
                {!isAddingCustom ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(true)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px dashed #CBD5E1',
                      background: '#F8FAFC',
                      color: '#2563EB',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={15} />
                    <span>+ Tambah Dompet Kustom / Lainnya</span>
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1.5px solid #BFDBFE',
                      background: '#EFF6FF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E40AF' }}>
                        Tambah Dompet Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <input
                      type="text"
                      className="onboarding-modern-input"
                      style={{ paddingLeft: '14px', background: '#FFFFFF' }}
                      placeholder="Nama Dompet (Misal: Bank Jatim, Tabungan Kos)"
                      value={customAccName}
                      onChange={(e) => setCustomAccName(e.target.value)}
                      autoFocus
                    />

                    {/* Tipe Dompet */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { type: 'bank', label: 'Bank', icon: '🏦' },
                        { type: 'ewallet', label: 'E-Wallet', icon: '📱' },
                        { type: 'cash', label: 'Tunai', icon: '💵' },
                        { type: 'other', label: 'Lainnya', icon: '💳' }
                      ].map((t) => (
                        <button
                          key={t.type}
                          type="button"
                          onClick={() => setCustomAccType(t.type)}
                          style={{
                            flex: 1,
                            padding: '6px 4px',
                            borderRadius: '8px',
                            border: customAccType === t.type ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            background: customAccType === t.type ? '#2563EB' : '#FFFFFF',
                            color: customAccType === t.type ? '#FFFFFF' : '#475569',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Saldo Awal */}
                    <div className="input-nominal-clean" style={{ background: '#FFFFFF', padding: '8px 12px' }}>
                      <span style={{ color: '#64748B' }}>Saldo Awal: Rp</span>
                      <input
                        type="text"
                        style={{ width: '100%', textAlign: 'left' }}
                        placeholder="0"
                        value={formatRupiahNumber(customAccBal)}
                        onChange={(e) => setCustomAccBal(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#475569',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomAccount}
                        disabled={!customAccName.trim()}
                        style={{
                          flex: 1.5,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#2563EB',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: !customAccName.trim() ? 0.5 : 1
                        }}
                      >
                        Simpan Dompet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tambah Cepat Pilihan Populer */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>
                  + Pilihan Cepat Bank & Dompet Populer:
                </div>
                <div className="popular-acc-chips">
                  {POPULAR_ACCOUNTS.map((item) => {
                    const isAdded = accounts.some(a => a.name.toLowerCase() === item.name.toLowerCase());
                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`popular-chip ${isAdded ? 'added' : ''}`}
                        onClick={() => handleAddPopularAccount(item)}
                        style={{
                          opacity: isAdded ? 0.6 : 1,
                          cursor: isAdded ? 'default' : 'pointer'
                        }}
                        title={isAdded ? 'Sudah ditambahkan' : `Tambah ${item.name}`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        {isAdded && <Check size={11} style={{ color: '#2563EB', marginLeft: '2px' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW KTM & SELESAI */}
          {step === 4 && (
            <div className="onboarding-form-step" style={{ textAlign: 'center' }}>
              {/* Minimalist Digital Student Card */}
              <div className="ktm-card-preview">
                <div className="ktm-card-top">
                  <div className="ktm-chip">KTM DIGITAL</div>
                  <div className="ktm-univ">{university.trim() || 'Universitas'}</div>
                </div>

                <div className="ktm-card-middle">
                  <div className="ktm-avatar-circle" style={{ overflow: 'hidden', padding: 0 }}>
                    <img src="/logo.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="ktm-user-info">
                    <div className="ktm-name">{fullName.trim() || 'Mahasiswa'}</div>
                    <div className="ktm-major">{major.trim() || 'Program Studi'}</div>
                  </div>
                </div>

                <div className="ktm-card-bottom">
                  <div className="ktm-badge-sem">Semester {semester} Aktif ⭐</div>
                  <div className="ktm-target-gpa">Target IPK: 3.80</div>
                </div>
              </div>

              {/* Ready Checklist Highlights */}
              <div className="onboarding-checklist-preview">
                <div className="onboarding-check-row">
                  <div className="onboarding-check-badge">
                    <Check size={12} />
                  </div>
                  <span>Profil akademik & Semester {semester} siap dikelola</span>
                </div>
                <div className="onboarding-check-row">
                  <div className="onboarding-check-badge">
                    <Check size={12} />
                  </div>
                  <span>{accounts.length} dompet aktif dengan saldo awal tercatat</span>
                </div>
                <div className="onboarding-check-row">
                  <div className="onboarding-check-badge">
                    <Check size={12} />
                  </div>
                  <span>Siklus bulanan dimulai setiap Tanggal {startDayOfMonth}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="onboarding-footer-actions">
          {step > 1 ? (
            <button
              type="button"
              className="onboarding-back-btn"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={15} />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              className="onboarding-next-btn"
              onClick={() => setStep(step + 1)}
            >
              <span>Lanjut</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="onboarding-finish-btn"
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Mulai Gunakan MyKuliahLife'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
