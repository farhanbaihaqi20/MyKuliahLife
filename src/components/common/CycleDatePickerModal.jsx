import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getFinancialCycle } from '../../utils/dateCycle';
import { X, Calendar, Check, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CycleDatePickerModal = () => {
  const {
    isCycleModalOpen,
    setIsCycleModalOpen,
    startDayOfMonth,
    setStartDayOfMonth
  } = useApp();

  const [selectedDay, setSelectedDay] = useState(startDayOfMonth || 1);

  if (!isCycleModalOpen) return null;

  const previewCycle = getFinancialCycle(selectedDay, new Date());

  const handleApply = () => {
    setStartDayOfMonth(selectedDay);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    setIsCycleModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCycleModalOpen(false)} style={{ zIndex: 1200 }}>
      <div className="modal-bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: '#1665D8' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
              Atur Siklus Anggaran Bulanan
            </h3>
          </div>
          <button
            onClick={() => setIsCycleModalOpen(false)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
          Pilih tanggal mulainya uang saku atau gajian bulananmu. Dashboard & sisa budget harian akan otomatis menyesuaikan siklus ini!
        </p>

        {/* Preset Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: selectedDay === 1 ? '2px solid #1665D8' : '1px solid #CBD5E1',
              background: selectedDay === 1 ? '#EFF6FF' : '#FFFFFF',
              color: selectedDay === 1 ? '#1665D8' : '#334155',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onClick={() => setSelectedDay(1)}
          >
            <div>🗓️ Tanggal 1</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>Awal Bulan Kalender</div>
          </button>

          <button
            type="button"
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: selectedDay === 25 ? '2px solid #1665D8' : '1px solid #CBD5E1',
              background: selectedDay === 25 ? '#EFF6FF' : '#FFFFFF',
              color: selectedDay === 25 ? '#1665D8' : '#334155',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onClick={() => setSelectedDay(25)}
          >
            <div>💰 Tanggal 25</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>Hari Gajian / Uang Saku</div>
          </button>
        </div>

        {/* Custom Day Slider / Input */}
        <div className="input-group" style={{ marginBottom: '16px' }}>
          <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pilih Tanggal Kustom (1 - 28)</span>
            <strong style={{ color: '#1665D8' }}>Tanggal {selectedDay}</strong>
          </label>
          <input
            type="range"
            min="1"
            max="28"
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1665D8', height: '6px', cursor: 'pointer' }}
          />
        </div>

        {/* Live Preview Box */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Hasil Periode Aktif:
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1665D8', marginTop: '4px' }}>
            {previewCycle.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            <Clock size={13} />
            <span>Tersisa <strong>{previewCycle.daysRemaining} hari</strong> dalam siklus ini</span>
          </div>
        </div>

        <button className="btn-primary" onClick={handleApply}>
          <Check size={18} /> Terapkan Siklus Ini
        </button>
      </div>
    </div>
  );
};
