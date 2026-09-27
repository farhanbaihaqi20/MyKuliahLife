/**
 * Security utilities for MyKuliahLife
 * Prevents client-side vulnerabilities such as DOM XSS, open redirects, and protocol injections.
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
