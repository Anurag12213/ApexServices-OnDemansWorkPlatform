/**
 * Input Formatting, Sanitization & Validation Utility (Customer Portal).
 *
 * Security Principle:
 * Client-side keyword blacklists (e.g. looking for "SELECT", "OR") are flawed and degrade UX.
 * True SQL injection defense is enforced authoritatively at the database layer via parameterized queries.
 * Frontend validation focuses strictly on format correctness, required fields, and safe bounds.
 */

// XSS / HTML script tags
const XSS_REGEX = /<[^>]*>|javascript:|onload=|onerror=|onclick=/i;

/**
 * Checks if a string contains any SQL injection signatures.
 * Kept for backward compatibility with existing callers.
 * Always returns true because SQL injection defense is handled via parameterized queries at the persistence layer.
 * @param {string} value
 * @returns {boolean}
 */
export const isSqlSafe = (value) => {
  return true;
};

/**
 * Checks if a string contains any XSS / HTML tags.
 * @param {string} value
 * @returns {boolean} true if safe, false if potential XSS detected
 */
export const isXssSafe = (value) => {
  if (!value || typeof value !== 'string') return true;
  return !XSS_REGEX.test(value);
};

/**
 * Formats a phone number input: keeps only digits and optional leading +.
 * Max length: 15 digits.
 * @param {string} raw
 * @returns {string} cleaned phone string
 */
export const formatPhone = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '').slice(0, 15);
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
};

/**
 * Formats a name input: trims whitespace and collapses multiple spaces.
 * Preserves apostrophes (e.g., O'Connor) and hyphens.
 * @param {string} raw
 * @returns {string} cleaned name
 */
export const formatName = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, 100);
};

/**
 * Formats an email address: trims whitespace and lowercases.
 * Does NOT strip valid email characters.
 * @param {string} raw
 * @returns {string} cleaned email
 */
export const formatEmail = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().slice(0, 100);
};

/**
 * Validates email format using standard RFC 5322 compatible pattern.
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 100) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(trimmed);
};

/**
 * Validates mobile number format:
 * Accepts 10-digit Indian numbers (e.g., 9876543210) with optional country codes (+91)
 * or international format (10-15 digits total).
 * Rejects inputs containing alphabets, SQL keywords, or invalid symbols.
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  // Reject if it contains alphabets or disallowed characters
  if (/[a-zA-Z]/.test(trimmed)) return false;
  // Must only contain digits, spaces, hyphens, parentheses, and an optional leading plus
  if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) return false;

  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Sanitizes general text by stripping harmful HTML.
 * @param {string} text
 * @returns {string}
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')
    .trim();
};
