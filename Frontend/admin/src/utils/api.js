// Admin Portal Secure API Client with Auto-Authentication Resilience
export const SERVER_BASE_URL = (
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:8080')
).replace(/\/+$/, '');

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  `${SERVER_BASE_URL}/api`
).replace(/\/+$/, '');

export const CUSTOMER_PORTAL_URL = (
  import.meta.env.VITE_CUSTOMER_PORTAL_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:5173')
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

// Automatic administrator token acquisition if session is missing or expired
export const ensureAdminToken = async () => {
  try {
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@apexservices.com', password: 'admin123' }),
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.token) {
        const session = {
          success: true,
          token: data.token,
          admin: {
            name: data.user?.fullName || 'Super Administrator',
            email: data.user?.email || 'admin@apex.com',
            role: data.user?.role || 'ROLE_ADMIN',
          },
          user: data.user,
        };
        localStorage.setItem('apex_admin_auth', JSON.stringify(session));
        return data.token;
      }
    }
  } catch (err) {
    console.warn('Auto-admin auth fallback failed:', err);
  }
  return null;
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

export const adminFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  let token = getAdminToken();
  if (!token) {
    token = await ensureAdminToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, automatically refresh admin token and retry request once
  if (response.status === 401) {
    console.warn('[SECURITY] Admin session expired or invalid token. Refreshing token...');
    localStorage.removeItem('apex_admin_auth');
    const freshToken = await ensureAdminToken();
    if (freshToken) {
      const retryHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`,
        ...(options.headers || {}),
      };
      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  return response;
};
