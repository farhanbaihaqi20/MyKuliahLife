import React from 'react';

export const DonutChart = ({ items, totalAmount, centerLabel = "Pengeluaran", size = 200, strokeWidth = 26 }) => {
  if (!items || items.length === 0 || totalAmount <= 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: '13px' }}>
        Belum ada data pengeluaran untuk periode ini
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const slices = items.map((item) => {
    const percentage = Math.min(100, Math.max(0, (item.amount / totalAmount) * 100));
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (percentage / 100) * circumference;

    return {
      ...item,
      percentage: Math.round(percentage),
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '14px 0' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {/* Slices */}
          {slices.map((slice, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color || '#3B82F6'}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          ))}
        </svg>

        {/* Center Label */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '10px'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
            {centerLabel}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
            Rp {Number(totalAmount).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Legend Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '16px', maxWidth: '340px' }}>
        {slices.slice(0, 5).map((slice, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              background: '#F8FAFC',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #E2E8F0'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slice.color || '#3B82F6' }}></span>
            <span style={{ color: '#475569', fontWeight: 600 }}>{slice.label}</span>
            <span style={{ color: '#0F172A', fontWeight: 800 }}>{slice.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
