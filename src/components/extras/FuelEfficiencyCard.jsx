import React, { useMemo } from 'react';
import { TrendingUp, Award, CheckCircle2, AlertCircle, Zap, Calendar, Route, Sparkles } from 'lucide-react';

export const FuelEfficiencyCard = ({ fuelLogs = [], fuelSettings = {} }) => {
  // Hitung efisiensi berurutan dari log odometer
  const efficiencyData = useMemo(() => {
    const validLogs = [...fuelLogs]
      .filter((l) => l.odometer !== null && l.odometer !== undefined && Number(l.odometer) > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (validLogs.length < 2) {
      return {
        hasData: false,
        totalKm: 0,
        avgEfficiency: 0,
        trendPoints: [],
        typeComparison: {},
        latestEfficiency: null,
        smartDrain: null
      };
    }

    const intervals = [];
    const typeBuckets = {};

    for (let i = 1; i < validLogs.length; i++) {
      const prev = validLogs[i - 1];
      const curr = validLogs[i];
      const dist = Number(curr.odometer) - Number(prev.odometer);
      const liters = Number(curr.liters) || 0;

      if (dist > 0 && liters > 0) {
        const kmPerLiter = Number((dist / liters).toFixed(1));
        intervals.push({
          date: curr.date,
          fuelType: curr.fuelType,
          kmPerLiter,
          distance: dist,
          liters
        });

        if (!typeBuckets[curr.fuelType]) {
          typeBuckets[curr.fuelType] = { totalDist: 0, totalLiters: 0, count: 0 };
        }
        typeBuckets[curr.fuelType].totalDist += dist;
        typeBuckets[curr.fuelType].totalLiters += liters;
        typeBuckets[curr.fuelType].count += 1;
      }
    }

    if (intervals.length === 0) {
      return {
        hasData: false,
        totalKm: 0,
        avgEfficiency: 0,
        trendPoints: [],
        typeComparison: {},
        latestEfficiency: null,
        smartDrain: null
      };
    }

    const totalDist = intervals.reduce((acc, it) => acc + it.distance, 0);
    const totalLiters = intervals.reduce((acc, it) => acc + it.liters, 0);
    const avgEfficiency = totalLiters > 0 ? Number((totalDist / totalLiters).toFixed(1)) : 0;
    const latestEfficiency = intervals[intervals.length - 1].kmPerLiter;

    // Perbandingan jenis BBM
    const typeComparison = {};
    Object.keys(typeBuckets).forEach((type) => {
      const b = typeBuckets[type];
      typeComparison[type] = b.totalLiters > 0 ? Number((b.totalDist / b.totalLiters).toFixed(1)) : 0;
    });

    // Smart Daily Drain
    const firstDate = new Date(validLogs[0].date);
    const lastDate = new Date(validLogs[validLogs.length - 1].date);
    const totalDays = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
    const avgDailyLiters = Number((totalLiters / totalDays).toFixed(2));
    const avgDailyKm = Number((totalDist / totalDays).toFixed(1));

    return {
      hasData: true,
      totalKm: totalDist,
      avgEfficiency,
      latestEfficiency,
      trendPoints: intervals,
      typeComparison,
      smartDrain: {
        avgDailyLiters,
        avgDailyKm
      }
    };
  }, [fuelLogs, fuelSettings]);

  const getEfficiencyRating = (kmPerLiter) => {
    if (kmPerLiter >= 42) {
      return { label: 'Sangat Irit', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', icon: Award };
    }
    if (kmPerLiter >= 32) {
      return { label: 'Konsumsi Normal', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', icon: CheckCircle2 };
    }
    return { label: 'Cenderung Boros', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: AlertCircle };
  };

  const fuelMetadata = {
    pertalite: { name: 'Pertalite', ron: 'RON 90', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    pertamax_90: { name: 'Pertamax', ron: 'RON 92', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)' },
    pertamax_green: { name: 'Green 95', ron: 'RON 95', color: '#0D9488', bg: 'rgba(13, 148, 136, 0.12)' },
    pertamax_turbo: { name: 'Turbo', ron: 'RON 98', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)' }
  };

  if (!efficiencyData.hasData) {
    return (
      <div className="eff-card-minimal">
        <div className="eff-empty-state">
          <div className="eff-empty-icon-wrap">
            <Route size={28} />
          </div>
          <h4 className="eff-empty-title">Analisis Efisiensi Belum Aktif</h4>
          <p className="eff-empty-desc">
            Masukkan angka odometer saat mengisi bensin minimal <strong>2 kali</strong> untuk melihat kalkulasi km/L, grafik tren berkendara, dan perbandingan jenis BBM.
          </p>
        </div>
      </div>
    );
  }

  const rating = getEfficiencyRating(efficiencyData.avgEfficiency);
  const RatingIcon = rating.icon;

  // PERHITUNGAN KURVA GRAFIK BEZIER (Mulus, Tidak Terpotong)
  const points = efficiencyData.trendPoints;
  const maxVal = Math.max(...points.map((p) => p.kmPerLiter), 50);
  const minVal = Math.max(0, Math.min(...points.map((p) => p.kmPerLiter), 20) - 5);
  const range = maxVal - minVal || 1;

  const chartWidth = 320;
  const chartHeight = 110;
  const paddingX = 36; // Memberi ruang lega agar angka di tepi kanan/kiri tidak terpotong
  const paddingTop = 26; // Ruang lega untuk label angka di atas titik
  const paddingBottom = 16;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const coordPoints = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * plotWidth;
    const y = chartHeight - paddingBottom - ((p.kmPerLiter - minVal) / range) * plotHeight;
    return { x, y, ...p };
  });

  // Smooth Bezier Curve generator
  const createSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) {
      return `M ${pts[0].x} ${pts[0].y} Q ${(pts[0].x + pts[1].x) / 2} ${(pts[0].y + pts[1].y) / 2} ${pts[1].x} ${pts[1].y}`;
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const smoothCurveD = createSmoothPath(coordPoints);
  const maxCompKm = Math.max(...Object.values(efficiencyData.typeComparison), 50);

  return (
    <div className="eff-card-minimal">
      {/* 1. Header Utama Minimalist & Elegan */}
      <div className="eff-hero-block">
        <div className="eff-hero-left">
          <span className="eff-hero-eyebrow">Rata-Rata Efisiensi Bahan Bakar</span>
          <div className="eff-hero-num-wrap">
            <span className="eff-hero-number">{efficiencyData.avgEfficiency}</span>
            <span className="eff-hero-unit">km / Liter</span>
          </div>
          <div className="eff-rating-pill" style={{ backgroundColor: rating.bg, color: rating.color }}>
            <RatingIcon size={13} strokeWidth={2.5} />
            <span>{rating.label}</span>
          </div>
        </div>

        {/* 2 Kolom Metrik Cepat */}
        <div className="eff-hero-right">
          <div className="eff-quick-stat-pill">
            <span className="eff-stat-pill-label">Isi Terakhir</span>
            <span className="eff-stat-pill-value text-sky-600 dark:text-sky-400">
              {efficiencyData.latestEfficiency} <small>km/L</small>
            </span>
          </div>
          <div className="eff-quick-stat-pill">
            <span className="eff-stat-pill-label">Total Dianalisis</span>
            <span className="eff-stat-pill-value text-slate-700 dark:text-slate-200">
              {Number(efficiencyData.totalKm).toLocaleString('id-ID')} <small>km</small>
            </span>
          </div>
        </div>
      </div>

      {/* Divider Halus */}
      <div className="eff-clean-divider" />

      {/* 2. Grafik Tren Efisiensi (Smooth Spline Curve) */}
      <div className="eff-chart-section">
        <div className="eff-section-header">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={15} className="text-emerald-500" />
            <h5 className="eff-section-title">Tren Efisiensi (km/L)</h5>
          </div>
          <span className="eff-count-badge">{points.length} kali pengisian</span>
        </div>

        <div className="eff-chart-viewport">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="eff-svg-chart">
            <defs>
              <linearGradient id="smoothAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Baseline Dash */}
            <line
              x1={paddingX - 10}
              y1={chartHeight - paddingBottom}
              x2={chartWidth - paddingX + 10}
              y2={chartHeight - paddingBottom}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeDasharray="4 4"
            />

            {/* Area Fill Halus */}
            {coordPoints.length > 1 && (
              <path
                d={`${smoothCurveD} L ${coordPoints[coordPoints.length - 1].x} ${
                  chartHeight - paddingBottom
                } L ${coordPoints[0].x} ${chartHeight - paddingBottom} Z`}
                fill="url(#smoothAreaGrad)"
              />
            )}

            {/* Smooth Bezier Spline */}
            <path
              d={smoothCurveD}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Dots & Label Angka (Dengan Safe Positioning) */}
            {coordPoints.map((pt, i) => {
              const isLast = i === coordPoints.length - 1;
              const isFirst = i === 0;
              const textAnchor = isLast ? 'end' : isFirst ? 'start' : 'middle';
              const textX = isLast ? pt.x + 4 : isFirst ? pt.x - 4 : pt.x;

              return (
                <g key={i}>
                  {/* Outer glow aura */}
                  <circle cx={pt.x} cy={pt.y} r="6" fill="rgba(16, 185, 129, 0.2)" />
                  {/* Core dot */}
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                  {/* Number label with clear background contrast */}
                  <text
                    x={textX}
                    y={pt.y - 9}
                    textAnchor={textAnchor}
                    className="eff-dot-text"
                  >
                    {pt.kmPerLiter}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Divider Halus */}
      <div className="eff-clean-divider" />

      {/* 3. Perbandingan Jenis BBM (Desain Bar Rapi & Berjarak Proporsional) */}
      {Object.keys(efficiencyData.typeComparison).length > 0 && (
        <div className="eff-comparison-section">
          <div className="flex items-center justify-between mb-3">
            <h5 className="eff-section-title">Perbandingan Konsumsi Jenis BBM</h5>
            <span className="text-[11px] text-slate-400 font-medium">Berdasarkan motormu</span>
          </div>

          <div className="space-y-3">
            {Object.entries(efficiencyData.typeComparison).map(([type, kmL]) => {
              const meta = fuelMetadata[type] || { name: type, ron: '', color: '#0284C7', bg: 'rgba(2,132,199,0.1)' };
              const isBest = kmL === Math.max(...Object.values(efficiencyData.typeComparison));
              const pct = Math.min(100, Math.round((kmL / maxCompKm) * 100));

              return (
                <div key={type} className="eff-fuel-row">
                  <div className="eff-fuel-row-header">
                    <div className="flex items-center gap-2">
                      <span className="eff-fuel-name">{meta.name}</span>
                      <span className="eff-fuel-ron-pill" style={{ color: meta.color, backgroundColor: meta.bg }}>
                        {meta.ron}
                      </span>
                      {isBest && (
                        <span className="eff-best-pill">
                          <Sparkles size={10} /> Paling Irit
                        </span>
                      )}
                    </div>
                    <span className="eff-fuel-val">{kmL} <small>km/L</small></span>
                  </div>

                  {/* Clean Track Bar */}
                  <div className="eff-track-bg">
                    <div
                      className="eff-track-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: meta.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider Halus */}
      <div className="eff-clean-divider" />

      {/* 4. Smart Estimator Pemakaian Harian (Minimalist Twin Cards) */}
      {efficiencyData.smartDrain && (
        <div className="eff-smart-section">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Zap size={15} className="text-amber-500" />
            <h5 className="eff-section-title">Estimasi Pola Harian</h5>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="eff-mini-stat-card">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Route size={13} />
                <span className="text-[11px] font-semibold">Jarak Tempuh Harian</span>
              </div>
              <div className="eff-mini-val">
                ~{efficiencyData.smartDrain.avgDailyKm} <small>km / hari</small>
              </div>
            </div>

            <div className="eff-mini-stat-card">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Calendar size={13} />
                <span className="text-[11px] font-semibold">Konsumsi Rata-Rata</span>
              </div>
              <div className="eff-mini-val">
                ~{efficiencyData.smartDrain.avgDailyLiters} <small>L / hari</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelEfficiencyCard;
