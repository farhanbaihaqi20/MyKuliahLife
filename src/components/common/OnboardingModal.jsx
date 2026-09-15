import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import {
  Sparkles,
  User,
  GraduationCap,
  Calendar,
  Wallet,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const POPULAR_ACCOUNTS = [
  // Banks
  { name: 'BCA', type: 'bank', icon: '🏦', color: '#0052CC', defaultBal: 1000000 },
  { name: 'SeaBank', type: 'bank', icon: '🏦', color: '#EA580C', defaultBal: 500000 },
  { name: 'Bank Mandiri', type: 'bank', icon: '🏦', color: '#0284C7', defaultBal: 1000000 },
  { name: 'BRI', type: 'bank', icon: '🏦', color: '#00529C', defaultBal: 1000000 },
  { name: 'BNI', type: 'bank', icon: '🏦', color: '#F15A24', defaultBal: 1000000 },
  { name: 'BSI', type: 'bank', icon: '🏦', color: '#00A39D', defaultBal: 500000 },
  { name: 'Bank Jago', type: 'bank', icon: '🏦', color: '#FF7A00', defaultBal: 500000 },
  { name: 'CIMB Niaga', type: 'bank', icon: '🏦', color: '#8B0000', defaultBal: 500000 },
  // E-Wallets
  { name: 'GoPay', type: 'ewallet', icon: '📱', color: '#00AED6', defaultBal: 150000 },
  { name: 'DANA', type: 'ewallet', icon: '📱', color: '#10B981', defaultBal: 100000 },
  { name: 'OVO', type: 'ewallet', icon: '📱', color: '#4C3494', defaultBal: 100000 },
  { name: 'ShopeePay', type: 'ewallet', icon: '🛍️', color: '#EE4D2D', defaultBal: 100000 },
  // Cash
  { name: 'Uang Tunai / Cash', type: 'cash', icon: '💵', color: '#059669', defaultBal: 50000 }
];

export const OnboardingModal = () => {
  const {
    isOnboardingOpen,
    completeOnboarding,
    data,
    user
  } = useApp();

  const [step, setStep] = useState(1);

  // Form states - Empty by default so new user doesn't have to delete dummy text
  const [fullName, setFullName] = useState(() => {
    const existing = data.profile?.fullName || user?.user_metadata?.full_name || '';
    return (existing === 'Mahasiswa Baru' || existing === 'Nama Lengkap Anda') ? '' : existing;
  });
  const [university, setUniversity] = useState(() => {
    const existing = data.profile?.university || '';
    return (existing === 'Universitas' || existing === 'Universitas Indonesia') ? '' : existing;
  });
  const [major, setMajor] = useState(() => {
    const existing = data.profile?.major || '';
    return (existing === 'Program Studi' || existing === 'Teknik Informatika') ? '' : existing;
  });
  const [semester, setSemester] = useState(data.activeSemester || 1);
  const [startDayOfMonth, setStartDayOfMonth] = useState(1);
  const [initialBudget, setInitialBudget] = useState('1.500.000');

  // Wallets
  const [accounts, setAccounts] = useState(() => {
    if (data?.accounts && data.accounts.length > 0) {
      return data.accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type || 'bank',
        balance: a.balance || 0,
        isPrimary: Boolean(a.isPrimary),
        icon: a.icon || (a.type === 'bank' ? '🏦' : a.type === 'ewallet' ? '📱' : '💵'),
        color: a.color || '#1665D8'
      }));
    }
    return [
      { id: 'acc-1', name: 'Uang Tunai / Cash', type: 'cash', balance: 50000, isPrimary: true, icon: '💵', color: '#059669' }
    ];
  });

  // Custom Wallet Creation state in Step 3
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customAccName, setCustomAccName] = useState('');
  const [customAccBal, setCustomAccBal] = useState('');
  const [customAccType, setCustomAccType] = useState('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOnboardingOpen) return null;

  const handleAddPopularAccount = (item) => {
    if (accounts.some(a => a.name.toLowerCase() === item.name.toLowerCase())) return;
    setAccounts([
      ...accounts,
      {
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        type: item.type,
        balance: item.defaultBal,
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
    try {
      await completeOnboarding({
        profile: {
          fullName: fullName.trim() || 'Mahasiswa',
          university: university.trim() || 'Universitas',
          major: major.trim() || 'Program Studi',
          semester: Number(semester) || 1
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
        {/* Header Progress Bar */}
        <div className="onboarding-progress-header">
          <div className="progress-steps-indicator">
            <span className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</span>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
            <span className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</span>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
            <span className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</span>
            <div className={`step-line ${step >= 4 ? 'active' : ''}`} />
            <span className={`step-dot ${step >= 4 ? 'active' : ''}`}>4</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <span className="onboarding-step-badge">Langkah {step} dari 4</span>
            <h3 className="onboarding-step-title">
              {step === 1 && 'Identitas & Semester Mahasiswa'}
              {step === 2 && 'Siklus & Anggaran Belanja'}
              {step === 3 && 'Atur Dompet & Saldo Awal'}
              {step === 4 && 'Selamat Datang di MyKuliahLife!'}
            </h3>
          </div>
        </div>

        {/* Content Body per Step */}
        <div className="onboarding-content-body">
          {/* STEP 1: IDENTITAS */}
          {step === 1 && (
            <div className="onboarding-form-step">
              <div className="form-field">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Contoh: Farhan Baihaqi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Kampus / Universitas</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Contoh: Universitas Indonesia"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Program Studi / Jurusan</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Contoh: Teknik Informatika"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Semester Aktif Awal
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginLeft: '6px' }}>
                    (Bisa dikelola kapan saja di Profil)
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
                      {semester === s && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SIKLUS & ANGGARAN */}
          {step === 2 && (
            <div className="onboarding-form-step">
              <div className="form-field">
                <label className="form-label">
                  Tanggal Mulai Siklus / Hari Kiriman Uang
                </label>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '-4px 0 10px' }}>
                  Aplikasi akan mereset hitungan budget bulanan setiap tanggal ini.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="1"
                    max="28"
                    value={startDayOfMonth}
                    onChange={(e) => setStartDayOfMonth(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#1665D8', height: '6px' }}
                  />
                  <span className="badge-cycle-day">Tanggal {startDayOfMonth}</span>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Rencana Alokasi Budget Bulanan
                </label>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '-4px 0 8px' }}>
                  Batas pengeluaran bulanan yang kamu rencanakan.
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

                <div className="auth-input-wrapper" style={{ marginTop: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#1665D8', marginRight: '6px' }}>Rp</span>
                  <input
                    type="text"
                    className="auth-input-raw"
                    value={initialBudget}
                    onChange={(e) => setInitialBudget(formatRupiahNumber(e.target.value))}
                    placeholder="1.500.000"
                  />
                </div>
              </div>

              <div className="tip-box-clean">
                <Sparkles size={20} style={{ color: '#1665D8', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    Alokasi Saku Harian Aman
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Kamu bisa membelanjakan rata-rata <strong>Rp {estimatedDaily.toLocaleString('id-ID')} / hari</strong> agar pengeluaranmu tetap terkontrol.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DOMPET & SALDO AWAL */}
          {step === 3 && (
            <div className="onboarding-form-step">
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                Sesuaikan saldo awal pada rekening atau dompet aktifmu:
              </div>

              {/* List Dompet Aktif yang Akan Disimpan */}
              <div className="account-setup-list">
                {accounts.map((acc) => (
                  <div key={acc.id} className="account-setup-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{acc.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.name}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'capitalize' }}>{acc.type}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div className="input-nominal-micro">
                        <span>Rp</span>
                        <input
                          type="text"
                          value={formatRupiahNumber(acc.balance)}
                          onChange={(e) => handleUpdateBalance(acc.id, e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="delete-acc-btn"
                        onClick={() => handleRemoveAccount(acc.id)}
                        title="Hapus dompet ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Tambah Dompet Kustom (Bebas) */}
              <div style={{ marginTop: '14px' }}>
                {!isAddingCustom ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(true)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1.5px dashed #2563EB',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={16} />
                    <span>+ Tambah Dompet Kustom (Bebas / Custom)</span>
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid #BFDBFE',
                      background: '#F8FAFC',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        Tambah Dompet Baru (Kustom)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Nama Dompet (Misal: BSI Syariah, Tabungan Kos, dll)"
                        value={customAccName}
                        onChange={(e) => setCustomAccName(e.target.value)}
                        autoFocus
                      />
                    </div>

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
                            background: customAccType === t.type ? '#EFF6FF' : '#FFFFFF',
                            color: customAccType === t.type ? '#1E40AF' : '#475569',
                            fontSize: '11px',
                            fontWeight: 700,
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
                    <div className="input-nominal-micro" style={{ width: '100%', boxSizing: 'border-box' }}>
                      <span style={{ color: '#64748B' }}>Saldo Awal: Rp</span>
                      <input
                        type="text"
                        style={{ width: '100%' }}
                        placeholder="0"
                        value={formatRupiahNumber(customAccBal)}
                        onChange={(e) => setCustomAccBal(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsAddingCustom(false)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAddCustomAccount}
                        disabled={!customAccName.trim()}
                        style={{ flex: 1.5, padding: '8px 12px', fontSize: '12px' }}
                      >
                        Simpan Dompet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tambah Cepat Pilihan Populer */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>
                  + Pilihan Cepat Bank & E-Wallet Populer:
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
                          backgroundColor: isAdded ? '#EFF6FF' : '#F8FAFC',
                          borderColor: isAdded ? '#93C5FD' : '#E2E8F0',
                          cursor: isAdded ? 'default' : 'pointer'
                        }}
                        title={isAdded ? 'Sudah ditambahkan' : `Tambah ${item.name}`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        {isAdded && <Check size={12} style={{ color: '#2563EB', marginLeft: '2px' }} />}
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
                  <div className="ktm-univ">{university || 'Universitas'}</div>
                </div>

                <div className="ktm-card-middle">
                  <div className="ktm-avatar-circle">🎓</div>
                  <div className="ktm-user-info">
                    <div className="ktm-name">{fullName || 'Mahasiswa'}</div>
                    <div className="ktm-major">{major || 'Program Studi'}</div>
                  </div>
                </div>

                <div className="ktm-card-bottom">
                  <div className="ktm-badge-sem">Semester {semester} Aktif ⭐</div>
                  <div className="ktm-target-gpa">Target IPK: 3.80</div>
                </div>
              </div>

              <div style={{ margin: '18px 0 6px', color: '#0F172A', fontWeight: 800, fontSize: '16px' }}>
                Setup Profil Selesai! 🎉
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', maxWidth: '340px', margin: '0 auto' }}>
                Semua konfigurasi awal selesai. Kamu bisa langsung mengelola pengeluaran harian dan aktivitas akademikmu.
              </p>
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
              <ArrowLeft size={16} />
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
              <ArrowRight size={16} />
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
