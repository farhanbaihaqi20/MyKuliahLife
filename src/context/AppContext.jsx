import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadLocalData, saveLocalData, syncWithCloud } from '../services/db';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { INITIAL_DATA, CLEAN_DATA } from '../constants/initialData';
import { getFinancialCycle } from '../utils/dateCycle';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(() => loadLocalData());
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'academic' | 'finance' | 'grades' | 'profile'
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('transaction');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  // Active semester vs viewed semester
  const activeSemester = data.activeSemester || data.profile?.semester || 1;
  const [viewSemester, setViewSemester] = useState(activeSemester);

  // Sync viewSemester when activeSemester changes
  useEffect(() => {
    setViewSemester(activeSemester);
  }, [activeSemester]);

  const [syncStatus, setSyncStatus] = useState({
    mode: isSupabaseConfigured() ? 'connecting' : 'offline',
    message: isSupabaseConfigured() ? 'Menghubungkan ke Supabase...' : 'Mode Offline Lokal',
    lastSynced: null
  });

  // Save changes to localStorage whenever data updates
  useEffect(() => {
    saveLocalData(data);
  }, [data]);

  // Check Supabase connection on load
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setSyncStatus({
        mode: 'offline',
        message: 'Tersimpan di Penyimpanan Lokal (Offline)',
        lastSynced: new Date().toLocaleTimeString('id-ID')
      });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSyncStatus({
          mode: 'online',
          message: 'Tersinkron Cloud Supabase',
          lastSynced: new Date().toLocaleTimeString('id-ID')
        });
      } else {
        setSyncStatus({
          mode: 'ready',
          message: 'Supabase Terhubung (Mode Tamu Lokal)',
          lastSynced: null
        });
      }
    });
  }, []);

  // Sync Action
  const triggerSync = async () => {
    setSyncStatus(prev => ({ ...prev, message: 'Menyinkronkan data...' }));
    const res = await syncWithCloud(data);
    setSyncStatus({
      mode: res.mode === 'cloud' ? 'online' : (res.mode === 'offline' ? 'offline' : 'ready'),
      message: res.message,
      lastSynced: new Date().toLocaleTimeString('id-ID')
    });
    return res;
  };

  // Profile Management
  const updateProfile = (fields) => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...fields }
    }));
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

  const completeOnboarding = ({ profile, startDayOfMonth, initialAccounts, initialBudget }) => {
    const newData = {
      ...CLEAN_DATA,
      activeSemester: Number(profile.semester) || 1,
      profile: {
        ...CLEAN_DATA.profile,
        ...profile,
        semester: Number(profile.semester) || 1
      },
      accounts: initialAccounts && initialAccounts.length > 0 ? initialAccounts : CLEAN_DATA.accounts,
      budget: {
        ...CLEAN_DATA.budget,
        startDayOfMonth: Number(startDayOfMonth) || 1,
        totalBudget: Number(initialBudget) || 1000000
      }
    };
    setData(newData);
    setIsOnboardingOpen(false);
  };

  // Financial Cycle Calculation
  const startDayOfMonth = data.budget?.startDayOfMonth || 1;
  const financialCycle = useMemo(() => {
    return getFinancialCycle(startDayOfMonth, new Date());
  }, [startDayOfMonth]);

  const setStartDayOfMonth = (newDay) => {
    const day = Number(newDay);
    setData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        startDayOfMonth: day,
        periodLabel: getFinancialCycle(day, new Date()).label
      }
    }));
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

  const totalBalance = useMemo(() => {
    return data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [data.accounts]);

  const totalBudget = data.budget?.totalBudget || 1000000;
  const remainingBudget = Math.max(0, totalBudget - cycleExpenses);
  const percentUsed = Math.min(100, Math.round((cycleExpenses / totalBudget) * 100));
  const dailyAllowance = Math.round(remainingBudget / Math.max(1, financialCycle.daysRemaining));

  // --- ACCOUNTS CRUD ---
  const addAccount = (acc) => {
    const newAccount = {
      id: `acc-${Date.now()}`,
      name: acc.name,
      type: acc.type || 'bank',
      balance: Number(acc.balance) || 0,
      isPrimary: Boolean(acc.isPrimary),
      icon: acc.icon || '💳',
      color: acc.color || '#1665D8',
      updated: 'Baru saja'
    };
    setData(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount]
    }));
  };

  const editAccount = (accId, updatedFields) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === accId ? { ...a, ...updatedFields } : a)
    }));
  };

  const deleteAccount = (accId) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== accId)
    }));
  };

  // --- TRANSACTIONS CRUD ---
  const addTransaction = (tx) => {
    const newTx = {
      id: `tx-${Date.now()}`,
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

    // Update account balances
    setData(prev => {
      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.name === tx.accountName) {
          if (tx.type === 'expense') {
            return { ...acc, balance: Math.max(0, acc.balance - newTx.amount), updated: 'Baru saja' };
          } else if (tx.type === 'income') {
            return { ...acc, balance: acc.balance + newTx.amount, updated: 'Baru saja' };
          } else if (tx.type === 'transfer') {
            return { ...acc, balance: Math.max(0, acc.balance - newTx.amount), updated: 'Baru saja' };
          }
        }
        if (tx.type === 'transfer' && acc.name === tx.toAccountName) {
          return { ...acc, balance: acc.balance + newTx.amount, updated: 'Baru saja' };
        }
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: [newTx, ...prev.transactions]
      };
    });
  };

  const deleteTransaction = (txId, rollbackBalance = true) => {
    setData(prev => {
      const targetTx = prev.transactions.find(t => t.id === txId);
      if (!targetTx) return prev;

      let updatedAccounts = prev.accounts;
      if (rollbackBalance) {
        updatedAccounts = prev.accounts.map(acc => {
          if (acc.name === targetTx.accountName) {
            if (targetTx.type === 'expense') {
              return { ...acc, balance: acc.balance + targetTx.amount };
            } else if (targetTx.type === 'income') {
              return { ...acc, balance: Math.max(0, acc.balance - targetTx.amount) };
            } else if (targetTx.type === 'transfer') {
              return { ...acc, balance: acc.balance + targetTx.amount };
            }
          }
          if (targetTx.type === 'transfer' && acc.name === targetTx.toAccountName) {
            return { ...acc, balance: Math.max(0, acc.balance - targetTx.amount) };
          }
          return acc;
        });
      }

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: prev.transactions.filter(t => t.id !== txId)
      };
    });
  };

  // Budget
  const updateBudget = (newTotal, updatedCategories) => {
    setData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        totalBudget: newTotal !== undefined ? newTotal : prev.budget.totalBudget,
        categories: updatedCategories || prev.budget.categories
      }
    }));
  };

  // --- BILLS CRUD ---
  const addBill = (bill) => {
    const newBill = {
      id: `bill-${Date.now()}`,
      ...bill,
      amount: Number(bill.amount),
      isPaid: false
    };
    setData(prev => ({
      ...prev,
      bills: [newBill, ...prev.bills]
    }));
  };

  const toggleBillPaid = (billId) => {
    setData(prev => ({
      ...prev,
      bills: prev.bills.map(b => b.id === billId ? { ...b, isPaid: !b.isPaid } : b)
    }));
  };

  const deleteBill = (billId) => {
    setData(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== billId)
    }));
  };

  // --- SAVINGS TARGETS CRUD ---
  const addSavingsTarget = (target) => {
    const newTarget = {
      id: `st-${Date.now()}`,
      ...target,
      targetAmount: Number(target.targetAmount),
      currentAmount: Number(target.currentAmount || 0),
      history: []
    };
    setData(prev => ({
      ...prev,
      savingsTargets: [newTarget, ...prev.savingsTargets]
    }));
  };

  const depositToTarget = (targetId, amount, note = 'Setoran tabungan') => {
    const depositAmount = Number(amount);
    setData(prev => ({
      ...prev,
      savingsTargets: prev.savingsTargets.map(st => {
        if (st.id === targetId) {
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
            currentAmount: st.currentAmount + depositAmount,
            history: newHistory
          };
        }
        return st;
      })
    }));
  };

  const deleteSavingsTarget = (targetId) => {
    setData(prev => ({
      ...prev,
      savingsTargets: prev.savingsTargets.filter(t => t.id !== targetId)
    }));
  };

  // --- SEMESTER & ACADEMIC TRANSITION ---
  const promoteToNextSemester = () => {
    const nextSem = activeSemester + 1;
    setData(prev => ({
      ...prev,
      activeSemester: nextSem,
      profile: {
        ...prev.profile,
        semester: nextSem
      }
    }));
    setViewSemester(nextSem);
  };

  // --- COURSES CRUD (Bound to semester) ---
  const addCourse = (course) => {
    const newCourse = {
      id: `crs-${Date.now()}`,
      semester: course.semester || viewSemester,
      ...course,
      attendance: []
    };
    setData(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse]
    }));
  };

  const deleteCourse = (courseId) => {
    setData(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== courseId),
      assignments: prev.assignments.filter(a => a.courseId !== courseId),
      courseNotes: prev.courseNotes.filter(n => n.courseId !== courseId)
    }));
  };

  const updateAttendance = (courseId, meetingNumber, status) => {
    setData(prev => ({
      ...prev,
      courses: prev.courses.map(crs => {
        if (crs.id === courseId) {
          const existingAtt = crs.attendance || [];
          const idx = existingAtt.findIndex(a => a.meeting === meetingNumber);
          let newAtt;
          if (idx >= 0) {
            newAtt = [...existingAtt];
            newAtt[idx] = { ...newAtt[idx], status };
          } else {
            newAtt = [...existingAtt, { meeting: meetingNumber, status, date: new Date().toISOString().split('T')[0] }];
          }
          return { ...crs, attendance: newAtt };
        }
        return crs;
      })
    }));
  };

  // --- ASSIGNMENTS CRUD (Bound to semester) ---
  const addAssignment = (asg) => {
    const newAsg = {
      id: `asg-${Date.now()}`,
      semester: asg.semester || viewSemester,
      ...asg,
      status: 'pending'
    };
    setData(prev => ({
      ...prev,
      assignments: [newAsg, ...prev.assignments]
    }));
  };

  const toggleAssignmentStatus = (asgId) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => {
        if (a.id === asgId) {
          const nextStatus = a.status === 'completed' ? 'pending' : 'completed';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    }));
  };

  const deleteAssignment = (asgId) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.id !== asgId)
    }));
  };

  // --- COURSE NOTES CRUD (Bound to semester) ---
  const addCourseNote = (note) => {
    const newNote = {
      id: `note-${Date.now()}`,
      semester: note.semester || viewSemester,
      ...note
    };
    setData(prev => ({
      ...prev,
      courseNotes: [newNote, ...prev.courseNotes]
    }));
  };

  const deleteCourseNote = (noteId) => {
    setData(prev => ({
      ...prev,
      courseNotes: prev.courseNotes.filter(n => n.id !== noteId)
    }));
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

  // Overall Academic Calculations (IPK Kumulatif)
  const totalCumulativeSks = useMemo(() => {
    return data.semesters.reduce((sum, s) => sum + s.totalSks, 0);
  }, [data.semesters]);

  const cumulativeGpa = useMemo(() => {
    const totalPoints = data.semesters.reduce((sum, s) => {
      return sum + s.courses.reduce((csum, c) => csum + (c.sks * c.point), 0);
    }, 0);
    return totalCumulativeSks > 0
      ? Number((totalPoints / totalCumulativeSks).toFixed(2))
      : 0.0;
  }, [data.semesters, totalCumulativeSks]);

  return (
    <AppContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        isBalanceVisible,
        setIsBalanceVisible,
        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddType,
        setQuickAddType,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isCycleModalOpen,
        setIsCycleModalOpen,
        syncStatus,
        triggerSync,
        // Onboarding & Reset
        resetToDemoData,
        resetToCleanData,
        completeOnboarding,
        updateProfile,
        // Semester System
        activeSemester,
        viewSemester,
        setViewSemester,
        promoteToNextSemester,
        // Financial cycle
        financialCycle,
        startDayOfMonth,
        setStartDayOfMonth,
        totalBalance,
        totalBudget,
        cycleExpenses,
        cycleIncome,
        remainingBudget,
        percentUsed,
        dailyAllowance,
        // Finance CRUD
        addAccount,
        editAccount,
        deleteAccount,
        addTransaction,
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
        addCourse,
        deleteCourse,
        updateAttendance,
        addAssignment,
        toggleAssignmentStatus,
        deleteAssignment,
        addCourseNote,
        deleteCourseNote,
        addSemesterCourse,
        deleteSemesterCourse
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
