import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { ShieldCheck, ArrowRight, RefreshCw, Smartphone, Mail, CheckCircle } from 'lucide-react';

export const ContactVerificationScreen = ({ onVerified }) => {
  const { partner } = usePartner();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index, val) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      setIsVerifying(false);
      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 1000);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center mb-4">
        <Smartphone className="w-7 h-7" />
      </div>

      <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
        Step 3 of 4 • Contact Verification
      </span>

      <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-1">
        Verify Your Mobile Number
      </h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        We sent a 6-digit confirmation code to{' '}
        <strong className="text-slate-800 font-semibold">{partner?.phone || '+91 98234 11200'}</strong>{' '}
        and <strong className="text-slate-800 font-semibold">{partner?.email}</strong>.
      </p>

      {/* OTP inputs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex justify-center gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-input-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-13 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF] focus:border-[#3867FF]"
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {infoMessage && <p className="text-xs text-blue-600 font-medium">{infoMessage}</p>}
        {success && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4" /> Contact verified! Proceeding to Deposit...
          </p>
        )}

        {/* Resend info */}
        <div className="text-xs text-slate-500">
          {resendTimer > 0 ? (
            <span>Resend code in {resendTimer}s</span>
          ) : (
            <button
              onClick={() => {
                setResendTimer(30);
                setInfoMessage('A new verification code has been dispatched to your mobile and email.');
                setTimeout(() => setInfoMessage(''), 4000);
              }}
              className="font-bold text-[#3867FF] hover:underline"
            >
              Resend Verification Code
            </button>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full py-3 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isVerifying ? (
            <span>Validating Code...</span>
          ) : (
            <>
              <span>Verify & Continue to Deposit</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
