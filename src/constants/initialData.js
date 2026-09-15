export const INITIAL_DATA = {
  activeSemester: 5,
  profile: {
    fullName: "Han (Farhan)",
    email: "farhan.student@kampus.ac.id",
    university: "Universitas Indonesia",
    major: "Teknik Informatika",
    semester: 5,
    targetGpa: 3.85,
    isPremium: true
  },

  accounts: [
    { id: "acc-1", name: "Sea Bank", type: "bank", balance: 5313358, isPrimary: true, icon: "🌊", color: "#0077FF", updated: "12 Sep 20:31" },
    { id: "acc-2", name: "Krom Bank", type: "bank", balance: 1000000, isPrimary: false, icon: "🏦", color: "#6366F1", updated: "09 Sep 11:10" },
    { id: "acc-3", name: "GoPay", type: "ewallet", balance: 544476, isPrimary: false, icon: "📱", color: "#00AED6", updated: "11 Sep 21:00" },
    { id: "acc-4", name: "Cash", type: "cash", balance: 181000, isPrimary: false, icon: "💵", color: "#10B981", updated: "12 Sep 01:03" },
    { id: "acc-5", name: "DANA", type: "ewallet", balance: 69000, isPrimary: false, icon: "💳", color: "#118EEA", updated: "11 Sep 21:00" },
    { id: "acc-6", name: "ShopeePay", type: "ewallet", balance: 8556, isPrimary: false, icon: "🛍️", color: "#EE4D2D", updated: "09 Sep 09:08" }
  ],

  budget: {
    startDayOfMonth: 5,
    periodLabel: "5 Sep - 4 Oct 2026",
    startDate: "2026-09-05",
    endDate: "2026-10-04",
    totalBudget: 850000,
    categories: [
      { id: "cat-1", name: "Makanan & minuman", budget: 320000, icon: "🍜", color: "#F97316" },
      { id: "cat-2", name: "Tagihan & utilitas", budget: 480000, icon: "🧾", color: "#3B82F6" },
      { id: "cat-3", name: "Kebutuhan Kuliah & Print", budget: 100000, icon: "📚", color: "#8B5CF6" },
      { id: "cat-4", name: "Transport & Bensin", budget: 150000, icon: "🛵", color: "#10B981" },
      { id: "cat-5", name: "Hiburan & Jajan", budget: 50000, icon: "☕", color: "#EC4899" }
    ]
  },

  transactions: [
    {
      id: "tx-1",
      date: "2026-09-12",
      type: "expense",
      category: "Makanan & minuman",
      amount: 30000,
      accountName: "Sea Bank",
      merchant: "Pasar Kouta",
      note: "galon + jajan",
      icon: "🍜"
    },
    {
      id: "tx-2",
      date: "2026-09-12",
      type: "expense",
      category: "Makanan & minuman",
      amount: 11000,
      accountName: "Sea Bank",
      merchant: "bu Yayuk",
      note: "sarapan pagi",
      icon: "🍜"
    },
    {
      id: "tx-3",
      date: "2026-09-12",
      type: "expense",
      category: "Makanan & minuman",
      amount: 17500,
      accountName: "Sea Bank",
      merchant: "az zahra",
      note: "nasi ayam geprek",
      icon: "🍜"
    },
    {
      id: "tx-4",
      date: "2026-09-12",
      type: "expense",
      category: "Makanan & minuman",
      amount: 15000,
      accountName: "Cash",
      merchant: "Warung Bu Yayuk",
      note: "Nasgor Mawut",
      icon: "🍜"
    },
    {
      id: "tx-5",
      date: "2026-09-11",
      type: "expense",
      category: "Makanan & minuman",
      amount: 18000,
      accountName: "Cash",
      merchant: "kantin rektorat",
      note: "makan siang bareng teman",
      icon: "🍜"
    },
    {
      id: "tx-6",
      date: "2026-09-11",
      type: "expense",
      category: "Makanan & minuman",
      amount: 6000,
      accountName: "Cash",
      merchant: "az Zahra",
      note: "roti coklat sore",
      icon: "🍞"
    },
    {
      id: "tx-7",
      date: "2026-09-11",
      type: "expense",
      category: "Makanan & minuman",
      amount: 13000,
      accountName: "Cash",
      merchant: "Warung Bu Yayuk",
      note: "es teh + batagor",
      icon: "🍜"
    },
    {
      id: "tx-8",
      date: "2026-09-10",
      type: "expense",
      category: "Makanan & minuman",
      amount: 4000,
      accountName: "GoPay",
      merchant: "kantin rektorat",
      note: "air mineral",
      icon: "🍜"
    },
    {
      id: "tx-9",
      date: "2026-09-10",
      type: "expense",
      category: "Makanan & minuman",
      amount: 21000,
      accountName: "Sea Bank",
      merchant: "kantin rektorat",
      note: "nasi rames komplit",
      icon: "🍜"
    },
    {
      id: "tx-10",
      date: "2026-09-09",
      type: "income",
      category: "Transfer Masuk",
      amount: 5400000,
      accountName: "Sea Bank",
      merchant: "Kiriman Ortu",
      note: "Uang bulanan + persiapan tugas akhir",
      icon: "💰"
    },
    {
      id: "tx-11",
      date: "2026-09-08",
      type: "expense",
      category: "Tagihan & utilitas",
      amount: 30120,
      accountName: "Sea Bank",
      merchant: "PLN / Token",
      note: "Listrik kamar kost",
      icon: "⚡"
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
  ]
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
      { id: "cat-1", name: "Makanan & minuman", budget: 400000, icon: "🍜", color: "#F97316" },
      { id: "cat-2", name: "Tagihan & utilitas", budget: 300000, icon: "🧾", color: "#3B82F6" },
      { id: "cat-3", name: "Kebutuhan Kuliah & Print", budget: 150000, icon: "📚", color: "#8B5CF6" },
      { id: "cat-4", name: "Transport & Bensin", budget: 100000, icon: "🛵", color: "#10B981" },
      { id: "cat-5", name: "Hiburan & Jajan", budget: 50000, icon: "☕", color: "#EC4899" }
    ]
  },
  transactions: [],
  bills: [],
  savingsTargets: [],
  courses: [],
  assignments: [],
  courseNotes: [],
  semesters: []
};
