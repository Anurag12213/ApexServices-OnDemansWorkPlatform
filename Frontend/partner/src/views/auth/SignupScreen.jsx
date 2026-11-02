import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import ApexLogo from '../../components/common/ApexLogo';
import { api } from '../../services/api';
import { OtpInput } from '../../components/common/OtpInput';

export const SignupScreen = ({ accountType = 'INDIVIDUAL', onBack, onComplete }) => {
  const { register, brandName } = usePartner();

  const isOrg = accountType === 'ORGANIZATION';

  // State for Individual
  const [individualForm, setIndividualForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // State for Organization
  const [orgForm, setOrgForm] = useState({
    orgName: '',
    businessAddress: '',
    contactPerson: '',
    regNumber: '',
    businessEmail: '',
    businessMobile: '',
    password: 'password123',
    confirmPassword: 'password123',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email OTP Verification State
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300);
  const [infoMessage, setInfoMessage] = useState('');
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    let t;
    if (cooldown > 0) {
      t = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    let t;
    if (otpStep && expiresIn > 0) {
      t = setInterval(() => setExpiresIn((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [otpStep, expiresIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isOrg) {
      if (!individualForm.fullName.trim()) {
        setError('Full name is required');
        return;
      }
      if (!individualForm.email.trim() && !individualForm.phone.trim()) {
        setError('Please provide email or phone');
        return;
      }
      if (individualForm.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (individualForm.password !== individualForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      if (!orgForm.orgName.trim()) {
        setError('Organization name is required');
        return;
      }
      if (!orgForm.contactPerson.trim()) {
        setError('Contact person name is required');
        return;
      }
      if (!orgForm.businessEmail.trim() && !orgForm.businessMobile.trim()) {
        setError('Please provide business email or phone');
        return;
      }
    }

    setIsSubmitting(true);
    const payload = isOrg
      ? {
          fullName: orgForm.contactPerson,
          email: orgForm.businessEmail ? orgForm.businessEmail.trim().toLowerCase() : '',
          phone: orgForm.businessMobile ? orgForm.businessMobile.trim() : '',
          orgName: orgForm.orgName,
          gstin: orgForm.regNumber,
          password: orgForm.password,
          accountType: 'ORGANIZATION',
        }
      : {
          fullName: individualForm.fullName,
          email: individualForm.email ? individualForm.email.trim().toLowerCase() : '',
          phone: individualForm.phone ? individualForm.phone.trim() : '',
          password: individualForm.password,
          accountType: 'INDIVIDUAL',
        };

    // If email is provided, mandate Email OTP verification before account creation
    if (payload.email) {
      setIsSubmitting(true);
      try {
        const res = await api.sendEmailOtp(payload.email, 'REGISTRATION');
        if (res.success) {
          setPendingPayload(payload);
          setCooldown(res.cooldownSeconds || 60);
          setExpiresIn(res.expiresInSeconds || 300);
          setOtp('');
          setOtpStep(true);
          setInfoMessage(`A 6-digit verification code has been dispatched to ${payload.email}`);
        } else {
          setError(res.error || 'Failed to dispatch verification code. Please check your email.');
        }
      } catch (err) {
        setError('Network error sending verification code.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Mobile-Only Registration (No Email Provided)
    setIsSubmitting(true);
    try {
      const res = await register(payload);
      if (res.success) {
        onComplete(res.partner);
      } else {
        setError('Registration could not be completed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setInfoMessage('');

    try {
      const targetEmail = pendingPayload.email.trim().toLowerCase();
      // 1. Verify OTP with backend to receive single-use verification grant
      const verifyRes = await api.verifyEmailOtp(targetEmail, otp, 'REGISTRATION');
      if (!verifyRes.success || !verifyRes.verificationGrant) {
        setError(verifyRes.error || 'Invalid or expired verification code.');
        setIsSubmitting(false);
        return;
      }

      // 2. Complete registration atomically passing the verification grant
      const regRes = await register({
        ...pendingPayload,
        verificationGrant: verifyRes.verificationGrant,
      });

      if (regRes.success) {
        onComplete(regRes.partner);
      } else {
        setError('Registration could not be completed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      const targetEmail = pendingPayload.email.trim().toLowerCase();
      const res = await api.resendEmailOtp(targetEmail, 'REGISTRATION');
      if (res.success) {
        setCooldown(res.cooldownSeconds || 60);
        setExpiresIn(res.expiresInSeconds || 300);
        setOtp('');
        setInfoMessage('A fresh verification code has been dispatched.');
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Network error resending verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[720px] rounded-[32px] bg-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-100 text-left">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <ApexLogo portal="partner" brandName={brandName} />
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Type</span>
          </button>
        </div>

        {/* 4-Step Wizard Indicator */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-8 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Account</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">2</span>
            <span>Profile</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">3</span>
            <span>Services</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">4</span>
            <span>Review</span>
          </div>
        </div>

        {otpStep ? (
          /* ==================== EMAIL OTP VERIFICATION STEP ==================== */
          <div className="max-w-md mx-auto text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center border border-blue-200">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Verify Your Email
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                We sent a 6-digit confirmation code to<br />
                <strong className="text-slate-800 font-bold">{pendingPayload?.email}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
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
                  disabled={isSubmitting}
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
                  disabled={cooldown > 0 || isSubmitting}
                  className="text-[#3867FF] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <span>Creating Partner Account...</span> : <span>Verify & Complete Registration</span>}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => { setOtpStep(false); setError(''); }}
                className="text-xs text-slate-500 hover:text-slate-800 block mx-auto pt-1 underline cursor-pointer"
              >
                Back to Edit Details
              </button>
            </form>
          </div>
        ) : (
          <>
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isOrg ? 'Business Details' : 'Personal Details'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOrg ? 'Tell us about your organization' : 'Tell us about yourself'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
          {!isOrg ? (
            /* ==================== INDIVIDUAL FORM (NO DOCUMENT UPLOAD) ==================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={individualForm.fullName}
                  onChange={(e) => setIndividualForm({ ...individualForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={individualForm.email}
                  onChange={(e) => setIndividualForm({ ...individualForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Mobile Number
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    value={individualForm.phone}
                    onChange={(e) => setIndividualForm({ ...individualForm, phone: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-r-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={individualForm.password}
                    onChange={(e) => setIndividualForm({ ...individualForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
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
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={individualForm.confirmPassword}
                    onChange={(e) => setIndividualForm({ ...individualForm, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
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
            </div>
          ) : (
            /* ==================== ORGANIZATION FORM (NO DOCUMENT UPLOAD) ==================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgForm.orgName}
                  onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                  placeholder="Enter business name"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={orgForm.businessAddress}
                  onChange={(e) => setOrgForm({ ...orgForm, businessAddress: e.target.value })}
                  placeholder="Enter address"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={orgForm.contactPerson}
                  onChange={(e) => setOrgForm({ ...orgForm, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Registration Number (Optional)
                </label>
                <input
                  type="text"
                  value={orgForm.regNumber}
                  onChange={(e) => setOrgForm({ ...orgForm, regNumber: e.target.value })}
                  placeholder="GST / Business Registration No."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={orgForm.businessEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, businessEmail: e.target.value })}
                  placeholder="business@example.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Business Mobile
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    value={orgForm.businessMobile}
                    onChange={(e) => setOrgForm({ ...orgForm, businessMobile: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-r-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Registering...' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
        </>
        )}

      </div>
    </div>
  );
};

export default SignupScreen;
