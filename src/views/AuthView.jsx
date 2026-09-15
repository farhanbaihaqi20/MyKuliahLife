import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const AuthView = () => {
  const { login, register, enterGuestMode } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
          // If confirmation email is required by Supabase project
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
    <div className="auth-container">
      {/* Brand Header */}
      <div className="auth-header">
        <div className="auth-logo-badge">
          <span style={{ fontSize: '28px' }}>🎓</span>
        </div>
        <h1 className="auth-title">MyKuliahLife</h1>
        <p className="auth-subtitle">Sistem Pengatur Keuangan & Manajemen Akademik Mahasiswa</p>
      </div>

      {/* Segment Tab Switcher */}
      <div className="auth-tab-bar">
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
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
          className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setMode('register');
            setErrorMsg('');
            setSuccessMsg('');
          }}
        >
          Daftar Akun
        </button>
      </div>

      {/* Card Form */}
      <div className="auth-card">
        {errorMsg && (
          <div className="auth-alert error">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-field">
              <label className="form-label">Nama Lengkap</label>
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Farhan Rizki"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Email Mahasiswa</label>
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="nama@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Kata Sandi</label>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner-text">Menghubungkan...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk ke MyKuliahLife' : 'Mulai Setup Akun Baru'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>atau</span>
        </div>

        {/* Mode Tamu / Demo Button */}
        <button
          type="button"
          className="guest-mode-btn"
          onClick={enterGuestMode}
          disabled={loading}
        >
          <span>👀 Coba Mode Tamu (Demo Offline)</span>
        </button>
      </div>

      {/* Security Footer Note */}
      <div className="auth-footer-note">
        <ShieldCheck size={14} style={{ color: '#10B981' }} />
        <span>Tersinkron aman via Supabase Database & Row Level Security</span>
      </div>
    </div>
  );
};
