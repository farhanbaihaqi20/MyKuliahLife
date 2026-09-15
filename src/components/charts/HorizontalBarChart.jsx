import React from 'react';
import { ChevronRight } from 'lucide-react';

export const HorizontalBarChart = ({
  items = [],
  maxAmount,
  totalAmount,
  onItemClick,
  emptyText = "Belum ada data pengeluaran",
  unit = 'Rp'
}) => {
  if (!items || items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94A3B8', fontSize: '13px' }}>
        {emptyText}
      </div>
    );
  }

  // Calculate highest amount if maxAmount not provided
  const calculatedMax = maxAmount || Math.max(...items.map(it => it.amount || 0), 1);

  return (
    <div className="horizontal-bar-chart" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, index) => {
        const itemAmount = item.amount || 0;
        const barWidthPct = Math.min(100, Math.max(0, (itemAmount / calculatedMax) * 100));
        const totalPct = totalAmount && totalAmount > 0 ? Math.round((itemAmount / totalAmount) * 100) : null;
        const isClickable = Boolean(onItemClick);

        return (
          <div
            key={item.id || index}
            className={`bar-chart-row ${item.isHighlight ? 'highlighted' : ''} ${isClickable ? 'clickable' : ''}`}
            onClick={() => {
              if (isClickable) onItemClick(item);
            }}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onItemClick(item);
              }
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              background: item.isHighlight ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)' : '#F8FAFC',
              border: item.isHighlight ? '1px solid #FECDD3' : '1px solid #E2E8F0',
              cursor: isClickable ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Header row: Rank, Label, and Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {/* Rank indicator */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: index === 0 ? '#F43F5E' : index === 1 ? '#F97316' : index === 2 ? '#3B82F6' : '#E2E8F0',
                    color: index < 3 ? '#FFFFFF' : '#64748B',
                    flexShrink: 0
                  }}
                >
                  {index + 1}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: item.isHighlight ? '#9F1239' : '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          backgroundColor: item.isHighlight ? '#E11D48' : '#F1F5F9',
                          color: item.isHighlight ? '#FFFFFF' : '#475569',
                          flexShrink: 0
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.sublabel && (
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                      {item.sublabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount and percentage */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: item.isHighlight ? '#E11D48' : '#0F172A' }}>
                    {unit} {Number(itemAmount).toLocaleString('id-ID')}
                  </div>
                  {totalPct !== null && (
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                      {totalPct}% dari total
                    </div>
                  )}
                </div>
                {isClickable && (
                  <ChevronRight size={16} style={{ color: '#94A3B8', marginLeft: '4px' }} />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '7px',
                backgroundColor: item.isHighlight ? '#FECDD3' : '#E2E8F0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${barWidthPct}%`,
                  height: '100%',
                  backgroundColor: item.color || (item.isHighlight ? '#E11D48' : '#3B82F6'),
                  borderRadius: '10px',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
