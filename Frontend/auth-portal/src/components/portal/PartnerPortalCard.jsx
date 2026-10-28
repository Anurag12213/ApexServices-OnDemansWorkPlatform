import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight, User, Users, ChevronRight } from 'lucide-react';
import ApexLogo from '../common/ApexLogo';
import GoogleButton from '../common/GoogleButton';
import { ForgotPasswordModal } from '../auth/ForgotPasswordModal';
import { PartnerOnboardingModal } from '../auth/PartnerOnboardingModal';
import authService from '../../services/authService';

export const PartnerPortalCard = ({ onLoginSuccess }) => {
  const [loginTab, setLoginTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'partner@apexservices.com',
      mobileNumber: '9123456780',
      password: 'partner123',
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
        role: 'ROLE_PARTNER',
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
      setErrorMessage(err?.response?.data?.message || err?.message || 'Invalid partner credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('Partner Google SSO requires OAuth Client ID configuration.');
  };

  return (
    <>
      <div className="w-full max-w-[420px] rounded-[32px] bg-gradient-to-b from-[#E8FAF0] via-[#F2FCF6] to-[#F8FAFC] p-4 sm:p-5 shadow-xl border border-emerald-100/80 flex flex-col justify-between transition-all duration-300">
        
        {/* TOP HERO HEADER */}
        <div className="pt-2 px-1 pb-4">
          {/* Logo & Badge */}
          <div className="mb-4">
            <ApexLogo portal="partner" />
          </div>

          {/* Headline + Subtitle + Hero Cutout Image */}
          <div className="flex items-start justify-between gap-3 min-h-[110px]">
            <div className="flex-1 pr-1">
              <h2 className="text-[19px] sm:text-[21px] font-black text-slate-900 leading-tight tracking-tight">
                Grow Your Business With More Opportunities
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-snug">
                Join as a partner and get consistent service requests in your area.
              </p>
            </div>

            {/* Top-Right Technician Hero Image */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-white bg-emerald-100">
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80"
                alt="Partner technician with service vehicle"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* FLOATING WHITE LOGIN CARD */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-emerald-950/5 border border-slate-100/90 text-left">
          <div className="text-center mb-5">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Login to your Partner account
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
                  ? 'bg-[#DCFCE7] text-[#15803D] shadow-xs'
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
                  ? 'bg-[#DCFCE7] text-[#15803D] shadow-xs'
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
                    placeholder="partner@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
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
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
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
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] sm:text-xs">Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
            <span>New to Apex Services? </span>
            <button
              type="button"
              onClick={() => setShowOnboardingModal(true)}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Register as a Partner
            </button>
          </div>
        </div>

        {/* BOTTOM PARTNER ONBOARDING CALLOUT BOX */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#E8F8F0] border border-emerald-200/70 text-left">
          <div
            onClick={() => setShowOnboardingModal(true)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                Not a Partner yet?
              </h4>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                Join as an Individual or Organization partner and start getting service requests today.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 2 Quick Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-200/60">
            <button
              type="button"
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-xs transition-all text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900 truncate">Individual Partner</div>
                <div className="text-[9px] text-slate-500 truncate">Work independently</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-xs transition-all text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900 truncate">Organization Partner</div>
                <div className="text-[9px] text-slate-500 truncate">Build a team & grow</div>
              </div>
            </button>
          </div>
        </div>

      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        portal="partner"
      />

      <PartnerOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
    </>
  );
};

export default PartnerPortalCard;
