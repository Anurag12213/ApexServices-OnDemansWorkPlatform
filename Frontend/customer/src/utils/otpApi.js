import { API_BASE_URL } from './apiConfig';

/**
 * Enterprise Centralized Email OTP API Client for Customer Portal.
 * Communicates EXCLUSIVELY with the Spring Boot backend REST endpoints.
 * Never connects directly to third-party providers.
 */

export const sendEmailOtp = async (email, purpose = 'REGISTRATION') => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.message || data.error || 'Failed to dispatch verification code.';
      return { success: false, error: errorMsg, code: data.code, retryAfterSeconds: data.retryAfterSeconds };
    }
    return {
      success: true,
      message: data.message,
      cooldownSeconds: data.cooldownSeconds || 60,
      expiresInSeconds: data.expiresInSeconds || 300,
    };
  } catch (err) {
    return { success: false, error: 'Network error communicating with verification server. Please retry.' };
  }
};

export const verifyEmailOtp = async (email, otp, purpose = 'REGISTRATION') => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), purpose }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.message || data.error || 'Verification failed. Please check the code.';
      return { success: false, error: errorMsg, code: data.code };
    }
    return {
      success: true,
      message: data.message,
      verificationGrant: data.verificationGrant,
      grantExpiresInSeconds: data.grantExpiresInSeconds || 600,
    };
  } catch (err) {
    return { success: false, error: 'Network error verifying code. Please retry.' };
  }
};

export const resendEmailOtp = async (email, purpose = 'REGISTRATION') => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.message || data.error || 'Failed to resend verification code.';
      return { success: false, error: errorMsg, code: data.code, retryAfterSeconds: data.retryAfterSeconds };
    }
    return {
      success: true,
      message: data.message,
      cooldownSeconds: data.cooldownSeconds || 60,
      expiresInSeconds: data.expiresInSeconds || 300,
    };
  } catch (err) {
    return { success: false, error: 'Network error resending verification code. Please retry.' };
  }
};

export const resetPasswordWithGrant = async (email, newPassword, verificationGrant) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        newPassword,
        verificationGrant,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.message || data.error || 'Password reset failed.';
      return { success: false, error: errorMsg, code: data.code };
    }
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, error: 'Network error updating password. Please retry.' };
  }
};
