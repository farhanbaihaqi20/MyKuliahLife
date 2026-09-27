import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateStrongPassword, formatAuthError } from '../../utils/security';

export const ResetPasswordModal = () => {
  const { updatePassword, setIsResetPasswordModalOpen } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          setIsResetPasswordModalOpen(false);
        }, 1800);
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err.message || 'Terjadi kesalahan saat memperbarui kata sandi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '26px 22px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          animation: 'authFadeUp 0.3s ease'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
              boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.15)'
            }}
          >
            <KeyRound size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Buat Kata Sandi Baru
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
            Tautan pemulihan valid. Masukkan kata sandi baru untuk akun Anda.
          </p>
        </div>

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
      </div>
    </div>
  );
};

export default ResetPasswordModal;
