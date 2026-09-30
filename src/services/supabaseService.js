import { supabase, isSupabaseConfigured } from './supabase';
import { isValidUUID, isValidEmail, sanitizeText } from '../utils/security';
import { normalizeBudgetCategories, normalizeCategoryName } from '../constants/initialData';

/**
 * Supabase Service Layer: Menangani Otentikasi dan Sinkronisasi Database
 * Didesain aman, modular, dan bebas error dengan fallback lokal.
 */

// =========================================================================
// 1. OTENTIKASI PENGGUNA (SUPABASE AUTH)
// =========================================================================

export const authService = {
  // Ambil sesi aktif saat ini
  async getSession() {
    if (!isSupabaseConfigured() || !supabase) return { session: null, user: null };
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, user: session?.user || null };
    } catch (err) {
      console.warn('Error fetching Supabase session:', err);
      return { session: null, user: null };
    }
  },

  // Masuk / Sign In
  async signIn(email, password) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif atau sedang dalam pemeliharaan.');
    }
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Format alamat email tidak valid.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    if (error) throw error;
    return data;
  },

  // Daftar / Sign Up
  async signUp(email, password, metadata = {}) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif atau sedang dalam pemeliharaan.');
    }
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Format alamat email tidak valid.');
    }
    const cleanMetadata = {
      ...metadata,
      full_name: sanitizeText(metadata?.full_name || 'Mahasiswa', 150)
    };
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: cleanMetadata
      }
    });
    if (error) throw error;
    return data;
  },

  // Verifikasi Kode OTP (Pendaftaran / Konfirmasi Email)
  async verifyOtp(email, token, type = 'signup') {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type
    });
    if (error) throw error;
    return data;
  },

  // Kirim ulang OTP / Tautan Konfirmasi Pendaftaran
  async resendSignupOtp(email) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    });
    if (error) throw error;
    return data;
  },

  // Keluar / Sign Out
  async signOut() {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during sign out:', err);
    }
  },

  // Listener perubahan status otentikasi
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured() || !supabase) return { data: { subscription: { unsubscribe: () => { } } } };
    return supabase.auth.onAuthStateChange(callback);
  },

  // Masuk dengan Google OAuth
  async signInWithGoogle() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) throw error;
    return data;
  },

  // Link akun Google ke user yang sudah login (misal email+pw)
  async linkGoogleIdentity() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  // Unlink identitas dari user
  async unlinkGoogleIdentity(identity) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const { data, error } = await supabase.auth.unlinkIdentity(identity);
    if (error) throw error;
    return data;
  },

  // Dapatkan daftar identitas akun yang terhubung
  async getLinkedIdentities() {
    if (!isSupabaseConfigured() || !supabase) return [];
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return [];
      return user.identities || [];
    } catch {
      return [];
    }
  },

  // Kirim email pemulihan / reset kata sandi
  async resetPasswordForEmail(email) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Format alamat email tidak valid.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}`
    });
    if (error) throw error;
    return data;
  },

  // Perbarui kata sandi pengguna (dipanggil setelah user buka recovery link)
  async updateUserPassword(newPassword) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  // Perbarui metadata pengguna (misal URL foto avatar)
  async updateUserMetadata(metadata = {}) {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Failed to update user metadata:', err);
      return null;
    }
  },

  // Ambil data user segar langsung dari server Supabase (bukan hanya cache lokal)
  async getUser() {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (err) {
      console.warn('Error fetching fresh Supabase user:', err);
      return null;
    }
  }
};

// =========================================================================
// 1.1 STORAGE SERVICE: FOTO PROFIL (AVATARS)
// =========================================================================

export const storageService = {
  // Upload avatar image blob to Supabase Storage bucket 'avatars'
  async uploadAvatar(userId, fileBlob) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      throw new Error('Layanan cloud saat ini belum aktif.');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Format ID pengguna tidak valid.');
    }
    const filePath = `${userId}/avatar.jpg`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    // Ambil URL publik gambar
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    return { path: data.path, publicUrl };
  },

  // Ambil URL publik avatar pengguna
  getAvatarUrl(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId || !isValidUUID(userId)) return null;
    try {
      const filePath = `${userId}/avatar.jpg`;
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
    } catch {
      return null;
    }
  },

  // Cek apakah file avatar ada di Supabase Storage via HEAD request cepat (tanpa butuh SELECT policy)
  async checkAvatarExists(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId || !isValidUUID(userId)) return null;
    try {
      const filePath = `${userId}/avatar.jpg`;
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const url = data?.publicUrl;
      if (!url) return null;
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        return `${url}?t=${Date.now()}`;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Hapus avatar dari storage
  async removeAvatar(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId || !isValidUUID(userId)) return;
    try {
      const filePath = `${userId}/avatar.jpg`;
      await supabase.storage.from('avatars').remove([filePath]);
    } catch (err) {
      console.warn('Failed to remove avatar from storage:', err);
    }
  }
};

// =========================================================================
// 2. DATA SERVICE: PROFIL & SEMESTER MANAGEMENT
// =========================================================================

export const profileService = {
  // Ambil profil mahasiswa
  async getProfile(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile:', error);
      }
      return data || null;
    } catch (err) {
      console.warn('Catch profile fetch error:', err);
      return null;
    }
  },

  // Simpan / update profil mahasiswa (Safe Partial Upsert)
  async upsertProfile(userId, profileData) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const payload = {
        id: userId,
        updated_at: new Date().toISOString()
      };

      if (profileData.fullName !== undefined || profileData.full_name !== undefined) {
        const val = (profileData.fullName || profileData.full_name || '').trim();
        if (val) payload.full_name = val;
      }
      if (profileData.university !== undefined) {
        const val = (profileData.university || '').trim();
        if (val) payload.university = val;
      }
      if (profileData.major !== undefined) {
        const val = (profileData.major || '').trim();
        if (val) payload.major = val;
      }
      const semNum = Number(profileData.activeSemester || profileData.active_semester || profileData.semester);
      if (semNum) {
        payload.active_semester = semNum;
      }
      if (profileData.unlockedSemesters || profileData.unlocked_semesters) {
        payload.unlocked_semesters = profileData.unlockedSemesters || profileData.unlocked_semesters;
      }
      if (profileData.targetGpa !== undefined || profileData.target_gpa !== undefined) {
        payload.target_gpa = Number(profileData.targetGpa || profileData.target_gpa || 3.80);
      }
      if (profileData.startDayOfMonth !== undefined || profileData.start_day_of_month !== undefined) {
        payload.start_day_of_month = Number(profileData.startDayOfMonth || profileData.start_day_of_month || 1);
      }
      if (profileData.monthlyBudget !== undefined || profileData.monthly_budget !== undefined) {
        payload.monthly_budget = Number(profileData.monthlyBudget || profileData.monthly_budget);
      }
      if (profileData.budgetCategories || profileData.budget_categories) {
        payload.budget_categories = profileData.budgetCategories || profileData.budget_categories;
      }
      if (profileData.avatarUrl !== undefined || profileData.avatar_url !== undefined) {
        payload.avatar_url = profileData.avatarUrl || profileData.avatar_url || null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('avatar_url') || error.code === '42703') {
          console.warn('Kolom avatar_url belum dibuat di tabel profiles, upsert fallback tanpa avatar_url.');
          delete payload.avatar_url;
          const retryRes = await supabase.from('profiles').upsert(payload).select().single();
          if (retryRes.error) throw retryRes.error;
          return retryRes.data;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to upsert profile:', err);
      throw err;
    }
  },

  // Update Alokasi Budget & Siklus Keuangan Mahasiswa (Safe Partial Update)
  async updateBudget(userId, { monthlyBudget, startDayOfMonth, budgetCategories }) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const updatePayload = {
        updated_at: new Date().toISOString()
      };
      if (monthlyBudget !== undefined && monthlyBudget !== null) {
        updatePayload.monthly_budget = Number(monthlyBudget);
      }
      if (startDayOfMonth !== undefined && startDayOfMonth !== null) {
        updatePayload.start_day_of_month = Number(startDayOfMonth);
      }
      if (budgetCategories && Array.isArray(budgetCategories)) {
        updatePayload.budget_categories = budgetCategories;
      }

      // 1. Coba update penuh dengan budget_categories
      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Gagal update budget_categories di profiles, fallback ke monthly_budget saja:', error);
        delete updatePayload.budget_categories;
        const fallbackRes = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select()
          .maybeSingle();
        if (fallbackRes.error) {
          console.error('Fallback budget update failed:', fallbackRes.error);
          throw fallbackRes.error;
        }
        return fallbackRes.data || null;
      }

      return data || null;
    } catch (err) {
      console.error('Failed to update budget in Supabase profiles:', err);
      throw err;
    }
  },

  // Update profil mahasiswa secara aman (Partial Update)
  async updateProfile(userId, profileFields) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const updatePayload = {
        updated_at: new Date().toISOString()
      };

      if (profileFields.fullName !== undefined || profileFields.full_name !== undefined) {
        const name = (profileFields.fullName || profileFields.full_name || '').trim();
        if (name) updatePayload.full_name = name;
      }
      if (profileFields.university !== undefined) {
        const uni = (profileFields.university || '').trim();
        if (uni) updatePayload.university = uni;
      }
      if (profileFields.major !== undefined) {
        const maj = (profileFields.major || '').trim();
        if (maj) updatePayload.major = maj;
      }
      const semNum = Number(profileFields.activeSemester || profileFields.semester);
      if (semNum) {
        updatePayload.active_semester = semNum;
      }
      if (profileFields.unlockedSemesters && Array.isArray(profileFields.unlockedSemesters) && profileFields.unlockedSemesters.length > 0) {
        updatePayload.unlocked_semesters = profileFields.unlockedSemesters;
      }
      if (profileFields.targetGpa !== undefined || profileFields.target_gpa !== undefined) {
        updatePayload.target_gpa = Number(profileFields.targetGpa || profileFields.target_gpa || 3.80);
      }
      if (profileFields.monthlyBudget !== undefined || profileFields.monthly_budget !== undefined) {
        updatePayload.monthly_budget = Number(profileFields.monthlyBudget || profileFields.monthly_budget);
      }
      if (profileFields.startDayOfMonth !== undefined || profileFields.start_day_of_month !== undefined) {
        updatePayload.start_day_of_month = Number(profileFields.startDayOfMonth || profileFields.start_day_of_month);
      }
      if (profileFields.budgetCategories || profileFields.budget_categories) {
        updatePayload.budget_categories = profileFields.budgetCategories || profileFields.budget_categories;
      }
      if (profileFields.avatarUrl !== undefined || profileFields.avatar_url !== undefined) {
        updatePayload.avatar_url = profileFields.avatarUrl || profileFields.avatar_url || null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        if (error.message?.includes('avatar_url') || error.code === '42703') {
          console.warn('Kolom avatar_url belum dibuat di tabel profiles, update fallback tanpa avatar_url.');
          delete updatePayload.avatar_url;
          const retryRes = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId)
            .select()
            .maybeSingle();
          if (retryRes.error) throw retryRes.error;
          return retryRes.data || null;
        }
        console.error('Failed to update profile in Supabase:', error);
        throw error;
      }

      // Jika baris profil belum pernah ada, buat baru via upsert
      if (!data) {
        return await profileService.upsertProfile(userId, profileFields);
      }

      return data || null;
    } catch (err) {
      console.error('Catch updateProfile error:', err);
      throw err;
    }
  },

  // Update semester aktif & daftar semester terbuka
  async updateSemesters(userId, activeSemester, unlockedSemesters) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const semNum = Number(activeSemester || 1);
      const safeUnlocked = Array.isArray(unlockedSemesters) && unlockedSemesters.length > 0
        ? Array.from(new Set([...unlockedSemesters, semNum])).sort((a, b) => a - b)
        : [semNum];

      const { data, error } = await supabase
        .from('profiles')
        .update({
          active_semester: semNum,
          unlocked_semesters: safeUnlocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to update semester status:', err);
      throw err;
    }
  }
};

// =========================================================================
// 3. FULL SYNC & BACKUP SERVICE
// =========================================================================

export const dataSyncService = {
  // Muat seluruh data user dari Supabase
  async loadUserData(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const [
        profileRes,
        accountsRes,
        transactionsRes,
        coursesRes,
        assignmentsRes,
        notesRes,
        attendanceRes,
        billsRes,
        targetsRes,
        fuelLogsRes,
        fuelSettingsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('accounts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('assignments').select('*').eq('user_id', userId).order('deadline', { ascending: true }),
        supabase.from('course_notes').select('*').eq('user_id', userId).order('week_number', { ascending: true }),
        supabase.from('attendance').select('*').eq('user_id', userId),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('savings_targets').select('*').eq('user_id', userId),
        supabase.from('fuel_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).then(r => r, () => ({ data: [] })),
        supabase.from('fuel_settings').select('*').eq('user_id', userId).maybeSingle().then(r => r, () => ({ data: null }))
      ]);

      if (!profileRes.data) {
        return null; // Pengguna baru, belum ada data profil
      }

      const prof = profileRes.data;
      const activeSemester = prof.active_semester || 1;
      let unlockedSemesters = prof.unlocked_semesters || [activeSemester];
      if (!Array.isArray(unlockedSemesters)) {
        unlockedSemesters = [activeSemester];
      }

      // Format ke struktur state App
      return {
        profile: {
          fullName: prof.full_name,
          university: prof.university,
          major: prof.major,
          semester: activeSemester,
          targetGpa: Number(prof.target_gpa) || 3.80,
          avatarUrl: prof.avatar_url || null
        },
        activeSemester,
        unlockedSemesters,
        budget: {
          startDayOfMonth: prof.start_day_of_month || 1,
          totalBudget: Number(prof.monthly_budget) || 1500000,
          categories: (() => {
            const tot = Number(prof.monthly_budget) || 1500000;
            return normalizeBudgetCategories(prof.budget_categories, tot);
          })()
        },
        accounts: (accountsRes.data || []).map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: Number(a.balance),
          icon: a.icon || '💳',
          color: a.color || '#1665D8',
          isPrimary: a.is_primary,
          accountNumber: a.account_number || '',
          notes: a.notes || ''
        })),
        transactions: (transactionsRes.data || []).map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          accountName: t.account_name || 'Bank',
          category: normalizeCategoryName(t.category),
          merchant: t.merchant || '',
          note: t.note || '',
          date: t.date,
          icon: t.icon || '💸'
        })),
        courses: (coursesRes.data || []).map(c => {
          const courseAtt = (attendanceRes.data || [])
            .filter(att => att.course_id === c.id && att.status && att.status !== 'unrecorded')
            .map(att => ({
              meeting: Number(att.meeting_number),
              status: att.status,
              date: att.created_at ? att.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            }));

          return {
            id: c.id,
            semester: Number(c.semester),
            code: c.code,
            name: c.name,
            sks: Number(c.sks),
            lecturer: c.lecturer,
            room: c.room,
            dayOfWeek: c.day_of_week,
            startTime: c.start_time?.slice(0, 5) || '08:00',
            endTime: c.end_time?.slice(0, 5) || '10:30',
            color: c.color || '#1665D8',
            grade: {
              letter: c.is_graded ? (c.grade_letter || 'A') : null,
              point: c.is_graded ? (Number(c.grade_point) ?? 0.0) : 0.0,
              isGraded: Boolean(c.is_graded)
            },
            attendance: courseAtt
          };
        }),
        assignments: (assignmentsRes.data || []).map(asg => ({
          id: asg.id,
          courseId: asg.course_id,
          courseName: asg.course_name,
          semester: Number(asg.semester),
          title: asg.title,
          description: asg.description,
          deadline: asg.deadline,
          priority: asg.priority,
          status: asg.status
        })),
        courseNotes: (notesRes.data || []).map(n => ({
          id: n.id,
          courseId: n.course_id,
          courseName: n.course_name,
          semester: Number(n.semester),
          weekNumber: Number(n.week_number),
          topic: n.topic,
          content: n.content,
          materialUrl: n.material_url
        })),
        attendance: (attendanceRes.data || []).map(att => ({
          id: att.id,
          courseId: att.course_id,
          meetingNumber: Number(att.meeting_number),
          status: att.status
        })),
        bills: (billsRes.data || []).map(b => ({
          id: b.id,
          name: b.name,
          amount: Number(b.amount),
          dueDate: b.due_date,
          category: b.category,
          isPaid: Boolean(b.is_paid)
        })),
        savingsTargets: (targetsRes.data || []).map(st => ({
          id: st.id,
          title: st.title,
          targetAmount: Number(st.target_amount),
          currentAmount: Number(st.current_amount),
          deadline: st.deadline,
          category: st.category,
          icon: st.icon || '🎯'
        })),
        fuelLogs: (fuelLogsRes?.data || []).map(fl => ({
          id: fl.id,
          date: fl.date,
          fuelType: fl.fuel_type,
          amount: Number(fl.amount),
          liters: Number(fl.liters),
          pricePerLiter: Number(fl.price_per_liter),
          station: fl.station || '',
          odometer: fl.odometer !== null && fl.odometer !== undefined ? Number(fl.odometer) : null,
          tankLevel: fl.tank_level !== null && fl.tank_level !== undefined ? Number(fl.tank_level) : 100,
          note: fl.note || ''
        })),
        fuelSettings: fuelSettingsRes?.data ? {
          motorName: fuelSettingsRes.data.motor_name || 'Motor Saya',
          motorType: fuelSettingsRes.data.motor_type || 'Matic',
          tankCapacity: Number(fuelSettingsRes.data.tank_capacity) || 4.2,
          currentTankLevel: Number(fuelSettingsRes.data.current_tank_level) ?? 50,
          currentOdometer: Number(fuelSettingsRes.data.current_odometer) || 0,
          provinceSlug: fuelSettingsRes.data.province_slug || 'jawa-timur',
          provinceName: fuelSettingsRes.data.province_name || 'Jawa Timur',
          lastPriceSync: fuelSettingsRes.data.last_price_sync || null,
          fuelPrices: fuelSettingsRes.data.fuel_prices || {
            pertalite: 10000,
            pertamax_90: 15950,
            pertamax_green: 19150,
            pertamax_turbo: 19600
          }
        } : null
      };
    } catch (err) {
      console.error('Failed to load user data from Supabase:', err);
      return null;
    }
  },

  // Simpan data inisial onboarding ke Supabase
  async initializeNewUser(userId, { profile, startDayOfMonth, initialAccounts, initialBudget }) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      // 1. Profil
      await profileService.upsertProfile(userId, {
        fullName: profile.fullName,
        university: profile.university,
        major: profile.major,
        activeSemester: profile.semester,
        unlockedSemesters: [profile.semester],
        startDayOfMonth,
        monthlyBudget: initialBudget
      });

      // 2. Akun / Dompet
      if (initialAccounts && initialAccounts.length > 0) {
        const accPayload = initialAccounts.map(a => ({
          user_id: userId,
          name: a.name,
          type: a.type || 'bank',
          balance: Number(a.balance) || 0,
          icon: a.icon || '💳',
          color: a.color || '#1665D8',
          is_primary: Boolean(a.isPrimary)
        }));
        await supabase.from('accounts').insert(accPayload);
      }
    } catch (err) {
      console.error('Failed to initialize user in Supabase:', err);
      throw err;
    }
  }
};

// =========================================================================
// 4. HELPER UUID GENERATOR (STANDAR RFC4122 V4)
// =========================================================================
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// =========================================================================
// 5. DIRECT CLOUD AUTO-SYNC SERVICE (INSTANT MUTATION PERSISTENCE)
// =========================================================================
export const cloudService = {
  // COURSES
  async insertCourse(userId, course) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: course.id,
        user_id: userId,
        semester: Number(course.semester) || 1,
        code: course.code || 'MK',
        name: course.name,
        sks: Number(course.sks) || 3,
        lecturer: course.lecturer || '',
        room: course.room || '',
        day_of_week: course.dayOfWeek || 'Senin',
        start_time: course.startTime || '08:00',
        end_time: course.endTime || '10:30',
        color: course.color || '#1665D8',
        grade_letter: course.grade?.letter || 'E',
        grade_point: Number(course.grade?.point) || 0.0,
        is_graded: Boolean(course.grade?.isGraded)
      };
      const { error } = await supabase.from('courses').insert(payload);
      if (error) console.error('Cloud insert course error:', error);
    } catch (e) {
      console.error('Catch insertCourse:', e);
    }
  },

  async updateCourse(courseId, fields) {
    if (!isSupabaseConfigured() || !supabase || !courseId) return;
    try {
      const payload = {};
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.code !== undefined) payload.code = fields.code;
      if (fields.sks !== undefined) payload.sks = Number(fields.sks);
      if (fields.lecturer !== undefined) payload.lecturer = fields.lecturer;
      if (fields.room !== undefined) payload.room = fields.room;
      if (fields.dayOfWeek !== undefined) payload.day_of_week = fields.dayOfWeek;
      if (fields.startTime !== undefined) payload.start_time = fields.startTime;
      if (fields.endTime !== undefined) payload.end_time = fields.endTime;
      if (fields.color !== undefined) payload.color = fields.color;
      if (fields.grade !== undefined) {
        payload.grade_letter = fields.grade.letter;
        payload.grade_point = Number(fields.grade.point);
        payload.is_graded = Boolean(fields.grade.isGraded);
      }
      const { error } = await supabase.from('courses').update(payload).eq('id', courseId);
      if (error) console.error('Cloud update course error:', error);
    } catch (e) {
      console.error('Catch updateCourse:', e);
    }
  },

  async deleteCourse(courseId) {
    if (!isSupabaseConfigured() || !supabase || !courseId) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) console.error('Cloud delete course error:', error);
    } catch (e) {
      console.error('Catch deleteCourse:', e);
    }
  },

  async setCourseGrade(courseId, letter, point) {
    if (!isSupabaseConfigured() || !supabase || !courseId) return;
    try {
      const { error } = await supabase.from('courses').update({
        grade_letter: letter,
        grade_point: Number(point),
        is_graded: true
      }).eq('id', courseId);
      if (error) console.error('Cloud set course grade error:', error);
    } catch (e) {
      console.error('Catch setCourseGrade:', e);
    }
  },

  // ASSIGNMENTS
  async insertAssignment(userId, asg) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: asg.id,
        user_id: userId,
        course_id: asg.courseId,
        course_name: asg.courseName,
        semester: Number(asg.semester) || 1,
        title: asg.title,
        description: asg.description || '',
        deadline: asg.deadline,
        priority: asg.priority || 'medium',
        status: asg.status || 'pending'
      };
      const { error } = await supabase.from('assignments').insert(payload);
      if (error) console.error('Cloud insert assignment error:', error);
    } catch (e) {
      console.error('Catch insertAssignment:', e);
    }
  },

  async updateAssignment(asgId, fields) {
    if (!isSupabaseConfigured() || !supabase || !asgId) return;
    try {
      const payload = {};
      if (fields.title !== undefined) payload.title = fields.title;
      if (fields.description !== undefined) payload.description = fields.description;
      if (fields.deadline !== undefined) payload.deadline = fields.deadline;
      if (fields.priority !== undefined) payload.priority = fields.priority;
      if (fields.status !== undefined) payload.status = fields.status;
      const { error } = await supabase.from('assignments').update(payload).eq('id', asgId);
      if (error) console.error('Cloud update assignment error:', error);
    } catch (e) {
      console.error('Catch updateAssignment:', e);
    }
  },

  async deleteAssignment(asgId) {
    if (!isSupabaseConfigured() || !supabase || !asgId) return;
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', asgId);
      if (error) console.error('Cloud delete assignment error:', error);
    } catch (e) {
      console.error('Catch deleteAssignment:', e);
    }
  },

  // COURSE NOTES
  async insertNote(userId, note) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: note.id,
        user_id: userId,
        course_id: note.courseId,
        course_name: note.courseName,
        semester: Number(note.semester) || 1,
        week_number: Number(note.weekNumber) || 1,
        topic: note.topic,
        content: note.content || '',
        material_url: note.materialUrl || null
      };
      const { error } = await supabase.from('course_notes').insert(payload);
      if (error) console.error('Cloud insert note error:', error);
    } catch (e) {
      console.error('Catch insertNote:', e);
    }
  },

  async updateNote(noteId, fields) {
    if (!isSupabaseConfigured() || !supabase || !noteId) return;
    try {
      const payload = {};
      if (fields.topic !== undefined) payload.topic = fields.topic;
      if (fields.content !== undefined) payload.content = fields.content;
      if (fields.weekNumber !== undefined) payload.week_number = Number(fields.weekNumber);
      if (fields.materialUrl !== undefined) payload.material_url = fields.materialUrl;
      payload.updated_at = new Date().toISOString();
      const { error } = await supabase.from('course_notes').update(payload).eq('id', noteId);
      if (error) console.error('Cloud update note error:', error);
    } catch (e) {
      console.error('Catch updateNote:', e);
    }
  },

  async deleteNote(noteId) {
    if (!isSupabaseConfigured() || !supabase || !noteId) return;
    try {
      const { error } = await supabase.from('course_notes').delete().eq('id', noteId);
      if (error) console.error('Cloud delete note error:', error);
    } catch (e) {
      console.error('Catch deleteNote:', e);
    }
  },

  // ATTENDANCE
  async upsertAttendance(userId, { courseId, meetingNumber, status }) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      if (status === 'unrecorded') {
        await this.deleteAttendance(userId, courseId, meetingNumber);
        return;
      }
      const payload = {
        user_id: userId,
        course_id: courseId,
        meeting_number: Number(meetingNumber),
        status
      };
      const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'user_id,course_id,meeting_number' });
      if (error) console.error('Cloud upsert attendance error:', error);
    } catch (e) {
      console.error('Catch upsertAttendance:', e);
    }
  },

  async deleteAttendance(userId, courseId, meetingNumber) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('meeting_number', Number(meetingNumber));
      if (error) console.error('Cloud delete attendance error:', error);
    } catch (e) {
      console.error('Catch deleteAttendance:', e);
    }
  },

  // ACCOUNTS
  async insertAccount(userId, acc) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: acc.id,
        user_id: userId,
        name: acc.name,
        type: acc.type || 'bank',
        balance: Number(acc.balance) || 0,
        icon: acc.icon || '💳',
        color: acc.color || '#1665D8',
        is_primary: Boolean(acc.isPrimary),
        account_number: acc.accountNumber || null,
        notes: acc.notes || null
      };
      const { error } = await supabase.from('accounts').insert(payload);
      if (error) console.error('Cloud insert account error:', error);
    } catch (e) {
      console.error('Catch insertAccount:', e);
    }
  },

  async updateAccount(accId, fields) {
    if (!isSupabaseConfigured() || !supabase || !accId) return;
    try {
      const payload = {};
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.balance !== undefined) payload.balance = Number(fields.balance);
      if (fields.type !== undefined) payload.type = fields.type;
      if (fields.icon !== undefined) payload.icon = fields.icon;
      if (fields.color !== undefined) payload.color = fields.color;
      if (fields.isPrimary !== undefined) payload.is_primary = Boolean(fields.isPrimary);
      if (fields.accountNumber !== undefined) payload.account_number = fields.accountNumber;
      if (fields.notes !== undefined) payload.notes = fields.notes;
      const { error } = await supabase.from('accounts').update(payload).eq('id', accId);
      if (error) console.error('Cloud update account error:', error);
    } catch (e) {
      console.error('Catch updateAccount:', e);
    }
  },

  async deleteAccount(accId) {
    if (!isSupabaseConfigured() || !supabase || !accId) return;
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', accId);
      if (error) console.error('Cloud delete account error:', error);
    } catch (e) {
      console.error('Catch deleteAccount:', e);
    }
  },

  // TRANSACTIONS
  async insertTransaction(userId, tx, updatedAccounts = []) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tx.id);
      const validId = isUUID ? tx.id : generateUUID();
      const payload = {
        id: validId,
        user_id: userId,
        account_name: tx.accountName,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category,
        merchant: tx.merchant || '',
        note: tx.note || '',
        icon: tx.icon || '💸',
        date: tx.date || new Date().toISOString().split('T')[0]
      };
      const { error } = await supabase.from('transactions').insert(payload);
      if (error) console.error('Cloud insert transaction error:', error);

      // Sync account balance
      if (updatedAccounts && updatedAccounts.length > 0) {
        for (const acc of updatedAccounts) {
          const accIsUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(acc.id);
          if (accIsUUID) {
            await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('id', acc.id);
          } else {
            await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('user_id', userId).eq('name', acc.name);
          }
        }
      }
    } catch (e) {
      console.error('Catch insertTransaction:', e);
    }
  },

  async updateTransaction(arg1, arg2, arg3 = [], arg4 = null) {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      let userId = null;
      let txId = null;
      let fields = {};
      let updatedAccounts = [];

      if (typeof arg2 === 'string') {
        // Called as updateTransaction(userId, txId, fields, updatedAccounts)
        userId = arg1;
        txId = arg2;
        fields = arg3 || {};
        updatedAccounts = Array.isArray(arg4) ? arg4 : [];
      } else {
        // Called as updateTransaction(txId, fields, updatedAccounts, userId)
        txId = arg1;
        fields = arg2 || {};
        updatedAccounts = Array.isArray(arg3) ? arg3 : [];
        userId = arg4;
      }

      if (!txId) return;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(txId);

      const payload = {};
      if (fields.amount !== undefined) payload.amount = Number(fields.amount);
      if (fields.type !== undefined) payload.type = fields.type;
      if (fields.category !== undefined) payload.category = fields.category;
      if (fields.accountName !== undefined) payload.account_name = fields.accountName;
      if (fields.merchant !== undefined) payload.merchant = fields.merchant;
      if (fields.note !== undefined) payload.note = fields.note;
      if (fields.icon !== undefined) payload.icon = fields.icon;
      if (fields.date !== undefined) payload.date = fields.date;

      if (isUUID) {
        let query = supabase.from('transactions').update(payload).eq('id', txId);
        if (userId) {
          query = query.eq('user_id', userId);
        }
        const { data: updatedRows, error } = await query.select();

        if (error) {
          console.error('Cloud update transaction error:', error);
        } else if (!updatedRows || updatedRows.length === 0) {
          // If transaction didn't exist in Supabase (e.g. created offline), insert it now so it is safely saved
          if (userId) {
            const insertPayload = {
              id: txId,
              user_id: userId,
              account_name: fields.accountName || 'Tunai',
              type: fields.type || 'expense',
              amount: Number(fields.amount) || 0,
              category: fields.category || 'Lainnya',
              merchant: fields.merchant || '',
              note: fields.note || '',
              icon: fields.icon || '💸',
              date: fields.date || new Date().toISOString().split('T')[0]
            };
            const { error: insErr } = await supabase.from('transactions').insert(insertPayload);
            if (insErr) console.error('Cloud insert fallback transaction error:', insErr);
          }
        }
      } else if (userId) {
        // txId is not a UUID (e.g. legacy 'tx-1' from mock data).
        // Insert as new row in Supabase so it gets persisted to cloud!
        const newUUID = generateUUID();
        const insertPayload = {
          id: newUUID,
          user_id: userId,
          account_name: fields.accountName || 'Tunai',
          type: fields.type || 'expense',
          amount: Number(fields.amount) || 0,
          category: fields.category || 'Lainnya',
          merchant: fields.merchant || '',
          note: fields.note || '',
          icon: fields.icon || '💸',
          date: fields.date || new Date().toISOString().split('T')[0]
        };
        const { error: insErr } = await supabase.from('transactions').insert(insertPayload);
        if (insErr) console.error('Cloud insert fallback for non-UUID transaction error:', insErr);
      }

      // Sync account balances in Supabase
      if (updatedAccounts && updatedAccounts.length > 0) {
        for (const acc of updatedAccounts) {
          const accIsUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(acc.id);
          if (accIsUUID) {
            await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('id', acc.id);
          } else if (userId) {
            await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('user_id', userId).eq('name', acc.name);
          }
        }
      }
    } catch (e) {
      console.error('Catch updateTransaction:', e);
    }
  },

  async deleteTransaction(arg1, arg2 = [], arg3 = []) {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      let txId = null;
      let updatedAccounts = [];
      let userId = null;

      if (typeof arg2 === 'string') {
        userId = arg1;
        txId = arg2;
        updatedAccounts = Array.isArray(arg3) ? arg3 : [];
      } else {
        txId = arg1;
        updatedAccounts = Array.isArray(arg2) ? arg2 : [];
        userId = arg3;
      }

      if (!txId) return;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(txId);
      if (isUUID) {
        let query = supabase.from('transactions').delete().eq('id', txId);
        if (userId) query = query.eq('user_id', userId);
        const { error } = await query;
        if (error) console.error('Cloud delete transaction error:', error);
      }

      if (updatedAccounts && updatedAccounts.length > 0) {
        for (const acc of updatedAccounts) {
          const accIsUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(acc.id);
          if (accIsUUID) {
            await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('id', acc.id);
          } else if (userId) {
            await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('user_id', userId).eq('name', acc.name);
          }
        }
      }
    } catch (e) {
      console.error('Catch deleteTransaction:', e);
    }
  },

  // BILLS
  async insertBill(userId, bill) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: bill.id,
        user_id: userId,
        name: bill.title || bill.name,
        amount: Number(bill.amount),
        due_date: bill.dueDate || bill.due_date,
        category: bill.category || 'Kost & Rumah',
        is_paid: Boolean(bill.isPaid)
      };
      const { error } = await supabase.from('bills').insert(payload);
      if (error) console.error('Cloud insert bill error:', error);
    } catch (e) {
      console.error('Catch insertBill:', e);
    }
  },

  async toggleBill(billId, isPaid) {
    if (!isSupabaseConfigured() || !supabase || !billId) return;
    try {
      const { error } = await supabase.from('bills').update({ is_paid: isPaid }).eq('id', billId);
      if (error) console.error('Cloud toggle bill error:', error);
    } catch (e) {
      console.error('Catch toggleBill:', e);
    }
  },

  async deleteBill(billId) {
    if (!isSupabaseConfigured() || !supabase || !billId) return;
    try {
      const { error } = await supabase.from('bills').delete().eq('id', billId);
      if (error) console.error('Cloud delete bill error:', error);
    } catch (e) {
      console.error('Catch deleteBill:', e);
    }
  },

  // SAVINGS TARGETS
  async insertTarget(userId, target) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: target.id,
        user_id: userId,
        title: target.title,
        target_amount: Number(target.targetAmount),
        current_amount: Number(target.currentAmount || 0),
        deadline: target.deadline || null,
        category: target.category || 'Pendidikan',
        icon: target.icon || '🎯'
      };
      const { error } = await supabase.from('savings_targets').insert(payload);
      if (error) console.error('Cloud insert target error:', error);
    } catch (e) {
      console.error('Catch insertTarget:', e);
    }
  },

  async updateTargetAmount(targetId, currentAmount) {
    if (!isSupabaseConfigured() || !supabase || !targetId) return;
    try {
      const { error } = await supabase.from('savings_targets').update({ current_amount: Number(currentAmount) }).eq('id', targetId);
      if (error) console.error('Cloud update target error:', error);
    } catch (e) {
      console.error('Catch updateTargetAmount:', e);
    }
  },

  async deleteTarget(targetId) {
    if (!isSupabaseConfigured() || !supabase || !targetId) return;
    try {
      const { error } = await supabase.from('savings_targets').delete().eq('id', targetId);
      if (error) console.error('Cloud delete target error:', error);
    } catch (e) {
      console.error('Catch deleteTarget:', e);
    }
  },

  // FUEL TRACKER
  async insertFuelLog(userId, log) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        id: log.id,
        user_id: userId,
        date: log.date || new Date().toISOString().split('T')[0],
        fuel_type: log.fuelType,
        amount: Number(log.amount),
        liters: Number(log.liters),
        price_per_liter: Number(log.pricePerLiter),
        station: log.station || '',
        odometer: log.odometer !== null && log.odometer !== undefined ? Number(log.odometer) : null,
        tank_level: log.tankLevel !== null && log.tankLevel !== undefined ? Number(log.tankLevel) : 100,
        note: log.note || ''
      };
      const { error } = await supabase.from('fuel_logs').insert(payload);
      if (error) console.error('Cloud insert fuel log error:', error);
    } catch (e) {
      console.error('Catch insertFuelLog:', e);
    }
  },

  async deleteFuelLog(logId) {
    if (!isSupabaseConfigured() || !supabase || !logId) return;
    try {
      const { error } = await supabase.from('fuel_logs').delete().eq('id', logId);
      if (error) console.error('Cloud delete fuel log error:', error);
    } catch (e) {
      console.error('Catch deleteFuelLog:', e);
    }
  },

  async upsertFuelSettings(userId, settings) {
    if (!isSupabaseConfigured() || !supabase || !userId) return;
    try {
      const payload = {
        user_id: userId,
        motor_name: settings.motorName || 'Motor Saya',
        motor_type: settings.motorType || 'Matic',
        tank_capacity: Number(settings.tankCapacity) || 4.2,
        current_tank_level: Number(settings.currentTankLevel) ?? 50,
        current_odometer: Number(settings.currentOdometer) || 0,
        province_slug: settings.provinceSlug || 'jawa-timur',
        province_name: settings.provinceName || 'Jawa Timur',
        last_price_sync: settings.lastPriceSync || null,
        fuel_prices: settings.fuelPrices,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('fuel_settings').upsert(payload, { onConflict: 'user_id' });
      if (error) console.error('Cloud upsert fuel settings error:', error);
    } catch (e) {
      console.error('Catch upsertFuelSettings:', e);
    }
  }
};
