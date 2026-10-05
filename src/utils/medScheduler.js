/**
 * MedScheduler — Mesin Rekomendasi Jadwal Minum Obat
 *
 * Prinsip:
 * 1. SPACING    — Dosis untuk obat yang sama terdistribusi merata di jam
 *                 bangun (±06:30 – 22:00) dengan jarak minimum aman.
 * 2. CLUSTERING — Waktu minum diselaraskan dengan jadwal obat lain agar
 *                 beberapa obat bisa diminum bersamaan (kepatuhan lebih baik).
 * 3. ADAPTIF    — Jam yang sudah diatur/diubah user menjadi "anchor" baru
 *                 untuk rekomendasi berikutnya.
 */

// Kandidat slot default sepanjang jam bangun (HH:MM)
const DEFAULT_POOL = [
  '06:30', '07:00', '08:00', '09:00',
  '12:00', '13:00', '15:00',
  '17:00', '19:00', '20:00', '21:00', '22:00'
];

// Slot kanonik (pagi-siang-malam klasik) — diberi preferensi ringan
const CANONICAL_SLOTS = ['07:00', '13:00', '19:00'];

// Aturan jarak antar dosis per frekuensi harian (menit)
const FREQ_RULES = {
  1: { idealGap: 0, minGap: 0 },
  2: { idealGap: 720, minGap: 600 },   // ~12 jam, minimal 10 jam
  3: { idealGap: 360, minGap: 270 },   // ~6 jam, minimal 4.5 jam
  4: { idealGap: 240, minGap: 180 }    // ~4 jam, minimal 3 jam
};

const CLUSTER_TOLERANCE_MIN = 20;   // Jam dianggap "selaras" jika selisih ≤ 20 menit
const CLUSTER_BONUS = 45;
const CANONICAL_BONUS = 10;

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const toHHMM = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Kumpulkan semua jam terjadwal dari obat AKTIF lain (selain yang sedang diedit).
 * Inilah "anchor" adaptif — termasuk jam yang pernah diubah manual user.
 */
export const collectExistingTimes = (medications = [], excludeMedId = null) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const times = [];
  (medications || []).forEach(med => {
    if (!med) return;
    if (excludeMedId && String(med.id) === String(excludeMedId)) return;
    if (med.status && med.status !== 'active') return;
    if (med.endDate && med.endDate < todayStr) return;
    (med.scheduleTimes || []).forEach(t => times.push(t));
  });
  return times;
};

const isClustered = (mins, existingMins) =>
  existingMins.some(e => Math.abs(e - mins) <= CLUSTER_TOLERANCE_MIN);

// Generator kombinasi: pilih k elemen dari array terurut
function* combinations(arr, k) {
  const n = arr.length;
  if (k > n) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.map(i => arr[i]);
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

/**
 * Hitung skor satu kombinasi jadwal (lebih kecil = lebih baik).
 */
const scoreCombo = (comboMins, rules, existingMins) => {
  let score = 0;

  // 1. Spacing: deviasi dari jarak ideal + penalti berat jika di bawah minimum
  for (let i = 1; i < comboMins.length; i++) {
    const gap = comboMins[i] - comboMins[i - 1];
    score += Math.abs(gap - rules.idealGap);
    if (gap < rules.minGap) {
      score += (rules.minGap - gap) * 5;
    }
  }

  // 2. Preferensi dosis pertama di pagi hari (06:00–10:00)
  const firstDose = comboMins[0];
  if (firstDose > 600) score += (firstDose - 600) * 0.5;
  if (firstDose < 360) score += (360 - firstDose) * 1.5;

  // 3. Dosis terakhir jangan terlalu larut (> 22:00)
  const lastDose = comboMins[comboMins.length - 1];
  if (lastDose > 1320) score += (lastDose - 1320) * 1.5;

  // 4. Bonus clustering dengan jadwal obat lain
  comboMins.forEach(t => {
    if (isClustered(t, existingMins)) score -= CLUSTER_BONUS;
  });

  // 5. Bonus slot kanonik
  comboMins.forEach(t => {
    if (CANONICAL_SLOTS.some(c => Math.abs(toMinutes(c) - t) <= CLUSTER_TOLERANCE_MIN)) {
      score -= CANONICAL_BONUS;
    }
  });

  return score;
};

/**
 * Rekomendasikan jadwal optimal untuk satu obat.
 *
 * @param {Object} params
 * @param {number} params.frequency - Berapa kali minum per hari (1-4)
 * @param {Array}  params.medications - Semua obat (untuk anchor clustering)
 * @param {string|null} params.excludeMedId - ID obat yang sedang diedit (dikeluarkan dari anchor)
 * @param {string[]} params.currentTimes - Jadwal saat ini (dipakai saat freq tidak berubah / sudah valid)
 * @param {number[]} params.poolMinutes - Kandidat slot dalam menit (default: DEFAULT_POOL)
 * @returns {{ times: string[], changed: boolean, reason: string }}
 */
export const recommendSchedule = ({
  frequency = 1,
  medications = [],
  excludeMedId = null,
  currentTimes = [],
  poolMinutes = null
} = {}) => {
  const freq = Math.max(1, Math.min(4, Number(frequency) || 1));
  const rules = FREQ_RULES[freq];

  const existingTimes = collectExistingTimes(medications, excludeMedId);
  const existingMins = existingTimes.map(toMinutes);

  // Bangun pool kandidat: DEFAULT_POOL + semua jam existing (anchor adaptif)
  const poolSet = new Set((poolMinutes || DEFAULT_POOL.map(toMinutes)));
  existingMins.forEach(m => poolSet.add(m));
  const pool = Array.from(poolSet).sort((a, b) => a - b);

  // Jika jumlah jadwal saat ini sudah sesuai frekuensi DAN valid → pertahankan
  const validCurrent = (currentTimes || []).filter(Boolean).map(toMinutes).sort((a, b) => a - b);
  if (validCurrent.length === freq && isSpacingValid(validCurrent, rules)) {
    return {
      times: validCurrent.map(toHHMM),
      changed: false,
      reason: 'Jadwal saat ini sudah optimal'
    };
  }

  // Cari kombinasi terbaik
  let best = null;
  let bestScore = Infinity;

  for (const combo of combinations(pool, freq)) {
    const score = scoreCombo(combo, rules, existingMins);
    if (score < bestScore) {
      bestScore = score;
      best = combo;
    }
  }

  if (!best) {
    // Fallback: distribusi merata manual
    best = buildEvenDistribution(freq);
  }

  return {
    times: best.map(toHHMM),
    changed: true,
    reason: buildReason(freq, best, existingMins)
  };
};

const isSpacingValid = (comboMins, rules) => {
  if (comboMins.length < 2) return true;
  for (let i = 1; i < comboMins.length; i++) {
    if (comboMins[i] - comboMins[i - 1] < rules.minGap) return false;
  }
  return true;
};

const buildEvenDistribution = (freq) => {
  // Fallback: distribusi merata 07:00 → 21:00
  if (freq === 1) return [toMinutes('08:00')];
  const start = toMinutes('07:00');
  const end = toMinutes('21:00');
  const step = Math.floor((end - start) / (freq - 1));
  return Array.from({ length: freq }, (_, i) => start + step * i);
};

const buildReason = (freq, comboMins, existingMins) => {
  const clustered = comboMins.filter(t => isClustered(t, existingMins)).length;
  if (clustered > 0 && clustered < comboMins.length) {
    return 'Diselaraskan sebagian dengan jadwal obat lain';
  }
  if (clustered === comboMins.length) {
    return 'Diselaraskan penuh dengan jadwal obat lain';
  }
  return `Jarak optimal untuk ${freq}x sehari`;
};

/**
 * Validasi apakah satu jam boleh ditambahkan ke jadwal obat tertentu
 * (tanpa melanggar jarak minimum antar dosis obat itu sendiri).
 */
export const canAddTime = (times = [], newTime) => {
  if (!newTime) return false;
  if (times.includes(newTime)) return false;
  const mins = toMinutes(newTime);
  const sorted = [...times].map(toMinutes).sort((a, b) => a - b);
  // Jarak minimum antar dosis: 60 menit (aturan umum)
  return sorted.every(t => Math.abs(t - mins) >= 60);
};

export const FREQ_OPTIONS = [
  { value: 1, label: '1x sehari' },
  { value: 2, label: '2x sehari' },
  { value: 3, label: '3x sehari' },
  { value: 4, label: '4x sehari' }
];
