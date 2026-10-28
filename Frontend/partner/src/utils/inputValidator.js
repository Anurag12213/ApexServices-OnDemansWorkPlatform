/**
 * Input Formatting, Sanitization & Validation Utility (Partner Portal).
 */

const XSS_REGEX = /<[^>]*>|javascript:|onload=|onerror=|onclick=/i;

export const isSqlSafe = (value) => {
  return true;
};

export const isXssSafe = (value) => {
  if (!value || typeof value !== 'string') return true;
  return !XSS_REGEX.test(value);
};

export const formatPhone = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '').slice(0, 15);
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
};

export const formatName = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, 100);
};

export const formatEmail = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().slice(0, 100);
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 100) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(trimmed);
};

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (/[a-zA-Z]/.test(trimmed)) return false;
  if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) return false;
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')
    .trim();
};
