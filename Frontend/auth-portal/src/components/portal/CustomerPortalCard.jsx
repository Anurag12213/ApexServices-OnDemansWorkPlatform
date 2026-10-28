import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import ApexLogo from '../common/ApexLogo';
import GoogleButton from '../common/GoogleButton';
import { ForgotPasswordModal } from '../auth/ForgotPasswordModal';
import { CustomerRegisterModal } from '../auth/CustomerRegisterModal';
import authService from '../../services/authService';

export const CustomerPortalCard = ({ onLoginSuccess }) => {
  const [loginTab, setLoginTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'customer@apexservices.com',
      mobileNumber: '9876543211',
      password: 'customer123',
      keepSignedIn: true,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        password: data.password,
        role: 'ROLE_CUSTOMER',
      };
      if (loginTab === 'email') {
        payload.email = data.email;
      } else {
        payload.mobileNumber = data.mobileNumber;
      }

      const res = await authService.login(payload);
      setSuccessMessage(`Welcome back, ${res.user.fullName}!`);
      if (onLoginSuccess) onLoginSuccess(res);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('Google Sign-In requires OAuth Client ID configuration.');
  };

  return (
    <>
      <div className="w-full max-w-[420px] rounded-[32px] bg-gradient-to-b from-[#EBF3FF] via-[#F3F7FD] to-[#F8FAFC] p-4 sm:p-5 shadow-xl border border-blue-100/80 flex flex-col justify-between transition-all duration-300">
        
        {/* TOP HERO HEADER */}
        <div className="pt-2 px-1 pb-4">
          {/* Logo & Badge */}
          <div className="mb-4">
            <ApexLogo portal="customer" />
          </div>

          {/* Headline + Subtitle + Hero Cutout Image */}
          <div className="flex items-start justify-between gap-3 min-h-[110px]">
            <div className="flex-1 pr-1">
              <h2 className="text-[19px] sm:text-[21px] font-black text-slate-900 leading-tight tracking-tight">
                Book Home Services Easily and Securely
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-snug">
                Find trusted professionals for cleaning, repairs, installations and more.
              </p>
            </div>

            {/* Top-Right Lifestyle Hero Image */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-white bg-blue-100">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80"
                alt="Happy customer booking services"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* FLOATING WHITE LOGIN CARD */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-blue-900/5 border border-slate-100/90 text-left">
          <div className="text-center mb-5">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Login to your Customer account
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Segmented Tabs: Email | Mobile Number */}
          <div className="bg-[#F1F5F9] p-1 rounded-xl flex items-center mb-4">
            <button
              type="button"
              onClick={() => setLoginTab('email')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                loginTab === 'email'
                  ? 'bg-[#DBEAFE] text-[#1E40AF] shadow-xs'
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
                  ? 'bg-[#DBEAFE] text-[#1E40AF] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mobile Number
            </button>
          </div>

          {/* Login Form */}
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
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
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

            {/* Keep me signed in & Forgot password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  {...register('keepSignedIn')}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] sm:text-xs">Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#1E5AE6] hover:bg-blue-700 active:scale-[0.99] text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
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

          {/* Registration link */}
          <div className="mt-4 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* BOTTOM VALUE PROPS BAR */}
        <div className="mt-4 pt-2 px-1 flex items-center justify-between text-center gap-2">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-none">Book Services</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Quick & Easy</span>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-none">Verified</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Professionals</span>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-none">Track</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Your Bookings</span>
          </div>
        </div>

      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        portal="customer"
      />

      <CustomerRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => setShowRegisterModal(false)}
      />
    </>
  );
};

export default CustomerPortalCard;
