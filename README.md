# 🎓 MyKuliahLife — Student Financial & Academic OS

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-1665D8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **MyKuliahLife** adalah *all-in-one operating system* berbasis web (PWA) yang dirancang khusus untuk mahasiswa Indonesia dalam mengelola **perkuliahan, jadwal & IPK** sekaligus **arus kas, dompet digital, anggaran bulanan, dan tabungan** dalam satu aplikasi yang intuitif, cepat, dan mobile-first.

---

## 🌟 Fitur Unggulan

### 1. 🎓 Academic Life Management
* **Multi-Semester Tracker**: Pengelolaan semester aktif 1 hingga 8 dengan sistem arsip terstruktur.
* **Mata Kuliah & Jadwal**: Pencatatan SKS, nama dosen, ruang kelas, jadwal hari & jam kuliah.
* **Presensi & Batas Kehadiran**: Pelacakan absensi dengan peringatan otomatis agar tidak melebihi batas toleransi bolos kuliah.
* **Tugas & Deadline**: Daftar tugas kuliah dengan tag mata kuliah, tanggal jatuh tempo, dan status pengerjaan.
* **Catatan Kuliah Cepat**: Dokumentasi ringkasan materi atau catatan penting per mata kuliah.
* **Rekap Nilai & Simulasi IPK**: Perhitungan IPS (Indeks Prestasi Semester) dan IPK Kumulatif otomatis lengkap dengan target nilai dan predikat kelulusan (*Cum Laude, Sangat Memuaskan, Memuaskan*).

### 2. 💳 Smart Financial OS
* **Multi-Dompet Fleksibel**: Dukungan penuh rekening bank (BCA, Mandiri, BRI, BNI, BSI, Bank Jago, SeaBank, CIMB Niaga, dll), dompet digital (GoPay, DANA, OVO, ShopeePay), uang tunai (Cash), serta pembuatan **Dompet Kustom** bebas nama dan saldo awal.
* **Dual Header Intelligence**:
  * **Arus Kas Periode**: Memantau perputaran kas harian dan akumulasi pengeluaran pada siklus bulan aktif.
  * **Kotak Saldo Akumulatif**: Rincian total likuiditas seluruh dompet beserta persentase distribusinya (dapat digeser halus / *horizontal scroll* di perangkat mobile).
* **Anggaran & Burn Rate**: Pengaturan tanggal gajian/kiriman bulanan serta batas budget belanja dengan visual progress bar.
* **Tagihan & Target Tabungan**: Manajemen tagihan rutin mahasiswa (kos, wifi, UKT) dan *goals tracker* tabungan impian.
* **Laporan Keuangan Interaktif**:
  * Donut chart interaktif per kategori belanja dan per dompet/rekening.
  * *Drill-down modal*: Klik kategori atau hari tertentu untuk meninjau seluruh riwayat transaksi detail.
  * **Tab Pola Hari**: Mengurutkan hari dalam sepekan dari yang paling boros (*🔥 Terboros*) hingga terhemat.
  * **Komparasi 6 Bulan**: Evaluasi tren pengeluaran bulanan dibanding rata-rata pengeluaran sebelumnya.

### 3. 🪪 KTM Digital & Privasi Foto Lokal
* Kartu Tanda Mahasiswa (KTM) interaktif dengan barcode ID mahasiswa.
* Pengguna dapat memasang foto profil langsung dari kamera atau galeri handphone. Foto dikompres otomatis via HTML5 Canvas (~20KB) dan **disimpan murni di `localStorage` browser masing-masing tanpa diunggah ke database**, menjaga privasi dan menghemat kuota server.

### 4. ⚡ PWA & Offline Support
* Dapat di-install langsung di layar utama smartphone (*Add to Home Screen*) layaknya aplikasi *native* Android / iOS.
* Dilengkapi *fallback* penyimpanan lokal (`localStorage`) dan **Mode Tamu (Guest Mode)** untuk langsung mencoba aplikasi tanpa perlu login.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite 6, Vanilla CSS (Design Tokens & HSL palette modern).
* **Icons**: Lucide React.
* **Animations & FX**: Canvas Confetti.
* **Backend & Database**: Supabase (PostgreSQL, GoTrue Auth, Row Level Security).
* **PWA**: Web App Manifest (`manifest.json`), Apple Touch Icon, meta theme tags.

---

## 🚀 Memulai (Local Development)

### 1. Prasyarat
* [Node.js](https://nodejs.org/) versi 18.0 atau yang lebih baru.
* Akun [Supabase](https://supabase.com/) (gratis).

### 2. Kloning & Instalasi Dependensi
```bash
git clone https://github.com/username/MyKuliahLife.git
cd MyKuliahLife
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root folder proyek:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Inisialisasi Database Supabase
Jalankan file SQL migrasi yang tersedia di folder `supabase/migrations/`:
1. Buka dashboard Supabase project Anda -> **SQL Editor**.
2. Salin seluruh isi file [`supabase/migrations/20260913073430_fresh_init_schema.sql`](supabase/migrations/20260913073430_fresh_init_schema.sql).
3. Klik **Run** untuk membuat semua tabel, indeks relasional, trigger sinkronisasi akun, dan aturan keamanan RLS (*Row Level Security*).

### 5. Menjalankan Server Lokal
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173` (atau port yang ditentukan Vite).

### 6. Build Produksi
```bash
npm run build
```
Bundle hasil kompilasi yang siap dideploy akan tersedia di direktori `dist/`.

---

## 📱 Panduan PWA & Penempatan Ikon Logo (Satu Foto Otomatis)

Aplikasi telah mengadopsi standar modern PWA Universal, sehingga Anda **cukup menyediakan 1 file foto/logo master saja**:

1. Letakkan foto/logo persegi Anda di: **`public/logo.png`** (misal resolusi 512×512 atau berapapun yang tajam).
2. Sistem browser di Android, iOS Safari, Google Chrome, dan desktop akan otomatis menyesuaikan (*auto-scale*) foto master tersebut untuk:
   * Ikon homescreen Android & desktop install shortcut.
   * Ikon bookmark Safari iOS (*apple-touch-icon*).
   * Splash screen saat aplikasi pertama kali dimuat.
   * Favicon tab browser.
3. Sebagai kemudahan awal, logo default bertema toga wisuda & finansial emas sudah tersedia langsung di `public/logo.png`. Jika ingin mengganti, Anda cukup me-replace/menimpa file tersebut!

---

## 🌐 Panduan Deployment

### Deploy ke Vercel
1. Hubungkan repository GitHub Anda ke [Vercel](https://vercel.com).
2. Konfigurasi project:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Tambahkan Environment Variables di dashboard Vercel:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**.

### Deploy ke Netlify
1. Hubungkan repository ke [Netlify](https://netlify.com).
2. Atur **Build Command**: `npm run build` dan **Publish Directory**: `dist`.
3. Tambahkan Environment Variables yang sama di menu *Site Configuration -> Environment Variables*.
4. Pastikan file `public/_redirects` (opsional untuk SPA) berisi:
   ```
   /*    /index.html   200
   ```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT License** — silakan baca file [LICENSE](LICENSE) untuk rincian lengkapnya.

---

Dibuat dengan ❤️ untuk mahasiswa Indonesia agar kuliah makin tertata dan finansial selalu terjaga!
