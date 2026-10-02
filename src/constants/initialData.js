export const DEFAULT_BUDGET_CATEGORIES = [
  { id: 'cat-1', name: 'Makanan & minuman', icon: '🍜', percentage: 35, color: '#F97316' },
  { id: 'cat-2', name: 'Tagihan & utilitas', icon: '⚡', percentage: 25, color: '#3B82F6' },
  { id: 'cat-3', name: 'Kebutuhan Pribadi & Skincare', icon: '🧴', percentage: 15, color: '#EC4899' },
  { id: 'cat-4', name: 'Transport & Bensin', icon: '🛵', percentage: 12, color: '#10B981' },
  { id: 'cat-5', name: 'Kebutuhan Kuliah & Print', icon: '📚', percentage: 8, color: '#8B5CF6' },
  { id: 'cat-6', name: 'Hiburan & Jajan', icon: '☕', percentage: 5, color: '#F43F5E' }
];

export const normalizeCategoryName = (catName) => {
  if (!catName || typeof catName !== 'string') return catName || 'Makanan & minuman';
  const lower = catName.trim().toLowerCase();
  if (lower === 'transportasi') return 'Transport & Bensin';
  if (lower === 'hiburan & nongkrong' || lower === 'hiburan & ngopi') return 'Hiburan & Jajan';
  if (lower === 'kost & tagihan') return 'Tagihan & utilitas';
  if (lower === 'pendidikan & kuliah') return 'Kebutuhan Kuliah & Print';
  return catName.trim();
};

export const normalizeBudgetCategories = (categories, totalBudget = 1000000) => {
  const tot = Number(totalBudget) > 0 ? Number(totalBudget) : 1000000;
  if (!Array.isArray(categories) || categories.length === 0) {
    return DEFAULT_BUDGET_CATEGORIES.map(c => ({
      ...c,
      budget: Math.round((tot * c.percentage) / 100)
    }));
  }

  // 1. Normalisasi nama kategori lama
  let list = categories.map(c => {
    const normName = normalizeCategoryName(c.name);
    const def = DEFAULT_BUDGET_CATEGORIES.find(d => d.name.toLowerCase() === normName.toLowerCase());
    return {
      ...c,
      name: normName,
      icon: c.icon || def?.icon || '🏷️',
      color: c.color || def?.color || '#1665D8',
      percentage: Number(c.percentage) || (def?.percentage ?? 15)
    };
  });

  // Hapus duplikat nama jika ada
  const seen = new Set();
  list = list.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 2. Pastikan 6 kategori inti selalu ada
  DEFAULT_BUDGET_CATEGORIES.forEach(def => {
    const exists = list.some(c => c.name.toLowerCase() === def.name.toLowerCase());
    if (!exists) {
      list.push({
        id: def.id,
        name: def.name,
        icon: def.icon,
        percentage: def.percentage,
        color: def.color,
        budget: Math.round((tot * def.percentage) / 100)
      });
    }
  });

  // 3. Pastikan urutan rapi dan persentase seimbang 100%
  const currentSum = list.reduce((s, c) => s + (Number(c.percentage) || 0), 0);
  if (currentSum > 0 && currentSum !== 100) {
    let remainder = 100;
    list = list.map((c, i) => {
      if (i === list.length - 1) {
        const pct = Math.max(0, remainder);
        return {
          ...c,
          percentage: pct,
          budget: Math.round((tot * pct) / 100)
        };
      }
      const pct = Math.round(((Number(c.percentage) || 0) / currentSum) * 100);
      remainder -= pct;
      return {
        ...c,
        percentage: pct,
        budget: Math.round((tot * pct) / 100)
      };
    });
  } else {
    list = list.map(c => ({
      ...c,
      budget: Number(c.budget) || Math.round((tot * (Number(c.percentage) || 0)) / 100)
    }));
  }

  return list;
};

export const INITIAL_DATA = {
  activeSemester: 1,
  profile: {
    fullName: "Mahasiswa Demo",
    email: "demo@mahasiswa.id",
    university: "Universitas Indonesia",
    major: "Teknik Informatika",
    semester: 1,
    targetGpa: 3.80,
    isPremium: true
  },

  accounts: [
    { id: "acc-1", name: "Dompet Utama (Cash)", type: "cash", balance: 150000, isPrimary: true, icon: "💵", color: "#10B981", updated: "Baru saja" },
    { id: "acc-2", name: "Rekening Bank", type: "bank", balance: 500000, isPrimary: false, icon: "🏦", color: "#0077FF", updated: "Baru saja" },
    { id: "acc-3", name: "E-Wallet", type: "ewallet", balance: 100000, isPrimary: false, icon: "📱", color: "#00AED6", updated: "Baru saja" }
  ],

  budget: {
    startDayOfMonth: 1,
    periodLabel: "1 Sep - 30 Sep 2026",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    totalBudget: 1500000,
    categories: [
      { id: "cat-1", name: "Makanan & minuman", percentage: 35, budget: 500000, icon: "🍜", color: "#F97316" },
      { id: "cat-2", name: "Tagihan & utilitas", percentage: 25, budget: 300000, icon: "⚡", color: "#3B82F6" },
      { id: "cat-3", name: "Kebutuhan Pribadi & Skincare", percentage: 15, budget: 250000, icon: "🧴", color: "#EC4899" },
      { id: "cat-4", name: "Transport & Bensin", percentage: 12, budget: 200000, icon: "🛵", color: "#10B981" },
      { id: "cat-5", name: "Kebutuhan Kuliah & Print", percentage: 8, budget: 150000, icon: "📚", color: "#8B5CF6" },
      { id: "cat-6", name: "Hiburan & Jajan", percentage: 5, budget: 100000, icon: "☕", color: "#F43F5E" }
    ]
  },

  transactions: [
    {
      id: "tx-demo-1",
      date: "2026-09-12",
      type: "expense",
      category: "Makanan & minuman",
      amount: 25000,
      accountName: "Dompet Utama (Cash)",
      merchant: "Kantin Kampus",
      note: "Makan siang",
      icon: "🍜"
    },
    {
      id: "tx-demo-2",
      date: "2026-09-11",
      type: "expense",
      category: "Kebutuhan Kuliah & Print",
      amount: 15000,
      accountName: "Dompet Utama (Cash)",
      merchant: "Fotokopi & Print Kampus",
      note: "Print modul materi kuliah",
      icon: "📚"
    },
    {
      id: "tx-demo-3",
      date: "2026-09-10",
      type: "expense",
      category: "Transport & Bensin",
      amount: 30000,
      accountName: "E-Wallet",
      merchant: "SPBU Pertamina",
      note: "Beli bensin motor",
      icon: "🛵"
    },
    {
      id: "tx-demo-4",
      date: "2026-09-08",
      type: "expense",
      category: "Kebutuhan Pribadi & Skincare",
      amount: 45000,
      accountName: "Rekening Bank",
      merchant: "Minimarket Kampus",
      note: "Sabun mandi & perlengkapan harian",
      icon: "🧴"
    }
  ],

  bills: [
    {
      id: "bill-1",
      title: "Uang Kost Bulanan",
      amount: 850000,
      dueDate: "2026-09-25",
      category: "Kost & Rumah",
      recurrence: "Bulanan",
      isPaid: false,
      icon: "🏠"
    },
    {
      id: "bill-2",
      title: "Wi-Fi Kost Bersama",
      amount: 50000,
      dueDate: "2026-09-18",
      category: "Internet",
      recurrence: "Bulanan",
      isPaid: false,
      icon: "📶"
    },
    {
      id: "bill-3",
      title: "Spotify Premium Mahasiswa",
      amount: 27500,
      dueDate: "2026-09-20",
      category: "Langganan",
      recurrence: "Bulanan",
      isPaid: true,
      icon: "🎧"
    },
    {
      id: "bill-4",
      title: "UKT Kuliah Semester 5",
      amount: 4500000,
      dueDate: "2026-08-30",
      category: "Pendidikan",
      recurrence: "Semesteran",
      isPaid: true,
      icon: "🎓"
    }
  ],

  savingsTargets: [
    {
      id: "st-1",
      title: "Laptop Spek Coding & Skripsi",
      targetAmount: 14000000,
      currentAmount: 8500000,
      deadline: "2026-12-15",
      category: "Peralatan Kuliah",
      icon: "💻",
      history: [
        { id: "sh-1", amount: 500000, date: "2026-09-10", note: "Sisa uang saku minggu lalu" },
        { id: "sh-2", amount: 1000000, date: "2026-09-01", note: "Hasil freelance web project" }
      ]
    },
    {
      id: "st-2",
      title: "Biaya Sertifikasi Cloud & Wisuda",
      targetAmount: 3000000,
      currentAmount: 1250000,
      deadline: "2027-02-28",
      category: "Karier",
      icon: "🎓",
      history: [
        { id: "sh-3", amount: 250000, date: "2026-09-05", note: "Tabungan rutin awal bulan" }
      ]
    },
    {
      id: "st-3",
      title: "Dana Darurat Mahasiswa",
      targetAmount: 2000000,
      currentAmount: 1800000,
      deadline: "2026-10-30",
      category: "Darurat",
      icon: "🛡️",
      history: [
        { id: "sh-4", amount: 300000, date: "2026-08-28", note: "Jaga-jaga service motor" }
      ]
    }
  ],

  debts: [
    {
      id: "debt-demo-1",
      type: "receivable",
      personName: "Dimas (Teman Sekelas)",
      personAvatar: "🧑‍💻",
      description: "Pinjam buat bayar fotokopi modul & kas kelas",
      totalAmount: 50000,
      remainingAmount: 20000,
      accountName: "Dompet Utama (Cash)",
      createdDate: "2026-09-20",
      dueDate: "2026-10-10",
      status: "active",
      settledDate: null,
      affectsBalance: true,
      payments: [
        {
          id: "dp-demo-1",
          amount: 30000,
          date: "2026-09-28",
          accountName: "Dompet Utama (Cash)",
          note: "Dicicil separuh dulu"
        }
      ]
    },
    {
      id: "debt-demo-2",
      type: "payable",
      personName: "Warung Bu Siti",
      personAvatar: "🍲",
      description: "Kasbon makan siang pas dompet ketinggalan",
      totalAmount: 25000,
      remainingAmount: 25000,
      accountName: "Dompet Utama (Cash)",
      createdDate: "2026-09-25",
      dueDate: "2026-10-05",
      status: "active",
      settledDate: null,
      affectsBalance: false,
      payments: []
    }
  ],

  courses: [
    {
      id: "crs-1",
      code: "IF3101",
      name: "Pemrograman Web Lanjut",
      sks: 3,
      lecturer: "Dr. Ir. Hendra Gunawan, M.T.",
      room: "Lab Komputer 3 (Gedung B)",
      dayOfWeek: "Senin",
      startTime: "08:00",
      endTime: "10:30",
      color: "#1665D8",
      attendance: [
        { meeting: 1, status: "present", date: "2026-08-25" },
        { meeting: 2, status: "present", date: "2026-09-01" },
        { meeting: 3, status: "present", date: "2026-09-08" },
        { meeting: 4, status: "pending", date: "2026-09-15" }
      ]
    },
    {
      id: "crs-2",
      code: "IF3102",
      name: "Rekayasa Perangkat Lunak",
      sks: 3,
      lecturer: "Prof. Maya Anggraini, Ph.D",
      room: "Ruang Teori 401",
      dayOfWeek: "Selasa",
      startTime: "10:00",
      endTime: "12:30",
      color: "#059669",
      attendance: [
        { meeting: 1, status: "present", date: "2026-08-26" },
        { meeting: 2, status: "sick", date: "2026-09-02" },
        { meeting: 3, status: "present", date: "2026-09-09" }
      ]
    },
    {
      id: "crs-3",
      code: "IF3103",
      name: "Basis Data Lanjutan",
      sks: 3,
      lecturer: "Ahmad Fauzi, M.Kom",
      room: "Lab Basis Data (Lt. 2)",
      dayOfWeek: "Rabu",
      startTime: "13:00",
      endTime: "15:30",
      color: "#D97706",
      attendance: [
        { meeting: 1, status: "present", date: "2026-08-27" },
        { meeting: 2, status: "present", date: "2026-09-03" },
        { meeting: 3, status: "permission", date: "2026-09-10" }
      ]
    },
    {
      id: "crs-4",
      code: "IF3104",
      name: "Kecerdasan Buatan (AI)",
      sks: 3,
      lecturer: "Siti Rahmawati, Ph.D",
      room: "Ruang Seminar 202",
      dayOfWeek: "Kamis",
      startTime: "09:00",
      endTime: "11:30",
      color: "#7C3AED",
      attendance: [
        { meeting: 1, status: "present", date: "2026-08-28" },
        { meeting: 2, status: "present", date: "2026-09-04" },
        { meeting: 3, status: "present", date: "2026-09-11" }
      ]
    },
    {
      id: "crs-5",
      code: "IF3105",
      name: "Manajemen Proyek TI",
      sks: 2,
      lecturer: "Budi Santoso, S.T., M.T.",
      room: "Ruang Teori 105",
      dayOfWeek: "Jumat",
      startTime: "13:30",
      endTime: "15:30",
      color: "#DB2777",
      attendance: [
        { meeting: 1, status: "present", date: "2026-08-29" },
        { meeting: 2, status: "present", date: "2026-09-05" },
        { meeting: 3, status: "present", date: "2026-09-12" }
      ]
    }
  ],

  assignments: [
    {
      id: "asg-1",
      courseId: "crs-1",
      courseName: "Pemrograman Web Lanjut",
      title: "Integrasi REST API & Autentikasi JWT",
      description: "Buat modul auth menggunakan JWT dan endpoint CRUD data mahasiswa.",
      deadline: "2026-09-15T23:59:00",
      priority: "high",
      status: "in_progress"
    },
    {
      id: "asg-2",
      courseId: "crs-2",
      courseName: "Rekayasa Perangkat Lunak",
      title: "Dokumen SRS & Diagram Use Case",
      description: "Lengkapi bab 2 analisis kebutuhan fungsional dan non-fungsional aplikasi.",
      deadline: "2026-09-14T17:00:00",
      priority: "high",
      status: "pending"
    },
    {
      id: "asg-3",
      courseId: "crs-3",
      courseName: "Basis Data Lanjutan",
      title: "Optimasi Query Indexing & Sharding",
      description: "Jalankan EXPLAIN ANALYZE pada tabel 500k data dan laporkan execution time.",
      deadline: "2026-09-18T23:59:00",
      priority: "medium",
      status: "pending"
    },
    {
      id: "asg-4",
      courseId: "crs-4",
      courseName: "Kecerdasan Buatan (AI)",
      title: "Implementasi Algoritma A* Pathfinding",
      description: "Simulasi pencarian rute terpendek graf peta kampus dengan bobot jarak.",
      deadline: "2026-09-10T23:59:00",
      priority: "low",
      status: "completed"
    }
  ],

  courseNotes: [
    {
      id: "note-1",
      courseId: "crs-1",
      courseName: "Pemrograman Web Lanjut",
      weekNumber: 3,
      topic: "State Management & React Context vs Redux",
      content: "Context API cocok untuk aplikasi skala kecil-menengah tanpa overhead boilerplate yang berlebihan. Pastikan memecah context menjadi logical chunks agar tidak re-render seluruh tree.",
      materialUrl: "https://drive.google.com/drive/folders/dummy-materi-web"
    },
    {
      id: "note-2",
      courseId: "crs-2",
      courseName: "Rekayasa Perangkat Lunak",
      weekNumber: 2,
      topic: "Agile Scrum & User Stories Framework",
      content: "Format User Story: As a [user type], I want [feature] so that [business value]. Acceptance criteria harus spesifik dan dapat diuji secara terukur.",
      materialUrl: "https://drive.google.com/drive/folders/dummy-materi-rpl"
    },
    {
      id: "note-3",
      courseId: "crs-4",
      courseName: "Kecerdasan Buatan (AI)",
      weekNumber: 3,
      topic: "Heuristic Search & Admissible Function",
      content: "Fungsi heuristik h(n) dikatakan admissible bila tidak pernah melebih-lebihkan (overestimate) biaya sesungguhnya menuju goal state.",
      materialUrl: ""
    }
  ],

  semesters: [
    {
      semesterNumber: 1,
      ips: 3.75,
      totalSks: 20,
      courses: [
        { name: "Algoritma & Pemrograman 1", sks: 4, letter: "A", point: 4.0 },
        { name: "Kalkulus Informatika 1", sks: 3, letter: "B+", point: 3.5 },
        { name: "Matematika Diskrit", sks: 3, letter: "A", point: 4.0 },
        { name: "Pengantar Teknologi Informasi", sks: 2, letter: "A", point: 4.0 },
        { name: "Bahasa Inggris Akademik", sks: 2, letter: "A", point: 4.0 },
        { name: "Pancasila & Kewarganegaraan", sks: 2, letter: "A", point: 4.0 },
        { name: "Fisika Dasar", sks: 4, letter: "B", point: 3.0 }
      ]
    },
    {
      semesterNumber: 2,
      ips: 3.82,
      totalSks: 22,
      courses: [
        { name: "Struktur Data & Algoritma", sks: 4, letter: "A", point: 4.0 },
        { name: "Kalkulus Informatika 2", sks: 3, letter: "A-", point: 3.75 },
        { name: "Organisasi Sistem Komputer", sks: 3, letter: "B+", point: 3.5 },
        { name: "Aljabar Linear & Matriks", sks: 3, letter: "A", point: 4.0 },
        { name: "Pemrograman Berorientasi Objek", sks: 4, letter: "A", point: 4.0 },
        { name: "Statistika & Probabilitas", sks: 3, letter: "A", point: 4.0 },
        { name: "Bahasa Indonesia", sks: 2, letter: "A", point: 4.0 }
      ]
    },
    {
      semesterNumber: 3,
      ips: 3.90,
      totalSks: 22,
      courses: [
        { name: "Sistem Operasi", sks: 3, letter: "A", point: 4.0 },
        { name: "Basis Data", sks: 4, letter: "A", point: 4.0 },
        { name: "Jaringan Komputer", sks: 3, letter: "A", point: 4.0 },
        { name: "Interaksi Manusia & Komputer", sks: 3, letter: "A", point: 4.0 },
        { name: "Analisis & Desain Algoritma", sks: 3, letter: "A-", point: 3.75 },
        { name: "Metode Numerik", sks: 3, letter: "A", point: 4.0 },
        { name: "Etika Profesi & Hukum Siber", sks: 3, letter: "A", point: 4.0 }
      ]
    },
    {
      semesterNumber: 4,
      ips: 3.79,
      totalSks: 21,
      courses: [
        { name: "Pemrograman Web Dasar", sks: 3, letter: "A", point: 4.0 },
        { name: "Sistem Terdistribusi", sks: 3, letter: "B+", point: 3.5 },
        { name: "Teori Bahasa & Otomata", sks: 3, letter: "A-", point: 3.75 },
        { name: "Keamanan Sistem & Jaringan", sks: 3, letter: "A", point: 4.0 },
        { name: "Data Warehouse & Mining", sks: 3, letter: "A", point: 4.0 },
        { name: "Pengolahan Citra Digital", sks: 3, letter: "B+", point: 3.5 },
        { name: "Riset Teknologi Informasi", sks: 3, letter: "A", point: 4.0 }
      ]
    }
  ],
  fuelLogs: [
    {
      id: "fl-1",
      date: "2026-09-05",
      fuelType: "pertalite",
      amount: 42000,
      liters: 4.2,
      pricePerLiter: 10000,
      station: "SPBU Pertamina Ketintang",
      odometer: 14250,
      tankLevel: 100,
      note: "Isi penuh setelah kuliah"
    },
    {
      id: "fl-2",
      date: "2026-09-12",
      fuelType: "pertalite",
      amount: 40000,
      liters: 4.0,
      pricePerLiter: 10000,
      station: "SPBU Pertamina Ngagel",
      odometer: 14420,
      tankLevel: 100,
      note: "Isi bensin mingguan"
    },
    {
      id: "fl-3",
      date: "2026-09-19",
      fuelType: "pertamax_90",
      amount: 50000,
      liters: 3.135,
      pricePerLiter: 15950,
      station: "SPBU Pertamina Manyar",
      odometer: 14595,
      tankLevel: 85,
      note: "Coba Pertamax biar lebih enteng"
    }
  ],
  fuelSettings: {
    motorName: "Honda Beat Deluxe",
    motorType: "Matic",
    tankCapacity: 4.2,
    currentTankLevel: 65,
    currentOdometer: 14640,
    provinceSlug: "jawa-timur",
    provinceName: "Jawa Timur",
    lastPriceSync: null,
    fuelPrices: {
      pertalite: 10000,
      pertamax_90: 15950,
      pertamax_green: 19150,
      pertamax_turbo: 19600
    }
  }
};

export const CLEAN_DATA = {
  activeSemester: 1,
  profile: {
    fullName: "",
    email: "",
    university: "",
    major: "",
    semester: 1,
    targetGpa: 3.80,
    isPremium: true
  },
  accounts: [
    { id: "acc-clean-1", name: "Tunai / Dompet Utama", type: "cash", balance: 0, isPrimary: true, icon: "💵", color: "#10B981", updated: "Baru dibuat" }
  ],
  budget: {
    startDayOfMonth: 1,
    periodLabel: "1 Sep - 30 Sep 2026",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    totalBudget: 1000000,
    categories: [
      { id: "cat-1", name: "Makanan & minuman", percentage: 35, budget: 350000, icon: "🍜", color: "#F97316" },
      { id: "cat-2", name: "Tagihan & utilitas", percentage: 25, budget: 250000, icon: "⚡", color: "#3B82F6" },
      { id: "cat-3", name: "Kebutuhan Pribadi & Skincare", percentage: 15, budget: 150000, icon: "🧴", color: "#EC4899" },
      { id: "cat-4", name: "Transport & Bensin", percentage: 12, budget: 120000, icon: "🛵", color: "#10B981" },
      { id: "cat-5", name: "Kebutuhan Kuliah & Print", percentage: 8, budget: 80000, icon: "📚", color: "#8B5CF6" },
      { id: "cat-6", name: "Hiburan & Jajan", percentage: 5, budget: 50000, icon: "☕", color: "#F43F5E" }
    ]
  },
  transactions: [],
  bills: [],
  savingsTargets: [],
  debts: [],
  courses: [],
  assignments: [],
  courseNotes: [],
  semesters: [],
  fuelLogs: [],
  fuelSettings: {
    motorName: "Motor Saya",
    motorType: "Matic",
    tankCapacity: 4.2,
    currentTankLevel: 50,
    currentOdometer: 0,
    provinceSlug: "jawa-timur",
    provinceName: "Jawa Timur",
    lastPriceSync: null,
    fuelPrices: {
      pertalite: 10000,
      pertamax_90: 15950,
      pertamax_green: 19150,
      pertamax_turbo: 19600
    }
  }
};
