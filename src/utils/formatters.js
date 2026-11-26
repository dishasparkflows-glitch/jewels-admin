/**
 * Standardized Formatting Utilities for Neirah Admin Portal
 *
 * Provides consistent, localized formatting across dates, currency (INR),
 * numbers, and file sizes. Eliminates duplicate ad-hoc formatters.
 */

/**
 * Format currency amounts into INR string (e.g. "₹ 17,216" or "₹ 17,216.50")
 * @param {number|string} value - Raw number or numeric string
 * @param {Object} [options]
 * @param {string} [options.fallback='₹ 0'] - Default return when value is empty/invalid
 * @param {boolean} [options.includeDecimals=false] - Whether to show paise/cents
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, options = {}) {
  const { fallback = '₹ 0', includeDecimals = false } = options;
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return fallback;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Shorthand alias for `formatCurrency` to allow drop-in replacement
 * of legacy `const money = (val) => ...` helpers.
 */
export const money = (val, opts) => formatCurrency(val, opts);

/**
 * Format date string into standard administrative display: "13 Oct 2026"
 * @param {string|Date} dateStr - Date object or ISO string
 * @param {string} [fallback=''] - Fallback when date is empty/invalid
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, fallback = '') {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date and time: "13 Oct 2026, 04:30 PM"
 * @param {string|Date} dateStr
 * @param {string} [fallback='']
 * @returns {string}
 */
export function formatDateTime(dateStr, fallback = '') {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert Date / ISO string to YYYY-MM-DD for HTML5 <input type="date">
 * @param {string|Date} dateStr
 * @returns {string} YYYY-MM-DD or empty string
 */
export function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Format numeric byte counts into human-readable strings ("1.4 MB", "320 KB")
 * @param {number} bytes
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format integer numbers with Indian comma separation (e.g. 1,50,000)
 * @param {number|string} val
 * @param {string} [fallback='0']
 * @returns {string}
 */
export function formatNumber(val, fallback = '0') {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Convert arbitrary text into a clean URL-safe lowercase slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text = '') {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract up to 2 uppercase initials from a name string or user/customer object.
 * @param {string|Object} input
 * @param {string} [fallback='U']
 * @returns {string}
 */
export function getInitials(input, fallback = 'U') {
  if (!input) return fallback;
  const rawName =
    typeof input === 'string'
      ? input
      : [
          input.profile?.firstName || input.firstName,
          input.profile?.lastName || input.lastName,
        ]
          .filter(Boolean)
          .join(' ') ||
        input.name ||
        input.fullName ||
        '';
  const parts = String(rawName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Format timestamp as concise relative time ("Just now", "5m ago", "2h ago", "3d ago", or formatted date).
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Split a timestamp into formatted `{ date, time }` parts (e.g. `{ date: "24 Oct 2026", time: "10:45 AM" }`).
 *
 * @param {string|Date} dateStr
 * @param {Object} [options]
 * @param {string} [options.defaultDate='—']
 * @param {string} [options.defaultTime='—']
 * @param {'numeric'|'2-digit'} [options.dayFormat='numeric']
 * @returns {{ date: string, time: string }}
 */
export function formatDateParts(dateStr, options = {}) {
  const { defaultDate = '—', defaultTime = '—', dayFormat = 'numeric' } = options;
  if (!dateStr) return { date: defaultDate, time: defaultTime };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { date: defaultDate, time: defaultTime };

  return {
    date: d.toLocaleDateString('en-GB', {
      day: dayFormat,
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

/**
 * Format date as DD/MM/YYYY.
 *
 * @param {string|Date} dateStr
 * @param {string} [fallback='']
 * @returns {string}
 */
export function formatSlashDate(dateStr, fallback = '') {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Format short day + month (e.g. "11 Oct").
 *
 * @param {string|Date} dateStr
 * @param {string} [fallback='']
 * @returns {string}
 */
export function formatShortDate(dateStr, fallback = '') {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Format 24-hour time string (e.g. "11:30").
 *
 * @param {string|Date} dateStr
 * @param {string} [fallback='']
 * @returns {string}
 */
export function formatTime24(dateStr, fallback = '') {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}
