# 🎓 MyKuliahLife
### *The Ultimate Student Financial & Academic Operating System*

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-1665D8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <img src="public/logo.png" alt="MyKuliahLife Logo" width="130" style="border-radius: 28px; box-shadow: 0 10px 25px rgba(22, 101, 216, 0.25);" />
</p>

---

## 📌 Tentang MyKuliahLife

Kehidupan mahasiswa sering kali dihadapkan pada dua tantangan terbesar: **akademik yang padat** (jadwal kuliah bentrok, tugas menumpuk, batas bolos presensi, target IPK) dan **finansial yang tidak terkontrol** (uang saku kiriman habis sebelum akhir bulan, lupa bayar kos, saldo tercecer di berbagai bank/e-wallet).

**MyKuliahLife** hadir sebagai platform terpadu (*all-in-one daily driver*) yang menyatukan manajemen perkuliahan dan pengelolaan finansial mahasiswa dalam satu aplikasi modern, intuitif, dan responsif. Dirancang dengan pendekatan *mobile-first* berteknologi **Progressive Web App (PWA)**, aplikasi ini dapat diakses cepat dari smartphone layaknya aplikasi native tanpa membebani memori perangkat.

---

## 🌟 Fitur & Modul Utama

```
                      ┌─────────────────────────────────────────┐
                      │             MyKuliahLife                │
                      └────────────────────┬────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴──────────────┬──────────────────┐
         ▼                  ▼                             ▼                  ▼
   💰 KEUANGAN        🎓 AKADEMIK                   📊 NILAI & IPK      🪪 PROFIL & KTM
   • Multi-Dompet     • Jadwal Kuliah & SKS         • Kalkulator IPS    • KTM Digital
   • Arus Kas Harian  • Smart Presensi & Absensi    • Simulasi IPK      • Foto Profil Lokal
   • Siklus Anggaran  • Checklist Tugas Kuliah      • Target Predikat   • Ringkasan Eksekutif
   • Pola Hari Boros  • Catatan Materi Cepat        • Transkrip Nilai   • Cloud / Mode Tamu
```

---

### 💰 1. Modul Keuangan Mahasiswa (Smart Financial OS)
Kelola seluruh aliran dana kuliah dengan visibilitas penuh tanpa ada uang yang "hilang tanpa jejak":

* **Multi-Dompet Fleksibel**:
  * Dukungan rekening bank populer: **BCA, SeaBank, Bank Mandiri, BRI, BNI, BSI, Bank Jago, CIMB Niaga**.
  * E-Wallet & Cash: **GoPay, DANA, OVO, ShopeePay, dan Uang Tunai / Cash**.
  * **Tambah Dompet Kustom Bebas**: Buat dompet atau kantong tabungan khusus dengan nama dan saldo awal sesuai kebutuhan pengguna.
* **Dual-Header Intelligence**:
  * **Arus Kas Periode**: Memantau kas masuk/keluar hari ini dan total pengeluaran pada siklus bulan berjalan.
  * **Kotak Saldo Akumulatif**: Menampilkan total likuiditas seluruh rekening dengan kartu distribusi aset yang dapat di-*swipe* (*horizontal scrollable* di smartphone).
* **Siklus Anggaran & Batas Belanja**:
  * Pengaturan tanggal awal siklus bulanan (hari gajian / tanggal kiriman orang tua).
  * Batas alokasi belanja dengan indikator *burn-rate* dan visualisasi persentase konsumsi anggaran.
* **Manajemen Tagihan & Target Tabungan**:
  * Catat tagihan rutin (uang kos, wifi, listrik, UKT semester) lengkap dengan tanggal jatuh tempo.
  * Tetapkan tujuan tabungan (beli laptop, dana darurat, liburan semester) dengan pelacak progres nominal terkumpul.
* **Laporan Keuangan & Analitik Pengeluaran Cerdas**:
  * **Donut Chart Interaktif**: Proporsi pengeluaran per kategori belanja dan per dompet.
  * **Drill-Down Riwayat Transaksi**: Klik pada kategori atau dompet untuk langsung melihat daftar mutasi transaksi lengkap beserta tanggal dan nominal.
  * **Pola Hari Terboros (Day Spending Pattern)**: Peringkat hari dalam sepekan (Senin – Minggu) dari yang paling boros (*🔥 Terboros*) hingga terhemat, membantu mahasiswa mengevaluasi kebiasaan nongkrong/belanja di akhir pekan.
  * **Komparasi 6 Bulan Terakhir**: Grafik perbandingan pengeluaran antar bulan untuk mengevaluasi tren belanja dibanding rata-rata bulanan.

---

### 🎓 2. Modul Akademik & Perkuliahan
Atur jadwal dan tanggung jawab perkuliahan agar tidak ada mata kuliah atau tugas yang terlewat:

* **Manajemen Multi-Semester**: Dukungan pemilihan dan pengelolaan semester 1 hingga 8 dengan sistem arsip terstruktur.
* **Jadwal & Mata Kuliah**:
  * Pencatatan beban SKS, nama dosen pengampu, nomor kontak dosen, ruang perkuliahan, dan jam kelas.
* **Smart Attendance Tracker (Presensi Kehadiran)**:
  * Menghitung total kehadiran perkuliahan secara *real-time*.
  * Dilengkapi batas maksimal ketidakhadiran (toleransi bolos/izin) untuk mencegah mahasiswa dicekal saat Ujian Akhir Semester (UAS).
* **Manajemen Tugas & Deadline**:
  * Checklist tugas terhubung langsung ke mata kuliah terkait.
  * Status pengerjaan (*Belum Selesai* / *Selesai*) dengan tanggal tenggat waktu yang jelas.
* **Catatan Kuliah Singkat**:
  * Ruang dokumentasi ringkasan materi, link materi kuliah, atau kisi-kisi ujian per mata kuliah tanpa perlu aplikasi catatan terpisah.

---

### 📊 3. Modul Rekap Nilai & Simulasi IPK
Pantau perkembangan prestasi akademik sejak semester awal hingga target kelulusan:

* **Kalkulator IPS (Indeks Prestasi Semester)**: Perhitungan otomatis nilai mutu berdasarkan bobot SKS dan nilai huruf mata kuliah (A, AB, B, BC, C, D, E).
* **Kalkulasi IPK Kumulatif Real-Time**: Evaluasi pencapaian akademik lintas seluruh semester yang telah ditempuh.
* **Simulasi & Target Kelulusan**: Tetapkan target IPK impian dan ketahui langsung status predikat kelulusan (*Dengan Pujian / Cum Laude*, *Sangat Memuaskan*, atau *Memuaskan*).

---

### 🪪 4. Profil Mahasiswa & KTM Digital (Privacy-First)
Identitas mahasiswa modern dengan perlindungan privasi data pribadi:

* **KTM Digital (Kartu Tanda Mahasiswa)**: Tampilan visual kartu mahasiswa elegan berisikan nama, universitas, program studi, semester aktif, dan barcode ID.
* **Foto Profil Lokal Tanpa Unggah ke Database**:
  * Pengguna dapat memasang foto profil langsung dari galeri atau kamera smartphone.
  * Foto otomatis dikompres via HTML5 Canvas (~20KB) dan **disimpan secara lokal di browser (`localStorage`)**. Foto pribadi tidak pernah dikirim ke database cloud, menghemat kuota server dan menjaga privasi pengguna 100%.
* **Executive Metrics Dashboard**:
  * Menampilkan ringkasan eksekutif: IPK Kumulatif, Beban SKS Semester Ini, Matakuliah Terdaftar, Tugas Pending, Total Likuiditas Saldo, Belanja Siklus Ini, dan Tagihan Aktif.
* **Edit Profil Terpadu**: Pembaruan biodata mahasiswa dan pergantian semester aktif dilakukan dalam satu modal ringkas.

---

### ⚡ 5. Progressive Web App (PWA) & Cloud Sync
Pengalaman pengguna kelas atas yang fleksibel di berbagai skenario:

* **PWA Universal (Installable)**: Dapat di-install ke layar utama Android, iPhone/iPad (Safari), dan Desktop (Chrome/Edge) dengan tampilan layar penuh (*standalone display*).
* **Single Master Photo Auto-Scale**: Pengaturan ikon PWA modern yang otomatis menyesuaikan 1 foto logo untuk seluruh ukuran ikon homescreen dan splash screen.
* **Supabase Cloud Sync**: Autentikasi aman dan sinkronisasi data antar perangkat dengan enkripsi *Row Level Security (RLS)* berbasis PostgreSQL.
* **Mode Tamu (Guest Mode)**: Pengguna baru dapat langsung mencoba seluruh fitur aplikasi secara offline tanpa perlu mendaftar akun terlebih dahulu.
* **Tombol Cepat / Quick Add (+)**: Floating action button untuk mencatat transaksi keuangan, tugas baru, atau catatan kuliah kapan saja hanya dalam 2 ketukan.

---

## 🏗️ Arsitektur Teknologi

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Core Framework** | React 18 & JavaScript (ESNext) | Arsitektur komponen modular dan reaktif |
| **Build Tool & Bundler** | Vite 6 | Waktu start dev instan dan optimasi bundle produksi cepat |
| **Styling** | Vanilla CSS Modern | Design tokens kustom, HSL color palette, dan zero overhead framework |
| **Database & Auth** | Supabase (PostgreSQL) | Manajemen user, otentikasi sesi, dan Row Level Security (RLS) |
| **Local Storage** | Web Storage API & Canvas | Penyimpanan offline-first dan kompresi foto avatar lokal |
| **Icons & UI Assets** | Lucide React | Ikon modern, clean, dan konsisten di seluruh aplikasi |
| **Micro-Interactions** | Canvas Confetti | Efek selebrasi interaktif saat menyelesaikan onboarding / tugas |

---

## 💻 Panduan Menjalankan Proyek (Quick Start)

### 1. Kloning Repositori
```bash
git clone https://github.com/username/MyKuliahLife.git
cd MyKuliahLife
npm install
```

### 2. Environment Setup
Buat file `.env.local` di folder utama:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Jalankan Server Dev
```bash
npm run dev
```

### 4. Build Produksi
```bash
npm run build
```

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT License**. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.

<p align="center">
  Didesain dan dikembangkan dengan ❤️ untuk membantu mahasiswa Indonesia menjalani perkuliahan yang lebih produktif dan keuangan yang lebih terarah.
</p>
