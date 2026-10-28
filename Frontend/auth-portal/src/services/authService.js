import apiClient from './apiClient';

export const authService = {
  /**
   * Login with Email or Mobile Number + Password
   */
  async login({ identifier, password, portalRole }) {
    const res = await apiClient.post('/auth/login', { identifier, password });
    if (res && res.token) {
      localStorage.setItem('apex_token', res.token);
      localStorage.setItem('apex_user', JSON.stringify(res.user));
    }
    return res;
  },

  /**
   * Register a new account
   */
  async register({ fullName, email, mobileNumber, password, role }) {
    const res = await apiClient.post('/auth/register', { 
      fullName, 
      email: email || undefined, 
      mobileNumber: mobileNumber || undefined, 
      password, 
      role 
    });
    if (res && res.token) {
      localStorage.setItem('apex_token', res.token);
      localStorage.setItem('apex_user', JSON.stringify(res.user));
    }
    return res;
  },

  /**
   * Continue with Google OAuth2
   */
  async googleLogin({ idToken, role }) {
    const res = await apiClient.post('/auth/google', { idToken, role });
    if (res && res.token) {
      localStorage.setItem('apex_token', res.token);
      localStorage.setItem('apex_user', JSON.stringify(res.user));
    }
    return res;
  },

  /**
   * Reset / Forgot Password Request
   */
  async requestPasswordReset(identifier) {
    const res = await apiClient.post('/auth/forgot-password', { identifier });
    return res || {
      success: true,
      message: `Password reset instructions sent to ${identifier}`,
    };
  },

  /**
   * Get Current Stored User
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem('apex_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
  },
};

export default authService;
