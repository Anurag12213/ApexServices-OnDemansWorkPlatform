// ApexServices Google OAuth2 / OpenID Connect Client Utility
// Supports Google Identity Services (GIS) One-Tap/Popup and OAuth2 Authorization Code Redirect

const DEFAULT_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  '909992515205-gup00q4690nbccsn6rth82tsukjqd8cd.apps.googleusercontent.com';

let cachedClientId = null;

export const fetchGoogleClientId = async (apiBaseUrl = '/api') => {
  if (cachedClientId) return cachedClientId;
  if (DEFAULT_CLIENT_ID && !DEFAULT_CLIENT_ID.startsWith('${')) {
    cachedClientId = DEFAULT_CLIENT_ID;
    return cachedClientId;
  }
  try {
    const res = await fetch(`${apiBaseUrl}/auth/google/client-id`);
    if (res.ok) {
      const data = await res.json();
      if (data.clientId) {
        cachedClientId = data.clientId;
        return data.clientId;
      }
    }
  } catch (e) {
    console.warn('[GoogleAuth] Failed to fetch client ID from backend:', e);
  }
  return DEFAULT_CLIENT_ID;
};

export const loadGsiScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!window.google?.accounts?.id), 2000);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

export const redirectToGoogleOAuth2 = (portal = 'customer', apiBaseUrl = '/api') => {
  const normalizedBase = apiBaseUrl.replace(/\/+$/, '');
  const authUrl = `${normalizedBase}/auth/oauth2/authorize/google?portal=${encodeURIComponent(portal)}`;
  window.location.href = authUrl;
};

export const parseOAuthRedirectParams = () => {
  if (typeof window === 'undefined') return { token: null, error: null, role: null };
  const params = new URLSearchParams(window.location.search);
  const token = params.get('oauth_token') || params.get('token');
  const role = params.get('role');
  const error = params.get('error');

  if (token || error) {
    // Clean URL params to prevent token exposure in address bar or history
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  return { token, role, error };
};
