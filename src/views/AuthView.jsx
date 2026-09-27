import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles, ShieldCheck, Compass, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import GoogleIcon from '../components/auth/GoogleIcon';

export const AuthView = () => {
  const { login, loginWithGoogle, register, resetPassword, checkEmailRegistered, enterGuestMode } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailUnregistered, setIsEmailUnregistered] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsGoogleLoading(true);

    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memulai autentikasi Google. Silakan periksa kembali konfigurasi Supabase.');
        setIsGoogleLoading(false);
      }
      // On success, window redirects automatically to Google
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menghubungkan ke akun Google.');
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsEmailUnregistered(false);

    if (!email.trim()) {
      setErrorMsg('Harap masukkan alamat email mahasiswa Anda.');
      return;
    }

    setLoading(true);
    try {
      // 1. Cek apakah email terdaftar di database
      const exists = await checkEmailRegistered(email);
      if (exists === false) {
        setIsEmailUnregistered(true);
        setErrorMsg('Email ini belum terdaftar di MyKuliahLife. Silakan buat akun baru terlebih dahulu.');
        setLoading(false);
        return;
      }

      // 2. Kirim email pemulihan
      const res = await resetPassword(email);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengirim email pemulihan.');
      } else {
        setSuccessMsg(`Tautan pemulihan kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk atau folder spam email Anda.`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses pemulihan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
        }
      } else {
        const res = await register(email, password, { full_name: fullName.trim() || 'Mahasiswa' });
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal mendaftar. Silakan coba lagi.');
        } else {
          if (res.data?.user && !res.data?.session) {
            setSuccessMsg('Pendaftaran berhasil! Cek kotak masuk email Anda untuk konfirmasi, atau langsung login jika konfirmasi email dinonaktifkan.');
            setMode('login');
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kendala saat menghubungi server Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-wrapper">
      {/* Dynamic Ambient Background Elements */}
      <div className="auth-ambient-glow auth-glow-1" />
      <div className="auth-ambient-glow auth-glow-2" />
      <div className="auth-ambient-glow auth-glow-3" />

      <div className="auth-modern-container">
        {/* Brand Header */}
        <header className="auth-modern-header">
          <div className="auth-modern-brand-badge">
            <span className="brand-emoji">🎓</span>
            <div className="brand-dot-pulse" />
          </div>
          <h1 className="auth-modern-title">MyKuliahLife</h1>
          <p className="auth-modern-subtitle">
            Manajemen Keuangan & Kehidupan Kuliah Terpadu
          </p>
        </header>

        {/* Main Glassmorphic Auth Card */}
        <div className="auth-modern-card">
          {/* Alerts */}
          {errorMsg && (
            <div className="auth-modern-alert error">
              <AlertCircle size={16} className="alert-icon" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isEmailUnregistered && (
            <button
              type="button"
              className="auth-primary-submit-btn"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
                setIsEmailUnregistered(false);
              }}
              style={{
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                boxShadow: '0 6px 18px -4px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>Daftar Akun Baru Sekarang</span>
              <ArrowRight size={17} />
            </button>
          )}

          {successMsg && (
            <div className="auth-modern-alert success">
              <CheckCircle2 size={16} className="alert-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: Forgot Password View */}
          {mode === 'forgot' ? (
            <div className="auth-forgot-panel">
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className="auth-back-link-inline"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '10px'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Masuk</span>
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  Lupa Kata Sandi?
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                  Masukkan email mahasiswa yang terdaftar. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="auth-modern-form">
                <div className="auth-field-group">
                  <label className="auth-field-label">Email Terdaftar</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-modern-input"
                      placeholder="nama@kampus.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-btn-spinner-wrap">
                      <span className="auth-btn-spinner" />
                      <span>Mengirim Tautan...</span>
                    </span>
                  ) : (
                    <>
                      <span>Kirim Tautan Pemulihan</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Google Single Sign-On Button */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || loading}
              >
                {isGoogleLoading ? (
                  <span className="google-spinner-wrap">
                    <span className="auth-btn-spinner" />
                    <span>Membuka Google OAuth...</span>
                  </span>
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    <span className="google-btn-text">
                      {mode === 'login' ? 'Lanjutkan dengan Google' : 'Daftar dengan Google'}
                    </span>
                  </>
                )}
              </button>

              {/* Modern Elegant Divider */}
              <div className="auth-modern-divider">
                <span className="divider-line" />
                <span className="divider-text">atau dengan email</span>
                <span className="divider-line" />
              </div>

              {/* Segmented Mode Switcher */}
              <div className="auth-modern-tabs">
                <button
                  type="button"
                  className={`auth-modern-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  className={`auth-modern-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  Daftar Akun
                </button>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="auth-modern-form">
                {mode === 'register' && (
                  <div className="auth-field-group">
                    <label className="auth-field-label">Nama Lengkap</label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-modern-input"
                        placeholder="Contoh: Farhan Rizki"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading || isGoogleLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="auth-field-group">
                  <label className="auth-field-label">Email Mahasiswa</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-modern-input"
                      placeholder="nama@kampus.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || isGoogleLoading}
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="auth-field-label">Kata Sandi</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="auth-forgot-link-btn"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-modern-input"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || isGoogleLoading}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      aria-label="Tampilkan atau sembunyikan kata sandi"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={loading || isGoogleLoading}
                >
                  {loading ? (
                    <span className="auth-btn-spinner-wrap">
                      <span className="auth-btn-spinner" />
                      <span>Memverifikasi Akun...</span>
                    </span>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Masuk ke Dashboard' : 'Mulai Sekarang'}</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Demo Mode Action (Preserved for Testing and Guest Exploration) */}
        <div className="auth-guest-section">
          <div className="guest-section-header">
            <span>Ingin melihat fitur tanpa membuat akun?</span>
          </div>
          <button
            type="button"
            className="auth-modern-guest-btn"
            onClick={enterGuestMode}
            disabled={loading || isGoogleLoading}
          >
            <div className="guest-btn-content">
              <div className="guest-btn-badge">
                <Compass size={16} />
              </div>
              <div className="guest-btn-text">
                <span className="guest-btn-title">Mode Demo Tamu (Guest Mode)</span>
                <span className="guest-btn-subtitle">Coba simulasi data kampus lengkap secara instan</span>
              </div>
            </div>
            <Sparkles size={16} className="guest-btn-sparkle" />
          </button>
        </div>

        {/* Security & Cloud Trust Footer */}
        <footer className="auth-modern-footer">
          <div className="auth-trust-badge">
            <ShieldCheck size={14} className="trust-icon" />
            <span>Keamanan data terlindungi dengan enkripsi Supabase & Google Cloud</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AuthView;
