import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, GraduationCap, Plus, Wallet, Award } from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab, setIsQuickAddOpen } = useApp();

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav-bar">
        {/* 1. Beranda */}
        <button
          className={`nav-item-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={22} />
          <span>Beranda</span>
        </button>

        {/* 2. Akademik */}
        <button
          className={`nav-item-btn ${activeTab === 'academic' ? 'active' : ''}`}
          onClick={() => setActiveTab('academic')}
        >
          <GraduationCap size={22} />
          <span>Akademik</span>
        </button>

        {/* 3. Floating Quick Add (+) Button */}
        <button
          className="floating-add-btn"
          onClick={() => setIsQuickAddOpen(true)}
          title="Tambah Transaksi, Tugas, atau Catatan"
        >
          <Plus size={28} strokeWidth={2.8} />
        </button>

        {/* 4. Keuangan / Budget */}
        <button
          className={`nav-item-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <Wallet size={22} />
          <span>Keuangan</span>
        </button>

        {/* 5. Nilai & IPK */}
        <button
          className={`nav-item-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <Award size={22} />
          <span>Nilai & IPK</span>
        </button>
      </nav>
    </div>
  );
};
