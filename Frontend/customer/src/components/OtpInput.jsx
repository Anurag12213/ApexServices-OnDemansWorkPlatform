import React, { useRef, useEffect } from 'react';

/**
 * 6-Digit Accessible OTP Input Component.
 * Supports auto-focus, auto-advance, backspace navigation, and full-string clipboard pasting.
 */
export const OtpInput = ({ value = '', onChange, length = 6, disabled = false, error = false }) => {
  const inputRefs = useRef([]);

  // Ensure digits array matches length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleInputChange = (index, e) => {
    const rawVal = e.target.value;
    const char = rawVal.slice(-1); // Take last entered character

    if (char && !/^\d+$/.test(char)) return; // Allow numbers only

    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!pastedData) return;

    const numericOnly = pastedData.replace(/\D/g, '').slice(0, length);
    if (!numericOnly) return;

    onChange(numericOnly);

    // Focus on the next empty digit or last digit
    const nextIdx = Math.min(numericOnly.length, length - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index] || ''}
          onChange={(e) => handleInputChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-black rounded-xl border bg-white text-slate-900 transition-all select-none focus:outline-hidden ${
            error
              ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-200'
              : 'border-slate-300 focus:border-[#ff3b47] focus:ring-2 focus:ring-[#ff3b47]/20 shadow-xs'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
