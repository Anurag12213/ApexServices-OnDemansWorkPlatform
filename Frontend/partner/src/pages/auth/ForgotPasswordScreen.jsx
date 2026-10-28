import React, { useState } from 'react';
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordScreen = ({ onBackToLogin }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
      <button
        onClick={onBackToLogin}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Login</span>
      </button>

      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Reset Your Password
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Enter your registered email address or phone number and we will send secure recovery instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recovery Link Dispatched</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              If an active partner account is registered with the details provided, a password reset link and temporary security token have been transmitted. Please check your inbox and SMS.
            </p>
          </div>
          <button
            onClick={onBackToLogin}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
          >
            Return to Partner Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. rajesh.partner@apexservices.in"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? <span>Generating Token...</span> : <span>Send Recovery Instructions</span>}
          </button>
        </form>
      )}
    </div>
  );
};
