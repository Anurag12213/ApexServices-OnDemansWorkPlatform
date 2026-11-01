import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ShieldCheck, Calendar, MapPin, Zap, CreditCard, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import ApexLogo from '../components/ApexLogo';
import GoogleButton from '../components/GoogleButton';
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

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loginTab, setLoginTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

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
    } else if (registerForm.password.length < 6) {
      newRegErrors.password = 'Password must be at least 6 characters long.';
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
    setLoading(true);

    try {
      const cleanEmail = emailTrimmed ? formatEmail(emailTrimmed) : undefined;
      const cleanPhone = mobileTrimmed ? formatPhone(mobileTrimmed) : undefined;

      const res = await registerCustomer(
        cleanFullName,
        cleanEmail || `${cleanPhone}@customer.apex`,
        cleanPhone || '9999999999',
        registerForm.password
      );
      if (!res.success) {
        setError(res.error || 'Registration failed. Email or mobile may already be registered.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
                      onClick={() => toast.success('Password reset instructions have been sent to your registered contact.', 'Password Recovery')}
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
