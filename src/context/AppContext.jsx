import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadLocalData, saveLocalData } from '../services/db';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { authService, profileService, dataSyncService, cloudService, generateUUID } from '../services/supabaseService';
import { INITIAL_DATA, CLEAN_DATA } from '../constants/initialData';
import { getFinancialCycle } from '../utils/dateCycle';

const FUEL_API_BASE = 'https://nasgunawann.github.io/bensin-api/v1/provinsi';
const FUEL_PRODUCT_MAP = {
  'PERTALITE': 'pertalite',
  'PERTAMAX': 'pertamax_90',
  'PERTAMAX GREEN 95': 'pertamax_green',
  'PERTAMAX TURBO': 'pertamax_turbo'
};
const DEFAULT_FUEL_PRICES = {
  pertalite: 10000,
  pertamax_90: 15950,
  pertamax_green: 19150,
  pertamax_turbo: 19600
};

const AppContext = createContext();

// Helper to intelligently merge cloud data with local cached data
// If cloud profile has default placeholders ('Mahasiswa', 'Universitas', 'Program Studi', semester 1, etc.)
// but cached has customized values, PRESERVE cached and sync back to cloud so data is never wiped!
const reconcileUserData = (cloudData, cached, userId) => {
  if (!cloudData) return cached || CLEAN_DATA;
  if (!cached) return cloudData;

  let needsCloudHealing = false;
  const healingPayload = {};

  // 1. Reconcile Attendance
  if (cached.courses && Array.isArray(cloudData.courses)) {
    cloudData.courses = cloudData.courses.map(cc => {
      if (!cc.attendance || cc.attendance.length === 0) {
        const cachedC = cached.courses.find(localC => localC.id === cc.id);
        if (cachedC?.attendance && cachedC.attendance.length > 0) {
          cachedC.attendance.forEach(att => {
            if (att.status && att.status !== 'unrecorded') {
              cloudService.upsertAttendance(userId, {
                courseId: cc.id,
                meetingNumber: att.meeting,
                status: att.status
              });
            }
          });
          return { ...cc, attendance: cachedC.attendance };
        }
      }
      return cc;
    });
  }

  // 2. Reconcile Profile (Full Name, University, Major)
  const isPlaceholderName = (name) => !name || name.trim() === '' || name.trim().toLowerCase() === 'mahasiswa';
  const isPlaceholderUniv = (u) => !u || u.trim() === '' || u.trim().toLowerCase() === 'universitas';
  const isPlaceholderMajor = (m) => !m || m.trim() === '' || m.trim().toLowerCase() === 'program studi';

  if (!cloudData.profile) {
    cloudData.profile = { ...(cached.profile || CLEAN_DATA.profile) };
  }

  if (isPlaceholderName(cloudData.profile.fullName) && cached.profile?.fullName && !isPlaceholderName(cached.profile.fullName)) {
    cloudData.profile.fullName = cached.profile.fullName;
    healingPayload.fullName = cached.profile.fullName;
    needsCloudHealing = true;
  }

  if (isPlaceholderUniv(cloudData.profile.university) && cached.profile?.university && !isPlaceholderUniv(cached.profile.university)) {
    cloudData.profile.university = cached.profile.university;
    healingPayload.university = cached.profile.university;
    needsCloudHealing = true;
  }

  if (isPlaceholderMajor(cloudData.profile.major) && cached.profile?.major && !isPlaceholderMajor(cached.profile.major)) {
    cloudData.profile.major = cached.profile.major;
    healingPayload.major = cached.profile.major;
    needsCloudHealing = true;
  }

  // 3. Reconcile Semester (Active Semester & Unlocked Semesters)
  const cachedSem = Number(cached.activeSemester || cached.profile?.semester || 1);
  const cloudSem = Number(cloudData.activeSemester || cloudData.profile?.semester || 1);

  if (cloudSem === 1 && cachedSem > 1) {
    cloudData.activeSemester = cachedSem;
    cloudData.profile.semester = cachedSem;
    healingPayload.activeSemester = cachedSem;
    needsCloudHealing = true;
  } else {
    const finalSem = cloudSem || cachedSem || 1;
    cloudData.activeSemester = finalSem;
    cloudData.profile.semester = finalSem;
  }

  const cachedUnlocked = Array.isArray(cached.unlockedSemesters) ? cached.unlockedSemesters : [cachedSem];
  const cloudUnlocked = Array.isArray(cloudData.unlockedSemesters) ? cloudData.unlockedSemesters : [cloudSem];
  const mergedUnlocked = Array.from(new Set([...cloudUnlocked, ...cachedUnlocked, cloudData.activeSemester])).sort((a, b) => a - b);
  cloudData.unlockedSemesters = mergedUnlocked;

  if (mergedUnlocked.length > cloudUnlocked.length) {
    healingPayload.unlockedSemesters = mergedUnlocked;
    needsCloudHealing = true;
  }

  // 4. Reconcile Budget (if cloud total is default 1500000 but local has custom total)
  if (cloudData.budget && cached.budget) {
    if (Number(cloudData.budget.totalBudget) === 1500000 && Number(cached.budget.totalBudget) && Number(cached.budget.totalBudget) !== 1500000) {
      cloudData.budget.totalBudget = Number(cached.budget.totalBudget);
      healingPayload.monthlyBudget = Number(cached.budget.totalBudget);
      needsCloudHealing = true;
    }
  }

  // 5. Reconcile Fuel Data (keep cached if cloud is empty)
  if ((!cloudData.fuelLogs || cloudData.fuelLogs.length === 0) && cached.fuelLogs && cached.fuelLogs.length > 0) {
    cloudData.fuelLogs = cached.fuelLogs;
  }
  if (!cloudData.fuelSettings && cached.fuelSettings) {
    cloudData.fuelSettings = cached.fuelSettings;
  }

  // Background auto-heal Supabase
  if (needsCloudHealing && userId) {
    profileService.updateProfile(userId, healingPayload).catch(err => {
      console.warn('Background profile healing error:', err);
    });
  }

  return cloudData;
};

export const AppProvider = ({ children }) => {
  // Auth states
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Initialize data with cached local data if available
  const [data, setData] = useState(() => {
    try {
      return loadLocalData(null) || CLEAN_DATA;
    } catch {
      return CLEAN_DATA;
    }
  });
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'academic' | 'finance' | 'grades' | 'profile' | 'extras'
  const [financeSubtab, setFinanceSubtab] = useState('accounts'); // 'accounts' | 'budget' | 'history' | 'report' | 'bills' | 'targets'
  const [academicTab, setAcademicTab] = useState('schedule'); // 'schedule' | 'assignments' | 'attendance' | 'notes'
  const [extrasSubtab, setExtrasSubtab] = useState('menu'); // 'menu' | 'fuel'
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('transaction');
  const [quickAddCategory, setQuickAddCategory] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  // Global navigation helper that synchronizes active tab and subtab
  const navigateTo = (mainTab, subTab = null) => {
    setActiveTab(mainTab);
    if (mainTab === 'finance' && subTab) {
      setFinanceSubtab(subTab);
    } else if (mainTab === 'academic' && subTab) {
      setAcademicTab(subTab);
    } else if (mainTab === 'extras' && subTab) {
      setExtrasSubtab(subTab);
    }
  };

  // Active semester vs viewed semester
  const activeSemester = data.activeSemester || data.profile?.semester || 1;
  const unlockedSemesters = data.unlockedSemesters || [activeSemester];
  const [viewSemester, setViewSemester] = useState(activeSemester);

  // Sync viewSemester when activeSemester changes
  useEffect(() => {
    setViewSemester(activeSemester);
  }, [activeSemester]);

  const [syncStatus, setSyncStatus] = useState({
    mode: isSupabaseConfigured() ? 'online' : 'offline',
    message: isSupabaseConfigured() ? '⚡ Auto-Sync Supabase Aktif' : 'Mode Offline Lokal',
    lastSynced: null
  });

  // Save changes to localStorage only after auth finishes resolving
  useEffect(() => {
    if (!isAuthLoading) {
      saveLocalData(data, user?.id);
    }
  }, [data, user?.id, isAuthLoading]);

  // Supabase Auth & Session Bootstrapping
  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const { session: currSession, user: currUser } = await authService.getSession();
        if (!mounted) return;

        setSession(currSession);
        setUser(currUser);

        if (currUser) {
          setSyncStatus({
            mode: 'online',
            message: 'Tersinkron Cloud Supabase',
            lastSynced: new Date().toLocaleTimeString('id-ID')
          });

          // Check if user has cloud data
          const rawCloudData = await dataSyncService.loadUserData(currUser.id);
          if (rawCloudData) {
            const cached = loadLocalData(currUser.id);
            const resolvedData = reconcileUserData(rawCloudData, cached, currUser.id);
            setData(resolvedData);
            saveLocalData(resolvedData, currUser.id);
            setIsOnboardingOpen(false);
          } else {
            // New user without cloud profile
            const cached = loadLocalData(currUser.id);
            if (cached && cached.profile?.fullName && cached.profile.fullName !== 'Mahasiswa') {
              setData(cached);
              setIsOnboardingOpen(false);
            } else {
              setData(CLEAN_DATA);
              setIsOnboardingOpen(true);
            }
          }
        } else {
          setSyncStatus({
            mode: 'offline',
            message: 'Belum Masuk Akun',
            lastSynced: null
          });
          const localGuestData = loadLocalData(null);
          if (localGuestData) {
            setData(localGuestData);
          }
        }
      } catch (err) {
        console.warn('Auth bootstrapping error:', err);
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    };

    bootstrapAuth();

    // Listen to real-time auth changes
    const { data: authListener } = authService.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const newUser = newSession?.user || null;
      setUser(newUser);

      if (newUser && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setSyncStatus({
          mode: 'online',
          message: 'Tersinkron Cloud Supabase',
          lastSynced: new Date().toLocaleTimeString('id-ID')
        });

        const rawCloudData = await dataSyncService.loadUserData(newUser.id);
        if (rawCloudData) {
          const cached = loadLocalData(newUser.id);
          const resolvedData = reconcileUserData(rawCloudData, cached, newUser.id);
          setData(resolvedData);
          saveLocalData(resolvedData, newUser.id);
          setIsOnboardingOpen(false);
        } else {
          setData(CLEAN_DATA);
          setIsOnboardingOpen(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setSyncStatus({
          mode: 'offline',
          message: 'Telah Keluar Akun',
          lastSynced: null
        });
        setData(CLEAN_DATA);
        setIsGuestMode(false);
        setIsOnboardingOpen(false);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Auth Action Methods
  const login = async (email, password) => {
    try {
      const authData = await authService.signIn(email, password);
      return { success: true, data: authData };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (email, password, metadata = {}) => {
    try {
      const authData = await authService.signUp(email, password, metadata);
      return { success: true, data: authData };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
    setIsGuestMode(false);
    setData(CLEAN_DATA);
    setActiveTab('home');
  };

  const enterGuestMode = () => {
    setIsGuestMode(true);
    setData(INITIAL_DATA);
    setIsOnboardingOpen(false);
  };

  const loginWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const linkGoogle = async () => {
    try {
      await authService.linkGoogleIdentity();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const unlinkGoogle = async (identity) => {
    try {
      await authService.unlinkGoogleIdentity(identity);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getLinkedIdentities = async () => {
    return await authService.getLinkedIdentities();
  };

  // Sync Action
  const triggerSync = async () => {
    setSyncStatus(prev => ({ ...prev, message: 'Menyinkronkan data...' }));
    const res = await syncWithCloud(data, user?.id);
    setSyncStatus({
      mode: res.mode === 'cloud' ? 'online' : (res.mode === 'offline' ? 'offline' : 'ready'),
      message: res.message,
      lastSynced: new Date().toLocaleTimeString('id-ID')
    });
    return res;
  };

  // Local Avatar (Stored strictly in browser localStorage, not uploaded to database)
  const [localAvatar, setLocalAvatarState] = useState(() => {
    try {
      return localStorage.getItem('mykuliahlife_local_avatar') || localStorage.getItem('myuang_local_avatar') || '';
    } catch {
      return '';
    }
  });

  const saveLocalAvatar = (base64) => {
    try {
      if (base64) {
        localStorage.setItem('mykuliahlife_local_avatar', base64);
        localStorage.removeItem('myuang_local_avatar');
        setLocalAvatarState(base64);
      } else {
        localStorage.removeItem('mykuliahlife_local_avatar');
        localStorage.removeItem('myuang_local_avatar');
        setLocalAvatarState('');
      }
    } catch (e) {
      console.warn('Failed to save local avatar:', e);
    }
  };

  // Profile Management
  const updateProfile = (fields) => {
    const semNum = Number(fields.semester || fields.activeSemester) || undefined;

    setData(prev => {
      const currentActiveSem = semNum || prev.activeSemester || prev.profile?.semester || 1;
      const currentUnlocked = Array.isArray(prev.unlockedSemesters) && prev.unlockedSemesters.length > 0
        ? prev.unlockedSemesters
        : [currentActiveSem];
      const nextUnlocked = semNum && !currentUnlocked.includes(semNum)
        ? Array.from(new Set([...currentUnlocked, semNum])).sort((a, b) => a - b)
        : currentUnlocked;

      const updated = {
        ...prev,
        activeSemester: currentActiveSem,
        unlockedSemesters: nextUnlocked,
        profile: {
          ...prev.profile,
          ...fields,
          semester: currentActiveSem
        }
      };

      // Always save to localStorage immediately
      saveLocalData(updated, user?.id);

      // Safe partial update to Supabase
      if (user?.id) {
        profileService.updateProfile(user.id, {
          fullName: updated.profile?.fullName,
          university: updated.profile?.university,
          major: updated.profile?.major,
          activeSemester: currentActiveSem,
          unlockedSemesters: nextUnlocked,
          targetGpa: updated.profile?.targetGpa,
          startDayOfMonth: updated.budget?.startDayOfMonth,
          monthlyBudget: updated.budget?.totalBudget,
          budgetCategories: updated.budget?.categories
        }).catch(err => console.warn('Supabase updateProfile error:', err));
      }

      return updated;
    });

    if (semNum) {
      setViewSemester(semNum);
    }
  };

  // Semester Management (Centrally in Profile)
  const changeActiveSemester = async (targetSem) => {
    const semNum = Number(targetSem);
    if (!semNum) return;

    let nextUnlocked = [];
    setData(prev => {
      const currentUnlocked = Array.isArray(prev.unlockedSemesters) && prev.unlockedSemesters.length > 0
        ? prev.unlockedSemesters
        : [prev.activeSemester || 1];
      nextUnlocked = Array.from(new Set([...currentUnlocked, semNum])).sort((a, b) => a - b);

      const updated = {
        ...prev,
        activeSemester: semNum,
        unlockedSemesters: nextUnlocked,
        profile: {
          ...prev.profile,
          semester: semNum
        }
      };
      saveLocalData(updated, user?.id);
      return updated;
    });

    setViewSemester(semNum);

    if (user?.id) {
      try {
        await profileService.updateSemesters(user.id, semNum, nextUnlocked);
      } catch (e) {
        console.warn('Sync semester error:', e);
      }
    }
  };

  const unlockNewSemester = async (targetSem) => {
    const semNum = Number(targetSem);
    if (!semNum) return;

    let nextUnlocked = [];
    setData(prev => {
      const currentUnlocked = Array.isArray(prev.unlockedSemesters) && prev.unlockedSemesters.length > 0
        ? prev.unlockedSemesters
        : [prev.activeSemester || 1];
      nextUnlocked = Array.from(new Set([...currentUnlocked, semNum])).sort((a, b) => a - b);

      const updated = {
        ...prev,
        activeSemester: semNum,
        unlockedSemesters: nextUnlocked,
        profile: {
          ...prev.profile,
          semester: semNum
        }
      };
      saveLocalData(updated, user?.id);
      return updated;
    });

    setViewSemester(semNum);

    if (user?.id) {
      try {
        await profileService.updateSemesters(user.id, semNum, nextUnlocked);
      } catch (e) {
        console.warn('Sync unlock semester error:', e);
      }
    }
  };

  // Reset & Onboarding Operations
  const resetToDemoData = () => {
    setData(INITIAL_DATA);
    setIsOnboardingOpen(false);
  };

  const resetToCleanData = () => {
    setData(CLEAN_DATA);
    setIsOnboardingOpen(true);
  };

  const completeOnboarding = async ({ profile, startDayOfMonth, initialAccounts, initialBudget }) => {
    const sem = Number(profile.semester) || 1;
    const newData = {
      ...CLEAN_DATA,
      activeSemester: sem,
      unlockedSemesters: [sem],
      profile: {
        ...CLEAN_DATA.profile,
        ...profile,
        semester: sem
      },
      accounts: initialAccounts && initialAccounts.length > 0 ? initialAccounts : CLEAN_DATA.accounts,
      budget: {
        ...CLEAN_DATA.budget,
        startDayOfMonth: Number(startDayOfMonth) || 1,
        totalBudget: Number(initialBudget) || 1500000
      }
    };
    setData(newData);
    setIsOnboardingOpen(false);
    saveLocalData(newData, user?.id);

    if (user?.id) {
      try {
        await dataSyncService.initializeNewUser(user.id, {
          profile,
          startDayOfMonth,
          initialAccounts,
          initialBudget
        });
      } catch (err) {
        console.warn('Failed cloud user init, kept in local storage:', err);
      }
    }
  };

  // Financial Cycle Calculation
  const startDayOfMonth = data.budget?.startDayOfMonth || 1;
  const financialCycle = useMemo(() => {
    return getFinancialCycle(startDayOfMonth, new Date());
  }, [startDayOfMonth]);

  const setStartDayOfMonth = (newDay) => {
    const day = Number(newDay);
    setData(prev => {
      const nextData = {
        ...prev,
        budget: {
          ...prev.budget,
          startDayOfMonth: day,
          periodLabel: getFinancialCycle(day, new Date()).label
        }
      };
      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }
      return nextData;
    });
    if (user?.id) {
      profileService.updateBudget(user.id, {
        startDayOfMonth: day
      }).catch(err => console.warn(err));
    }
  };

  // Filter transactions within active financial cycle
  const cycleExpenses = useMemo(() => {
    return data.transactions
      .filter(t => t.type === 'expense' && financialCycle.isDateInCycle(t.date))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [data.transactions, financialCycle]);

  const cycleIncome = useMemo(() => {
    return data.transactions
      .filter(t => t.type === 'income' && financialCycle.isDateInCycle(t.date))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [data.transactions, financialCycle]);

  // Today's transaction summary
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayTransactions = useMemo(() => {
    return data.transactions.filter(t => t.date === todayDateStr || (t.date && t.date.startsWith(todayDateStr)));
  }, [data.transactions, todayDateStr]);

  const todayIncome = useMemo(() => {
    return todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayTransactions]);

  const todayExpenses = useMemo(() => {
    return todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayTransactions]);

  const todayNet = todayIncome - todayExpenses;
  const todayTxCount = todayTransactions.length;

  const totalBalance = useMemo(() => {
    return data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [data.accounts]);

  const totalBudget = data.budget?.totalBudget || 1000000;
  const remainingBudget = Math.max(0, totalBudget - cycleExpenses);
  const percentUsed = Math.min(100, Math.round((cycleExpenses / totalBudget) * 100));
  const dailyAllowance = Math.round(remainingBudget / Math.max(1, financialCycle.daysRemaining));

  // --- ACCOUNTS CRUD ---
  const addAccount = (acc) => {
    const accId = generateUUID();
    const newAccount = {
      id: accId,
      name: acc.name,
      type: acc.type || 'bank',
      balance: Number(acc.balance) || 0,
      isPrimary: Boolean(acc.isPrimary),
      icon: acc.icon || '💳',
      color: acc.color || '#1665D8',
      accountNumber: acc.accountNumber || '',
      notes: acc.notes || '',
      updated: 'Baru saja'
    };
    setData(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount]
    }));
    if (user?.id) {
      cloudService.insertAccount(user.id, newAccount);
    }
  };

  const editAccount = (accId, updatedFields) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === accId ? { ...a, ...updatedFields } : a)
    }));
    if (user?.id) {
      cloudService.updateAccount(accId, updatedFields);
    }
  };

  const deleteAccount = (accId) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== accId)
    }));
    if (user?.id) {
      cloudService.deleteAccount(accId);
    }
  };

  // --- TRANSACTIONS CRUD ---
  const addTransaction = async (tx) => {
    const txId = generateUUID();
    const newTx = {
      id: txId,
      date: tx.date || new Date().toISOString().split('T')[0],
      type: tx.type, // 'expense' | 'income' | 'transfer'
      category: tx.category,
      amount: Number(tx.amount),
      accountName: tx.accountName,
      toAccountName: tx.toAccountName,
      merchant: tx.merchant || '-',
      note: tx.note || '',
      icon: tx.icon || '💸'
    };

    let finalAccounts = [];

    setData(prev => {
      const updatedAccounts = (prev.accounts || []).map(acc => {
        let balance = Number(acc.balance) || 0;
        if (acc.name === tx.accountName) {
          if (tx.type === 'expense') {
            balance = Math.max(0, balance - newTx.amount);
          } else if (tx.type === 'income') {
            balance += newTx.amount;
          } else if (tx.type === 'transfer') {
            balance = Math.max(0, balance - newTx.amount);
          }
          return { ...acc, balance, updated: 'Baru saja' };
        }
        if (tx.type === 'transfer' && acc.name === tx.toAccountName) {
          balance += newTx.amount;
          return { ...acc, balance, updated: 'Baru saja' };
        }
        return acc;
      });

      finalAccounts = updatedAccounts;

      const nextData = {
        ...prev,
        accounts: updatedAccounts,
        transactions: [newTx, ...(prev.transactions || [])]
      };

      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }

      return nextData;
    });

    if (user?.id) {
      await cloudService.insertTransaction(user.id, newTx, finalAccounts);
      setSyncStatus({
        mode: 'online',
        message: 'Tersinkron Cloud Supabase',
        lastSynced: new Date().toLocaleTimeString('id-ID')
      });
    }
  };

  const deleteTransaction = async (txId, rollbackBalance = true) => {
    let finalAccounts = [];

    setData(prev => {
      const targetTx = (prev.transactions || []).find(t => String(t.id) === String(txId));
      if (!targetTx) return prev;

      let updatedAccounts = prev.accounts || [];
      if (rollbackBalance) {
        updatedAccounts = (prev.accounts || []).map(acc => {
          let balance = Number(acc.balance) || 0;
          if (acc.name === targetTx.accountName) {
            if (targetTx.type === 'expense') {
              balance += targetTx.amount;
            } else if (targetTx.type === 'income') {
              balance = Math.max(0, balance - targetTx.amount);
            } else if (targetTx.type === 'transfer') {
              balance += targetTx.amount;
            }
            return { ...acc, balance, updated: 'Baru saja' };
          }
          if (targetTx.type === 'transfer' && acc.name === targetTx.toAccountName) {
            balance = Math.max(0, balance - targetTx.amount);
            return { ...acc, balance, updated: 'Baru saja' };
          }
          return acc;
        });
      }

      finalAccounts = updatedAccounts;

      const nextData = {
        ...prev,
        accounts: updatedAccounts,
        transactions: (prev.transactions || []).filter(t => String(t.id) !== String(txId))
      };

      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }

      return nextData;
    });

    if (user?.id) {
      await cloudService.deleteTransaction(user.id, txId, finalAccounts);
      setSyncStatus({
        mode: 'online',
        message: 'Tersinkron Cloud Supabase',
        lastSynced: new Date().toLocaleTimeString('id-ID')
      });
    }
  };

  const editTransaction = async (txId, updatedFields) => {
    let finalAccounts = [];
    let savedNewTx = null;

    setData(prev => {
      const oldTx = (prev.transactions || []).find(t => String(t.id) === String(txId));
      if (!oldTx) {
        console.warn('Transaction to edit not found in current state:', txId);
        return prev;
      }

      // Rollback old transaction effect on balances
      const tempAccounts = (prev.accounts || []).map(acc => {
        let balance = Number(acc.balance) || 0;
        if (acc.name === oldTx.accountName) {
          if (oldTx.type === 'expense') balance += oldTx.amount;
          else if (oldTx.type === 'income') balance = Math.max(0, balance - oldTx.amount);
          else if (oldTx.type === 'transfer') balance += oldTx.amount;
        }
        if (oldTx.type === 'transfer' && acc.name === oldTx.toAccountName) {
          balance = Math.max(0, balance - oldTx.amount);
        }
        return { ...acc, balance };
      });

      // Build updated transaction object
      const newTx = {
        ...oldTx,
        ...updatedFields,
        amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : oldTx.amount)
      };
      savedNewTx = newTx;

      // Apply new transaction effect on balances
      const updatedAccounts = tempAccounts.map(acc => {
        let balance = Number(acc.balance) || 0;
        if (acc.name === newTx.accountName) {
          if (newTx.type === 'expense') balance = Math.max(0, balance - newTx.amount);
          else if (newTx.type === 'income') balance += newTx.amount;
          else if (newTx.type === 'transfer') balance = Math.max(0, balance - newTx.amount);
        }
        if (newTx.type === 'transfer' && acc.name === newTx.toAccountName) {
          balance += newTx.amount;
        }
        return { ...acc, balance, updated: 'Baru saja' };
      });

      finalAccounts = updatedAccounts;

      const nextData = {
        ...prev,
        accounts: updatedAccounts,
        transactions: (prev.transactions || []).map(t => String(t.id) === String(txId) ? newTx : t)
      };

      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }

      return nextData;
    });

    // Sync directly to Supabase cloud
    if (user?.id && savedNewTx) {
      await cloudService.updateTransaction(user.id, txId, savedNewTx, finalAccounts);
      setSyncStatus({
        mode: 'online',
        message: 'Tersinkron Cloud Supabase',
        lastSynced: new Date().toLocaleTimeString('id-ID')
      });
    }
  };

  // Budget Management (Direct Cloud Sync + Safe Local Persistence)
  const updateBudget = async (newTotal, updatedCategories) => {
    let targetTotal = 1500000;
    let targetCategories = [];
    let targetStartDay = 1;

    setData(prev => {
      targetTotal = newTotal !== undefined ? Number(newTotal) : (prev.budget?.totalBudget || 1500000);
      targetCategories = updatedCategories || prev.budget?.categories || [];
      targetStartDay = prev.budget?.startDayOfMonth || 1;

      const nextData = {
        ...prev,
        budget: {
          ...prev.budget,
          totalBudget: targetTotal,
          categories: targetCategories
        }
      };

      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }

      return nextData;
    });

    if (user?.id) {
      try {
        await profileService.updateBudget(user.id, {
          monthlyBudget: targetTotal,
          startDayOfMonth: targetStartDay,
          budgetCategories: targetCategories
        });
        setSyncStatus({
          mode: 'online',
          message: 'Tersinkron Cloud Supabase',
          lastSynced: new Date().toLocaleTimeString('id-ID')
        });
      } catch (err) {
        console.error('Failed to sync budget to Supabase profiles:', err);
      }
    }
  };

  // --- BILLS CRUD ---
  const addBill = (bill) => {
    const billId = generateUUID();
    const newBill = {
      id: billId,
      ...bill,
      amount: Number(bill.amount),
      isPaid: false
    };
    setData(prev => ({
      ...prev,
      bills: [newBill, ...prev.bills]
    }));
    if (user?.id) {
      cloudService.insertBill(user.id, newBill);
    }
  };

  const toggleBillPaid = (billId) => {
    let nextPaid = false;
    setData(prev => ({
      ...prev,
      bills: prev.bills.map(b => {
        if (b.id === billId) {
          nextPaid = !b.isPaid;
          return { ...b, isPaid: nextPaid };
        }
        return b;
      })
    }));
    if (user?.id) {
      cloudService.toggleBill(billId, nextPaid);
    }
  };

  const deleteBill = (billId) => {
    setData(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== billId)
    }));
    if (user?.id) {
      cloudService.deleteBill(billId);
    }
  };

  // --- SAVINGS TARGETS CRUD ---
  const addSavingsTarget = (target) => {
    const targetId = generateUUID();
    const newTarget = {
      id: targetId,
      ...target,
      targetAmount: Number(target.targetAmount),
      currentAmount: Number(target.currentAmount || 0),
      history: []
    };
    setData(prev => ({
      ...prev,
      savingsTargets: [newTarget, ...prev.savingsTargets]
    }));
    if (user?.id) {
      cloudService.insertTarget(user.id, newTarget);
    }
  };

  const depositToTarget = (targetId, amount, note = 'Setoran tabungan') => {
    const depositAmount = Number(amount);
    let finalAmount = 0;
    setData(prev => ({
      ...prev,
      savingsTargets: prev.savingsTargets.map(st => {
        if (st.id === targetId) {
          finalAmount = st.currentAmount + depositAmount;
          const newHistory = [
            {
              id: `sh-${Date.now()}`,
              amount: depositAmount,
              date: new Date().toISOString().split('T')[0],
              note
            },
            ...(st.history || [])
          ];
          return {
            ...st,
            currentAmount: finalAmount,
            history: newHistory
          };
        }
        return st;
      })
    }));
    if (user?.id) {
      cloudService.updateTargetAmount(targetId, finalAmount);
    }
  };

  const deleteSavingsTarget = (targetId) => {
    setData(prev => ({
      ...prev,
      savingsTargets: prev.savingsTargets.filter(t => t.id !== targetId)
    }));
    if (user?.id) {
      cloudService.deleteTarget(targetId);
    }
  };

  // --- FUEL TRACKER CRUD & SYNC ---
  const addFuelLog = async (logData, autoRecordTransaction = true) => {
    const logId = generateUUID();
    const fuelPrice = Number(logData.pricePerLiter) || 10000;
    const amount = Number(logData.amount) || 0;
    const calculatedLiters = logData.liters ? Number(logData.liters) : Number((amount / fuelPrice).toFixed(3));
    
    const currSettings = data.fuelSettings || {
      motorName: 'Motor Saya',
      motorType: 'Matic',
      tankCapacity: 4.2,
      currentTankLevel: 50,
      currentOdometer: 0,
      provinceSlug: 'jawa-timur',
      provinceName: 'Jawa Timur',
      lastPriceSync: null,
      fuelPrices: DEFAULT_FUEL_PRICES
    };

    const tankCap = Number(currSettings.tankCapacity) || 4.2;
    const addedPercent = (calculatedLiters / tankCap) * 100;
    const newTankLevel = Math.min(100, Math.round((Number(currSettings.currentTankLevel) || 50) + addedPercent));
    const newOdo = logData.odometer !== undefined && logData.odometer !== null && logData.odometer !== '' 
      ? Number(logData.odometer) 
      : (currSettings.currentOdometer || 0);

    const updatedFuelSettings = {
      ...currSettings,
      currentTankLevel: newTankLevel,
      currentOdometer: newOdo
    };

    const newLog = {
      id: logId,
      date: logData.date || new Date().toISOString().split('T')[0],
      fuelType: logData.fuelType || 'pertalite',
      amount,
      liters: calculatedLiters,
      pricePerLiter: fuelPrice,
      station: logData.station || '',
      odometer: logData.odometer !== undefined && logData.odometer !== null && logData.odometer !== '' ? Number(logData.odometer) : null,
      tankLevel: newTankLevel,
      note: logData.note || ''
    };

    setData(prev => {
      const nextData = {
        ...prev,
        fuelLogs: [newLog, ...(prev.fuelLogs || [])],
        fuelSettings: updatedFuelSettings
      };
      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }
      return nextData;
    });

    if (user?.id) {
      cloudService.insertFuelLog(user.id, newLog);
      cloudService.upsertFuelSettings(user.id, updatedFuelSettings);
    }

    // Auto-record to Financial Transactions (Category: "Transport & Bensin")
    if (autoRecordTransaction && amount > 0) {
      const fuelNames = {
        pertalite: 'Pertalite',
        pertamax_90: 'Pertamax',
        pertamax_green: 'Pertamax Green 95',
        pertamax_turbo: 'Pertamax Turbo'
      };
      const fuelLabel = fuelNames[logData.fuelType] || 'BBM';
      const odoText = logData.odometer ? ` | Odo: ${Number(logData.odometer).toLocaleString('id-ID')} km` : '';
      
      await addTransaction({
        type: 'expense',
        category: 'Transport & Bensin',
        amount,
        accountName: logData.accountName || data.accounts?.[0]?.name || 'Tunai',
        merchant: logData.station || 'SPBU Pertamina',
        note: `⛽ ${fuelLabel} ${calculatedLiters.toFixed(2)}L @ Rp${fuelPrice.toLocaleString('id-ID')}${odoText}`,
        icon: '⛽',
        date: logData.date || new Date().toISOString().split('T')[0]
      });
    }

    return newLog;
  };

  const deleteFuelLog = (logId) => {
    setData(prev => {
      const nextData = {
        ...prev,
        fuelLogs: (prev.fuelLogs || []).filter(fl => fl.id !== logId)
      };
      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }
      return nextData;
    });
    if (user?.id) {
      cloudService.deleteFuelLog(logId);
    }
  };

  const updateFuelSettings = (newFields) => {
    let merged = null;
    setData(prev => {
      const curr = prev.fuelSettings || {
        motorName: 'Motor Saya',
        motorType: 'Matic',
        tankCapacity: 4.2,
        currentTankLevel: 50,
        currentOdometer: 0,
        provinceSlug: 'jawa-timur',
        provinceName: 'Jawa Timur',
        lastPriceSync: null,
        fuelPrices: DEFAULT_FUEL_PRICES
      };
      merged = {
        ...curr,
        ...newFields,
        fuelPrices: newFields.fuelPrices ? { ...curr.fuelPrices, ...newFields.fuelPrices } : curr.fuelPrices
      };
      const nextData = {
        ...prev,
        fuelSettings: merged
      };
      if (!isAuthLoading) {
        saveLocalData(nextData, user?.id);
      }
      return nextData;
    });
    if (user?.id && merged) {
      cloudService.upsertFuelSettings(user.id, merged);
    }
    return merged;
  };

  const fetchFuelPrices = async (targetSlug = null) => {
    const slug = targetSlug || data.fuelSettings?.provinceSlug || 'jawa-timur';
    try {
      const res = await fetch(`${FUEL_API_BASE}/${slug}.json`);
      if (!res.ok) throw new Error('Gagal mengambil data dari server bensin-api');
      const json = await res.json();
      
      const newPrices = {};
      if (Array.isArray(json.products)) {
        json.products.forEach(p => {
          const mappedKey = FUEL_PRODUCT_MAP[p.product];
          if (mappedKey && p.price_rupiah) {
            newPrices[mappedKey] = Number(p.price_rupiah);
          }
        });
      }

      if (Object.keys(newPrices).length > 0) {
        const updated = updateFuelSettings({
          fuelPrices: newPrices,
          provinceSlug: slug,
          provinceName: json.provinsi || data.fuelSettings?.provinceName || 'Jawa Timur',
          lastPriceSync: new Date().toISOString()
        });
        return { success: true, prices: newPrices, updatedAt: json.pertamina_updated_at };
      }
      return { success: false, error: 'Format data produk tidak sesuai' };
    } catch (err) {
      console.warn('Fuel price fetch error:', err);
      return { success: false, error: err.message };
    }
  };

  // --- SEMESTER & ACADEMIC TRANSITION ---
  const promoteToNextSemester = () => {
    const nextSem = (activeSemester || 1) + 1;
    unlockNewSemester(nextSem);
  };

  // --- COURSES CRUD (Bound to semester & auto-synced) ---
  const addCourse = (course) => {
    const courseId = generateUUID();
    const newCourse = {
      id: courseId,
      semester: Number(course.semester || viewSemester || activeSemester),
      code: course.code || 'MK',
      name: course.name,
      sks: Number(course.sks) || 3,
      lecturer: course.lecturer || 'Dosen Pengampu',
      room: course.room || 'Ruang Kuliah',
      dayOfWeek: course.dayOfWeek || 'Senin',
      startTime: course.startTime || '08:00',
      endTime: course.endTime || '10:30',
      color: course.color || '#1665D8',
      grade: {
        letter: null,
        point: 0.0,
        isGraded: false
      },
      attendance: []
    };
    setData(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse]
    }));
    if (user?.id) {
      cloudService.insertCourse(user.id, newCourse);
    }
  };

  const updateCourse = (courseId, updatedFields) => {
    setData(prev => {
      const targetCourse = prev.courses.find(c => c.id === courseId);
      if (!targetCourse) return prev;

      const updatedCourse = {
        ...targetCourse,
        ...updatedFields,
        sks: updatedFields.sks !== undefined ? Number(updatedFields.sks) : targetCourse.sks
      };

      const updatedCourses = prev.courses.map(c => c.id === courseId ? updatedCourse : c);

      // Sync name changes to assignments and notes
      const updatedAssignments = prev.assignments.map(a => 
        a.courseId === courseId ? { ...a, courseName: updatedCourse.name } : a
      );
      const updatedCourseNotes = prev.courseNotes.map(n => 
        n.courseId === courseId ? { ...n, courseName: updatedCourse.name } : n
      );

      // Sync with semester grades if already graded
      const updatedSemesters = prev.semesters.map(s => {
        if (s.semesterNumber === updatedCourse.semester) {
          const hasCourse = s.courses.some(c => c.courseId === courseId || c.name === targetCourse.name);
          if (hasCourse) {
            const newSemCourses = s.courses.map(c => {
              if (c.courseId === courseId || c.name === targetCourse.name) {
                return { ...c, courseId: updatedCourse.id, name: updatedCourse.name, sks: updatedCourse.sks };
              }
              return c;
            });
            const totalSks = newSemCourses.reduce((sum, c) => sum + c.sks, 0);
            const totalPoints = newSemCourses.reduce((sum, c) => sum + (c.sks * c.point), 0);
            const ips = totalSks > 0 ? Number((totalPoints / totalSks).toFixed(2)) : 0;
            return { ...s, totalSks, ips, courses: newSemCourses };
          }
        }
        return s;
      });

      return {
        ...prev,
        courses: updatedCourses,
        assignments: updatedAssignments,
        courseNotes: updatedCourseNotes,
        semesters: updatedSemesters
      };
    });
  };

  const deleteCourse = (courseId) => {
    setData(prev => {
      const targetCourse = prev.courses.find(c => c.id === courseId);
      const targetName = targetCourse?.name;

      const updatedSemesters = prev.semesters.map(s => {
        const filteredCourses = s.courses.filter(c => c.courseId !== courseId && c.name !== targetName);
        if (filteredCourses.length !== s.courses.length) {
          const totalSks = filteredCourses.reduce((sum, c) => sum + c.sks, 0);
          const totalPoints = filteredCourses.reduce((sum, c) => sum + (c.sks * c.point), 0);
          const ips = totalSks > 0 ? Number((totalPoints / totalSks).toFixed(2)) : 0;
          return { ...s, totalSks, ips, courses: filteredCourses };
        }
        return s;
      });

      return {
        ...prev,
        courses: prev.courses.filter(c => c.id !== courseId),
        assignments: prev.assignments.filter(a => a.courseId !== courseId),
        courseNotes: prev.courseNotes.filter(n => n.courseId !== courseId),
        semesters: updatedSemesters
      };
    });

    if (user?.id) {
      cloudService.deleteCourse(courseId);
    }
  };

  const setCourseGrade = (courseId, letter, point) => {
    setData(prev => {
      const targetCourse = prev.courses.find(c => c.id === courseId);
      const numPoint = Number(point);
      const gradeObj = { letter, point: numPoint, isGraded: true };

      const updatedCourses = prev.courses.map(c => 
        c.id === courseId ? { ...c, grade: gradeObj } : c
      );

      const targetSemesterNum = targetCourse?.semester || activeSemester;
      const semExists = prev.semesters.some(s => s.semesterNumber === targetSemesterNum);

      let updatedSemesters;
      if (semExists) {
        updatedSemesters = prev.semesters.map(s => {
          if (s.semesterNumber === targetSemesterNum) {
            const courseIdx = s.courses.findIndex(c => (courseId && c.courseId === courseId) || (targetCourse && c.name?.toLowerCase() === targetCourse.name?.toLowerCase()));
            let newSemCourses;
            if (courseIdx >= 0) {
              newSemCourses = [...s.courses];
              newSemCourses[courseIdx] = {
                ...newSemCourses[courseIdx],
                courseId: targetCourse?.id || courseId,
                name: targetCourse?.name || newSemCourses[courseIdx].name,
                sks: Number(targetCourse?.sks) || Number(newSemCourses[courseIdx].sks) || 3,
                letter,
                point: numPoint,
                isGraded: true
              };
            } else if (targetCourse) {
              newSemCourses = [
                ...s.courses,
                {
                  courseId: targetCourse.id,
                  name: targetCourse.name,
                  sks: Number(targetCourse.sks) || 3,
                  letter,
                  point: numPoint,
                  isGraded: true
                }
              ];
            } else {
              newSemCourses = s.courses;
            }
            const gradedSemCourses = newSemCourses.filter(c => c.isGraded !== false && c.letter && c.letter !== '-');
            const totalSks = newSemCourses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);
            const gradedSks = gradedSemCourses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);
            const totalPoints = gradedSemCourses.reduce((sum, c) => sum + ((Number(c.sks) || 0) * (Number(c.point) || 0)), 0);
            const ips = gradedSks > 0 ? Number((totalPoints / gradedSks).toFixed(2)) : null;
            return { ...s, totalSks, ips, courses: newSemCourses };
          }
          return s;
        });
      } else if (targetCourse) {
        const initialCourse = {
          courseId: targetCourse.id,
          name: targetCourse.name,
          sks: Number(targetCourse.sks) || 3,
          letter,
          point: numPoint,
          isGraded: true
        };
        const newSem = {
          semesterNumber: targetSemesterNum,
          totalSks: initialCourse.sks,
          ips: initialCourse.point,
          courses: [initialCourse]
        };
        updatedSemesters = [...prev.semesters, newSem].sort((a, b) => a.semesterNumber - b.semesterNumber);
      } else {
        updatedSemesters = prev.semesters;
      }

      return {
        ...prev,
        courses: updatedCourses,
        semesters: updatedSemesters
      };
    });

    if (user?.id) {
      cloudService.setCourseGrade(courseId, letter, point);
    }
  };

  const updateAttendance = (courseId, meetingNumber, status) => {
    setData(prev => {
      const targetCourse = prev.courses.find(c => c.id === courseId);
      const existingAtt = targetCourse?.attendance || [];
      let newAtt;
      if (status === 'unrecorded') {
        newAtt = existingAtt.filter(a => a.meeting !== meetingNumber);
      } else {
        const idx = existingAtt.findIndex(a => a.meeting === meetingNumber);
        if (idx >= 0) {
          newAtt = [...existingAtt];
          newAtt[idx] = { ...newAtt[idx], status, date: new Date().toISOString().split('T')[0] };
        } else {
          newAtt = [...existingAtt, { meeting: meetingNumber, status, date: new Date().toISOString().split('T')[0] }];
        }
      }

      return {
        ...prev,
        courses: prev.courses.map(crs => crs.id === courseId ? { ...crs, attendance: newAtt } : crs)
      };
    });

    if (user?.id) {
      if (status === 'unrecorded') {
        cloudService.deleteAttendance(user.id, courseId, meetingNumber);
      } else {
        cloudService.upsertAttendance(user.id, { courseId, meetingNumber, status });
      }
    }
  };

  // --- ASSIGNMENTS CRUD (Bound to semester) ---
  const addAssignment = (asg) => {
    const asgId = generateUUID();
    const newAsg = {
      id: asgId,
      courseId: asg.courseId,
      courseName: asg.courseName,
      semester: Number(asg.semester || viewSemester || activeSemester),
      title: asg.title,
      description: asg.description || '',
      deadline: asg.deadline,
      priority: asg.priority || 'medium',
      status: 'pending'
    };
    setData(prev => ({
      ...prev,
      assignments: [newAsg, ...prev.assignments]
    }));
    if (user?.id) {
      cloudService.insertAssignment(user.id, newAsg);
    }
  };

  const editAssignment = (asgId, updatedFields) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => a.id === asgId ? { ...a, ...updatedFields } : a)
    }));
    if (user?.id) {
      cloudService.updateAssignment(asgId, updatedFields);
    }
  };

  const toggleAssignmentStatus = (asgId) => {
    let nextStatus = 'pending';
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => {
        if (a.id === asgId) {
          nextStatus = a.status === 'completed' ? 'pending' : 'completed';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    }));
    if (user?.id) {
      cloudService.updateAssignment(asgId, { status: nextStatus });
    }
  };

  const deleteAssignment = (asgId) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.id !== asgId)
    }));
    if (user?.id) {
      cloudService.deleteAssignment(asgId);
    }
  };

  // --- COURSE NOTES CRUD (Bound to semester) ---
  const addCourseNote = (note) => {
    const noteId = generateUUID();
    const newNote = {
      id: noteId,
      courseId: note.courseId,
      courseName: note.courseName,
      semester: Number(note.semester || viewSemester || activeSemester),
      weekNumber: Number(note.weekNumber) || 1,
      topic: note.topic,
      content: note.content || '',
      materialUrl: note.materialUrl || null
    };
    setData(prev => ({
      ...prev,
      courseNotes: [newNote, ...prev.courseNotes]
    }));
    if (user?.id) {
      cloudService.insertNote(user.id, newNote);
    }
  };

  const editCourseNote = (noteId, updatedFields) => {
    setData(prev => ({
      ...prev,
      courseNotes: prev.courseNotes.map(n => n.id === noteId ? { ...n, ...updatedFields } : n)
    }));
    if (user?.id) {
      cloudService.updateNote(noteId, updatedFields);
    }
  };

  const deleteCourseNote = (noteId) => {
    setData(prev => ({
      ...prev,
      courseNotes: prev.courseNotes.filter(n => n.id !== noteId)
    }));
    if (user?.id) {
      cloudService.deleteNote(noteId);
    }
  };

  // --- GRADES & IPS/IPK CRUD ---
  const addSemesterCourse = (semesterNum, course) => {
    setData(prev => {
      const existingSem = prev.semesters.find(s => s.semesterNumber === semesterNum);
      const newCourseItem = {
        name: course.name,
        sks: Number(course.sks),
        letter: course.letter,
        point: Number(course.point)
      };

      let updatedSemesters;
      if (existingSem) {
        const newCourses = [...existingSem.courses, newCourseItem];
        const totalSks = newCourses.reduce((sum, c) => sum + c.sks, 0);
        const totalPoints = newCourses.reduce((sum, c) => sum + (c.sks * c.point), 0);
        const ips = Number((totalPoints / totalSks).toFixed(2));

        updatedSemesters = prev.semesters.map(s =>
          s.semesterNumber === semesterNum ? { ...s, totalSks, ips, courses: newCourses } : s
        );
      } else {
        const totalSks = newCourseItem.sks;
        const ips = newCourseItem.point;
        updatedSemesters = [
          ...prev.semesters,
          {
            semesterNumber: semesterNum,
            ips,
            totalSks,
            courses: [newCourseItem]
          }
        ].sort((a, b) => a.semesterNumber - b.semesterNumber);
      }

      return { ...prev, semesters: updatedSemesters };
    });
  };

  const deleteSemesterCourse = (semesterNum, courseIndex) => {
    setData(prev => {
      const sem = prev.semesters.find(s => s.semesterNumber === semesterNum);
      if (!sem) return prev;

      const newCourses = sem.courses.filter((_, i) => i !== courseIndex);
      let updatedSemesters;

      if (newCourses.length === 0) {
        updatedSemesters = prev.semesters.filter(s => s.semesterNumber !== semesterNum);
      } else {
        const totalSks = newCourses.reduce((sum, c) => sum + c.sks, 0);
        const totalPoints = newCourses.reduce((sum, c) => sum + (c.sks * c.point), 0);
        const ips = totalSks > 0 ? Number((totalPoints / totalSks).toFixed(2)) : 0;

        updatedSemesters = prev.semesters.map(s =>
          s.semesterNumber === semesterNum ? { ...s, totalSks, ips, courses: newCourses } : s
        );
      }

      return { ...prev, semesters: updatedSemesters };
    });
  };

  // Overall Academic Calculations (IPK Kumulatif & Sinkronisasi Matakuliah per Semester)
  const unifiedSemesterData = useMemo(() => {
    const courseSemesters = (data.courses || []).map(c => c.semester || 1);
    const gradeSemesters = (data.semesters || []).map(s => s.semesterNumber || 1);
    const activeSem = data.activeSemester || data.profile?.semester || 1;
    const maxSem = Math.max(activeSem, ...courseSemesters, ...gradeSemesters, 1);
    const semNums = Array.from({ length: maxSem }, (_, i) => i + 1);

    return semNums.map(semNum => {
      const regCourses = (data.courses || []).filter(c => (c.semester || 1) === semNum);
      const semRec = (data.semesters || []).find(s => s.semesterNumber === semNum);
      const recCourses = semRec?.courses || [];

      const merged = [];
      const seen = new Set();

      regCourses.forEach(rc => {
        seen.add(rc.name?.toLowerCase());
        const match = recCourses.find(
          ec => (ec.courseId && ec.courseId === rc.id) || ec.name?.toLowerCase() === rc.name?.toLowerCase()
        );

        // Grade determination:
        // A course is only graded if explicitly marked as isGraded: true or has recorded grade in match
        const hasExplicitGraded = rc.grade?.isGraded === true || rc.is_graded === true;
        const isExplicitlyUngraded = rc.grade?.isGraded === false || rc.is_graded === false;

        let hasGrade = false;
        let letter = '-';
        let point = 0;

        if (hasExplicitGraded) {
          hasGrade = true;
          letter = rc.grade?.letter || match?.letter || 'A';
          point = rc.grade?.point !== undefined ? Number(rc.grade.point) : (match?.point !== undefined ? Number(match.point) : 4.0);
        } else if (isExplicitlyUngraded) {
          if (match && match.letter && match.letter !== '-' && match.isGraded !== false) {
            hasGrade = true;
            letter = match.letter;
            point = match.point !== undefined ? Number(match.point) : 0;
          } else {
            hasGrade = false;
            letter = '-';
            point = 0;
          }
        } else {
          // Fallback / legacy without explicit isGraded flag
          if (match && match.letter && match.letter !== '-') {
            hasGrade = true;
            letter = match.letter;
            point = match.point !== undefined ? Number(match.point) : 0;
          } else if (rc.grade?.letter && rc.grade.letter !== '-' && rc.grade.letter !== 'E') {
            hasGrade = true;
            letter = rc.grade.letter;
            point = rc.grade.point !== undefined ? Number(rc.grade.point) : 0;
          } else {
            // Default placeholder (e.g. unassigned grade 'E' with point 0) is treated as not graded yet
            hasGrade = false;
            letter = '-';
            point = 0;
          }
        }

        merged.push({
          id: rc.id,
          courseId: rc.id,
          name: rc.name,
          code: rc.code || 'MK',
          sks: Number(rc.sks) || 3,
          lecturer: rc.lecturer,
          room: rc.room,
          dayOfWeek: rc.dayOfWeek,
          startTime: rc.startTime,
          endTime: rc.endTime,
          time: `${rc.startTime || ''} - ${rc.endTime || ''}`,
          color: rc.color,
          semester: semNum,
          isFromCourses: true,
          isGraded: hasGrade,
          letter: hasGrade ? letter : '-',
          point: hasGrade ? point : 0
        });
      });

      recCourses.forEach(ec => {
        if (!seen.has(ec.name?.toLowerCase())) {
          seen.add(ec.name?.toLowerCase());
          const hasGrade = ec.isGraded !== false && Boolean(ec.letter && ec.letter !== '-');
          merged.push({
            id: ec.courseId || `ec-${ec.name}`,
            courseId: ec.courseId,
            name: ec.name,
            code: ec.code || 'MK',
            sks: Number(ec.sks) || 3,
            semester: semNum,
            isFromCourses: false,
            isGraded: hasGrade,
            letter: hasGrade ? (ec.letter || 'A') : '-',
            point: hasGrade ? (Number(ec.point) || 0) : 0
          });
        }
      });

      const totalSks = merged.reduce((sum, c) => sum + c.sks, 0);
      const graded = merged.filter(c => c.isGraded);
      const gradedSks = graded.reduce((sum, c) => sum + c.sks, 0);
      const gradedPoints = graded.reduce((sum, c) => sum + (c.sks * c.point), 0);

      let ips = null;
      if (gradedSks > 0) {
        ips = Number((gradedPoints / gradedSks).toFixed(2));
      } else if (semRec && typeof semRec.ips === 'number' && semRec.ips > 0 && semRec.totalSks > 0 && merged.length === 0) {
        ips = semRec.ips;
      }

      return {
        semesterNumber: semNum,
        courses: merged,
        totalSks,
        gradedCourses: graded,
        gradedSks: gradedSks > 0 ? gradedSks : (ips !== null && semRec?.totalSks ? semRec.totalSks : 0),
        gradedPoints: gradedSks > 0 ? gradedPoints : (ips !== null && semRec?.totalSks ? ips * semRec.totalSks : 0),
        ips
      };
    });
  }, [data.courses, data.semesters, data.activeSemester, data.profile?.semester]);

  const totalCumulativeSks = useMemo(() => {
    return unifiedSemesterData.reduce((sum, s) => sum + s.gradedSks, 0);
  }, [unifiedSemesterData]);

  const cumulativeGpa = useMemo(() => {
    const totalPoints = unifiedSemesterData.reduce((sum, s) => sum + s.gradedPoints, 0);
    return totalCumulativeSks > 0
      ? Number((totalPoints / totalCumulativeSks).toFixed(2))
      : 0.0;
  }, [unifiedSemesterData, totalCumulativeSks]);

  return (
    <AppContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        financeSubtab,
        setFinanceSubtab,
        academicTab,
        setAcademicTab,
        navigateTo,
        isBalanceVisible,
        setIsBalanceVisible,
        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddType,
        setQuickAddType,
        quickAddCategory,
        setQuickAddCategory,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isCycleModalOpen,
        setIsCycleModalOpen,
        syncStatus,
        triggerSync,
        // Auth & User Session
        session,
        user,
        isAuthLoading,
        isGuestMode,
        login,
        loginWithGoogle,
        register,
        logout,
        enterGuestMode,
        linkGoogle,
        unlinkGoogle,
        getLinkedIdentities,
        // Onboarding & Reset
        resetToDemoData,
        resetToCleanData,
        completeOnboarding,
        updateProfile,
        localAvatar,
        saveLocalAvatar,
        // Semester System (Centralized in Profile)
        activeSemester,
        unlockedSemesters,
        viewSemester,
        setViewSemester,
        changeActiveSemester,
        unlockNewSemester,
        // Financial cycle
        financialCycle,
        startDayOfMonth,
        setStartDayOfMonth,
        totalBalance,
        totalBudget,
        cycleExpenses,
        cycleIncome,
        todayIncome,
        todayExpenses,
        todayNet,
        todayTxCount,
        todayDateStr,
        remainingBudget,
        percentUsed,
        dailyAllowance,
        // Finance CRUD
        addAccount,
        editAccount,
        deleteAccount,
        addTransaction,
        editTransaction,
        deleteTransaction,
        updateBudget,
        addBill,
        toggleBillPaid,
        deleteBill,
        addSavingsTarget,
        depositToTarget,
        deleteSavingsTarget,
        // Academic CRUD
        cumulativeGpa,
        totalCumulativeSks,
        unifiedSemesterData,
        addCourse,
        updateCourse,
        deleteCourse,
        setCourseGrade,
        updateAttendance,
        addAssignment,
        editAssignment,
        toggleAssignmentStatus,
        deleteAssignment,
        addCourseNote,
        editCourseNote,
        deleteCourseNote,
        addSemesterCourse,
        deleteSemesterCourse,
        // Extras & Fuel Tracker
        extrasSubtab,
        setExtrasSubtab,
        fuelLogs: data.fuelLogs || [],
        fuelSettings: data.fuelSettings || {
          motorName: 'Motor Saya',
          motorType: 'Matic',
          tankCapacity: 4.2,
          currentTankLevel: 50,
          currentOdometer: 0,
          provinceSlug: 'jawa-timur',
          provinceName: 'Jawa Timur',
          lastPriceSync: null,
          fuelPrices: DEFAULT_FUEL_PRICES
        },
        addFuelLog,
        deleteFuelLog,
        updateFuelSettings,
        fetchFuelPrices
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
