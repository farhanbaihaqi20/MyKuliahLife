import { supabase, isSupabaseConfigured } from './supabase';

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
      throw new Error('Koneksi Supabase belum aktif. Pastikan environment variables sudah diset dan lakukan Re-Deploy di Netlify.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
    return data;
  },

  // Daftar / Sign Up
  async signUp(email, password, metadata = {}) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Koneksi Supabase belum aktif. Pastikan environment variables sudah diset dan lakukan Re-Deploy di Netlify.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: metadata
      }
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
    if (!isSupabaseConfigured() || !supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
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

  // Simpan / update profil mahasiswa
  async upsertProfile(userId, profileData) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const payload = {
        id: userId,
        full_name: profileData.fullName || profileData.full_name || 'Mahasiswa',
        university: profileData.university || 'Universitas',
        major: profileData.major || 'Program Studi',
        active_semester: Number(profileData.activeSemester || profileData.active_semester || profileData.semester || 1),
        unlocked_semesters: profileData.unlockedSemesters || profileData.unlocked_semesters || [1],
        target_gpa: Number(profileData.targetGpa || profileData.target_gpa || 3.80),
        start_day_of_month: Number(profileData.startDayOfMonth || profileData.start_day_of_month || 1),
        monthly_budget: Number(profileData.monthlyBudget || profileData.monthly_budget || 1500000),
        ...(profileData.budgetCategories || profileData.budget_categories ? { budget_categories: profileData.budgetCategories || profileData.budget_categories } : {}),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to upsert profile:', err);
      throw err;
    }
  },

  // Update semester aktif & daftar semester terbuka
  async updateSemesters(userId, activeSemester, unlockedSemesters) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          active_semester: Number(activeSemester),
          unlocked_semesters: unlockedSemesters,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

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
        targetsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('accounts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('assignments').select('*').eq('user_id', userId).order('deadline', { ascending: true }),
        supabase.from('course_notes').select('*').eq('user_id', userId).order('week_number', { ascending: true }),
        supabase.from('attendance').select('*').eq('user_id', userId),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('savings_targets').select('*').eq('user_id', userId)
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
          targetGpa: Number(prof.target_gpa) || 3.80
        },
        activeSemester,
        unlockedSemesters,
        budget: {
          startDayOfMonth: prof.start_day_of_month || 1,
          totalBudget: Number(prof.monthly_budget) || 1500000,
          categories: (() => {
            const fallbackCategories = [
              { id: 'cat-1', name: 'Makanan & minuman', icon: '🍜', budget: 750000, color: '#F97316' },
              { id: 'cat-2', name: 'Transportasi', icon: '🛵', budget: 200000, color: '#10B981' },
              { id: 'cat-3', name: 'Tagihan & utilitas', icon: '⚡', budget: 250000, color: '#3B82F6' },
              { id: 'cat-4', name: 'Kebutuhan Pribadi & Skincare', icon: '🧴', budget: 150000, color: '#EC4899' },
              { id: 'cat-5', name: 'Hiburan & nongkrong', icon: '☕', budget: 150000, color: '#8B5CF6' }
            ];
            if (Array.isArray(prof.budget_categories) && prof.budget_categories.length > 0) {
              const hasPersonalCare = prof.budget_categories.some(c =>
                c.name?.toLowerCase().includes('skincare') || c.name?.toLowerCase().includes('pribadi')
              );
              if (!hasPersonalCare) {
                return [
                  ...prof.budget_categories,
                  { id: 'cat-personal', name: 'Kebutuhan Pribadi & Skincare', icon: '🧴', budget: 150000, color: '#EC4899' }
                ];
              }
              return prof.budget_categories;
            }
            return fallbackCategories;
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
          category: t.category,
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
              letter: c.grade_letter || 'E',
              point: Number(c.grade_point) || 0.0,
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
        }))
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
      const payload = {
        id: tx.id,
        user_id: userId,
        account_name: tx.accountName,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category,
        merchant: tx.merchant || '',
        note: tx.note || '',
        icon: tx.icon || '💸',
        date: tx.date
      };
      const { error } = await supabase.from('transactions').insert(payload);
      if (error) console.error('Cloud insert transaction error:', error);

      // Sync account balance
      if (updatedAccounts && updatedAccounts.length > 0) {
        for (const acc of updatedAccounts) {
          await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('id', acc.id);
        }
      }
    } catch (e) {
      console.error('Catch insertTransaction:', e);
    }
  },

  async updateTransaction(txId, fields) {
    if (!isSupabaseConfigured() || !supabase || !txId) return;
    try {
      const payload = {};
      if (fields.amount !== undefined) payload.amount = Number(fields.amount);
      if (fields.type !== undefined) payload.type = fields.type;
      if (fields.category !== undefined) payload.category = fields.category;
      if (fields.accountName !== undefined) payload.account_name = fields.accountName;
      if (fields.merchant !== undefined) payload.merchant = fields.merchant;
      if (fields.note !== undefined) payload.note = fields.note;
      if (fields.date !== undefined) payload.date = fields.date;
      const { error } = await supabase.from('transactions').update(payload).eq('id', txId);
      if (error) console.error('Cloud update transaction error:', error);
    } catch (e) {
      console.error('Catch updateTransaction:', e);
    }
  },

  async deleteTransaction(txId, updatedAccounts = []) {
    if (!isSupabaseConfigured() || !supabase || !txId) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', txId);
      if (error) console.error('Cloud delete transaction error:', error);

      if (updatedAccounts && updatedAccounts.length > 0) {
        for (const acc of updatedAccounts) {
          await supabase.from('accounts').update({ balance: Number(acc.balance) }).eq('id', acc.id);
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
  }
};
