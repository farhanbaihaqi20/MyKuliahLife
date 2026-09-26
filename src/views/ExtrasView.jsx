import React from 'react';
import { Fuel, Wrench, BarChart3, Calculator, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FuelDashboard from '../components/extras/FuelDashboard';

export const ExtrasView = () => {
  const { extrasSubtab, setExtrasSubtab } = useApp();

  if (extrasSubtab === 'fuel') {
    return <FuelDashboard onBack={() => setExtrasSubtab('menu')} />;
  }

  const extraFeatures = [
    {
      id: 'fuel',
      title: 'BBM & Kendaraan',
      desc: 'Catat isi bensin, pantau tangki visual & kalkulasi efisiensi km/L motormu.',
      icon: Fuel,
      color: '#0284C7',
      bg: 'rgba(2, 132, 199, 0.1)',
      badge: 'Aktif',
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      isReady: true,
      onClick: () => setExtrasSubtab('fuel')
    },
    {
      id: 'maintenance',
      title: 'Servis & Ganti Oli',
      desc: 'Pengingat berkala ganti oli mesin, oli gardan, dan servis CVT motor.',
      icon: Wrench,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      badge: 'Segera Hadir',
      badgeColor: '#64748B',
      badgeBg: 'rgba(100, 116, 139, 0.12)',
      isReady: false
    },
    {
      id: 'splitbill',
      title: 'Kalkulator Split Bill',
      desc: 'Hitung patungan makan di kafe, sewa lapangan futsal, atau print tugas kelompok.',
      icon: Calculator,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      badge: 'Segera Hadir',
      badgeColor: '#64748B',
      badgeBg: 'rgba(100, 116, 139, 0.12)',
      isReady: false
    },
    {
      id: 'insights',
      title: 'Statistik Gaya Hidup',
      desc: 'Ringkasan visual kebiasaan jajan kopi vs kebutuhan kuliah bulanan.',
      icon: BarChart3,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      badge: 'Segera Hadir',
      badgeColor: '#64748B',
      badgeBg: 'rgba(100, 116, 139, 0.12)',
      isReady: false
    }
  ];

  return (
    <div className="extras-view-container animate-fade-in pb-20">
      {/* Top Banner Hub */}
      <div className="extras-hero-card">
        <div className="extras-hero-content">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-2">
            <Sparkles size={12} />
            <span>Utilitas Tambahan</span>
          </div>
          <h2 className="text-xl font-bold text-white">Menu Lainnya</h2>
          <p className="text-xs text-white/80 mt-1 max-w-xs">
            Kumpulan fitur pendukung kehidupan mobilitas dan perkuliahan harian mahasiswa.
          </p>
        </div>
      </div>

      {/* Grid Menu Fitur Tambahan */}
      <div className="extras-grid-section">
        <h3 className="extras-section-title">Fitur & Utilitas</h3>

        <div className="extras-feature-grid">
          {extraFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className={`extras-feature-card ${feat.isReady ? 'ready-card' : 'disabled-card'}`}
                onClick={() => feat.isReady && feat.onClick?.()}
                role={feat.isReady ? 'button' : undefined}
                tabIndex={feat.isReady ? 0 : undefined}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="extras-feature-icon-wrap"
                    style={{ backgroundColor: feat.bg, color: feat.color }}
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    className="extras-feature-badge"
                    style={{ backgroundColor: feat.badgeBg, color: feat.badgeColor }}
                  >
                    {feat.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="extras-feature-title">{feat.title}</h4>
                  <p className="extras-feature-desc">{feat.desc}</p>
                </div>

                {feat.isReady && (
                  <div className="extras-feature-footer">
                    <span>Buka Fitur</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExtrasView;
