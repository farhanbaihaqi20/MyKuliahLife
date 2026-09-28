/**
 * Formats a number or numeric string to Indonesian Rupiah thousand separator format with dots
 * Example: 20000 -> "20.000", "2000000" -> "2.000.000"
 */
export const formatRupiahNumber = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('id-ID');
};

/**
 * Parses an Indonesian Rupiah formatted string into an integer
 * Example: "20.000" -> 20000, "1.500.000" -> 1500000
 */
export const parseRupiahNumber = (str) => {
  if (str === null || str === undefined || str === '') return 0;
  const digitsOnly = String(str).replace(/\D/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
};

/**
 * Masks money string if balance visibility is hidden
 * Example: maskMoney(20000, true) -> "Rp 20.000", maskMoney(20000, false) -> "Rp ••••••"
 */
export const maskMoney = (amount, isVisible = true, prefix = 'Rp ') => {
  if (!isVisible) return `${prefix}••••••`;
  const num = Number(amount) || 0;
  return `${prefix}${num.toLocaleString('id-ID')}`;
};

/**
 * Formats a number to a compact Indonesian Rupiah format (e.g. 500000 -> "Rp 500rb", 1500000 -> "Rp 1,5jt")
 */
export const formatCompactRupiah = (val, isVisible = true) => {
  if (!isVisible) return 'Rp •••';
  const num = Number(val) || 0;
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  }
  if (Math.abs(num) >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${num}`;
};

/**
 * Returns relative date information for transactions (Hari Ini, Kemarin, Besok, or formatted date)
 * Safely parses YYYY-MM-DD components to avoid timezone shifting issues.
 */
export const getRelativeDateInfo = (dateStr) => {
  if (!dateStr) {
    return {
      isToday: false,
      isYesterday: false,
      isTomorrow: false,
      badgeText: '',
      dateText: '',
      fullLabel: ''
    };
  }

  // Parse YYYY-MM-DD components safely
  let targetYear, targetMonth, targetDay;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    targetYear = parseInt(parts[0], 10);
    targetMonth = parseInt(parts[1], 10) - 1;
    targetDay = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    targetYear = d.getFullYear();
    targetMonth = d.getMonth();
    targetDay = d.getDate();
  }

  const targetDate = new Date(targetYear, targetMonth, targetDay);
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = todayDate.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isYesterday = diffDays === 1;
  const isTomorrow = diffDays === -1;

  const dateWithoutWeekday = targetDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const fullDateFormatted = targetDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let badgeText = '';
  let fullLabel = fullDateFormatted;

  if (isToday) {
    badgeText = 'Hari Ini';
    fullLabel = `Hari Ini, ${dateWithoutWeekday}`;
  } else if (isYesterday) {
    badgeText = 'Kemarin';
    fullLabel = `Kemarin, ${dateWithoutWeekday}`;
  } else if (isTomorrow) {
    badgeText = 'Besok';
    fullLabel = `Besok, ${dateWithoutWeekday}`;
  }

  return {
    isToday,
    isYesterday,
    isTomorrow,
    badgeText,
    dateText: dateWithoutWeekday,
    fullLabel
  };
};
