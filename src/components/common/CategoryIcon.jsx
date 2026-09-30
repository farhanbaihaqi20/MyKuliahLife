import React from 'react';
import iconFood from '../../assets/categories/cat-food.png';
import iconTransport from '../../assets/categories/cat-transport.png';
import iconBills from '../../assets/categories/cat-bills.png';
import iconPersonal from '../../assets/categories/cat-personal.png';
import iconLeisure from '../../assets/categories/cat-leisure.png';
import iconEducation from '../../assets/categories/cat-education.png';

export const CATEGORY_3D_MAP = {
  // Makanan & Minuman
  'makanan & minuman': iconFood,
  'makanan dan minuman': iconFood,
  'makanan': iconFood,
  'food': iconFood,
  '🍜': iconFood,
  '🍲': iconFood,
  '🍱': iconFood,

  // Transport & Bensin
  'transport & bensin': iconTransport,
  'transport dan bensin': iconTransport,
  'transportasi': iconTransport,
  'transport': iconTransport,
  'bensin': iconTransport,
  '🛵': iconTransport,
  '🚗': iconTransport,
  '⛽': iconTransport,

  // Tagihan & Utilitas
  'tagihan & utilitas': iconBills,
  'tagihan dan utilitas': iconBills,
  'kost & tagihan': iconBills,
  'tagihan': iconBills,
  'listrik': iconBills,
  'utilitas': iconBills,
  '⚡': iconBills,
  '🔌': iconBills,
  '💡': iconBills,

  // Kebutuhan Pribadi & Skincare
  'kebutuhan pribadi & skincare': iconPersonal,
  'kebutuhan pribadi dan skincare': iconPersonal,
  'kebutuhan pribadi': iconPersonal,
  'skincare': iconPersonal,
  'pribadi': iconPersonal,
  '🧴': iconPersonal,
  '🧼': iconPersonal,
  '💄': iconPersonal,

  // Hiburan & Jajan
  'hiburan & jajan': iconLeisure,
  'hiburan dan jajan': iconLeisure,
  'hiburan & nongkrong': iconLeisure,
  'hiburan & ngopi': iconLeisure,
  'hiburan': iconLeisure,
  'jajan': iconLeisure,
  'ngopi': iconLeisure,
  'nongkrong': iconLeisure,
  '☕': iconLeisure,
  '🎮': iconLeisure,
  '🍿': iconLeisure,

  // Kebutuhan Kuliah & Print
  'kebutuhan kuliah & print': iconEducation,
  'kebutuhan kuliah dan print': iconEducation,
  'pendidikan & kuliah': iconEducation,
  'kebutuhan kuliah': iconEducation,
  'kuliah & print': iconEducation,
  'kuliah': iconEducation,
  'pendidikan': iconEducation,
  'print': iconEducation,
  'fotokopi': iconEducation,
  '📚': iconEducation,
  '📖': iconEducation,
  '📝': iconEducation
};

/**
 * Returns the 3D category icon image URL or null if not found
 */
export const getCategory3DIcon = (categoryName, iconStr) => {
  if (categoryName && typeof categoryName === 'string') {
    const key = categoryName.trim().toLowerCase();
    if (CATEGORY_3D_MAP[key]) return CATEGORY_3D_MAP[key];
  }
  if (iconStr && typeof iconStr === 'string') {
    const key = iconStr.trim();
    if (CATEGORY_3D_MAP[key]) return CATEGORY_3D_MAP[key];
  }
  return null;
};

/**
 * CategoryIcon component
 * Automatically displays the 3D squircle icon if matched,
 * or gracefully falls back to emoji string.
 */
export const CategoryIcon = ({
  category,
  icon,
  size = 36,
  className = '',
  style = {},
  alt
}) => {
  const iconSrc = getCategory3DIcon(category, icon);

  const dimensionStyle = typeof size === 'number'
    ? { width: `${size}px`, height: `${size}px` }
    : { width: size, height: size };

  if (iconSrc) {
    return (
      <img
        src={iconSrc}
        alt={alt || category || 'Kategori'}
        className={`category-3d-icon ${className}`.trim()}
        style={{
          ...dimensionStyle,
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
          filter: 'drop-shadow(0 2px 5px rgba(15, 23, 42, 0.08))',
          flexShrink: 0,
          ...style
        }}
        loading="lazy"
      />
    );
  }

  // Fallback to emoji or generic tag icon
  return (
    <span
      className={`category-fallback-icon ${className}`.trim()}
      style={{
        ...dimensionStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: typeof size === 'number' ? `${Math.round(size * 0.65)}px` : '18px',
        flexShrink: 0,
        ...style
      }}
    >
      {icon || '🏷️'}
    </span>
  );
};

export default CategoryIcon;
