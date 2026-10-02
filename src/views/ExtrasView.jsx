import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FuelDashboard from '../components/extras/FuelDashboard';
import DebtDashboard from '../components/extras/DebtDashboard';

import iconFuel from '../assets/extras/extra-fuel.png';
import iconDebt from '../assets/extras/extra-debt.png';
import iconMaintenance from '../assets/extras/extra-maintenance.png';
import iconSplitBill from '../assets/extras/extra-splitbill.png';
import iconLifestyle from '../assets/extras/extra-lifestyle.png';

export const ExtrasView = () => {
  const { extrasSubtab, setExtrasSubtab } = useApp();
  const [upcomingModal, setUpcomingModal] = useState(null);

  if (extrasSubtab === 'fuel') {
    return <FuelDashboard onBack={() => setExtrasSubtab('menu')} />;
  }

  if (extrasSubtab === 'debt') {
    return <DebtDashboard onBack={() => setExtrasSubtab('menu')} />;
  }

  const extraFeatures = [
    {
      id: 'debt',
      title: 'Utang & Piutang',
      desc: 'Catat uang dipinjamkan atau kasbon makanan tanpa merusak alokasi budget.',
      iconImg: iconDebt,
      isReady: true,
      onClick: () => setExtrasSubtab('debt')
    },
    {
      id: 'fuel',
      title: 'BBM & Kendaraan',
      desc: 'Catat isi bensin, pantau tangki visual & kalkulasi efisiensi km/L motormu.',
      iconImg: iconFuel,
      isReady: true,
      onClick: () => setExtrasSubtab('fuel')
    },
    {
      id: 'maintenance',
      title: 'Servis & Ganti Oli',
      desc: 'Pengingat berkala ganti oli mesin, oli gardan, dan servis berkala motor.',
      iconImg: iconMaintenance,
      isReady: false
    },
    {
      id: 'splitbill',
      title: 'Kalkulator Split Bill',
      desc: 'Hitung patungan makan di kafe, sewa lapangan futsal, atau print tugas kelompok.',
      iconImg: iconSplitBill,
      isReady: false
    },
    {
      id: 'insights',
      title: 'Statistik Gaya Hidup',
      desc: 'Ringkasan visual kebiasaan jajan kopi vs alokasi kebutuhan kuliah bulanan.',
      iconImg: iconLifestyle,
      isReady: false
    }
  ];

  return (
    <div className="extras-view-container animate-fade-in pb-20">
      {/* Minimalist Top Header */}
      <div className="extras-minimal-hero">
        <div className="extras-hero-header">
          <div className="extras-hero-tag">
            <Sparkles size={12} className="extras-tag-icon" />
            <span>Utilitas & Ekstra</span>
          </div>
          <span className="extras-hero-count">{extraFeatures.length} Modul</span>
        </div>
        <h2 className="extras-hero-title">Menu Lainnya</h2>
        <p className="extras-hero-desc">
          Kumpulan fitur pendukung mobilitas dan aktivitas harian mahasiswa.
        </p>
      </div>

      {/* Feature Section (Grid layout like Pic 1 with Pic 2 3D Icons) */}
      <div className="extras-section">
        <div className="extras-section-header">
          <h3 className="extras-section-title">Fitur & Utilitas</h3>
        </div>

        <div className="quick-action-grid">
          {extraFeatures.map((feat) => (
            <button
              key={feat.id}
              type="button"
              className={`quick-action-item ${feat.isReady ? '' : 'is-upcoming'}`}
              onClick={() => {
                if (feat.isReady) {
                  feat.onClick?.();
                } else {
                  setUpcomingModal(feat);
                }
              }}
              title={feat.isReady ? `Buka ${feat.title}` : `${feat.title} (Segera Hadir)`}
            >
              <div className="action-icon-box">
                <img
                  src={feat.iconImg}
                  alt={feat.title}
                  className="action-icon-img"
                  loading="eager"
                />
                {!feat.isReady && (
                  <span className="extras-badge-soon">Segera</span>
                )}
              </div>
              <span className="action-icon-label">{feat.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Feature Modal */}
      {upcomingModal && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setUpcomingModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            className="modal-content animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #FFFFFF)',
              borderRadius: '20px',
              padding: '24px 20px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-subtle, #E2E8F0)'
            }}
          >
            <div style={{ width: 68, height: 68, margin: '0 auto 12px' }}>
              <img
                src={upcomingModal.iconImg}
                alt={upcomingModal.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main, #0F172A)' }}>
              {upcomingModal.title}
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.45, margin: '0 0 18px 0' }}>
              {upcomingModal.desc}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 700, marginBottom: '18px' }}>
              ⏳ Segera Hadir di Pembaruan Berikutnya
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={() => setUpcomingModal(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtrasView;
