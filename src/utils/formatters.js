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
