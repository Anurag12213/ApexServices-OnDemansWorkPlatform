import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import authService from '../../services/authService';

export const ForgotPasswordModal = ({ isOpen, onClose, portal = 'customer' }) => {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const themeBtn = {
    customer: 'bg-blue-600 hover:bg-blue-700 text-white',
    partner: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    admin: 'bg-purple-600 hover:bg-purple-700 text-white',
  }[portal];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered email or mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.requestPasswordReset(identifier);
      setSubmitted(true);
    } catch {
      setError('Unable to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-700">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Reset your password</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Enter your registered email address or mobile number and we will send you verification instructions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. user@example.com or +919876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full py-2.5 px-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
                {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${themeBtn}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send Reset Instructions</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Instructions Sent!</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              We have dispatched a verification code & reset link to <strong className="text-slate-900">{identifier}</strong>. Please check your inbox or SMS.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
