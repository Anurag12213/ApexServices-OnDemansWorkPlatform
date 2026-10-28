import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Lock, Loader2, AlertCircle, CheckCircle2, ShieldAlert, LifeBuoy } from 'lucide-react';
import ApexLogo from '../common/ApexLogo';
import SegmentedTab from '../common/SegmentedTab';
import InputWithIcon from '../common/InputWithIcon';
import GoogleButton from '../common/GoogleButton';
import ValuePropsBar from '../common/ValuePropsBar';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import authService from '../../services/authService';

export const AdminLoginCard = ({ compact = false, onLoginSuccess }) => {
  const [loginTab, setLoginTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@apexservices.com',
      mobileNumber: '9999999999',
      password: 'admin123',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        password: data.password,
        role: 'ROLE_ADMIN',
      };

      if (loginTab === 'email') {
        payload.email = data.email;
      } else {
        payload.mobileNumber = data.mobileNumber;
      }

      const res = await authService.login(payload);
      setSuccessMessage(`Administrator privileges verified. Welcome, ${res.user.fullName}! Redirecting to Admin Console...`);
      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Administrative authentication failed. Access denied.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('Enterprise Google SSO requires Google Cloud Console Client ID configuration. Please authenticate using administrator credentials.');
  };

  return (
    <>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-950/5 border border-slate-100 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/10">
        <div>
          {/* Header */}
          <div className="flex flex-col items-start gap-1 mb-5">
            <ApexLogo portal="admin" size="md" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
              Admin Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Platform Management Made Simple
            </p>
          </div>

          {/* Security Notice Banner */}
          <div className="mb-5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Restricted Gateway:</span> Authorized personnel only. All access attempts and administrative sessions are strictly monitored and audited.
            </div>
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
              portal="admin"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginTab === 'email' ? (
              <InputWithIcon
                id="admin-email"
                name="email"
                label="Administrator Email"
                type="email"
                placeholder="admin@apexservices.internal"
                icon={Mail}
                portal="admin"
                register={register}
                error={errors.email?.message}
                disabled={isLoading}
              />
            ) : (
              <InputWithIcon
                id="admin-mobile"
                name="mobileNumber"
                label="Registered Emergency Contact"
                type="tel"
                placeholder="+91 99999 99999"
                icon={Phone}
                portal="admin"
                register={register}
                error={errors.mobileNumber?.message}
                disabled={isLoading}
              />
            )}

            <InputWithIcon
              id="admin-password"
              name="password"
              label="Master Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              portal="admin"
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
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                />
                <span>Keep session active</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-semibold text-purple-700 hover:text-purple-800 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white shadow-lg shadow-purple-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying security credentials...</span>
                </>
              ) : (
                <span>Secure Administrator Login</span>
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

          {/* Google SSO Button */}
          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            label="Sign in with Enterprise SSO"
          />

          {/* Support Notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
            <LifeBuoy className="w-4 h-4 text-slate-400" />
            <span>Need platform access? </span>
            <a
              href="mailto:security@apexservices.internal"
              className="font-bold text-purple-700 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* Value Props Footer */}
        {!compact && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <ValuePropsBar portal="admin" />
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        portal="admin"
      />
    </>
  );
};

export default AdminLoginCard;
