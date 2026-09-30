import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PieChart,
  Sparkles,
  Check,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  Plus,
  Minus
} from 'lucide-react';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import confetti from 'canvas-confetti';

const PRESETS = [
  {
    id: 'standard',
    name: '🍕 Standar Anak Kos',
    desc: 'Proporsi seimbang makan, kos, dan kebutuhan',
    allocations: {
      'Makanan & minuman': 35,
      'Tagihan & utilitas': 25,
      'Kebutuhan Pribadi & Skincare': 15,
      'Transport & Bensin': 12,
      'Kebutuhan Kuliah & Print': 8,
      'Hiburan & Jajan': 5
    }
  },
  {
    id: 'frugal',
    name: '🛡️ Mode Hemat Ekstra',
    desc: 'Prioritas makan & kebutuhan pokok',
    allocations: {
      'Makanan & minuman': 45,
      'Tagihan & utilitas': 25,
      'Kebutuhan Pribadi & Skincare': 15,
      'Transport & Bensin': 10,
      'Kebutuhan Kuliah & Print': 5,
      'Hiburan & Jajan': 0
    }
  },
  {
    id: 'academic',
    name: '📚 Fokus Kuliah & Tugas',
    desc: 'Alokasi ekstra untuk print, buku, & materi',
    allocations: {
      'Makanan & minuman': 30,
      'Tagihan & utilitas': 20,
      'Kebutuhan Kuliah & Print': 20,
      'Kebutuhan Pribadi & Skincare': 15,
      'Transport & Bensin': 10,
      'Hiburan & Jajan': 5
    }
  }
];

/**
 * Pure helper function to rebalance allocations to exactly targetSum (100%).
 * Completely free of external closure mutations, guaranteed safe in React Strict Mode.
 */
export const rebalanceAllocations = (list, targetSum = 100, preserveId = null) => {
  if (!list || list.length === 0) return list;
  const currentSum = list.reduce((s, c) => s + (Number(c.percentage) || 0), 0);
  const diff = targetSum - currentSum;
  if (diff === 0) return list;

  const copy = list.map(c => ({ ...c, percentage: Number(c.percentage) || 0 }));

  if (diff < 0) {
    // Kelebihan (>100%): kurangi dari kategori selain preserveId
    let excess = Math.abs(diff);
    let candidates = copy.filter(c => c.id !== preserveId && c.percentage > 0);
    if (candidates.length === 0) {
      candidates = copy.filter(c => c.percentage > 0);
    }

    const candSum = candidates.reduce((s, c) => s + c.percentage, 0);
    if (candSum > 0) {
      let totalCut = 0;
      candidates.forEach(c => {
        const cut = Math.min(c.percentage, Math.floor((c.percentage / candSum) * excess));
        c.percentage -= cut;
        totalCut += cut;
      });
      excess -= totalCut;
    }

    // Sisa pembulatan ke bawah
    while (excess > 0) {
      const active = candidates.filter(c => c.percentage > 0);
      if (active.length === 0) {
        const anyActive = copy.filter(c => c.percentage > 0);
        if (anyActive.length === 0) break;
        anyActive.sort((a, b) => b.percentage - a.percentage);
        anyActive[0].percentage -= 1;
      } else {
        active.sort((a, b) => b.percentage - a.percentage);
        active[0].percentage -= 1;
      }
      excess -= 1;
    }
  } else {
    // Kekurangan (<100%): tambahkan ke preserveId jika ada, atau ke kategori dengan persentase terbesar
    let deficit = diff;
    let target = copy.find(c => c.id === preserveId);
    if (!target) {
      let maxPct = -1;
      copy.forEach(c => {
        if (c.percentage > maxPct) {
          maxPct = c.percentage;
          target = c;
        }
      });
    }
    if (target) {
      target.percentage += deficit;
    }
  }

  return copy;
};

export const BudgetSettingsModal = ({
  isOpen,
  onClose,
  totalBudget = 1000000,
  categories = [],
  onSave
}) => {
  const [localTotalBudget, setLocalTotalBudget] = useState(totalBudget);
  const [totalInputStr, setTotalInputStr] = useState(formatRupiahNumber(totalBudget));
  const [allocations, setAllocations] = useState([]);
  const [lastModifiedId, setLastModifiedId] = useState(null);
  const [isAutoBalance, setIsAutoBalance] = useState(true);

  // Initialize allocations from categories
  useEffect(() => {
    if (isOpen) {
      setLocalTotalBudget(totalBudget);
      setTotalInputStr(formatRupiahNumber(totalBudget));
      setLastModifiedId(null);

      // Calculate initial percentage for each category
      const initial = categories.map(cat => {
        let pct = cat.percentage;
        if (pct === undefined || pct === null) {
          pct = totalBudget > 0 ? Math.round(((cat.budget || 0) / totalBudget) * 100) : 0;
        }
        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color || '#1665D8',
          percentage: Number(pct) || 0
        };
      });

      // Normalize if initial percentage doesn't sum to 100%
      const balanced = rebalanceAllocations(initial, 100);
      setAllocations(balanced);
    }
  }, [isOpen, totalBudget, categories]);

  // Total allocated percentage
  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
  }, [allocations]);

  const isOverBudget = totalPercentage > 100;
  const isUnderBudget = totalPercentage < 100;
  const isValid = totalPercentage === 100;

  // Handle total budget change
  const handleTotalBudgetChange = (e) => {
    const rawVal = parseRupiahNumber(e.target.value);
    setLocalTotalBudget(rawVal || 0);
    setTotalInputStr(formatRupiahNumber(rawVal || 0));
  };

  const handleQuickBudgetSelect = (val) => {
    setLocalTotalBudget(val);
    setTotalInputStr(formatRupiahNumber(val));
  };

  // Handle percentage change for a category
  const handlePercentageChange = (catId, newPct) => {
    setLastModifiedId(catId);
    const clampedPct = Math.max(0, Math.min(100, Math.round(Number(newPct) || 0)));

    setAllocations(prev => {
      const updated = prev.map(cat => (cat.id === catId ? { ...cat, percentage: clampedPct } : cat));
      if (isAutoBalance) {
        return rebalanceAllocations(updated, 100, catId);
      }
      return updated;
    });
  };

  // Adjust percentage by step (+5 / -5)
  const adjustStep = (catId, delta) => {
    setLastModifiedId(catId);
    setAllocations(prev => {
      const target = prev.find(cat => cat.id === catId);
      if (!target) return prev;
      const next = Math.max(0, Math.min(100, (target.percentage || 0) + delta));
      const updated = prev.map(cat => (cat.id === catId ? { ...cat, percentage: next } : cat));
      if (isAutoBalance) {
        return rebalanceAllocations(updated, 100, catId);
      }
      return updated;
    });
  };

  // Apply predefined preset
  const applyPreset = (preset) => {
    setAllocations(prev => {
      const updated = prev.map(cat => {
        const presetVal = preset.allocations[cat.name];
        if (presetVal !== undefined) {
          return { ...cat, percentage: presetVal };
        }
        return cat;
      });

      return rebalanceAllocations(updated, 100);
    });
  };

  // Distribute percentages equally
  const distributeEqually = () => {
    if (allocations.length === 0) return;
    const basePct = Math.floor(100 / allocations.length);
    const remainder = 100 - basePct * allocations.length;

    setAllocations(prev =>
      prev.map((cat, idx) => ({
        ...cat,
        percentage: idx === 0 ? basePct + remainder : basePct
      }))
    );
  };

  // 1-Click Auto-balance remainder or trim excess to 100%
  const autoBalanceTo100 = () => {
    setAllocations(prev => rebalanceAllocations(prev, 100, lastModifiedId));
    confetti({ particleCount: 28, spread: 50, origin: { y: 0.7 } });
  };

  // Save budget (strictly blocked if not exactly 100%)
  const handleSave = () => {
    if (!isValid) {
      if (isOverBudget) {
        alert(
          `Total alokasi saat ini ${totalPercentage}% (Kelebihan ${totalPercentage - 100}%).\n\nAlokasi tidak boleh melebihi 100%. Silakan klik 'Kurangi Kategori Lain Otomatis' agar pas 100%.`
        );
      } else {
        alert(
          `Total alokasi saat ini ${totalPercentage}% (Sisa ${100 - totalPercentage}% belum teralokasi).\n\nTotal alokasi harus tepat 100% sebelum disimpan.`
        );
      }
      return;
    }

    const updatedCategories = categories.map(cat => {
      const matchAlloc = allocations.find(a => a.id === cat.id);
      const pct = matchAlloc ? matchAlloc.percentage : (cat.percentage || 0);
      const calculatedBudget = Math.round((localTotalBudget * pct) / 100);

      return {
        ...cat,
        percentage: pct,
        budget: calculatedBudget
      };
    });

    onSave(localTotalBudget, updatedCategories);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    onClose();
  };

  // Handle close (X or backdrop click)
  const handleClose = () => {
    if (isValid) {
      handleSave();
    } else {
      // Discard invalid draft safely
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1280 }}>
      <div
        className="modal-bottom-sheet budget-settings-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="sheet-handle-bar" />

        {/* Modal Header */}
        <div className="budget-settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="budget-settings-header-icon">
              <PieChart size={20} />
            </div>
            <div>
              <h3 className="budget-settings-title">Atur Alokasi Budget (%)</h3>
              <p className="budget-settings-subtitle">Bagi persentase kebutuhanmu, nominal otomatis dihitung</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className={`budget-header-save-btn ${!isValid ? 'disabled' : ''}`}
              title={
                !isValid
                  ? isOverBudget
                    ? `Total melebihi 100% (${totalPercentage}%). Kurangi kategori lain.`
                    : `Total belum pas 100% (${totalPercentage}%).`
                  : 'Simpan alokasi budget'
              }
            >
              <Check size={14} style={{ marginRight: '4px' }} />
              Simpan
            </button>
            <button
              onClick={handleClose}
              className="category-modal-close-btn"
              aria-label="Tutup"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="category-modal-body" style={{ paddingRight: '4px' }}>
          {/* Total Budget Card */}
          <div className="budget-total-input-card">
            <label className="budget-input-label">
              <DollarSign size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Total Budget Bulanan (Rp)
            </label>
            <input
              type="text"
              value={totalInputStr}
              onChange={handleTotalBudgetChange}
              className="budget-total-input-field"
              placeholder="Rp 1.500.000"
            />

            {/* Quick Amount Pills */}
            <div className="budget-quick-pills-row">
              {[800000, 1000000, 1500000, 2000000].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`budget-quick-pill ${localTotalBudget === val ? 'active' : ''}`}
                  onClick={() => handleQuickBudgetSelect(val)}
                >
                  {val >= 1000000 ? `${(val / 1000000).toLocaleString('id-ID')} Jt` : `${val / 1000} Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Distribution Bar */}
          <div className="budget-alloc-summary-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Distribusi Alokasi
              </span>
              <span
                className={`budget-alloc-status-pill ${
                  totalPercentage === 100 ? 'safe' : totalPercentage > 100 ? 'over' : 'warning'
                }`}
              >
                {totalPercentage === 100 ? (
                  <>
                    <Check size={12} style={{ marginRight: '3px' }} /> Pas 100% (Siap Simpan)
                  </>
                ) : totalPercentage > 100 ? (
                  <>
                    <AlertTriangle size={12} style={{ marginRight: '3px' }} /> Kelebihan {totalPercentage - 100}%
                  </>
                ) : (
                  <>
                    Sisa {100 - totalPercentage}% Belum Teralokasi
                  </>
                )}
              </span>
            </div>

            {/* Multi-segment Bar */}
            <div className="budget-multi-progress-track">
              {allocations.map(cat => {
                if (!cat.percentage || cat.percentage <= 0) return null;
                return (
                  <div
                    key={cat.id}
                    className="budget-multi-progress-seg"
                    style={{
                      width: `${(cat.percentage / Math.max(100, totalPercentage)) * 100}%`,
                      backgroundColor: cat.color
                    }}
                    title={`${cat.name}: ${cat.percentage}%`}
                  />
                );
              })}
            </div>

            {/* Quick Action Button when not 100% */}
            {totalPercentage !== 100 && (
              <div style={{ marginTop: '10px' }}>
                {isOverBudget ? (
                  <button
                    type="button"
                    className="budget-auto-trim-action-btn"
                    onClick={autoBalanceTo100}
                  >
                    <Sparkles size={13} style={{ marginRight: '5px' }} />
                    Kurangi Kategori Lain Otomatis (-{totalPercentage - 100}%)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="budget-auto-trim-action-btn"
                    style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1665D8' }}
                    onClick={autoBalanceTo100}
                  >
                    <RotateCcw size={13} style={{ marginRight: '5px' }} />
                    Seimbangkan ke 100% Otomatis (+{100 - totalPercentage}%)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Real-time Auto-Balance Toggle */}
          <div className={`budget-autobalance-toggle-row ${isAutoBalance ? 'active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                  Auto-kurangi Kategori Lain saat Digeser
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  {isAutoBalance
                    ? 'Aktif: Kategori lain otomatis dikurangi agar total selalu pas 100%'
                    : 'Nonaktif: Anda dapat mengatur manual & mengunci persentase'}
                </div>
              </div>
            </div>
            <label className="budget-toggle-switch" title="Nyalakan/matikan penyesuaian otomatis">
              <input
                type="checkbox"
                checked={isAutoBalance}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setIsAutoBalance(nextVal);
                  if (nextVal && totalPercentage !== 100) {
                    setAllocations(prev => rebalanceAllocations(prev, 100, lastModifiedId));
                  }
                }}
              />
              <span className="budget-toggle-slider" />
            </label>
          </div>

          {/* Presets Row */}
          <div style={{ marginTop: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Pilihan Template Alokasi
              </span>
              <button
                type="button"
                className="budget-equal-btn"
                onClick={distributeEqually}
              >
                ⚖️ Bagi Rata
              </button>
            </div>

            <div className="budget-presets-scroll">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="budget-preset-pill"
                  onClick={() => applyPreset(p)}
                >
                  <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#0F172A' }}>{p.name}</div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '1px' }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Sliders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {allocations.map(cat => {
              const nominal = Math.round((localTotalBudget * (cat.percentage || 0)) / 100);

              return (
                <div key={cat.id} className="budget-cat-slider-card">
                  <div className="budget-cat-slider-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="budget-cat-slider-icon has-3d-icon" style={{ backgroundColor: 'transparent' }}>
                        <CategoryIcon category={cat.name} icon={cat.icon} size={32} />
                      </span>
                      <div>
                        <div className="budget-cat-slider-name">{cat.name}</div>
                        <div className="budget-cat-slider-nominal">
                          Rp {nominal.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {/* Stepper + Input % */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        className="budget-step-btn"
                        onClick={() => adjustStep(cat.id, -5)}
                        aria-label="Kurang 5%"
                      >
                        <Minus size={12} />
                      </button>

                      <div className="budget-pct-input-wrap">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={cat.percentage}
                          onChange={(e) => handlePercentageChange(cat.id, e.target.value)}
                          className="budget-pct-input"
                        />
                        <span className="budget-pct-symbol">%</span>
                      </div>

                      <button
                        type="button"
                        className="budget-step-btn"
                        onClick={() => adjustStep(cat.id, 5)}
                        aria-label="Tambah 5%"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div style={{ marginTop: '8px', padding: '0 2px' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={cat.percentage}
                      onChange={(e) => handlePercentageChange(cat.id, e.target.value)}
                      className="budget-range-slider"
                      style={{
                        accentColor: cat.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="category-modal-footer">
          <button
            type="button"
            className={`category-add-tx-btn ${!isValid ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={!isValid}
          >
            {isOverBudget ? (
              <>
                <AlertTriangle size={16} style={{ marginRight: '6px' }} />
                Kelebihan {totalPercentage - 100}% — Tidak Bisa Disimpan
              </>
            ) : isUnderBudget ? (
              <>
                <AlertTriangle size={16} style={{ marginRight: '6px' }} />
                Sisa {100 - totalPercentage}% Belum Teralokasi — Tidak Bisa Disimpan
              </>
            ) : (
              <>
                <Check size={16} style={{ marginRight: '6px' }} />
                Simpan Alokasi (100%)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSettingsModal;
