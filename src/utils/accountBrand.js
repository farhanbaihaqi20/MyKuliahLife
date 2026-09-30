// src/utils/accountBrand.js
// Utility for brand matching, custom icons, and minimalist account distinction

export const ACCOUNT_ICONS = {
  cash: '/assets/accounts/account-cash.png',
  ewallet: '/assets/accounts/account-ewallet.png',
  bank: '/assets/accounts/account-bank.png'
};

export const getAccountTypeIcon = (type) => {
  if (type === 'cash') return ACCOUNT_ICONS.cash;
  if (type === 'ewallet') return ACCOUNT_ICONS.ewallet;
  if (type === 'bank') return ACCOUNT_ICONS.bank;
  return ACCOUNT_ICONS.cash;
};

export const POPULAR_BRAND_PRESETS = [
  // Banks
  { match: ['krom', 'krombank'], label: 'Krom', shortCode: 'KROM', color: '#7C3AED', type: 'bank' },
  { match: ['sea', 'seabank'], label: 'SeaBank', shortCode: 'SEA', color: '#FF5722', type: 'bank' },
  { match: ['bca', 'klikbca', 'mybca'], label: 'BCA', shortCode: 'BCA', color: '#0052CC', type: 'bank' },
  { match: ['mandiri', 'livin'], label: 'Mandiri', shortCode: 'MDR', color: '#0284C7', type: 'bank' },
  { match: ['bri', 'brimo'], label: 'BRI', shortCode: 'BRI', color: '#00529C', type: 'bank' },
  { match: ['bni', 'bni mobile'], label: 'BNI', shortCode: 'BNI', color: '#F15A24', type: 'bank' },
  { match: ['jago', 'bank jago'], label: 'Jago', shortCode: 'JAGO', color: '#FF7A00', type: 'bank' },
  { match: ['bsi', 'syariah'], label: 'BSI', shortCode: 'BSI', color: '#00A39D', type: 'bank' },
  { match: ['cimb', 'niaga', 'octo'], label: 'CIMB', shortCode: 'CIMB', color: '#8B0000', type: 'bank' },
  { match: ['blu', 'blu by bca'], label: 'Blu', shortCode: 'BLU', color: '#00A3FF', type: 'bank' },
  { match: ['permata', 'me'], label: 'Permata', shortCode: 'PRM', color: '#10B981', type: 'bank' },
  { match: ['jenius', 'btpn'], label: 'Jenius', shortCode: 'JNS', color: '#00A4E4', type: 'bank' },

  // E-Wallets
  { match: ['gopay', 'go-pay', 'gojek'], label: 'GoPay', shortCode: 'GOPAY', color: '#00AA13', type: 'ewallet' },
  { match: ['shopee', 'shopeepay', 'shoppepay', 'spay'], label: 'ShopeePay', shortCode: 'SPAY', color: '#EE4D2D', type: 'ewallet' },
  { match: ['dana'], label: 'DANA', shortCode: 'DANA', color: '#118EEA', type: 'ewallet' },
  { match: ['ovo'], label: 'OVO', shortCode: 'OVO', color: '#4C3494', type: 'ewallet' },
  { match: ['linkaja', 'link aja'], label: 'LinkAja', shortCode: 'LNK', color: '#ED1C24', type: 'ewallet' },
  { match: ['astrapay', 'astra'], label: 'AstraPay', shortCode: 'ASTRA', color: '#0B5FA5', type: 'ewallet' },

  // Cash / Tunai
  { match: ['tunai', 'cash', 'dompet utama', 'fisik'], label: 'Tunai', shortCode: 'CASH', color: '#10B981', type: 'cash' }
];

export const COLOR_SWATCHES = [
  { name: 'Krom Purple', hex: '#7C3AED' },
  { name: 'SeaBank Orange', hex: '#FF5722' },
  { name: 'BCA Navy', hex: '#0052CC' },
  { name: 'Mandiri Blue', hex: '#0284C7' },
  { name: 'Jago Amber', hex: '#FF7A00' },
  { name: 'GoPay Green', hex: '#00AA13' },
  { name: 'Shopee Coral', hex: '#EE4D2D' },
  { name: 'DANA Blue', hex: '#118EEA' },
  { name: 'OVO Violet', hex: '#4C3494' },
  { name: 'Cash Emerald', hex: '#10B981' },
  { name: 'Dark Slate', hex: '#334155' }
];

export const getAccountBrandInfo = (acc) => {
  if (!acc) {
    return {
      label: 'Dompet',
      shortCode: 'ACC',
      color: '#2563EB',
      bgLight: 'rgba(37, 99, 235, 0.08)',
      isPreset: false
    };
  }

  const nameLower = (acc.name || '').trim().toLowerCase();

  // Find matching preset
  const preset = POPULAR_BRAND_PRESETS.find(p =>
    p.match.some(m => nameLower.includes(m))
  );

  if (preset) {
    // If account has an explicit custom color (different from generic default colors), use it, otherwise preset color
    const hasCustomNonDefault = acc.color &&
      acc.color !== '#1665D8' &&
      acc.color !== '#0077FF' &&
      acc.color !== '#10B981' &&
      acc.color !== '#00AED6' &&
      acc.color !== '#059669';

    const color = hasCustomNonDefault ? acc.color : preset.color;

    return {
      label: preset.label,
      shortCode: preset.shortCode,
      color: color,
      bgLight: `${color}14`,
      isPreset: true
    };
  }

  // Fallback for custom or unlisted accounts
  const fallbackColor = acc.color || (
    acc.type === 'bank' ? '#2563EB' :
    acc.type === 'ewallet' ? '#8B5CF6' :
    acc.type === 'cash' ? '#059669' : '#64748B'
  );

  const words = (acc.name || 'Akun').trim().split(/\s+/).filter(Boolean);
  let shortCode = '';
  if (words.length >= 2) {
    shortCode = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 3) {
    shortCode = words[0].slice(0, 3).toUpperCase();
  } else {
    shortCode = (acc.name || 'ACC').slice(0, 3).toUpperCase();
  }

  return {
    label: acc.name,
    shortCode: shortCode,
    color: fallbackColor,
    bgLight: `${fallbackColor}14`,
    isPreset: false
  };
};
