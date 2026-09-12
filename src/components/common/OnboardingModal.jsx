import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import { Sparkles, User, Calendar, Wallet, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingModal = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    resetToDemoData
  } = useApp();

  const [step, setStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState(1);
  const [startDayOfMonth, setStartDayOfMonth] = useState(1);
  const [initialBudget, setInitialBudget] = useState('1.500.000');

  // Wallets
  const [accounts, setAccounts] = useState([
    { id: 'acc-1', name: 'BCA / Bank Utama', type: 'bank', balance: 1000000, isPrimary: true, icon: '🏦', color: '#0052CC' },
    { id: 'acc-2', name: 'GoPay / E-Wallet', type: 'ewallet', balance: 150000, isPrimary: false, icon: '📱', color: '#00AED6' },
    { id: 'acc-3', name: 'Uang Tunai / Cash', type: 'cash', balance: 50000, isPrimary: false, icon: '💵', color: '#10B981' }
  ]);

  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccType, setNewAccType] = useState('bank');

  if (!isOnboardingOpen) return null;

  const handleAddAccount = () => {
    if (!newAccName.trim()) return;
    const newAcc = {
      id: `acc-${Date.now()}`,
      name: newAccName,
      type: newAccType,
      balance: parseRupiahNumber(newAccBalance) || 0,
      isPrimary: accounts.length === 0,
      icon: newAccType === 'bank' ? '🏦' : (newAccType === 'ewallet' ? '📱' : '💵'),
      color: '#1665D8'
    };
    setAccounts([...accounts, newAcc]);
    setNewAccName('');
    setNewAccBalance('');
  };

  const handleRemoveAccount = (id) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const handleFinish = () => {
    completeOnboarding({
      profile: {
        fullName: fullName || 'Mahasiswa Mandiri',
        university: university || 'Kampus Tercinta',
        major: major || 'Program Studi',
        semester: Number(semester) || 1
      },
      startDayOfMonth: Number(startDayOfMonth) || 1,
      initialAccounts: accounts,
      initialBudget: parseRupiahNumber(initialBudget) || 1000000
    });
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-bottom-sheet" style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle-bar" />

        {/* Step Indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1665D8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Setup Mahasiswa Baru • Langkah {step} dari 3
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {step === 1 && 'Identitas & Semester Aktif'}
              {step === 2 && 'Siklus Keuangan & Budget'}
              {step === 3 && 'Atur Dompet & Saldo Awal'}
            </h3>
          </div>

          <button
            type="button"
            onClick={resetToDemoData}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748B',
              background: '#F1F5F9',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            title="Muat data contoh siap pakai"
          >
            Muat Data Demo
          </button>
        </div>

        {/* STEP 1: Profil Mahasiswa & Semester Aktif */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Selamat datang! Mari sesuaikan aplikasi ini dengan profil dan semester kuliahmu sekarang.
            </p>

            <div className="input-group">
              <label className="input-label">Nama Lengkap / Panggilan</label>
              <input
                type="text"
                placeholder="cth: Farhan Han"
                className="input-field"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Perguruan Tinggi / Kampus</label>
              <input
                type="text"
                placeholder="cth: Universitas Indonesia"
                className="input-field"
                value={university}
                onChange={e => setUniversity(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Program Studi / Jurusan</label>
              <input
                type="text"
                placeholder="cth: Teknik Informatika / Sistem Informasi"
                className="input-field"
                value={major}
                onChange={e => setMajor(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Semester Aktif Saat Ini</label>
              <select
                className="input-field"
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Jadwal, tugas, dan catatan akan dikelompokkan otomatis di Semester {semester} ini.
              </span>
            </div>

            <button className="btn-primary" onClick={() => setStep(2)} style={{ marginTop: '16px' }}>
              Lanjut ke Siklus Keuangan <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Siklus Keuangan & Budget Bulanan */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Tentukan kapan siklus uang sakumu dimulai agar perhitungan harian akurat.
            </p>

            <div className="input-group">
              <label className="input-label">Tanggal Mulai Siklus / Uang Saku Masuk</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: startDayOfMonth === 1 ? '2px solid #1665D8' : '1px solid #CBD5E1',
                    background: startDayOfMonth === 1 ? '#EFF6FF' : '#FFFFFF',
                    color: startDayOfMonth === 1 ? '#1665D8' : '#334155',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setStartDayOfMonth(1)}
                >
                  Tanggal 1 (Awal Bulan)
                </button>
                <button
                  type="button"
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: startDayOfMonth === 25 ? '2px solid #1665D8' : '1px solid #CBD5E1',
                    background: startDayOfMonth === 25 ? '#EFF6FF' : '#FFFFFF',
                    color: startDayOfMonth === 25 ? '#1665D8' : '#334155',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setStartDayOfMonth(25)}
                >
                  Tanggal 25 (Gajian)
                </button>
              </div>

              <input
                type="number"
                min="1"
                max="28"
                className="input-field"
                value={startDayOfMonth}
                onChange={e => setStartDayOfMonth(Number(e.target.value))}
                placeholder="Atau masukkan tanggal (1 - 28)"
              />
            </div>

            <div className="input-group" style={{ marginTop: '14px' }}>
              <label className="input-label">Target Anggaran / Budget Bulanan (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1.500.000"
                className="input-field"
                value={initialBudget}
                onChange={e => setInitialBudget(formatRupiahNumber(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                Kembali
              </button>
              <button className="btn-primary" onClick={() => setStep(3)}>
                Lanjut ke Atur Dompet <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Dompet & Saldo Awal */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
              Masukkan dompet/rekening bank yang kamu miliki beserta saldo saat ini:
            </p>

            {/* List current accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '10px 14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{acc.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{acc.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{acc.type.toUpperCase()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1665D8' }}>
                      Rp {acc.balance.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(acc.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new account mini form */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>
                + Tambah Dompet Lainnya
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Nama Dompet (cth: OVO, BCA)"
                  className="input-field"
                  style={{ padding: '8px 10px', fontSize: '12px' }}
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                />
                <select
                  className="input-field"
                  style={{ padding: '8px 10px', fontSize: '12px' }}
                  value={newAccType}
                  onChange={e => setNewAccType(e.target.value)}
                >
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="cash">Tunai</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Saldo Awal (Rp)"
                  className="input-field"
                  style={{ padding: '8px 10px', fontSize: '12px' }}
                  value={newAccBalance}
                  onChange={e => setNewAccBalance(formatRupiahNumber(e.target.value))}
                />
                <button
                  type="button"
                  onClick={handleAddAccount}
                  style={{
                    background: '#1665D8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Tambah
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>
                Kembali
              </button>
              <button className="btn-primary" onClick={handleFinish}>
                <Check size={18} /> Selesai & Masuk Aplikasi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
