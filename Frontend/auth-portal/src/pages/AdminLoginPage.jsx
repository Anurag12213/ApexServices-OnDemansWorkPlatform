import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, BarChart2, Users, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ApexLogo from '../components/common/ApexLogo';
import GoogleButton from '../components/common/GoogleButton';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import authService from '../services/authService';

export const AdminLoginPage = () => {
  const [loginTab, setLoginTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'admin@apexservices.com',
      mobileNumber: '9999999999',
      password: 'admin123',
      keepSignedIn: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        password: data.password,
        role: 'ROLE_ADMIN',
      };
      if (loginTab === 'email') payload.email = data.email;
      else payload.mobileNumber = data.mobileNumber;

      await authService.login(payload);
      navigate('/dashboard/admin');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Administrative authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('Enterprise Google SSO requires Google Cloud Client ID configuration.');
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Matching Screenshot: Admin Login (Desktop) */}
      <div className="w-full max-w-[960px] rounded-[32px] bg-gradient-to-br from-[#F5F0FF] via-[#FAF7FF] to-white p-6 sm:p-8 lg:p-10 shadow-xl border border-purple-100 flex flex-col md:flex-row gap-8 items-stretch justify-between relative overflow-hidden">
        
        {/* LEFT COLUMN: HERO & FEATURES & IMAGE */}
        <div className="flex-1 flex flex-col justify-between pr-0 md:pr-4">
          <div>
            {/* Logo + Portal Badge */}
            <div className="mb-6">
              <ApexLogo portal="admin" />
            </div>

            {/* Headline & Subtitle */}
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 leading-tight tracking-tight">
              Platform Management Made Simple
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed max-w-md">
              Manage users, partners, service requests and operations all in one place.
            </p>

            {/* 3 Value Propositions with Icons */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Monitor Operations
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Manage Users & Partners
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Platform Settings
                </span>
              </div>
            </div>
          </div>

          {/* Admin Image in bottom-left */}
          <div className="mt-8 rounded-2xl overflow-hidden shadow-md border-2 border-white max-w-sm max-h-48 sm:max-h-56">
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
              alt="Admin examining operations dashboard"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING WHITE LOGIN CARD */}
        <div className="w-full md:w-[380px] shrink-0 bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-purple-950/5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Login to your Admin account
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Segmented Tabs: Email | Mobile Number */}
            <div className="bg-[#F1F5F9] p-1 rounded-xl flex items-center mb-4">
              <button
                type="button"
                onClick={() => setLoginTab('email')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginTab === 'email'
                    ? 'bg-[#EDE9FE] text-[#6D28D9] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('mobile')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginTab === 'mobile'
                    ? 'bg-[#EDE9FE] text-[#6D28D9] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mobile Number
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {loginTab === 'email' ? (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="admin@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      {...register('mobileNumber')}
                      placeholder="+91 99999 99999"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-colors"
                    />
                  </div>
                </div>
              )}

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
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-colors"
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

              {/* Keep me signed in & Forgot password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    {...register('keepSignedIn')}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] sm:text-xs">Keep me signed in</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] sm:text-xs font-semibold text-purple-700 hover:text-purple-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#6B21A8] hover:bg-[#581C87] active:scale-[0.99] text-white shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
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
              <span className="relative px-3 bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                OR
              </span>
            </div>

            {/* Google Button */}
            <GoogleButton
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              label="Continue with Google"
            />
          </div>

          {/* Support Notice */}
          <div className="mt-5 text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Authorized personnel only. </span>
            <a
              href="mailto:support@apexservices.internal"
              className="font-bold text-purple-700 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>

      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        portal="admin"
      />
    </div>
  );
};

export default AdminLoginPage;
