import React from 'react';
import { Fuel, Gauge, AlertTriangle, Zap, Edit3 } from 'lucide-react';

/**
 * MotorTankVisual
 * Menampilkan visual motor dinamis (Matic, Sport dengan tangki di depan, dan Bebek)
 * dengan tangki animasi liquid pure-CSS super enteng.
 */
export const MotorTankVisual = ({
  tankLevel = 65,
  tankCapacity = 4.2,
  motorName = 'Motor Saya',
  motorType = 'Matic',
  avgEfficiency = 42,
  onEditCapacity = null
}) => {
  const clampedLevel = Math.max(0, Math.min(100, Math.round(Number(tankLevel) || 0)));
  const remainingLiters = ((clampedLevel / 100) * Number(tankCapacity)).toFixed(1);
  const estimatedRange = Math.round(remainingLiters * (Number(avgEfficiency) || 40));

  // Normalisasi motorType: 'Matic' | 'Sport' | 'Bebek'
  const normalizedType = (() => {
    const t = String(motorType || '').toLowerCase();
    if (t.includes('sport') || t.includes('manual') || t.includes('laki') || t.includes('kopling')) return 'Sport';
    if (t.includes('bebek') || t.includes('moped')) return 'Bebek';
    return 'Matic';
  })();

  const getThemeColor = () => {
    if (clampedLevel > 50) {
      return {
        type: 'safe',
        primary: '#10B981',
        secondary: '#059669',
        glow: 'rgba(16, 185, 129, 0.35)',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        badgeText: '#059669',
        statusText: 'Tangki Cukup',
        statusDesc: 'Bahan bakar aman untuk beraktivitas hari ini'
      };
    }
    if (clampedLevel >= 25) {
      return {
        type: 'warning',
        primary: '#F59E0B',
        secondary: '#D97706',
        glow: 'rgba(245, 158, 11, 0.35)',
        badgeBg: 'rgba(245, 158, 11, 0.12)',
        badgeText: '#D97706',
        statusText: 'Mulai Menipis',
        statusDesc: 'Pertimbangkan isi bensin sebelum perjalanan jauh'
      };
    }
    return {
      type: 'danger',
      primary: '#EF4444',
      secondary: '#DC2626',
      glow: 'rgba(239, 68, 68, 0.35)',
      badgeBg: 'rgba(239, 68, 68, 0.12)',
      badgeText: '#DC2626',
      statusText: 'Bensin Kritis!',
      statusDesc: 'Segera melipir ke SPBU terdekat'
    };
  };

  const theme = getThemeColor();

  return (
    <div className="motor-visual-card">
      {/* Background ambient glow */}
      <div
        className="motor-visual-glow"
        style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
      />

      {/* Header Info Motor */}
      <div className="motor-visual-header">
        <div className="motor-title-wrap">
          <span className="motor-type-pill">{normalizedType}</span>
          <h3 className="motor-name-title">{motorName}</h3>
        </div>
        <div
          className="fuel-level-badge"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
        >
          <Fuel size={14} className="fuel-icon-pulse" />
          <span>{clampedLevel}%</span>
        </div>
      </div>

      {/* Stage: Visual Motor Illustration & Tangki Liquid */}
      <div className="motor-stage-container">
        <div className="scooter-svg-wrap">
          {/* ============================================================
              1. VARIAN MOTOR SPORT (TANGKI DI DEPAN ATAS DADA)
             ============================================================ */}
          {normalizedType === 'Sport' && (
            <svg viewBox="0 0 340 180" className="scooter-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="170" cy="168" rx="140" ry="8" fill="rgba(0,0,0,0.12)" />

              {/* Roda Belakang Sport */}
              <circle cx="64" cy="136" r="30" stroke="#334155" strokeWidth="11" fill="#0F172A" />
              <circle cx="64" cy="136" r="21" stroke="#64748B" strokeWidth="2.5" strokeDasharray="6 4" />
              <circle cx="64" cy="136" r="10" fill="#94A3B8" />

              {/* Swingarm & Monoshock Sport */}
              <path d="M64 136 L120 125 L150 110" stroke="#64748B" strokeWidth="7" strokeLinecap="round" />
              <path d="M125 125 L145 95" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />

              {/* Knalpot Sport Menjulang 45 Derajat */}
              <path d="M90 148 L138 128 Q155 120 160 126 L126 142 L86 154 Z" fill="#334155" />
              <path d="M138 128 L158 124" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />

              {/* Roda Depan Sport */}
              <circle cx="276" cy="136" r="30" stroke="#334155" strokeWidth="11" fill="#0F172A" />
              <circle cx="276" cy="136" r="21" stroke="#64748B" strokeWidth="2.5" strokeDasharray="6 4" />
              <circle cx="276" cy="136" r="10" fill="#94A3B8" />

              {/* Upside Down Front Fork (Emas/Perak) */}
              <path d="M276 136 L244 68" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
              <path d="M272 136 L240 68" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <path d="M250 108 Q266 100 290 112" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" />

              {/* Rangka Deltabox / Mesin Sport Terbuka */}
              <path d="M140 134 L170 142 L204 126 L196 98 L146 102 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
              <circle cx="166" cy="120" r="10" fill="#334155" />

              {/* Bodi Belakang & Jok Split Nungging */}
              <path d="M72 110 L110 92 L148 92 L132 108 L72 110 Z" fill="#0284C7" />
              <path d="M94 92 C102 78 126 78 148 90 Z" fill="#0F172A" />
              <path d="M120 90 C130 78 160 80 182 88 Z" fill="#0F172A" />

              {/* TANGKI MOTOR SPORT DI DEPAN ATAS DADA */}
              <path
                d="M165 88 C165 52 215 48 238 68 C242 78 226 98 185 96 Z"
                fill="#0284C7"
                stroke="#0369A1"
                strokeWidth="2"
              />
              {/* Tutup Tangki Atas */}
              <ellipse cx="204" cy="54" rx="8" ry="3" fill="#94A3B8" stroke="#334155" strokeWidth="1" />

              {/* JENDELA KAPSUL LIQUID DI DALAM TANGKI DEPAN SPORT */}
              <g className="fuel-sport-tank-group">
                <rect
                  x="180"
                  y="62"
                  width="44"
                  height="26"
                  rx="7"
                  fill="#0F172A"
                  stroke={theme.primary}
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />
                <defs>
                  <clipPath id="sportTankClip">
                    <rect x="182" y="64" width="40" height="22" rx="5" />
                  </clipPath>
                </defs>
                <g clipPath="url(#sportTankClip)">
                  <rect x="182" y="64" width="40" height="22" fill="#1E293B" />
                  <rect
                    x="182"
                    y={64 + 22 - (22 * clampedLevel) / 100}
                    width="40"
                    height={(22 * clampedLevel) / 100}
                    fill={`url(#liquidGrad-${theme.type})`}
                    style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                  <line x1="184" y1="70" x2="188" y2="70" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <line x1="184" y1="75" x2="190" y2="75" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                </g>
                <path d="M184 66 L216 66 Q220 66 220 68 L188 84 Z" fill="rgba(255,255,255,0.12)" clipPath="url(#sportTankClip)" />
              </g>

              {/* Headlamp Sport Tajam & Stang Jepit */}
              <path d="M236 68 L256 70 L248 88 L232 80 Z" fill="#0284C7" />
              <path d="M254 74 L264 78 L256 86 Z" fill="#FDE047" filter="drop-shadow(0 0 6px rgba(253, 224, 71, 0.8))" />
              <path d="M236 62 L228 50 L220 50" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <circle cx="224" cy="42" r="5" fill="#64748B" />
              <path d="M228 50 L224 42" stroke="#94A3B8" strokeWidth="1.5" />
            </svg>
          )}

          {/* ============================================================
              2. VARIAN MOTOR BEBEK (MOPED RAMPING SAYAP DEPAN)
             ============================================================ */}
          {normalizedType === 'Bebek' && (
            <svg viewBox="0 0 340 180" className="scooter-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="170" cy="168" rx="140" ry="8" fill="rgba(0,0,0,0.12)" />

              {/* Roda Belakang Ramping */}
              <circle cx="68" cy="138" r="28" stroke="#334155" strokeWidth="9" fill="#0F172A" />
              <circle cx="68" cy="138" r="20" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="68" cy="138" r="8" fill="#94A3B8" />

              {/* Dual Shock Belakang Bebek */}
              <path d="M72 138 L98 94" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
              <path d="M70 138 L96 94" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 2" />

              {/* Knalpot Horisontal Bebek */}
              <path d="M90 148 L140 144 Q155 142 160 146 L130 152 L86 152 Z" fill="#334155" />
              <path d="M125 144 L150 144" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />

              {/* Roda Depan Ramping */}
              <circle cx="272" cy="138" r="28" stroke="#334155" strokeWidth="9" fill="#0F172A" />
              <circle cx="272" cy="138" r="20" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="272" cy="138" r="8" fill="#94A3B8" />

              {/* Fork Depan */}
              <path d="M272 138 L246 72" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
              <path d="M246 110 Q262 104 286 114" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />

              {/* Sayap Depan Khas Motor Bebek (Leg Shield) */}
              <path d="M180 120 L220 90 L240 70 L216 72 L180 102 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Rangka Tengah Underbone */}
              <path d="M96 138 L140 140 Q170 138 200 110 L180 94 L130 94 L92 120 Z" fill="#1E293B" />

              {/* Bodi Belakang & Jok Landai Bebek */}
              <path d="M76 116 Q88 78 132 80 L165 88 L155 116 L96 122 Z" fill="#0284C7" />
              <path d="M86 78 C96 66 140 68 180 78 L124 82 Z" fill="#0F172A" />

              {/* JENDELA TANGKI BENSIN BEBEK DI BAWAH JOK */}
              <g className="fuel-bebek-tank-group">
                <rect
                  x="108"
                  y="92"
                  width="44"
                  height="30"
                  rx="7"
                  fill="#0F172A"
                  stroke={theme.primary}
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />
                <defs>
                  <clipPath id="bebekTankClip">
                    <rect x="110" y="94" width="40" height="26" rx="5" />
                  </clipPath>
                </defs>
                <g clipPath="url(#bebekTankClip)">
                  <rect x="110" y="94" width="40" height="26" fill="#1E293B" />
                  <rect
                    x="110"
                    y={94 + 26 - (26 * clampedLevel) / 100}
                    width="40"
                    height={(26 * clampedLevel) / 100}
                    fill={`url(#liquidGrad-${theme.type})`}
                    style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                  <line x1="112" y1="102" x2="116" y2="102" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <line x1="112" y1="108" x2="118" y2="108" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                </g>
                <path d="M112 96 L144 96 Q146 96 146 98 L114 118 Z" fill="rgba(255,255,255,0.12)" clipPath="url(#bebekTankClip)" />
              </g>

              {/* Stang & Lampu Bebek */}
              <path d="M246 68 L240 44 L232 44" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <path d="M244 52 L254 56 L248 64 Z" fill="#FDE047" filter="drop-shadow(0 0 6px rgba(253, 224, 71, 0.8))" />
            </svg>
          )}

          {/* ============================================================
              3. VARIAN MOTOR MATIC (SKUTER DEK RATA)
             ============================================================ */}
          {normalizedType === 'Matic' && (
            <svg viewBox="0 0 340 180" className="scooter-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="170" cy="168" rx="140" ry="8" fill="rgba(0,0,0,0.12)" />

              {/* Roda Belakang */}
              <circle cx="68" cy="138" r="28" stroke="#334155" strokeWidth="10" fill="#1E293B" />
              <circle cx="68" cy="138" r="20" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="68" cy="138" r="10" fill="#94A3B8" />

              {/* Knalpot Matic */}
              <path d="M60 144 L110 134 Q125 130 130 138 Q125 146 105 148 L56 150 Z" fill="#475569" />
              <path d="M110 134 L128 138" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />

              {/* Roda Depan */}
              <circle cx="272" cy="138" r="28" stroke="#334155" strokeWidth="10" fill="#1E293B" />
              <circle cx="272" cy="138" r="20" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="272" cy="138" r="10" fill="#94A3B8" />

              {/* Garpu Suspensi & Spakbor Depan */}
              <path d="M272 138 L248 76" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
              <path d="M246 112 Q262 104 286 116" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" />

              {/* Dek Kaki Rata Matic (Floorboard) */}
              <path d="M92 138 L140 140 Q170 140 200 134 L236 128 L244 100 L216 102 L170 102 L140 120 L92 124 Z" fill="#1E293B" />

              {/* Bodi Belakang & Jok Matic */}
              <path d="M72 120 Q84 76 130 76 L160 84 L165 116 L92 124 Z" fill="#0284C7" />
              <path d="M86 76 C94 62 130 64 165 68 C178 70 184 76 182 82 L124 82 Z" fill="#0F172A" />
              <path d="M216 102 L248 76 L254 50 Q246 44 238 52 L228 80 L200 102 Z" fill="#0284C7" />
              <path d="M252 56 L262 62 L254 70 Z" fill="#FDE047" filter="drop-shadow(0 0 6px rgba(253, 224, 71, 0.7))" />

              {/* JENDELA TANGKI BENSIN MATIC PADA BODI TENGAH */}
              <g className="fuel-tank-viewport-group">
                <rect
                  x="108"
                  y="92"
                  width="44"
                  height="32"
                  rx="8"
                  fill="#0F172A"
                  stroke={theme.primary}
                  strokeWidth="2"
                  strokeOpacity="0.8"
                />
                <defs>
                  <clipPath id="maticTankClip">
                    <rect x="110" y="94" width="40" height="28" rx="6" />
                  </clipPath>
                </defs>
                <g clipPath="url(#maticTankClip)">
                  <rect x="110" y="94" width="40" height="28" fill="#1E293B" />
                  <rect
                    x="110"
                    y={94 + 28 - (28 * clampedLevel) / 100}
                    width="40"
                    height={(28 * clampedLevel) / 100}
                    fill={`url(#liquidGrad-${theme.type})`}
                    style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                  <line x1="112" y1="101" x2="116" y2="101" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <line x1="112" y1="108" x2="118" y2="108" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                </g>
                <path d="M112 96 L146 96 Q148 96 148 98 L114 120 Z" fill="rgba(255,255,255,0.12)" clipPath="url(#maticTankClip)" />
              </g>

              {/* Stang & Spion */}
              <path d="M246 50 L242 32 L234 32" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <circle cx="236" cy="22" r="6" fill="#64748B" />
              <path d="M240 32 L236 22" stroke="#94A3B8" strokeWidth="2" />
            </svg>
          )}

          {/* Gradients Shared */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="liquidGrad-safe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="liquidGrad-warning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="liquidGrad-danger" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* TANK GAUGE SIDEBAR (Vertikal Kapsul Liquid) */}
        <div className="fuel-gauge-side">
          <div className="fuel-capsule-glass">
            <div
              className={`fuel-capsule-liquid fuel-liquid-${theme.type}`}
              style={{ height: `${clampedLevel}%` }}
            >
              <div className="liquid-wave-layer" />
            </div>

            <div className="gauge-marker marker-full"><span>F</span><div className="gauge-tick-line" /></div>
            <div className="gauge-marker marker-half"><span>½</span><div className="gauge-tick-line" /></div>
            <div className="gauge-marker marker-empty"><span>E</span><div className="gauge-tick-line" /></div>
          </div>
          <span className="gauge-label">Tangki</span>
        </div>
      </div>

      {/* Detail Sisa Bensin & Estimasi Jarak Tempuh (Adjustable Tank Access) */}
      <div className="motor-stats-row">
        <div
          className="motor-stat-box clickable-stat-box"
          onClick={onEditCapacity}
          title="Klik untuk ubah kapasitas tangki motor"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap" style={{ color: theme.primary }}>
            <Fuel size={16} />
          </div>
          <div className="stat-content">
            <div className="flex items-center gap-1">
              <span className="stat-title">Sisa Bahan Bakar</span>
              <Edit3 size={11} className="text-slate-400 opacity-60" />
            </div>
            <div className="stat-val-group">
              <span className="stat-val">{remainingLiters}</span>
              <span className="stat-unit">/ {tankCapacity} Liter</span>
            </div>
          </div>
        </div>

        <div className="motor-stat-box">
          <div className="stat-icon-wrap" style={{ color: '#0284C7' }}>
            <Gauge size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-title">Estimasi Jangkauan</span>
            <div className="stat-val-group">
              <span className="stat-val">~{estimatedRange}</span>
              <span className="stat-unit">km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar Peringatan Bensin */}
      <div className={`motor-status-strip status-strip-${theme.type}`}>
        {clampedLevel < 25 ? (
          <AlertTriangle size={15} className="status-strip-icon animate-bounce-subtle" />
        ) : (
          <Zap size={15} className="status-strip-icon" />
        )}
        <div className="status-strip-text">
          <strong>{theme.statusText}:</strong> {theme.statusDesc}
        </div>
      </div>
    </div>
  );
};

export default MotorTankVisual;
