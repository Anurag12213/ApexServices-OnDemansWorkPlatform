import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ShieldCheck, Calendar, MapPin, Zap, CreditCard, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import ApexLogo from '../components/ApexLogo';
import GoogleButton from '../components/GoogleButton';
import { OtpInput } from '../components/OtpInput';
import { sendEmailOtp, verifyEmailOtp, resendEmailOtp, resetPasswordWithGrant } from '../utils/otpApi';
import { isSqlSafe, isXssSafe, formatPhone, formatName, formatEmail, validateEmail, validatePhone } from '../utils/inputValidator';

export const LoginPage = () => {
  const {
    loginCustomer,
    registerCustomer,
    setActivePage,
    bookingDraft,
    loginBannerMessage,
    setActiveBookingStep,
    toast,
  } = useData();

  const [mode, setMode] = useState('login'); // 'login', 'register', or 'forgot'
  const [loginTab, setLoginTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration Email OTP State
  const [registerStep, setRegisterStep] = useState('FORM'); // 'FORM' or 'OTP'
  const [regOtp, setRegOtp] = useState('');
  const [regCooldown, setRegCooldown] = useState(0);
  const [regExpiresIn, setRegExpiresIn] = useState(300);
  const [regInfoMessage, setRegInfoMessage] = useState('');

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState('EMAIL'); // 'EMAIL', 'OTP', 'NEW_PASSWORD', 'SUCCESS'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotVerificationGrant, setForgotVerificationGrant] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotExpiresIn, setForgotExpiresIn] = useState(300);
  const [forgotInfo, setForgotInfo] = useState('');

  // Field-specific validation error states
  const [fieldErrors, setFieldErrors] = useState({
    identifier: '',
    password: '',
  });

  const [registerFieldErrors, setRegisterFieldErrors] = useState({
    fullName: '',
    identifier: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: '',
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: 'user@example.com',
    mobileNumber: '9876543210',
    password: 'password123',
    keepSignedIn: true,
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  // Registration OTP Timers
  useEffect(() => {
    let t;
    if (regCooldown > 0) {
      t = setInterval(() => setRegCooldown((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [regCooldown]);

  useEffect(() => {
    let t;
    if (registerStep === 'OTP' && regExpiresIn > 0) {
      t = setInterval(() => setRegExpiresIn((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [registerStep, regExpiresIn]);

  // Forgot Password OTP Timers
  useEffect(() => {
    let t;
    if (forgotCooldown > 0) {
      t = setInterval(() => setForgotCooldown((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [forgotCooldown]);

  useEffect(() => {
    let t;
    if (forgotStep === 'OTP' && forgotExpiresIn > 0) {
      t = setInterval(() => setForgotExpiresIn((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [forgotStep, forgotExpiresIn]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    const newFieldErrors = {};
    let cleanIdentifier = '';

    if (loginTab === 'email') {
      const emailVal = loginForm.email ? loginForm.email.trim() : '';
      if (!emailVal) {
        newFieldErrors.identifier = 'Email is required.';
      } else if (!validateEmail(emailVal)) {
        newFieldErrors.identifier = 'Enter a valid email address.';
      } else {
        cleanIdentifier = emailVal.toLowerCase();
      }
    } else {
      const mobileVal = loginForm.mobileNumber ? loginForm.mobileNumber.trim() : '';
      if (!mobileVal) {
        newFieldErrors.identifier = 'Mobile number is required.';
      } else if (!validatePhone(mobileVal)) {
        newFieldErrors.identifier = 'Enter a valid mobile number.';
      } else {
        cleanIdentifier = formatPhone(mobileVal);
      }
    }

    if (!loginForm.password) {
      newFieldErrors.password = 'Password is required.';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setFieldErrors({ identifier: '', password: '' });
    setLoading(true);

    try {
      const res = await loginCustomer(cleanIdentifier, loginForm.password);
      if (!res.success) {
        if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
          setFieldErrors({
            identifier: res.fieldErrors.identifier || '',
            password: res.fieldErrors.password || '',
          });
        } else {
          setError(res.error || 'Invalid email/mobile number or password.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setRegInfoMessage('');
    const newRegErrors = {};

    const cleanFullName = formatName(registerForm.fullName);
    if (!cleanFullName) {
      newRegErrors.fullName = 'Full name is required.';
    } else if (cleanFullName.length < 2) {
      newRegErrors.fullName = 'Full name must be at least 2 characters.';
    }

    const emailTrimmed = registerForm.email ? registerForm.email.trim() : '';
    const mobileTrimmed = registerForm.mobileNumber ? registerForm.mobileNumber.trim() : '';

    if (!emailTrimmed && !mobileTrimmed) {
      newRegErrors.identifier = 'Please provide an email address or mobile number.';
    } else {
      if (emailTrimmed && !validateEmail(emailTrimmed)) {
        newRegErrors.email = 'Enter a valid email address.';
      }
      if (mobileTrimmed && !validatePhone(mobileTrimmed)) {
        newRegErrors.mobileNumber = 'Enter a valid mobile number.';
      }
    }

    if (!registerForm.password) {
      newRegErrors.password = 'Password is required.';
    } else if (registerForm.password.length < 8) {
      newRegErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!registerForm.confirmPassword) {
      newRegErrors.confirmPassword = 'Confirm your password.';
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newRegErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!registerForm.agreeTerms) {
      newRegErrors.agreeTerms = 'You must agree to the Terms & Conditions.';
    }

    if (Object.keys(newRegErrors).length > 0) {
      setRegisterFieldErrors(newRegErrors);
      return;
    }

    setRegisterFieldErrors({
      fullName: '',
      identifier: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      agreeTerms: '',
    });

    const cleanEmail = emailTrimmed ? formatEmail(emailTrimmed) : undefined;
    const cleanPhone = mobileTrimmed ? formatPhone(mobileTrimmed) : undefined;

    // If email is provided, mandate Email OTP verification before account creation
    if (cleanEmail) {
      setLoading(true);
      const res = await sendEmailOtp(cleanEmail, 'REGISTRATION');
      setLoading(false);

      if (res.success) {
        setRegCooldown(res.cooldownSeconds || 60);
        setRegExpiresIn(res.expiresInSeconds || 300);
        setRegOtp('');
        setRegisterStep('OTP');
        setRegInfoMessage(`A 6-digit verification code has been dispatched to ${cleanEmail}`);
      } else {
        setError(res.error || 'Failed to dispatch verification code. Please try again.');
      }
      return;
    }

    // Mobile-Only Registration (No Email Provided)
    setLoading(true);
    try {
      const res = await registerCustomer(
        cleanFullName,
        undefined,
        cleanPhone,
        registerForm.password
      );
      if (!res.success) {
        setError(res.error || 'Registration failed. Mobile number may already be registered.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setRegInfoMessage('');

    if (regOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const cleanFullName = formatName(registerForm.fullName);
    const cleanEmail = formatEmail(registerForm.email.trim());
    const cleanPhone = registerForm.mobileNumber ? formatPhone(registerForm.mobileNumber.trim()) : undefined;

    setLoading(true);
    // 1. Verify OTP with backend to receive single-use verification grant
    const otpRes = await verifyEmailOtp(cleanEmail, regOtp, 'REGISTRATION');
    if (!otpRes.success || !otpRes.verificationGrant) {
      setLoading(false);
      setError(otpRes.error || 'Invalid or expired verification code.');
      return;
    }

    // 2. Complete registration atomically passing the verification grant
    try {
      const regRes = await registerCustomer(
        cleanFullName,
        cleanEmail,
        cleanPhone,
        registerForm.password,
        otpRes.verificationGrant
      );
      if (!regRes.success) {
        setError(regRes.error || 'Registration could not be completed.');
      }
    } catch (err) {
      setError('Something went wrong completing registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    if (regCooldown > 0 || loading) return;
    setError('');
    setRegInfoMessage('');
    const cleanEmail = formatEmail(registerForm.email.trim());
    setLoading(true);
    const res = await resendEmailOtp(cleanEmail, 'REGISTRATION');
    setLoading(false);
    if (res.success) {
      setRegCooldown(res.cooldownSeconds || 60);
      setRegExpiresIn(res.expiresInSeconds || 300);
      setRegOtp('');
      setRegInfoMessage('A fresh verification code has been dispatched.');
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  // Forgot Password Handlers
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setForgotInfo('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    const res = await sendEmailOtp(cleanEmail, 'PASSWORD_RESET');
    setLoading(false);

    if (res.success) {
      setForgotCooldown(res.cooldownSeconds || 60);
      setForgotExpiresIn(res.expiresInSeconds || 300);
      setForgotOtp('');
      setForgotStep('OTP');
      setForgotInfo('A 6-digit recovery code has been dispatched to your email.');
    } else {
      setError(res.error || 'Failed to dispatch recovery code.');
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setForgotInfo('');

    if (forgotOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyEmailOtp(forgotEmail, forgotOtp, 'PASSWORD_RESET');
    setLoading(false);

    if (res.success && res.verificationGrant) {
      setForgotVerificationGrant(res.verificationGrant);
      setForgotStep('NEW_PASSWORD');
    } else {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  const handleForgotResendOtp = async () => {
    if (forgotCooldown > 0 || loading) return;
    setError('');
    setForgotInfo('');
    setLoading(true);
    const res = await resendEmailOtp(forgotEmail, 'PASSWORD_RESET');
    setLoading(false);

    if (res.success) {
      setForgotCooldown(res.cooldownSeconds || 60);
      setForgotExpiresIn(res.expiresInSeconds || 300);
      setForgotOtp('');
      setForgotInfo('A fresh recovery code has been dispatched.');
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordWithGrant(forgotEmail, forgotNewPassword, forgotVerificationGrant);
    setLoading(false);

    if (res.success) {
      setForgotStep('SUCCESS');
    } else {
      setError(res.error || 'Password update failed. Please retry recovery.');
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasDraft = bookingDraft && bookingDraft.serviceCategory;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Bar with return link */}
      <div className="max-w-[960px] w-full mx-auto flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (hasDraft) {
              setActiveBookingStep(6);
              setActivePage('request-work');
            } else {
              setActivePage('home');
            }
          }}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#ff3b47]" />
          <span>{hasDraft ? 'Return to Booking Draft' : 'Back to Home'}</span>
        </button>

        {loginBannerMessage && (
          <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full">
            {loginBannerMessage}
          </span>
        )}
      </div>

      <div className="w-full flex items-center justify-center">
        {mode === 'login' ? (
          /* ==========================================================
             CUSTOMER LOGIN (DESKTOP)
             ========================================================== */
          <div className="w-full max-w-[960px] rounded-2xl bg-white p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-stretch justify-between relative text-left">
            
            {/* LEFT COLUMN: HERO & BULLETS & PHOTO */}
            <div className="flex-1 flex flex-col justify-between pr-0 md:pr-4">
              <div>
                <div className="mb-6">
                  <ApexLogo portal="customer" />
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                  Book Home Services Easily and Securely
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed max-w-md">
                  Find trusted professionals for cleaning, repairs, installations and more.
                </p>

                {/* 3 Bullets with Icons */}
                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Verified Professionals
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Easy Booking
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Real-time Tracking
                    </span>
                  </div>
                </div>
              </div>

              {/* Lifestyle Image in bottom-left */}
              <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200 max-w-sm max-h-48 sm:max-h-56">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                  alt="Customer relaxing at home"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: FLOATING WHITE LOGIN CARD */}
            <div className="w-full md:w-[380px] shrink-0 bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Login to your Customer account
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Segmented Tabs: Email | Mobile Number */}
                <div className="bg-slate-200/70 p-1 rounded-xl flex items-center mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginTab('email');
                      setError('');
                      setFieldErrors(prev => ({ ...prev, identifier: '' }));
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      loginTab === 'email'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginTab('mobile');
                      setError('');
                      setFieldErrors(prev => ({ ...prev, identifier: '' }));
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      loginTab === 'mobile'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mobile Number
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                  {loginTab === 'email' ? (
                    <div>
                      <label htmlFor="login-email-input" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.identifier ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          id="login-email-input"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => {
                            setLoginForm({ ...loginForm, email: e.target.value });
                            if (fieldErrors.identifier) setFieldErrors(prev => ({ ...prev, identifier: '' }));
                          }}
                          placeholder="user@example.com"
                          disabled={loading}
                          aria-invalid={!!fieldErrors.identifier}
                          aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
                          className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                            fieldErrors.identifier
                              ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                              : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                          }`}
                        />
                      </div>
                      {fieldErrors.identifier && (
                        <p id="login-identifier-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium" role="alert">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.identifier}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="login-mobile-input" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.identifier ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          id="login-mobile-input"
                          type="tel"
                          value={loginForm.mobileNumber}
                          onChange={(e) => {
                            setLoginForm({ ...loginForm, mobileNumber: e.target.value });
                            if (fieldErrors.identifier) setFieldErrors(prev => ({ ...prev, identifier: '' }));
                          }}
                          placeholder="+91 98765 43210"
                          disabled={loading}
                          aria-invalid={!!fieldErrors.identifier}
                          aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
                          className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                            fieldErrors.identifier
                              ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                              : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                          }`}
                        />
                      </div>
                      {fieldErrors.identifier && (
                        <p id="login-identifier-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium" role="alert">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.identifier}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="login-password-input" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-rose-500' : 'text-slate-400'}`} />
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, password: e.target.value });
                          if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                        }}
                        placeholder="••••••••••••"
                        disabled={loading}
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                        className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                          fieldErrors.password
                            ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p id="login-password-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Keep me signed in & Forgot password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={loginForm.keepSignedIn}
                        onChange={(e) => setLoginForm({ ...loginForm, keepSignedIn: e.target.checked })}
                        className="rounded border-slate-300 text-[#ff3b47] focus:ring-[#ff3b47] w-3.5 h-3.5"
                      />
                      <span className="text-[11px] sm:text-xs font-medium">Keep me signed in</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotStep('EMAIL');
                        setForgotEmail(loginTab === 'email' && loginForm.email ? loginForm.email : '');
                        setError('');
                      }}
                      className="text-[11px] sm:text-xs font-semibold text-slate-700 hover:text-[#ff3b47] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Logging in...</span>
                      </span>
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* OR Divider */}
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative px-3 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    OR
                  </span>
                </div>

                {/* Google Button */}
                <GoogleButton
                  onClick={async () => {
                    await loginCustomer('customer@example.com', 'password123');
                  }}
                  label="Continue with Google"
                />
              </div>

              {/* Registration link */}
              <div className="mt-5 text-center text-xs text-slate-500 pt-3 border-t border-slate-200/80">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="font-bold text-slate-900 hover:text-[#ff3b47] hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            </div>

          </div>
        ) : mode === 'forgot' ? (
          /* ==========================================================
             CUSTOMER FORGOT PASSWORD (DESKTOP)
             ========================================================== */
          <div className="w-full max-w-[960px] rounded-2xl bg-white p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-stretch justify-between relative text-left">
            {/* LEFT COLUMN: HERO & BULLETS */}
            <div className="flex-1 flex flex-col justify-between pr-0 md:pr-4">
              <div>
                <div className="mb-6">
                  <ApexLogo portal="customer" />
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                  Recover Your Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed max-w-md">
                  Verify your registered email address to securely reset your password.
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#ff3b47] flex items-center justify-center shrink-0 border border-rose-200/80">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Encrypted Password Recovery
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      6-Digit Single-Use Verification
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Instant Access Restoration
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200 max-w-sm max-h-48 sm:max-h-56">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                  alt="Customer relaxing at home"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: FORGOT PASSWORD CARD */}
            <div className="w-full md:w-[400px] shrink-0 bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {forgotStep === 'EMAIL' && 'Enter your registered email address'}
                    {forgotStep === 'OTP' && `Enter 6-digit code sent to ${forgotEmail}`}
                    {forgotStep === 'NEW_PASSWORD' && 'Create your new secure password'}
                    {forgotStep === 'SUCCESS' && 'Password updated successfully'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {forgotInfo && (
                  <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
                    <span className="font-medium">{forgotInfo}</span>
                  </div>
                )}

                {/* FORGOT STEP 1: EMAIL */}
                {forgotStep === 'EMAIL' && (
                  <form onSubmit={handleForgotSendOtp} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="user@example.com"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <span>Sending Code...</span> : <span>Send Recovery Code</span>}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                )}

                {/* FORGOT STEP 2: OTP */}
                {forgotStep === 'OTP' && (
                  <form onSubmit={handleForgotVerifyOtp} className="space-y-4 text-center">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                        Enter 6-Digit Code
                      </label>
                      <OtpInput
                        value={forgotOtp}
                        onChange={(val) => {
                          setForgotOtp(val);
                          if (error) setError('');
                        }}
                        disabled={loading}
                        error={!!error}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Expires in:{' '}
                        <strong className={forgotExpiresIn < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {formatSeconds(forgotExpiresIn)}
                        </strong>
                      </span>

                      <button
                        type="button"
                        onClick={handleForgotResendOtp}
                        disabled={forgotCooldown > 0 || loading}
                        className="text-[#ff3b47] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>{forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend Code'}</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || forgotOtp.length < 6}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? <span>Verifying...</span> : <span>Verify & Continue</span>}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setForgotStep('EMAIL'); setError(''); setForgotOtp(''); }}
                      className="text-xs text-slate-500 hover:text-slate-800 block mx-auto pt-1 underline cursor-pointer"
                    >
                      Change email address
                    </button>
                  </form>
                )}

                {/* FORGOT STEP 3: NEW PASSWORD */}
                {forgotStep === 'NEW_PASSWORD' && (
                  <form onSubmit={handleForgotResetPassword} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotPass ? 'text' : 'password'}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          disabled={loading}
                          className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPass(!showForgotPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotConfirm ? 'text' : 'password'}
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          disabled={loading}
                          className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotConfirm(!showForgotConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showForgotConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? <span>Updating Password...</span> : <span>Set New Password</span>}
                      {!loading && <Lock className="w-4 h-4" />}
                    </button>
                  </form>
                )}

                {/* FORGOT STEP 4: SUCCESS */}
                {forgotStep === 'SUCCESS' && (
                  <div className="text-center space-y-4 py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Password Updated</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Your password has been securely reset. You can now log in with your new credentials.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] text-white shadow-md transition-all cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}
              </div>

              {/* Back to sign in link */}
              {forgotStep !== 'SUCCESS' && (
                <div className="mt-5 text-center text-xs text-slate-500 pt-3 border-t border-slate-200/80">
                  <span>Remember your password? </span>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="font-bold text-slate-900 hover:text-[#ff3b47] hover:underline cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==========================================================
             CUSTOMER REGISTRATION (DESKTOP)
             ========================================================== */
          <div className="w-full max-w-[960px] rounded-2xl bg-white p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-stretch justify-between relative text-left">
            
            {/* LEFT COLUMN: HERO & BULLETS & PHOTO */}
            <div className="flex-1 flex flex-col justify-between pr-0 md:pr-4">
              <div>
                <div className="mb-6">
                  <ApexLogo portal="customer" />
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                  Create Your Customer Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed max-w-md">
                  Start booking trusted professionals for your home services.
                </p>

                {/* 3 Bullets with Icons */}
                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Quick & Easy Booking
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Verified Professionals
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Safe & Secure Payments
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200 max-w-sm max-h-48 sm:max-h-56">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                  alt="Customer relaxing at home"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: FLOATING REGISTRATION CARD */}
            <div className="w-full md:w-[400px] shrink-0 bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                {registerStep === 'OTP' ? (
                  /* ================= REGISTRATION EMAIL OTP STEP ================= */
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#ff3b47] mx-auto flex items-center justify-center border border-rose-200/80 mb-3">
                      <ShieldCheck className="w-6 h-6" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Verify Your Email
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      We sent a 6-digit verification code to<br />
                      <strong className="text-slate-800 font-bold">{registerForm.email}</strong>
                    </p>

                    {error && (
                      <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 text-left" role="alert">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="font-medium">{error}</span>
                      </div>
                    )}

                    {regInfoMessage && (
                      <div className="my-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2 text-left">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
                        <span className="font-medium">{regInfoMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleVerifyRegistrationOtp} className="space-y-4 mt-4">
                      <div>
                        <OtpInput
                          value={regOtp}
                          onChange={(val) => {
                            setRegOtp(val);
                            if (error) setError('');
                          }}
                          disabled={loading}
                          error={!!error}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>
                          Expires in:{' '}
                          <strong className={regExpiresIn < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                            {formatSeconds(regExpiresIn)}
                          </strong>
                        </span>

                        <button
                          type="button"
                          onClick={handleResendRegistrationOtp}
                          disabled={regCooldown > 0 || loading}
                          className="text-[#ff3b47] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          <span>{regCooldown > 0 ? `Resend in ${regCooldown}s` : 'Resend Code'}</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || regOtp.length < 6}
                        className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Creating Account...</span>
                          </span>
                        ) : (
                          <>
                            <span>Verify & Complete Registration</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setRegisterStep('FORM'); setError(''); }}
                        className="text-xs text-slate-500 hover:text-slate-800 block mx-auto pt-2 underline cursor-pointer"
                      >
                        Back to Edit Details
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                  <div className="text-center mb-5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Create Account
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Fill in your details to get started
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2" role="alert">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3" noValidate>
                  <div>
                    <label htmlFor="reg-fullname" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <input
                      id="reg-fullname"
                      type="text"
                      value={registerForm.fullName}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, fullName: e.target.value });
                        if (registerFieldErrors.fullName) setRegisterFieldErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="Enter your full name"
                      disabled={loading}
                      aria-invalid={!!registerFieldErrors.fullName}
                      aria-describedby={registerFieldErrors.fullName ? 'reg-fullname-error' : undefined}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                        registerFieldErrors.fullName
                          ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                      }`}
                    />
                    {registerFieldErrors.fullName && (
                      <p id="reg-fullname-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Email address (Optional)
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, email: e.target.value });
                        if (registerFieldErrors.email || registerFieldErrors.identifier) {
                          setRegisterFieldErrors(prev => ({ ...prev, email: '', identifier: '' }));
                        }
                      }}
                      placeholder="user@example.com"
                      disabled={loading}
                      aria-invalid={!!(registerFieldErrors.email || registerFieldErrors.identifier)}
                      aria-describedby={registerFieldErrors.email ? 'reg-email-error' : registerFieldErrors.identifier ? 'reg-identifier-error' : undefined}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                        (registerFieldErrors.email || registerFieldErrors.identifier)
                          ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                      }`}
                    />
                    {registerFieldErrors.email && (
                      <p id="reg-email-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-mobile" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Mobile Number (Optional)
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </span>
                      <input
                        id="reg-mobile"
                        type="tel"
                        value={registerForm.mobileNumber}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, mobileNumber: e.target.value });
                          if (registerFieldErrors.mobileNumber || registerFieldErrors.identifier) {
                            setRegisterFieldErrors(prev => ({ ...prev, mobileNumber: '', identifier: '' }));
                          }
                        }}
                        placeholder="98765 43210"
                        disabled={loading}
                        aria-invalid={!!(registerFieldErrors.mobileNumber || registerFieldErrors.identifier)}
                        aria-describedby={registerFieldErrors.mobileNumber ? 'reg-mobile-error' : registerFieldErrors.identifier ? 'reg-identifier-error' : undefined}
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-r-xl focus:outline-hidden transition-colors ${
                          (registerFieldErrors.mobileNumber || registerFieldErrors.identifier)
                            ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                        }`}
                      />
                    </div>
                    {registerFieldErrors.mobileNumber && (
                      <p id="reg-mobile-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.mobileNumber}</span>
                      </p>
                    )}
                    {registerFieldErrors.identifier && (
                      <p id="reg-identifier-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.identifier}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-password" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, password: e.target.value });
                          if (registerFieldErrors.password) setRegisterFieldErrors(prev => ({ ...prev, password: '' }));
                        }}
                        placeholder="••••••••••••"
                        disabled={loading}
                        aria-invalid={!!registerFieldErrors.password}
                        aria-describedby={registerFieldErrors.password ? 'reg-password-error' : undefined}
                        className={`w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                          registerFieldErrors.password
                            ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registerFieldErrors.password && (
                      <p id="reg-password-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-confirm-password" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        value={registerForm.confirmPassword}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                          if (registerFieldErrors.confirmPassword) setRegisterFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        placeholder="••••••••••••"
                        disabled={loading}
                        aria-invalid={!!registerFieldErrors.confirmPassword}
                        aria-describedby={registerFieldErrors.confirmPassword ? 'reg-confirm-error' : undefined}
                        className={`w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border rounded-xl focus:outline-hidden transition-colors ${
                          registerFieldErrors.confirmPassword
                            ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registerFieldErrors.confirmPassword && (
                      <p id="reg-confirm-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={registerForm.agreeTerms}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, agreeTerms: e.target.checked });
                          if (registerFieldErrors.agreeTerms) setRegisterFieldErrors(prev => ({ ...prev, agreeTerms: '' }));
                        }}
                        disabled={loading}
                        className="rounded border-slate-300 text-[#ff3b47] focus:ring-[#ff3b47] w-3.5 h-3.5"
                      />
                      <label htmlFor="agreeTerms" className="text-[11px] sm:text-xs text-slate-600">
                        I agree to the <span className="text-slate-900 hover:text-[#ff3b47] font-bold underline cursor-pointer">Terms & Conditions</span>
                      </label>
                    </div>
                    {registerFieldErrors.agreeTerms && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{registerFieldErrors.agreeTerms}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff3b47] hover:bg-[#e62e3a] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating account...</span>
                      </span>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  </form>
                  </>
                )}
              </div>

              <div className="mt-5 text-center text-xs text-slate-500 pt-3 border-t border-slate-200/80">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="font-bold text-slate-900 hover:text-[#ff3b47] hover:underline cursor-pointer"
                >
                  Login
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 py-3">
        Apex Services &copy; {new Date().getFullYear()} • Secure Customer Portal
      </div>
    </div>
  );
};

export default LoginPage;
