/**
 * Security utilities for MyKuliahLife
 * Prevents client-side vulnerabilities such as DOM XSS, CSV injection, path traversal, and weak passwords.
 */

/**
 * Sanitizes user-provided URLs to prevent DOM-based XSS (e.g., javascript:alert(1))
 * Only allows HTTP and HTTPS protocols.
 * 
 * @param {string} url - The URL to sanitize
 * @param {string} fallback - Fallback URL if invalid (default: '#')
 * @returns {string} Sanitized URL
 */
export const sanitizeUrl = (url, fallback = '#') => {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();

  // Strip control characters
  const sanitized = trimmed.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  // Only permit explicit http:// or https:// schemes
  if (/^https?:\/\//i.test(sanitized)) {
    return sanitized;
  }

  return fallback;
};

/**
 * Checks if a URL is safe to render as an external link
 * 
 * @param {string} url
 * @returns {boolean}
 */
export const isSafeExternalUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url.trim());
};

/**
 * Sanitizes a field for CSV export to prevent CSV / Spreadsheet Formula Injection (OWASP CWE-1236).
 * Prepend a single quote (') if the field begins with =, +, -, @, tab, or carriage return,
 * and escapes double quotes according to RFC 4180.
 * 
 * @param {any} val - The raw cell value
 * @returns {string} Escaped, quote-wrapped CSV string
 */
export const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // If starts with risky formula trigger characters, disarm with a single quote
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180: escape internal double quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Sanitizes URL path slugs to prevent path traversal or parameter injection attacks.
 * Only allows lowercase alphanumeric characters, underscores, and hyphens.
 * 
 * @param {string} slug
 * @param {string} fallback
 * @returns {string} Sanitized slug
 */
export const sanitizeSlug = (slug, fallback = 'jawa-timur') => {
  if (!slug || typeof slug !== 'string') return fallback;
  const cleaned = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
  return cleaned || fallback;
};

const COMMON_WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'admin123',
  'qwerty123',
  'indonesia',
  'mahasiswa'
]);

/**
 * Validates password strength to prevent weak credentials and algorithmic hash DoS attacks.
 * Enforces minimum 8 characters, maximum 128 characters, requires letters & numbers, and blocks common passwords.
 * 
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validateStrongPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Kata sandi tidak boleh kosong.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Kata sandi minimal harus 8 karakter.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Kata sandi maksimal 128 karakter demi keamanan komputasi hash.' };
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase().trim())) {
    return { valid: false, message: 'Kata sandi terlalu umum dan mudah ditebak. Harap gunakan kata sandi yang lebih unik.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung kombinasi huruf dan angka.' };
  }
  return { valid: true, message: '' };
};

/**
 * Validates email address format strictly based on RFC 5322 specifications.
 * Prevents input tampering, header injection, and malformed auth payloads.
 * 
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  // RFC 5322 compliant regex for web applications
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
};

/**
 * Validates a UUID (v4 format).
 * Protects storage file paths and database query parameters from path traversal or injection.
 * 
 * @param {string} id
 * @returns {boolean}
 */
export const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
};

/**
 * Sanitizes image URLs to prevent DOM XSS and unsafe data schemes.
 * Only permits valid HTTP, HTTPS, or safe raster image base64 URIs.
 * 
 * @param {string} url
 * @param {string} fallback
 * @returns {string}
 */
export const sanitizeImageUrl = (url, fallback = '') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();

  // Explicitly disallow dangerous schemes
  if (/^(javascript|vbscript|file|about):/i.test(trimmed)) {
    return fallback;
  }

  // Permit HTTP / HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Permit only safe image base64 data URIs (jpg, png, webp, gif)
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
};

/**
 * Sanitizes plain text input by stripping control characters and enforcing max length.
 * 
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const sanitizeText = (str, maxLength = 250) => {
  if (str === null || str === undefined) return '';
  const cleaned = String(str)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
  return cleaned.slice(0, maxLength);
};

/**
 * Sanitizes and clamps numeric inputs into safe boundaries.
 * 
 * @param {any} val
 * @param {number} min
 * @param {number} max
 * @param {number} defaultVal
 * @returns {number}
 */
export const sanitizeNumber = (val, min = 0, max = 1000000000000, defaultVal = 0) => {
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
};

/**
 * Translates raw backend / Supabase Auth error messages into professional,
 * clean, and human-friendly Indonesian messages.
 * Prevents raw regex dumps like "abcdefghijklmnopqrstuvwxyz..." from reaching the user.
 * 
 * @param {string|Error|any} error
 * @returns {string} Clean, friendly error message
 */
export const formatAuthError = (error) => {
  if (!error) return '';
  const raw = typeof error === 'string' ? error : error.message || String(error);
  const lower = raw.toLowerCase();

  // 1. Password complexity / policy errors from Supabase
  if (
    lower.includes('should be at least') || 
    lower.includes('character of each') || 
    lower.includes('password should contain') ||
    /abcdefghijklmnopqrstuvwxyz/i.test(raw)
  ) {
    return 'Kata sandi minimal 8 karakter dan harus mengandung kombinasi huruf (besar/kecil) serta angka.';
  }

  // 2. Leaked password (HaveIBeenPwned)
  if (
    lower.includes('pwned') || 
    lower.includes('breach') || 
    lower.includes('leaked password') || 
    lower.includes('compromised')
  ) {
    return 'Kata sandi ini terdeteksi pernah bocor di internet dan tidak aman. Harap gunakan kata sandi yang lebih unik.';
  }

  // 3. Invalid credentials
  if (
    lower.includes('invalid login credentials') || 
    lower.includes('invalid_grant') || 
    lower.includes('wrong password') || 
    lower.includes('invalid email or password')
  ) {
    return 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
  }

  // 4. Email not confirmed
  if (
    lower.includes('email not confirmed') || 
    lower.includes('not_confirmed') || 
    lower.includes('email confirmation')
  ) {
    return 'Email Anda belum dikonfirmasi. Silakan periksa kotak masuk atau folder spam Anda.';
  }

  // 5. User already registered
  if (
    lower.includes('user already registered') || 
    lower.includes('already exists') || 
    lower.includes('email already in use')
  ) {
    return 'Email ini sudah terdaftar. Silakan langsung masuk atau gunakan fitur lupa kata sandi.';
  }

  // 6. Rate limits / security delays
  if (
    lower.includes('rate limit') || 
    lower.includes('too many requests') || 
    lower.includes('security purposes') || 
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'Batas percobaan keamanan tercapai. Harap tunggu beberapa saat sebelum mencoba kembali.';
  }

  // 7. Expired OTP / Link
  if (
    lower.includes('token has expired') || 
    lower.includes('otp expired') || 
    lower.includes('token expired')
  ) {
    return 'Kode verifikasi atau tautan keamanan telah kadaluarsa. Silakan minta kode baru.';
  }

  // 8. Network / connectivity
  if (
    lower.includes('failed to fetch') || 
    lower.includes('network error') || 
    lower.includes('timeout')
  ) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
  }

  // 9. Backend database / provider errors
  if (lower.includes('supabase') || lower.includes('database error') || lower.includes('postgres')) {
    return 'Terjadi kendala pada layanan cloud. Silakan coba kembali dalam beberapa saat.';
  }

  return raw;
};
