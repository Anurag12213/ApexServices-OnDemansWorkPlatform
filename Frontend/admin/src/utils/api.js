// Admin Portal Secure API Client with Auto-Authentication Resilience
export const SERVER_BASE_URL = (
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8080')
).replace(/\/+$/, '');

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (SERVER_BASE_URL ? `${SERVER_BASE_URL}/api` : '/api')
).replace(/\/+$/, '');

export const CUSTOMER_PORTAL_URL = (
  import.meta.env.VITE_CUSTOMER_PORTAL_URL ||
  (import.meta.env.PROD ? 'https://apexservicesondemand.netlify.app' : 'http://localhost:5173')
).replace(/\/+$/, '');

export const getAdminAuth = () => {
  try {
    const saved = localStorage.getItem('apex_admin_auth');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse admin session', e);
  }
  return null;
};

export const getAdminToken = () => {
  const session = getAdminAuth();
  return session?.token || null;
};

// Administrator session management: retrieve current authenticated session
export const ensureAdminToken = async () => {
  const token = getAdminToken();
  if (!token) {
    // If no valid session exists, trigger session cleanup so user logs in cleanly
    localStorage.removeItem('apex_admin_auth');
    window.dispatchEvent(new Event('apex_admin_auth_expired'));
    return null;
  }
  return token;
};

export const getAdminAuthHeaders = async () => {
  let token = getAdminToken();
  if (!token) {
    token = await ensureAdminToken();
  }
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const inFlightRequests = new Map();

export const adminFetch = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Deduplicate identical in-flight GET requests to eliminate duplicate network calls
  if (method === 'GET' && inFlightRequests.has(url)) {
    return inFlightRequests.get(url).then((res) => res.clone());
  }

  let token = getAdminToken();
  if (!token) {
    token = await ensureAdminToken();
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  const fetchPromise = (async () => {
    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // If 401 Unauthorized, notify the application to route to login
      if (response.status === 401) {
        console.warn('[SECURITY] Admin session expired or unauthorized. Redirecting to login...');
        localStorage.removeItem('apex_admin_auth');
        window.dispatchEvent(new Event('apex_admin_auth_expired'));
      }

      return response;
    } finally {
      if (method === 'GET') {
        inFlightRequests.delete(url);
      }
    }
  })();

  if (method === 'GET') {
    inFlightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
};
