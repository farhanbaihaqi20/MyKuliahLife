import { INITIAL_DATA, CLEAN_DATA, normalizeBudgetCategories, normalizeCategoryName } from '../constants/initialData';
import { supabase, isSupabaseConfigured } from './supabase';
import { profileService, dataSyncService, cloudService } from './supabaseService';
import { getLocalDateString } from '../utils/formatters';

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
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return CLEAN_DATA;
      }

      // Eliminate prototype pollution threats
      delete parsed.__proto__;
      delete parsed.constructor;
      delete parsed.prototype;

      if (parsed.budget) {
        const tot = Number(parsed.budget.totalBudget) || 1000000;
        parsed.budget.categories = normalizeBudgetCategories(parsed.budget.categories, tot);
      }
      if (Array.isArray(parsed.transactions)) {
        parsed.transactions = parsed.transactions.map(t => {
          let txDate = t.date;
          const createdAt = t.createdAt || t.created_at;
          if (createdAt && t.date) {
            const createdLocal = new Date(createdAt);
            const localCreatedDate = getLocalDateString(createdLocal);
            if (localCreatedDate && localCreatedDate !== t.date) {
              const [ty, tm, td] = t.date.split('-').map(Number);
              const targetDateObj = new Date(ty, tm - 1, td);
              const diffDays = Math.round((createdLocal.getTime() - targetDateObj.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                txDate = localCreatedDate;
              }
            }
          }
          return {
            ...t,
            date: txDate,
            toAccountName: t.toAccountName || t.to_account_name || null,
            category: t.type === 'transfer' ? 'Transfer Antar Akun' : normalizeCategoryName(t.category)
          };
        });
      }
      // Ensure consistency for activeSemester and unlockedSemesters
      const safeActiveSemester = Math.min(Math.max(Number(parsed.activeSemester || parsed.profile?.semester || 1), 1), 14);
      parsed.activeSemester = safeActiveSemester;
      if (parsed.profile && typeof parsed.profile === 'object') {
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
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : CLEAN_DATA.accounts,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        courses: Array.isArray(parsed.courses) ? parsed.courses : [],
        assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
        courseNotes: Array.isArray(parsed.courseNotes) ? parsed.courseNotes : [],
        bills: Array.isArray(parsed.bills) ? parsed.bills : [],
        savingsTargets: Array.isArray(parsed.savingsTargets) ? parsed.savingsTargets : [],
        debts: Array.isArray(parsed.debts) ? parsed.debts : [],
        doctorVisits: Array.isArray(parsed.doctorVisits) ? parsed.doctorVisits : [],
        medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        waterIntakeLogs: Array.isArray(parsed.waterIntakeLogs) ? parsed.waterIntakeLogs : [],
        waterIntakeTarget: Number(parsed.waterIntakeTarget) || 2000,
        sleepLogs: Array.isArray(parsed.sleepLogs) ? parsed.sleepLogs : [],
        bmiLogs: Array.isArray(parsed.bmiLogs) ? parsed.bmiLogs : [],
        moodLogs: Array.isArray(parsed.moodLogs) ? parsed.moodLogs : [],
        profile: {
          ...CLEAN_DATA.profile,
          ...(typeof parsed.profile === 'object' && parsed.profile !== null ? parsed.profile : {})
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

    // 2. Sync Wellness to Supabase Cloud
    await cloudService.syncUserWellness(targetUserId, {
      waterIntakeTarget: localData.waterIntakeTarget || 2000,
      waterIntakeLogs: localData.waterIntakeLogs || [],
      sleepLogs: localData.sleepLogs || [],
      bmiLogs: localData.bmiLogs || [],
      moodLogs: localData.moodLogs || []
    });

    return { success: true, mode: 'cloud', message: 'Data berhasil disinkronkan ke Supabase Cloud!' };
  } catch (err) {
    console.error('Cloud sync error:', err);
    return { success: false, mode: 'error', message: err.message };
  }
};
