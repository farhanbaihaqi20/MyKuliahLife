import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateStrongPassword, formatAuthError } from '../utils/security';

export const ResetPasswordView = () => {
  const { updatePassword, setIsResetPasswordModalOpen, logout } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Strength Calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#CBD5E1' };
    if (pass.length < 8) return { score: 1, label: 'Terlalu Pendek (< 8 karakter)', color: '#EF4444' };
    
    let score = 1;
    if (pass.length >= 10) score++;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 2, label: 'Cukup', color: '#F59E0B' };
    return { score: 3, label: 'Kuat & Aman', color: '#10B981' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const pwdCheck = validateStrongPassword(newPassword);
    if (!pwdCheck.valid) {
      setErrorMsg(pwdCheck.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(newPassword);
      if (!res.success) {
        setErrorMsg(formatAuthError(res.error || 'Gagal memperbarui kata sandi. Silakan coba lagi.'));
      } else {
        setSuccessMsg('Kata sandi Anda berhasil diperbarui! Mengalihkan ke dashboard...');
        confetti({ particleCount: 55, spread: 75, origin: { y: 0.55 } });
        setTimeout(() => {
          setIsResetPasswordModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err.message || 'Terjadi kesalahan saat memperbarui kata sandi.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    setIsResetPasswordModalOpen(false);
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
            Keamanan Akun & Pemulihan Akses
          </p>
        </header>

        {/* Dedicated Reset Password Card */}
        <div className="auth-modern-card" style={{ animation: 'authFadeUp 0.35s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.2)'
              }}
            >
              <KeyRound size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
              Buat Kata Sandi Baru
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Tautan pemulihan valid. Masukkan kata sandi baru untuk akun Anda.
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="auth-modern-alert error" style={{ marginBottom: '14px' }}>
              <AlertCircle size={18} className="alert-icon" />
              <div className="alert-body">
                <span className="alert-text">{formatAuthError(errorMsg)}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="auth-modern-alert success" style={{ marginBottom: '14px' }}>
              <CheckCircle2 size={18} className="alert-icon" />
              <div className="alert-body">
                <span className="alert-text">{successMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="auth-field-group">
              <label className="auth-field-label">Kata Sandi Baru</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-modern-input"
                  placeholder="Minimal 8 karakter (huruf & angka)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading || !!successMsg}
                  autoFocus
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div style={{ marginTop: '7px' }}>
                  <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ flex: 1, backgroundColor: strength.score >= 1 ? strength.color : '#E2E8F0', transition: 'all 0.3s' }} />
                    <div style={{ flex: 1, backgroundColor: strength.score >= 2 ? strength.color : '#E2E8F0', transition: 'all 0.3s' }} />
                    <div style={{ flex: 1, backgroundColor: strength.score >= 3 ? strength.color : '#E2E8F0', transition: 'all 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px' }}>
                    <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                    <span style={{ color: '#94A3B8' }}>Min. 8 karakter (huruf & angka)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label">Konfirmasi Kata Sandi Baru</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-modern-input"
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || !!successMsg}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-primary-submit-btn"
              disabled={loading || !!successMsg}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span className="auth-btn-spinner-wrap">
                  <span className="auth-btn-spinner" />
                  <span>Menyimpan Kata Sandi...</span>
                </span>
              ) : (
                <>
                  <span>Simpan & Masuk ke Dashboard</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Cancel & Back to Login Button */}
          <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid rgba(226, 232, 240, 0.7)', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading || !!successMsg}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
            >
              <ArrowLeft size={14} />
              <span>Batal & Kembali ke Halaman Masuk</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="auth-modern-security-badge" style={{ marginTop: '16px' }}>
          <ShieldCheck size={14} />
          <span>Dilindungi oleh Enkripsi End-to-End 256-Bit</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordView;
