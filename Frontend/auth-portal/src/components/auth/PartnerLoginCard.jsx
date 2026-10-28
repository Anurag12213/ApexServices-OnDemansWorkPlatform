import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Lock, Loader2, AlertCircle, CheckCircle2, User, Users, ChevronRight } from 'lucide-react';
import ApexLogo from '../common/ApexLogo';
import SegmentedTab from '../common/SegmentedTab';
import InputWithIcon from '../common/InputWithIcon';
import GoogleButton from '../common/GoogleButton';
import ValuePropsBar from '../common/ValuePropsBar';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { PartnerOnboardingModal } from './PartnerOnboardingModal';
import authService from '../../services/authService';

export const PartnerLoginCard = ({ compact = false, onLoginSuccess }) => {
  const [loginTab, setLoginTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'partner@apexservices.com',
      mobileNumber: '9123456780',
      password: 'partner123',
      rememberMe: true,
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
      setSuccessMessage(`Welcome back, ${res.user.fullName}! Redirecting to partner dashboard...`);
      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Invalid partner credentials. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('Partner Google SSO requires OAuth Client ID configuration. Please log in with your verified partner credentials.');
  };

  return (
    <>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-slate-100 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/10">
        <div>
          {/* Header */}
          <div className="flex flex-col items-start gap-1 mb-6">
            <ApexLogo portal="partner" size="md" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
              Partner Hub Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Grow Your Business With More Opportunities
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="mb-5">
            <SegmentedTab
              activeTab={loginTab}
              onChange={(tab) => {
                setLoginTab(tab);
                setErrorMessage('');
              }}
              portal="partner"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginTab === 'email' ? (
              <InputWithIcon
                id="partner-email"
                name="email"
                label="Partner Email Address"
                type="email"
                placeholder="partner@example.com"
                icon={Mail}
                portal="partner"
                register={register}
                error={errors.email?.message}
                disabled={isLoading}
              />
            ) : (
              <InputWithIcon
                id="partner-mobile"
                name="mobileNumber"
                label="Registered Mobile Number"
                type="tel"
                placeholder="+91 98765 43210"
                icon={Phone}
                portal="partner"
                register={register}
                error={errors.mobileNumber?.message}
                disabled={isLoading}
              />
            )}

            <InputWithIcon
              id="partner-password"
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              portal="partner"
              register={register}
              error={errors.password?.message}
              disabled={isLoading}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating partner account...</span>
                </>
              ) : (
                <span>Sign In to Partner Hub</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              or continue with
            </span>
          </div>

          {/* Google Button */}
          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            label="Sign in with Partner Google ID"
          />

          {/* Partner Onboarding Callout Box */}
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Not an Apex Partner yet?
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                Join Today
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mb-3">
              Join thousands of skilled service providers. Select your preferred model to register:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-300/80 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Individual</div>
                    <div className="text-[10px] text-slate-500">Solo Pro</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-300/80 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Organization</div>
                    <div className="text-[10px] text-slate-500">Agency / Team</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Value Props Footer */}
        {!compact && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <ValuePropsBar portal="partner" />
          </div>
        )}
      </div>

      {/* Modals */}
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

export default PartnerLoginCard;
