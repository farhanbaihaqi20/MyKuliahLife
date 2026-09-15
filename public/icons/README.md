# 🎨 Panduan Ikon Aplikasi MyKuliahLife (Satu Foto untuk Semua)

Anda **TIDAK PERLU** lagi repot-repot memotong atau membuat banyak ukuran ikon satu per satu!

Aplikasi MyKuliahLife sudah dikonfigurasi secara modern (PWA Universal Standard):
Cukup sediakan **1 Foto / Logo master saja**:

📍 **Letakkan foto Anda di:**
`public/logo.png`

### Ketentuan Foto:
* **Format**: `.png` (atau `.jpg` yang di-rename menjadi `logo.png`).
* **Bentuk**: Persegi (rasio 1:1, misalnya 512×512 piksel atau resolusi berapa pun yang tajam).
* **Otomatisasi**: Sistem Android, iOS Safari, Google Chrome, dan desktop akan otomatis men-*scale* (menyesuaikan ukuran) foto master tersebut secara cerdas untuk kebutuhan:
  - Ikon aplikasi di Layar Utama (Homescreen) Android.
  - Ikon bookmark Safari (Add to Home Screen) di iPhone / iPad.
  - Splash screen saat aplikasi pertama kali dibuka.
  - Favicon tab browser.

*(Folder `public/icons/` ini secara otomatis sudah diisi duplikat fallback jika ada browser model lama yang memintanya).*
