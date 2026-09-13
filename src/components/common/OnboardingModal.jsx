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
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';

const POPULAR_ACCOUNTS = [
  { name: 'BCA', type: 'bank', icon: '🏦', color: '#0052CC', defaultBal: 1000000 },
  { name: 'SeaBank', type: 'bank', icon: '🏦', color: '#EA580C', defaultBal: 500000 },
  { name: 'Bank Mandiri', type: 'bank', icon: '🏦', color: '#0284C7', defaultBal: 1000000 },
  { name: 'GoPay', type: 'ewallet', icon: '📱', color: '#00AED6', defaultBal: 150000 },
  { name: 'DANA', type: 'ewallet', icon: '📱', color: '#10B981', defaultBal: 100000 },
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

  // Form states
  const [fullName, setFullName] = useState(data.profile?.fullName || user?.user_metadata?.full_name || '');
  const [university, setUniversity] = useState(data.profile?.university || 'Universitas Indonesia');
  const [major, setMajor] = useState(data.profile?.major || 'Teknik Informatika');
  const [semester, setSemester] = useState(data.activeSemester || 1);
  const [startDayOfMonth, setStartDayOfMonth] = useState(1);
  const [initialBudget, setInitialBudget] = useState('1.500.000');

  // Wallets
  const [accounts, setAccounts] = useState([
    { id: 'acc-1', name: 'BCA / Rekening Utama', type: 'bank', balance: 1000000, isPrimary: true, icon: '🏦', color: '#0052CC' },
    { id: 'acc-2', name: 'GoPay / E-Wallet', type: 'ewallet', balance: 150000, isPrimary: false, icon: '📱', color: '#00AED6' },
    { id: 'acc-3', name: 'Uang Tunai / Cash', type: 'cash', balance: 50000, isPrimary: false, icon: '💵', color: '#059669' }
  ]);

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
    e.preventDefault();
    if (!customAccName.trim()) return;
    setAccounts([
      ...accounts,
      {
        id: `acc-${Date.now()}`,
        name: customAccName.trim(),
        type: customAccType,
        balance: parseRupiahNumber(customAccBal) || 0,
        isPrimary: accounts.length === 0,
        icon: customAccType === 'bank' ? '🏦' : (customAccType === 'ewallet' ? '📱' : '💵'),
        color: '#1665D8'
      }
    ]);
    setCustomAccName('');
    setCustomAccBal('');
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

          <div className="onboarding-title-box">
            <div className="onboarding-step-badge">Langkah {step} dari 4</div>
            <h2 className="onboarding-step-title">
              {step === 1 && 'Identitas & Semester Mahasiswa'}
              {step === 2 && 'Siklus & Anggaran Keuangan'}
              {step === 3 && 'Atur Dompet & Saldo Awal'}
              {step === 4 && 'Kartu Mahasiswa & Siap Mulai'}
            </h2>
          </div>
        </div>

        {/* Step Body */}
        <div className="onboarding-content-body">
          {/* STEP 1: IDENTITAS MAHASISWA */}
          {step === 1 && (
            <div className="onboarding-form-step">
              <div className="form-field">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Nama Lengkap Anda"
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
                  placeholder="Nama Universitas / Institut / Politeknik"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Program Studi / Jurusan</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Teknik Informatika, Ilmu Komunikasi"
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

              <div className="form-field" style={{ marginTop: '16px' }}>
                <label className="form-label">Estimasi Budget Bulanan</label>
                <div className="budget-chip-row">
                  {['1.000.000', '1.500.000', '2.500.000', '4.000.000'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`budget-chip ${initialBudget === chip ? 'active' : ''}`}
                      onClick={() => setInitialBudget(chip)}
                    >
                      Rp {chip}
                    </button>
                  ))}
                </div>
                <div className="input-group" style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#1665D8', padding: '0 12px' }}>Rp</span>
                  <input
                    type="text"
                    className="auth-input"
                    value={initialBudget}
                    onChange={(e) => setInitialBudget(formatRupiahNumber(e.target.value))}
                    placeholder="1.500.000"
                  />
                </div>
              </div>

              <div className="tip-box-clean">
                <div style={{ fontSize: '22px' }}>💡</div>
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

              <div className="account-setup-list">
                {accounts.map((acc) => (
                  <div key={acc.id} className="account-setup-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <span style={{ fontSize: '20px' }}>{acc.icon}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{acc.name}</div>
                        <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'capitalize' }}>{acc.type}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

              {/* Tambah Cepat Pilihan Populer */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>
                  + Tambah Cepat Dompet Populer:
                </div>
                <div className="popular-acc-chips">
                  {POPULAR_ACCOUNTS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      className="popular-chip"
                      onClick={() => handleAddPopularAccount(item)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
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
                  <div className="ktm-univ">{university}</div>
                </div>

                <div className="ktm-card-middle">
                  <div className="ktm-avatar-circle">🎓</div>
                  <div className="ktm-user-info">
                    <div className="ktm-name">{fullName || 'Mahasiswa'}</div>
                    <div className="ktm-major">{major}</div>
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
                Seluruh pengaturan semester dan data akademik selanjutnya dapat kamu kelola dan perbarui secara fleksibel di halaman <strong>Profil Mahasiswa</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="onboarding-footer">
          {step > 1 ? (
            <button
              type="button"
              className="onboarding-back-btn"
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
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
              <Check size={18} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Mulai Gunakan MyUang'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
