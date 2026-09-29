import mascotSafe from '../assets/mascot/mascot-safe.png';
import mascotWarning from '../assets/mascot/mascot-warning.png';
import mascotDanger from '../assets/mascot/mascot-danger.png';

/**
 * Status kondisi budget mahasiswa
 */
export const BUDGET_STATUS = {
  SAFE: 'safe',
  WARNING: 'warning',
  DANGER: 'danger'
};

/**
 * Menghitung status dan data maskot berdasarkan kondisi budget & siklus keuangan.
 * Menggunakan bahasa profesional fintech yang ramah, jelas, dan bersahabat.
 *
 * Sistem 3 Situasi:
 * 1. SAFE (Aman / Terkendali):
 *    - Pengeluaran <= 65% total budget
 *    - Jatah harian proporsional dan terjaga
 *    - Tone: Bersahabat, melegakan, suportif
 *
 * 2. WARNING (Waspada / Perlu Dijaga):
 *    - Pengeluaran 65% - 85% total budget, ATAU
 *    - Jatah harian berkurang dibanding pace normal siklus
 *    - Tone: Informatif, mengingatkan dengan santun
 *
 * 3. DANGER (Kritis / Melampaui Batas):
 *    - Budget habis (remainingBudget <= 0), ATAU
 *    - Pengeluaran >= 85% total budget
 *    - Tone: Edukatif, solutif, menyarankan penahanan belanja
 */
export function getBudgetMascotState({
  totalBudget = 0,
  remainingBudget = 0,
  cycleExpenses = 0,
  percentUsed = 0,
  dailyAllowance = 0,
  financialCycle = {}
}) {
  const safeTotalBudget = Number(totalBudget) || 1000000;
  const safeRemaining = Math.max(0, Number(remainingBudget) || 0);
  const safePercentUsed = Math.min(100, Math.max(0, Number(percentUsed) || 0));
  const safeDailyAllowance = Math.max(0, Number(dailyAllowance) || 0);

  const totalDays = Math.max(1, Number(financialCycle?.totalDays) || 30);
  const daysRemaining = Math.max(1, Number(financialCycle?.daysRemaining) || 1);
  const daysElapsed = Math.max(1, totalDays - daysRemaining + 1);
  
  // Ideal jatah per hari jika dibagi rata dari total budget di awal
  const idealDailyBudget = safeTotalBudget / totalDays;
  // Ekspektasi persentase pemakaian sesuai hari yang sudah berjalan
  const expectedPacePercent = (daysElapsed / totalDays) * 100;

  // Cek apakah budget sudah terlewati / defisit
  const isOverBudget = safeRemaining <= 0 || cycleExpenses >= safeTotalBudget;

  let status = BUDGET_STATUS.SAFE;

  if (isOverBudget || safePercentUsed >= 85 || (safeDailyAllowance < idealDailyBudget * 0.35 && daysRemaining > 2)) {
    status = BUDGET_STATUS.DANGER;
  } else if (
    safePercentUsed >= 65 ||
    (safeDailyAllowance < idealDailyBudget * 0.7 && daysRemaining > 3) ||
    safePercentUsed > expectedPacePercent + 20
  ) {
    status = BUDGET_STATUS.WARNING;
  } else {
    status = BUDGET_STATUS.SAFE;
  }

  if (status === BUDGET_STATUS.DANGER) {
    const isExceeded = isOverBudget || safeRemaining <= 0;
    return {
      status,
      badgeLabel: isExceeded ? 'Overbudget' : 'Kritis',
      badgeClass: 'status-danger',
      mascotSrc: mascotDanger,
      mascotAlt: 'Maskot Peringatan Anggaran',
      title: isExceeded ? 'Batas Anggaran Terlampaui' : 'Sisa Anggaran Menipis',
      descPrefix: isExceeded
        ? 'Pengeluaran siklus ini telah melampaui target anggaran. Disarankan menahan belanja non-pokok hingga periode baru.'
        : 'Alokasi belanja harianmu tersisa rata-rata ',
      descSuffix: isExceeded
        ? ''
        : ' sampai akhir periode. Prioritaskan kebutuhan pokok terlebih dahulu.',
      isExceeded,
      dailyAllowance: safeDailyAllowance,
      daysRemaining
    };
  }

  if (status === BUDGET_STATUS.WARNING) {
    return {
      status,
      badgeLabel: 'Waspada',
      badgeClass: 'status-warning',
      mascotSrc: mascotWarning,
      mascotAlt: 'Maskot Pengingat Anggaran',
      title: 'Pengeluaran Perlu Dijaga',
      descPrefix: 'Alokasi belanja harianmu tersisa ',
      descSuffix: ' hingga akhir periode. Mulai atur pengeluaran agar tetap aman.',
      isExceeded: false,
      dailyAllowance: safeDailyAllowance,
      daysRemaining
    };
  }

  // SAFE
  return {
    status: BUDGET_STATUS.SAFE,
    badgeLabel: 'Aman',
    badgeClass: 'status-safe',
    mascotSrc: mascotSafe,
    mascotAlt: 'Maskot Anggaran Sehat',
    title: 'Kondisi Anggaran Aman',
    descPrefix: 'Alokasi belanja harianmu rata-rata ',
    descSuffix: ' hingga akhir periode ini.',
    isExceeded: false,
    dailyAllowance: safeDailyAllowance,
    daysRemaining
  };
}
