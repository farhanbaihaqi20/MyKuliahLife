import { INITIAL_DATA, CLEAN_DATA } from '../constants/initialData';
import { supabase, isSupabaseConfigured } from './supabase';
import { profileService, dataSyncService } from './supabaseService';

const BASE_STORAGE_KEY = 'mykuliahlife_app_data';
const LEGACY_STORAGE_KEY = 'myuang_app_data';

export const getStorageKey = (userId = null) => {
  return userId ? `${BASE_STORAGE_KEY}_${userId}` : `${BASE_STORAGE_KEY}_guest`;
};

export const getLegacyStorageKey = (userId = null) => {
  return userId ? `${LEGACY_STORAGE_KEY}_${userId}` : `${LEGACY_STORAGE_KEY}_guest`;
};

export const loadLocalData = (userId = null) => {
  try {
    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      const legacyKey = getLegacyStorageKey(userId);
      raw = localStorage.getItem(legacyKey);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.budget && Array.isArray(parsed.budget.categories)) {
        const hasPersonalCare = parsed.budget.categories.some(c =>
          c.name?.toLowerCase().includes('skincare') || c.name?.toLowerCase().includes('pribadi')
        );
        if (!hasPersonalCare) {
          parsed.budget.categories.push({
            id: 'cat-personal',
            name: 'Kebutuhan Pribadi & Skincare',
            budget: 150000,
            icon: '🧴',
            color: '#EC4899'
          });
        }
      }
      // Ensure consistency for activeSemester and unlockedSemesters
      const safeActiveSemester = Number(parsed.activeSemester || parsed.profile?.semester || 1);
      parsed.activeSemester = safeActiveSemester;
      if (parsed.profile) {
        parsed.profile.semester = safeActiveSemester;
      }
      if (!Array.isArray(parsed.unlockedSemesters) || parsed.unlockedSemesters.length === 0) {
        parsed.unlockedSemesters = [safeActiveSemester];
      } else if (!parsed.unlockedSemesters.includes(safeActiveSemester)) {
        parsed.unlockedSemesters = Array.from(new Set([...parsed.unlockedSemesters, safeActiveSemester])).sort((a, b) => a - b);
      }

      // Sanitize old stale developer cache if present in localStorage
      if (parsed.profile?.fullName === 'Han (Farhan)') {
        parsed.profile.fullName = '';
        parsed.profile.email = '';
      }
      if (Array.isArray(parsed.accounts) && parsed.accounts.some(a => a.name === 'Sea Bank' && a.balance === 5313358)) {
        parsed.accounts = CLEAN_DATA.accounts;
      }

      return {
        ...CLEAN_DATA,
        ...parsed,
        profile: {
          ...CLEAN_DATA.profile,
          ...(parsed.profile || {})
        }
      };
    }
  } catch (e) {
    console.error('Error loading local storage data:', e);
  }
  return CLEAN_DATA;
};

export const saveLocalData = (data, userId = null) => {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
    const legacyKey = getLegacyStorageKey(userId);
    localStorage.setItem(legacyKey, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local storage data:', e);
  }
};

/**
 * Sync Local Snapshot with Supabase Cloud
 */
export const syncWithCloud = async (localData, userId = null) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, mode: 'offline', message: 'Koneksi Supabase belum terkonfigurasi' };
  }

  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        return { success: false, mode: 'local', message: 'Belum login ke akun Supabase' };
      }
      targetUserId = session.user.id;
    }

    // 1. Sync Profile & Semester (Safe Partial Update, never overwrite with default placeholders)
    const semNum = Number(localData.activeSemester || localData.profile?.semester || 1);
    await profileService.updateProfile(targetUserId, {
      fullName: localData.profile?.fullName,
      university: localData.profile?.university,
      major: localData.profile?.major,
      activeSemester: semNum,
      unlockedSemesters: localData.unlockedSemesters || [semNum],
      targetGpa: localData.profile?.targetGpa,
      startDayOfMonth: localData.budget?.startDayOfMonth,
      monthlyBudget: localData.budget?.totalBudget,
      budgetCategories: localData.budget?.categories || []
    });

    return { success: true, mode: 'cloud', message: 'Data berhasil disinkronkan ke Supabase Cloud!' };
  } catch (err) {
    console.error('Cloud sync error:', err);
    return { success: false, mode: 'error', message: err.message };
  }
};
