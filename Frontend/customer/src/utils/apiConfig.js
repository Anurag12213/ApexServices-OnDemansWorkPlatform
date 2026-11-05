/**
 * Application API & Asset Configuration
 *
 * Automatically adapts between local development and live production environments.
 * Set VITE_API_URL or VITE_SERVER_URL in .env / .env.production when hosting API on a separate subdomain.
 */

export const SERVER_BASE_URL = (
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SERVER_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL) ||
  ''
).replace(/\/+$/, '');

export const API_BASE_URL = (
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  '/api'
).replace(/\/+$/, '');

/**
 * Resolves full URL for an uploaded media asset or technician photo.
 * @param {string} path
 * @returns {string}
 */
export const getAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};
