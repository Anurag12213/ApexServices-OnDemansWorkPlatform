import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Zap, ShieldCheck, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ApexLogo from '../components/common/ApexLogo';
import authService from '../services/authService';

export const CustomerRegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true,
    },
  });

  const onSubmit = async (data) => {
    if (!data.fullName.trim()) {
      setErrorMessage('Full name is required');
      return;
    }
    if (!data.email.trim() && !data.mobileNumber.trim()) {
      setErrorMessage('Please provide either an email or a mobile number');
      return;
    }
    if (data.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (data.password !== data.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!data.agreeTerms) {
      setErrorMessage('You must agree to the Terms & Conditions');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await authService.register({
        fullName: data.fullName,
        email: data.email.trim() || undefined,
        mobileNumber: data.mobileNumber.trim() || undefined,
        password: data.password,
        role: 'ROLE_CUSTOMER',
      });
      navigate('/dashboard/customer');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Matching Screenshot: Customer Registration (Desktop) */}
      <div className="w-full max-w-[960px] rounded-[32px] bg-gradient-to-br from-[#EBF3FF] via-[#F4F8FD] to-white p-6 sm:p-8 lg:p-10 shadow-xl border border-blue-100 flex flex-col md:flex-row gap-8 items-stretch justify-between relative overflow-hidden">
        
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
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Quick & Easy Booking
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Verified Professionals
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Safe & Secure Payments
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl overflow-hidden shadow-md border-2 border-white max-w-sm max-h-48 sm:max-h-56">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
              alt="Happy customer"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING WHITE REGISTRATION CARD */}
        <div className="w-full md:w-[400px] shrink-0 bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Fill in your details to get started
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Email address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    {...register('mobileNumber')}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  {...register('agreeTerms')}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <label htmlFor="agreeTerms" className="text-[11px] sm:text-xs text-slate-600">
                  I agree to the <span className="text-blue-600 font-semibold hover:underline cursor-pointer">Terms & Conditions</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#1E5AE6] hover:bg-blue-700 active:scale-[0.99] text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Already have an account? </span>
            <Link
              to="/login/customer"
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerRegisterPage;
