import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Activity, Clock, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import MotorTankVisual from './MotorTankVisual';
import FuelLogModal from './FuelLogModal';
import FuelHistoryList from './FuelHistoryList';
import FuelEfficiencyCard from './FuelEfficiencyCard';
import FuelSettingsModal from './FuelSettingsModal';

export const FuelDashboard = ({ onBack }) => {
  const { fuelLogs, fuelSettings, fetchFuelPrices } = useApp();

  const [activeTab, setActiveTab] = useState('efficiency'); // 'efficiency' | 'history'
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedFuelTypeForModal, setSelectedFuelTypeForModal] = useState('pertalite');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Auto-fetch fuel prices on mount if lastPriceSync is null or older than 24 hours
  useEffect(() => {
    if (!fuelSettings?.lastPriceSync) {
      fetchFuelPrices(fuelSettings?.provinceSlug || 'jawa-timur').catch(() => {});
    }
  }, []);

  const prices = fuelSettings?.fuelPrices || {
    pertalite: 10000,
    pertamax_90: 15950,
    pertamax_green: 19150,
    pertamax_turbo: 19600
  };

  const livePrices = [
    { id: 'pertalite', name: 'Pertalite', ron: 'RON 90', price: prices.pertalite, color: '#10B981' },
    { id: 'pertamax_90', name: 'Pertamax', ron: 'RON 92', price: prices.pertamax_90, color: '#0284C7' },
    { id: 'pertamax_green', name: 'Green 95', ron: 'RON 95', price: prices.pertamax_green, color: '#0D9488' },
    { id: 'pertamax_turbo', name: 'Turbo', ron: 'RON 98', price: prices.pertamax_turbo, color: '#DC2626' }
  ];

  const handleOpenLogModal = (fuelTypeId = 'pertalite') => {
    setSelectedFuelTypeForModal(fuelTypeId);
    setIsLogModalOpen(true);
  };

  return (
    <div className="fuel-dashboard-container animate-fade-in">
      {/* Top Header (Hanya 1 Tombol Setting Tunggal di Pojok Kanan) */}
      <div className="fuel-topbar">
        <button
          className="btn-fuel-back"
          onClick={onBack}
          aria-label="Kembali ke menu lainnya"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="fuel-topbar-title">
          <h2>BBM & Kendaraan</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {fuelSettings?.provinceName || 'Jawa Timur'} • Auto Pertamina API
          </span>
        </div>
        <button
          className="btn-fuel-icon-action"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="Pengaturan motor dan bensin"
          title="Pengaturan Motor & Harga"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Main Motor & Liquid Tank Visual (Mendukung Matic, Sport depan, Bebek) */}
      <MotorTankVisual
        tankLevel={fuelSettings?.currentTankLevel ?? 65}
        tankCapacity={fuelSettings?.tankCapacity || 4.2}
        motorName={fuelSettings?.motorName || 'Motor Saya'}
        motorType={fuelSettings?.motorType || 'Matic'}
        avgEfficiency={42}
        onEditCapacity={() => setIsSettingsModalOpen(true)}
      />

      {/* LIVE HARGA PERTAMINA (2x2 GRID PREMIER) */}
      <div className="live-price-strip-card">
        <div className="live-price-header-row">
          <div className="live-price-title-group">
            <span className="live-pulse-dot" />
            <h3 className="live-price-heading">Live Harga Pertamina</h3>
          </div>
          <span className="live-price-sub-badge">
            📍 {fuelSettings?.provinceName || 'Jawa Timur'}
          </span>
        </div>
        <p className="live-price-subtitle">
          Ketuk jenis BBM untuk catat pengisian
        </p>

        <div className="live-price-grid-2x2">
          {livePrices.map((item) => (
            <button
              key={item.id}
              type="button"
              className="live-price-card-item"
              onClick={() => handleOpenLogModal(item.id)}
              style={{
                borderLeftColor: item.color
              }}
              title={`Klik untuk catat ${item.name}`}
            >
              <div className="price-card-top-row">
                <span className="price-card-fuel-name">{item.name}</span>
                <span
                  className="price-card-ron-pill"
                  style={{
                    color: item.color,
                    backgroundColor: `${item.color}18`
                  }}
                >
                  {item.ron}
                </span>
              </div>
              <div className="price-card-bottom-row">
                <span className="price-card-amount">
                  <small>Rp</small> {Number(item.price).toLocaleString('id-ID')}
                  <span className="price-card-per-liter">/L</span>
                </span>
                <span className="price-card-action-chip" style={{ color: item.color }}>
                  + Isi
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Action Bar (Full-Width Button, Tanpa Tombol Setting Redundan) */}
      <div className="fuel-cta-bar single-cta">
        <button
          type="button"
          className="btn-cta-log-fuel full-width"
          onClick={() => handleOpenLogModal('pertalite')}
        >
          <Plus size={19} strokeWidth={2.8} />
          <span>Catat Isi Bensin</span>
        </button>
      </div>

      {/* Subtab Navigation (Efisiensi vs Histori) */}
      <div className="fuel-subtab-nav">
        <button
          type="button"
          className={`fuel-subtab-btn ${activeTab === 'efficiency' ? 'active' : ''}`}
          onClick={() => setActiveTab('efficiency')}
        >
          <Activity size={15} />
          <span>Analisis Efisiensi</span>
        </button>
        <button
          type="button"
          className={`fuel-subtab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={15} />
          <span>Riwayat ({fuelLogs.length})</span>
        </button>
      </div>

      {/* Subtab Content */}
      <div className="fuel-subtab-content">
        {activeTab === 'efficiency' ? (
          <FuelEfficiencyCard fuelLogs={fuelLogs} fuelSettings={fuelSettings} />
        ) : (
          <FuelHistoryList fuelLogs={fuelLogs} />
        )}
      </div>

      {/* Modals */}
      <FuelLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        fuelSettings={fuelSettings}
        initialFuelType={selectedFuelTypeForModal}
      />
      <FuelSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        fuelSettings={fuelSettings}
      />
    </div>
  );
};

export default FuelDashboard;
