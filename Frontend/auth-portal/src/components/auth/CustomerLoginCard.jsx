import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import ApexLogo from '../common/ApexLogo';
import SegmentedTab from '../common/SegmentedTab';
import InputWithIcon from '../common/InputWithIcon';
import GoogleButton from '../common/GoogleButton';
import ValuePropsBar from '../common/ValuePropsBar';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { CustomerRegisterModal } from './CustomerRegisterModal';
import authService from '../../services/authService';

export const CustomerLoginCard = ({ compact = false, onLoginSuccess }) => {
  const [loginTab, setLoginTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'customer@apexservices.com',
      mobileNumber: '9876543211',
      password: 'customer123',
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
        role: 'ROLE_CUSTOMER',
      };

      if (loginTab === 'email') {
        payload.email = data.email;
      } else {
        payload.mobileNumber = data.mobileNumber;
      }

      const res = await authService.login(payload);
      setSuccessMessage(`Welcome back, ${res.user.fullName}! Redirecting to customer dashboard...`);
      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Invalid credentials. Please verify and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('Google Sign-In requires OAuth Client ID configuration. Please log in with your email/mobile and password.');
  };

  return (
    <>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10">
        <div>
          {/* Header */}
          <div className="flex flex-col items-start gap-1 mb-6">
            <ApexLogo portal="customer" size="md" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
              Customer Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Book Home Services Easily and Securely
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
              portal="customer"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginTab === 'email' ? (
              <InputWithIcon
                id="customer-email"
                name="email"
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                icon={Mail}
                portal="customer"
                register={register}
                error={errors.email?.message}
                disabled={isLoading}
              />
            ) : (
              <InputWithIcon
                id="customer-mobile"
                name="mobileNumber"
                label="Mobile Number"
                type="tel"
                placeholder="+91 98765 43210"
                icon={Phone}
                portal="customer"
                register={register}
                error={errors.mobileNumber?.message}
                disabled={isLoading}
              />
            )}

            <InputWithIcon
              id="customer-password"
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              portal="customer"
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
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign In as Customer</span>
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
            label="Sign in with Google"
          />

          {/* Registration Prompt */}
          <div className="mt-5 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Value Props Footer */}
        {!compact && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <ValuePropsBar portal="customer" />
          </div>
        )}
      </div>

      {/* Modals */}
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

export default CustomerLoginCard;
