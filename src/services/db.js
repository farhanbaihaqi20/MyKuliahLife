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
      return { ...CLEAN_DATA, ...parsed };
    }
  } catch (e) {
    console.error('Error loading local storage data:', e);
  }
  return userId ? CLEAN_DATA : INITIAL_DATA;
};

export const saveLocalData = (data, userId = null) => {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
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

    // 1. Sync Profile & Semester
    await profileService.upsertProfile(targetUserId, {
      fullName: localData.profile?.fullName,
      university: localData.profile?.university,
      major: localData.profile?.major,
      activeSemester: localData.activeSemester || localData.profile?.semester || 1,
      unlockedSemesters: localData.unlockedSemesters || [localData.activeSemester || 1],
      targetGpa: localData.profile?.targetGpa || 3.80,
      startDayOfMonth: localData.budget?.startDayOfMonth || 1,
      monthlyBudget: localData.budget?.totalBudget || 1500000
    });

    return { success: true, mode: 'cloud', message: 'Data berhasil disinkronkan ke Supabase Cloud!' };
  } catch (err) {
    console.error('Cloud sync error:', err);
    return { success: false, mode: 'error', message: err.message };
  }
};
