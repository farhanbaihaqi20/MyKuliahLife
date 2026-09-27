import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles, ShieldCheck, Compass, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import GoogleIcon from '../components/auth/GoogleIcon';

export const AuthView = () => {
  const { login, loginWithGoogle, register, resetPassword, enterGuestMode, verifySignupOtp, resendSignupOtp } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify_otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP Verification States
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef([]);

  // Rate Limiting & Brute-Force Lockout States (persisted in sessionStorage)
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const saved = parseInt(sessionStorage.getItem('mkl_auth_login_attempts') || '0', 10);
    return Number.isNaN(saved) ? 0 : saved;
  });
  const [loginLockoutUntil, setLoginLockoutUntil] = useState(() => {
    const saved = parseInt(sessionStorage.getItem('mkl_auth_login_lockout') || '0', 10);
    return Number.isNaN(saved) ? 0 : saved;
  });
  const [loginCountdown, setLoginCountdown] = useState(0);

  const [forgotCooldownUntil, setForgotCooldownUntil] = useState(() => {
    const saved = parseInt(sessionStorage.getItem('mkl_auth_forgot_cooldown') || '0', 10);
    return Number.isNaN(saved) ? 0 : saved;
  });
  const [forgotCountdown, setForgotCountdown] = useState(0);

  const [registerCooldownUntil, setRegisterCooldownUntil] = useState(() => {
    const saved = parseInt(sessionStorage.getItem('mkl_auth_register_cooldown') || '0', 10);
    return Number.isNaN(saved) ? 0 : saved;
  });
  const [registerCountdown, setRegisterCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (loginLockoutUntil > now) {
        setLoginCountdown(Math.ceil((loginLockoutUntil - now) / 1000));
      } else {
        setLoginCountdown(0);
      }

      if (forgotCooldownUntil > now) {
        setForgotCountdown(Math.ceil((forgotCooldownUntil - now) / 1000));
      } else {
        setForgotCountdown(0);
      }

      if (registerCooldownUntil > now) {
        setRegisterCountdown(Math.ceil((registerCooldownUntil - now) / 1000));
      } else {
        setRegisterCountdown(0);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [loginLockoutUntil, forgotCooldownUntil, registerCooldownUntil]);

  // Cooldown effect for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const token = otpDigits.join('').trim();
    if (token.length < 6) {
      setErrorMsg('Harap masukkan 6 digit kode verifikasi lengkap.');
      return;
    }

    setOtpLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetEmail = pendingEmail || email;
      const res = await verifySignupOtp(targetEmail, token);
      if (!res.success) {
        setErrorMsg(res.error || 'Kode verifikasi salah atau sudah kadaluarsa. Periksa kembali kotak masuk email Anda.');
      } else {
        setSuccessMsg('Verifikasi berhasil! Mengalihkan ke dashboard...');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memverifikasi kode.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetEmail = pendingEmail || email;
      const res = await resendSignupOtp(targetEmail);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengirim ulang kode konfirmasi. Silakan coba sesaat lagi.');
      } else {
        setSuccessMsg(`Kode verifikasi baru telah dikirim ke ${targetEmail}.`);
        setResendCooldown(60);
      }
    } catch (err) {
      setErrorMsg('Gagal mengirim ulang kode konfirmasi.');
    }
  };

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
    if (forgotCountdown > 0) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Harap masukkan alamat email mahasiswa Anda.');
      return;
    }

    setLoading(true);
    try {
      // Panggil reset password langsung tanpa ekspos RPC publik (mencegah email enumeration)
      const res = await resetPassword(email);

      // Cooldown 60 detik setelah setiap pengiriman pemulihan kata sandi
      const cooldownTime = Date.now() + 60000;
      setForgotCooldownUntil(cooldownTime);
      sessionStorage.setItem('mkl_auth_forgot_cooldown', cooldownTime.toString());

      if (!res.success) {
        if (res.error?.toLowerCase().includes('rate limit') || res.error?.toLowerCase().includes('security purposes')) {
          setErrorMsg('Batas pengiriman email keamanan tercapai. Harap tunggu beberapa saat sebelum mencoba lagi.');
        } else {
          // Respon netral demi mencegah email enumeration (OWASP recommendation)
          setSuccessMsg(`Jika email ${email} terdaftar di MyKuliahLife, instruksi dan tautan pemulihan kata sandi telah dikirim. Silakan periksa kotak masuk atau folder spam Anda.`);
        }
      } else {
        setSuccessMsg(`Jika email ${email} terdaftar di MyKuliahLife, instruksi dan tautan pemulihan kata sandi telah dikirim. Silakan periksa kotak masuk atau folder spam Anda.`);
      }
    } catch (err) {
      setErrorMsg('Terjadi kendala saat memproses permintaan pemulihan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'login' && loginCountdown > 0) {
      setErrorMsg(`Akses masuk sementara dikunci demi keamanan. Silakan tunggu ${loginCountdown} detik.`);
      return;
    }

    if (mode === 'register' && registerCountdown > 0) {
      setErrorMsg(`Harap tunggu ${registerCountdown} detik sebelum mendaftarkan akun baru.`);
      return;
    }

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
          if (res.error?.toLowerCase().includes('not confirmed') || res.error?.toLowerCase().includes('confirm')) {
            setPendingEmail(email.trim());
            setMode('verify_otp');
            setOtpDigits(['', '', '', '', '', '']);
            setErrorMsg('Email Anda belum dikonfirmasi. Masukkan kode 6 digit dari email atau klik tautan konfirmasi Anda.');
            return;
          }

          const nextAttempts = loginAttempts + 1;
          setLoginAttempts(nextAttempts);
          sessionStorage.setItem('mkl_auth_login_attempts', nextAttempts.toString());

          if (nextAttempts >= 5) {
            const lockoutUntil = Date.now() + 60000;
            setLoginLockoutUntil(lockoutUntil);
            sessionStorage.setItem('mkl_auth_login_lockout', lockoutUntil.toString());
            setErrorMsg('Terlalu banyak percobaan masuk yang gagal. Formulir masuk dikunci selama 60 detik demi keamanan akun.');
          } else {
            const remaining = 5 - nextAttempts;
            setErrorMsg(
              (res.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.') +
              ` (Tersisa ${remaining} kesempatan sebelum dikunci 60 detik)`
            );
          }
        } else {
          // Berhasil login: reset percobaan
          setLoginAttempts(0);
          setLoginLockoutUntil(0);
          sessionStorage.removeItem('mkl_auth_login_attempts');
          sessionStorage.removeItem('mkl_auth_login_lockout');
        }
      } else {
        const res = await register(email, password, { full_name: fullName.trim() || 'Mahasiswa' });
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal mendaftar. Silakan coba lagi.');
        } else {
          // Cooldown 30 detik setelah pendaftaran
          const cooldownTime = Date.now() + 30000;
          setRegisterCooldownUntil(cooldownTime);
          sessionStorage.setItem('mkl_auth_register_cooldown', cooldownTime.toString());

          if (res.data?.user && !res.data?.session) {
            setPendingEmail(email.trim());
            setMode('verify_otp');
            setOtpDigits(['', '', '', '', '', '']);
            setSuccessMsg(`Pendaftaran berhasil! Kode verifikasi 6 digit telah dikirim ke ${email.trim()}. Masukkan kode di bawah ini atau klik tautan di email kamu.`);
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

          {successMsg && (
            <div className="auth-modern-alert success">
              <CheckCircle2 size={16} className="alert-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 0: Verify OTP View */}
          {mode === 'verify_otp' ? (
            <div className="auth-otp-panel" style={{ animation: 'authFadeUp 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    boxShadow: '0 8px 18px -4px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <KeyRound size={26} />
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Verifikasi Email Mahasiswa
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 auto', maxWidth: '320px', lineHeight: 1.5 }}>
                  Masukkan 6 digit kode yang dikirim ke <strong style={{ color: '#1E293B' }}>{pendingEmail || email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="auth-modern-form">
                {/* 6 Digit Inputs */}
                <div className="auth-otp-boxes-container">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className={`auth-otp-box ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      disabled={otpLoading}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={otpLoading || otpDigits.join('').length < 6}
                >
                  {otpLoading ? (
                    <span className="auth-btn-spinner-wrap">
                      <span className="auth-btn-spinner" />
                      <span>Memverifikasi Kode...</span>
                    </span>
                  ) : (
                    <>
                      <span>Verifikasi & Masuk</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Informative Dual Option Box (Click Link OR Enter Code) */}
              <div className="auth-otp-dual-notice">
                <span className="dual-notice-badge">💡 Opsi Bebas</span>
                <p className="dual-notice-text">
                  Selain mengetik kode, kamu juga bisa <strong>langsung klik tombol konfirmasi</strong> di emailmu. Halaman ini akan mendeteksi otomatis saat akunmu aktif!
                </p>
              </div>

              {/* Action Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || otpLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94A3B8' : '#2563EB',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: '4px'
                  }}
                >
                  {resendCooldown > 0 ? `Kirim Ulang Kode (${resendCooldown}s)` : 'Belum menerima kode? Kirim Ulang'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  Ganti Email atau Kembali ke Masuk
                </button>
              </div>
            </div>
          ) : mode === 'forgot' ? (
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
                      disabled={loading || forgotCountdown > 0}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-submit-btn"
                  disabled={loading || forgotCountdown > 0}
                >
                  {loading ? (
                    <span className="auth-btn-spinner-wrap">
                      <span className="auth-btn-spinner" />
                      <span>Mengirim Tautan...</span>
                    </span>
                  ) : forgotCountdown > 0 ? (
                    <span>Kirim Ulang ({forgotCountdown}s)</span>
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
                disabled={isGoogleLoading || loading || (mode === 'login' && loginCountdown > 0)}
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
                        disabled={loading || isGoogleLoading || (mode === 'register' && registerCountdown > 0)}
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
                      disabled={loading || isGoogleLoading || (mode === 'login' && loginCountdown > 0) || (mode === 'register' && registerCountdown > 0)}
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
                      disabled={loading || isGoogleLoading || (mode === 'login' && loginCountdown > 0) || (mode === 'register' && registerCountdown > 0)}
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
                  disabled={loading || isGoogleLoading || (mode === 'login' && loginCountdown > 0) || (mode === 'register' && registerCountdown > 0)}
                >
                  {loading ? (
                    <span className="auth-btn-spinner-wrap">
                      <span className="auth-btn-spinner" />
                      <span>Memverifikasi Akun...</span>
                    </span>
                  ) : mode === 'login' && loginCountdown > 0 ? (
                    <span>Terkunci ({loginCountdown}s)</span>
                  ) : mode === 'register' && registerCountdown > 0 ? (
                    <span>Tunggu ({registerCountdown}s)</span>
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
