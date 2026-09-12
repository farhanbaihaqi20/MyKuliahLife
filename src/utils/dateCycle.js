/**
 * Menghitung rentang siklus keuangan bulanan berdasarkan tanggal cut-off (startDay)
 * Contoh: Jika startDay = 25 dan hari ini 12 Sep 2026, maka siklusnya 25 Agu - 24 Sep 2026.
 * Jika startDay = 1 dan hari ini 12 Sep 2026, maka siklusnya 1 Sep - 30 Sep 2026.
 */
export const getFinancialCycle = (startDay = 1, referenceDate = new Date()) => {
  const d = new Date(referenceDate);
  const currentYear = d.getFullYear();
  const currentMonth = d.getMonth(); // 0-indexed (0 = Jan, 8 = Sep)
  const currentDay = d.getDate();

  let startYear = currentYear;
  let startMonth = currentMonth;
  let endYear = currentYear;
  let endMonth = currentMonth;

  if (startDay === 1) {
    // 1st to last day of current month
    startYear = currentYear;
    startMonth = currentMonth;
    endYear = currentYear;
    endMonth = currentMonth;
  } else if (currentDay >= startDay) {
    // Current cycle started this month on startDay
    startMonth = currentMonth;
    startYear = currentYear;
    endMonth = (currentMonth + 1) % 12;
    endYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  } else {
    // Current cycle started last month on startDay
    startMonth = (currentMonth - 1 + 12) % 12;
    startYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    endMonth = currentMonth;
    endYear = currentYear;
  }

  // Calculate actual dates
  const startDate = new Date(startYear, startMonth, startDay);
  
  // End date is one day before startDay in next month
  let endDay = startDay === 1
    ? new Date(endYear, endMonth + 1, 0).getDate() // Last day of month
    : startDay - 1;

  const endDate = new Date(endYear, endMonth, endDay, 23, 59, 59);

  // Total days in this cycle
  const oneDayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / oneDayMs) + 1);

  // Days remaining from today to endDate
  const todayMs = new Date(currentYear, currentMonth, currentDay).getTime();
  const daysRemaining = Math.max(1, Math.round((endDate.getTime() - todayMs) / oneDayMs) + 1);

  // Format label: e.g. "1 Sep - 30 Sep 2026" or "25 Agu - 24 Sep 2026"
  const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const label = startDay === 1
    ? `1 ${monthNamesId[startMonth]} - ${endDay} ${monthNamesId[endMonth]} ${endYear}`
    : `${startDay} ${monthNamesId[startMonth]} - ${endDay} ${monthNamesId[endMonth]} ${endYear}`;

  const formatIsoDate = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isoStart = formatIsoDate(startDate);
  const isoEnd = formatIsoDate(endDate);

  const isDateInCycle = (dateString) => {
    if (!dateString) return false;
    return dateString >= isoStart && dateString <= isoEnd;
  };

  return {
    startDay,
    startDate: isoStart,
    endDate: isoEnd,
    label,
    totalDays,
    daysRemaining,
    isDateInCycle
  };
};
