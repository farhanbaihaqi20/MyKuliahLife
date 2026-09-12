import { INITIAL_DATA } from '../constants/initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'myuang_app_data_v1';

export const loadLocalData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with initial data to ensure all keys exist
      return { ...INITIAL_DATA, ...parsed };
    }
  } catch (e) {
    console.error('Error loading local storage data:', e);
  }
  return INITIAL_DATA;
};

export const saveLocalData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local storage data:', e);
  }
};

/**
 * Cloud Sync Engine: Mengirim snapshot data lokal ke Supabase jika aktif & terhubung
 */
export const syncWithCloud = async (localData) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, mode: 'offline', message: 'Berjalan dalam mode offline lokal (.env.local belum diisi)' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return { success: false, mode: 'local', message: 'Belum login ke akun Supabase' };
    }

    const userId = session.user.id;

    // 1. Sync Profile
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: localData.profile.fullName,
      university: localData.profile.university,
      major: localData.profile.major,
      current_semester: localData.profile.semester,
      target_gpa: localData.profile.targetGpa,
      updated_at: new Date().toISOString()
    });

    return { success: true, mode: 'cloud', message: 'Data berhasil disinkronkan ke Supabase Cloud!' };
  } catch (err) {
    console.error('Cloud sync error:', err);
    return { success: false, mode: 'error', message: err.message };
  }
};
