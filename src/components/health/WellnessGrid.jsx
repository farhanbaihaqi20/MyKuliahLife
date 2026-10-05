import React, { useState } from 'react';
import { Droplets, Moon, Scale, Smile, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import WaterIntakeView from './WaterIntakeView';
import SleepTrackerView from './SleepTrackerView';
import BmiCalculatorView from './BmiCalculatorView';
import MoodCheckinView from './MoodCheckinView';

const MOOD_EMOJIS = {
  1: { emoji: '😢', label: 'Sangat Buruk' },
  2: { emoji: '😕', label: 'Kurang Baik' },
  3: { emoji: '😐', label: 'Biasa Aja' },
  4: { emoji: '😊', label: 'Baik' },
  5: { emoji: '🤩', label: 'Sangat Baik' }
};

export const WellnessGrid = () => {
  const [activeSubView, setActiveSubView] = useState(null); // 'water' | 'sleep' | 'bmi' | 'mood' | null

  const {
    todayWaterIntake = 0,
    waterIntakeTarget = 2000,
    todaySleepLog,
    latestBmi,
    todayMood
  } = useApp();

  if (activeSubView === 'water') {
    return <WaterIntakeView onBack={() => setActiveSubView(null)} />;
  }
  if (activeSubView === 'sleep') {
    return <SleepTrackerView onBack={() => setActiveSubView(null)} />;
  }
  if (activeSubView === 'bmi') {
    return <BmiCalculatorView onBack={() => setActiveSubView(null)} />;
  }
  if (activeSubView === 'mood') {
    return <MoodCheckinView onBack={() => setActiveSubView(null)} />;
  }

  const waterPct = Math.min(100, Math.round((todayWaterIntake / (waterIntakeTarget || 2000)) * 100));
  const currentMoodInfo = todayMood ? (MOOD_EMOJIS[todayMood.mood] || MOOD_EMOJIS[3]) : null;

  return (
    <div className="wellness-grid-container animate-fade-in">
      <div className="wellness-grid">
        {/* Card 1: Minum Air */}
        <button
          type="button"
          className="wellness-card"
          onClick={() => setActiveSubView('water')}
        >
          <div className="wellness-card-top">
            <div className="wellness-card-icon-box water">
              <Droplets size={20} />
            </div>
            <span className="wellness-card-badge water">
              {waterPct}%
            </span>
          </div>

          <div className="wellness-card-body">
            <span className="wellness-card-title">Minum Air</span>
            <div className="wellness-card-primary">
              {todayWaterIntake} <span className="wellness-card-unit">/ {waterIntakeTarget} ml</span>
            </div>
            <span className="wellness-card-sub">
              {waterPct >= 100 ? 'Target tercapai hari ini' : 'Catat asupan cairan'}
            </span>
          </div>

          <div className="wellness-card-footer">
            <span>Buka tracker</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Card 2: Pola Tidur */}
        <button
          type="button"
          className="wellness-card"
          onClick={() => setActiveSubView('sleep')}
        >
          <div className="wellness-card-top">
            <div className="wellness-card-icon-box sleep">
              <Moon size={20} />
            </div>
            <span className="wellness-card-badge sleep">
              {todaySleepLog ? todaySleepLog.quality : 'Tidur'}
            </span>
          </div>

          <div className="wellness-card-body">
            <span className="wellness-card-title">Pola Tidur</span>
            <div className="wellness-card-primary">
              {todaySleepLog ? `${todaySleepLog.durationHours} Jam` : 'Belum Dicatat'}
            </div>
            <span className="wellness-card-sub">
              {todaySleepLog ? `${todaySleepLog.sleepTime} - ${todaySleepLog.wakeTime}` : 'Pantau jam istirahat'}
            </span>
          </div>

          <div className="wellness-card-footer">
            <span>Buka tracker</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Card 3: BMI & Berat */}
        <button
          type="button"
          className="wellness-card"
          onClick={() => setActiveSubView('bmi')}
        >
          <div className="wellness-card-top">
            <div className="wellness-card-icon-box bmi">
              <Scale size={20} />
            </div>
            <span className="wellness-card-badge bmi">
              {latestBmi ? `${latestBmi.weight} kg` : 'BMI'}
            </span>
          </div>

          <div className="wellness-card-body">
            <span className="wellness-card-title">BMI & Berat</span>
            <div className="wellness-card-primary">
              {latestBmi ? `${latestBmi.bmi} BMI` : 'Hitung BMI'}
            </div>
            <span className="wellness-card-sub">
              {latestBmi ? (latestBmi.category === 'normal' ? 'Kategori berat ideal' : `Kategori ${latestBmi.category}`) : 'Cek berat idealmu'}
            </span>
          </div>

          <div className="wellness-card-footer">
            <span>Buka kalkulator</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Card 4: Mood Harian */}
        <button
          type="button"
          className="wellness-card"
          onClick={() => setActiveSubView('mood')}
        >
          <div className="wellness-card-top">
            <div className="wellness-card-icon-box mood">
              <Smile size={20} />
            </div>
            <span className="wellness-card-badge mood">
              {todayMood ? 'Tercatat' : 'Hari Ini'}
            </span>
          </div>

          <div className="wellness-card-body">
            <span className="wellness-card-title">Mood Harian</span>
            <div className="wellness-card-primary">
              {currentMoodInfo ? (
                <span>{currentMoodInfo.emoji} {currentMoodInfo.label}</span>
              ) : (
                'Check-in Mood'
              )}
            </div>
            <span className="wellness-card-sub">
              {todayMood?.notes ? `"${todayMood.notes}"` : 'Bagaimana harimu berjalan?'}
            </span>
          </div>

          <div className="wellness-card-footer">
            <span>Buka refleksi</span>
            <ChevronRight size={14} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default WellnessGrid;
