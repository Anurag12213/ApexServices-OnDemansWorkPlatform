import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { OtpInput } from '../../components/common/OtpInput';
import { validateEmail } from '../../utils/inputValidator';

export const ForgotPasswordScreen = ({ onBackToLogin }) => {
  // Steps: 'EMAIL', 'OTP', 'NEW_PASSWORD', 'SUCCESS'
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationGrant, setVerificationGrant] = useState('');
  
  // Password step states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Timers
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Expiration timer
  useEffect(() => {
    let timer;
    if (step === 'OTP' && expiresIn > 0) {
      timer = setInterval(() => setExpiresIn((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expiresIn]);

  // Step 1: Dispatch OTP Challenge
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please provide your registered partner email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const res = await api.sendEmailOtp(cleanEmail, 'PASSWORD_RESET');
    setIsLoading(false);

    if (res.success) {
      setCooldown(res.cooldownSeconds || 60);
      setExpiresIn(res.expiresInSeconds || 300);
      setStep('OTP');
      setInfoMessage('A 6-digit verification code has been dispatched to your email.');
    } else {
      setError(res.error || 'Failed to send verification code. Please try again.');
    }
  };

  // Step 2: Verify OTP and acquire Verification Grant
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    const res = await api.verifyEmailOtp(email, otp, 'PASSWORD_RESET');
    setIsLoading(false);

    if (res.success && res.verificationGrant) {
      setVerificationGrant(res.verificationGrant);
      setStep('NEW_PASSWORD');
    } else {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  // Resend OTP Challenge
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    const res = await api.resendEmailOtp(email, 'PASSWORD_RESET');
    setIsLoading(false);

    if (res.success) {
      setCooldown(res.cooldownSeconds || 60);
      setExpiresIn(res.expiresInSeconds || 300);
      setOtp('');
      setInfoMessage('A fresh verification code has been dispatched.');
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  // Step 3: Reset Password with Grant
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('New password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const res = await api.resetPasswordWithGrant(email, newPassword, verificationGrant);
    setIsLoading(false);

    if (res.success) {
      setStep('SUCCESS');
    } else {
      setError(res.error || 'Failed to update password. Please retry the recovery process.');
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
      <button
        onClick={onBackToLogin}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Partner Sign In</span>
      </button>

      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center border border-blue-200/80">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          {step === 'EMAIL' && 'Enter your registered partner email address to receive a secure recovery code.'}
          {step === 'OTP' && `Enter the 6-digit code sent to ${email}`}
          {step === 'NEW_PASSWORD' && 'Create a strong, new password for your partner account.'}
          {step === 'SUCCESS' && 'Password recovery complete! You can now sign in.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#3867FF]" />
          <span className="font-medium">{infoMessage}</span>
        </div>
      )}

      {/* STEP 1: ENTER EMAIL */}
      {step === 'EMAIL' && (
        <form onSubmit={handleSendOtp} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Registered Partner Email
            </label>
            <input
              type="email"
              placeholder="e.g. partner@apexservices.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <span>Dispatching Code...</span> : <span>Send Recovery Code</span>}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}

      {/* STEP 2: ENTER OTP */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Enter 6-Digit Code
            </label>
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (error) setError('');
              }}
              disabled={isLoading}
              error={!!error}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Expires in:{' '}
              <strong className={expiresIn < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                {formatSeconds(expiresIn)}
              </strong>
            </span>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || isLoading}
              className="text-[#3867FF] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length < 6}
            className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <span>Verifying Code...</span> : <span>Verify & Continue</span>}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { setStep('EMAIL'); setError(''); setOtp(''); }}
            className="text-xs text-slate-500 hover:text-slate-800 block mx-auto pt-1 underline"
          >
            Change email address
          </button>
        </form>
      )}

      {/* STEP 3: SET NEW PASSWORD */}
      {step === 'NEW_PASSWORD' && (
        <form onSubmit={handleResetPassword} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <span>Updating Password...</span> : <span>Set New Password</span>}
            {!isLoading && <Lock className="w-4 h-4" />}
          </button>
        </form>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 'SUCCESS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Password Reset Successfully</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your password has been securely updated. You can now access your partner account using your new credentials.
            </p>
          </div>
          <button
            onClick={onBackToLogin}
            className="w-full py-3 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Sign In with New Password
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordScreen;
