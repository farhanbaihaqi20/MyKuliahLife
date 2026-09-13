import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadLocalData, saveLocalData, syncWithCloud } from '../services/db';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { INITIAL_DATA, CLEAN_DATA } from '../constants/initialData';
import { getFinancialCycle } from '../utils/dateCycle';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(() => loadLocalData());
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'academic' | 'finance' | 'grades' | 'profile'
  const [financeSubtab, setFinanceSubtab] = useState('budget'); // 'budget' | 'history' | 'report' | 'bills' | 'targets' | 'accounts'
  const [academicTab, setAcademicTab] = useState('schedule'); // 'schedule' | 'assignments' | 'attendance' | 'notes'
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('transaction');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  // Global navigation helper that synchronizes active tab and subtab
  const navigateTo = (mainTab, subTab = null) => {
    setActiveTab(mainTab);
    if (mainTab === 'finance' && subTab) {
      setFinanceSubtab(subTab);
    } else if (mainTab === 'academic' && subTab) {
      setAcademicTab(subTab);
    }
  };

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

  const editTransaction = (txId, updatedFields) => {
    setData(prev => {
      const oldTx = prev.transactions.find(t => t.id === txId);
      if (!oldTx) return prev;

      // 1. Rollback old transaction effect on balances
      let tempAccounts = prev.accounts.map(acc => {
        let balance = acc.balance;
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

      // 2. Build updated transaction
      const newTx = {
        ...oldTx,
        ...updatedFields,
        amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : oldTx.amount)
      };

      // 3. Apply updated transaction effect on balances
      const finalAccounts = tempAccounts.map(acc => {
        let balance = acc.balance;
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

      return {
        ...prev,
        accounts: finalAccounts,
        transactions: prev.transactions.map(t => t.id === txId ? newTx : t)
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
  };

  const setCourseGrade = (courseId, letter, point) => {
    setData(prev => {
      const targetCourse = prev.courses.find(c => c.id === courseId);
      if (!targetCourse) return prev;

      const gradeObj = { letter, point: Number(point) };
      const updatedCourses = prev.courses.map(c => 
        c.id === courseId ? { ...c, grade: gradeObj } : c
      );

      const targetSemesterNum = targetCourse.semester || activeSemester;
      const semExists = prev.semesters.some(s => s.semesterNumber === targetSemesterNum);

      let updatedSemesters;
      if (semExists) {
        updatedSemesters = prev.semesters.map(s => {
          if (s.semesterNumber === targetSemesterNum) {
            const courseIdx = s.courses.findIndex(c => c.courseId === courseId || c.name === targetCourse.name);
            let newSemCourses;
            if (courseIdx >= 0) {
              newSemCourses = [...s.courses];
              newSemCourses[courseIdx] = {
                ...newSemCourses[courseIdx],
                courseId: targetCourse.id,
                name: targetCourse.name,
                sks: Number(targetCourse.sks) || 3,
                letter,
                point: Number(point)
              };
            } else {
              newSemCourses = [
                ...s.courses,
                {
                  courseId: targetCourse.id,
                  name: targetCourse.name,
                  sks: Number(targetCourse.sks) || 3,
                  letter,
                  point: Number(point)
                }
              ];
            }
            const totalSks = newSemCourses.reduce((sum, c) => sum + c.sks, 0);
            const totalPoints = newSemCourses.reduce((sum, c) => sum + (c.sks * c.point), 0);
            const ips = totalSks > 0 ? Number((totalPoints / totalSks).toFixed(2)) : 0;
            return { ...s, totalSks, ips, courses: newSemCourses };
          }
          return s;
        });
      } else {
        const initialCourse = {
          courseId: targetCourse.id,
          name: targetCourse.name,
          sks: Number(targetCourse.sks) || 3,
          letter,
          point: Number(point)
        };
        const newSem = {
          semesterNumber: targetSemesterNum,
          totalSks: initialCourse.sks,
          ips: initialCourse.point,
          courses: [initialCourse]
        };
        updatedSemesters = [...prev.semesters, newSem].sort((a, b) => a.semesterNumber - b.semesterNumber);
      }

      return {
        ...prev,
        courses: updatedCourses,
        semesters: updatedSemesters
      };
    });
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

  const editAssignment = (asgId, updatedFields) => {
    setData(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => a.id === asgId ? { ...a, ...updatedFields } : a)
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

  const editCourseNote = (noteId, updatedFields) => {
    setData(prev => ({
      ...prev,
      courseNotes: prev.courseNotes.map(n => n.id === noteId ? { ...n, ...updatedFields } : n)
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
        seen.add(rc.name.toLowerCase());
        const match = recCourses.find(
          ec => (ec.courseId && ec.courseId === rc.id) || ec.name.toLowerCase() === rc.name.toLowerCase()
        );
        const hasGrade = Boolean(rc.grade?.letter || match?.letter);
        const letter = rc.grade?.letter || match?.letter || 'E';
        const point = rc.grade?.point !== undefined ? Number(rc.grade.point) : (match?.point !== undefined ? Number(match.point) : 0);

        merged.push({
          id: rc.id,
          courseId: rc.id,
          name: rc.name,
          code: rc.code || 'MK',
          sks: Number(rc.sks) || 3,
          lecturer: rc.lecturer,
          room: rc.room,
          dayOfWeek: rc.dayOfWeek,
          time: `${rc.startTime || ''} - ${rc.endTime || ''}`,
          color: rc.color,
          semester: semNum,
          isFromCourses: true,
          isGraded: hasGrade,
          letter,
          point
        });
      });

      recCourses.forEach(ec => {
        if (!seen.has(ec.name.toLowerCase())) {
          seen.add(ec.name.toLowerCase());
          merged.push({
            id: ec.courseId || `ec-${ec.name}`,
            courseId: ec.courseId,
            name: ec.name,
            code: ec.code || 'MK',
            sks: Number(ec.sks) || 3,
            semester: semNum,
            isFromCourses: false,
            isGraded: true,
            letter: ec.letter || 'E',
            point: Number(ec.point) || 0
          });
        }
      });

      const totalSks = merged.reduce((sum, c) => sum + c.sks, 0);
      const graded = merged.filter(c => c.isGraded);
      const gradedSks = graded.reduce((sum, c) => sum + c.sks, 0);
      const gradedPoints = graded.reduce((sum, c) => sum + (c.sks * c.point), 0);
      const ips = gradedSks > 0 ? Number((gradedPoints / gradedSks).toFixed(2)) : null;

      return {
        semesterNumber: semNum,
        courses: merged,
        totalSks,
        gradedCourses: graded,
        gradedSks,
        gradedPoints,
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
        deleteSemesterCourse
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
