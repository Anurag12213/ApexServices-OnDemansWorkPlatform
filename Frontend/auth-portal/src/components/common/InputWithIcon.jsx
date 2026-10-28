import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const InputWithIcon = ({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  portal = 'customer',
  error,
  register,
  disabled = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const focusRingStyles = {
    customer: 'focus:border-blue-500 focus:ring-3 focus:ring-blue-100',
    partner: 'focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100',
    admin: 'focus:border-purple-600 focus:ring-3 focus:ring-purple-100',
  };

  const focusStyle = focusRingStyles[portal] || focusRingStyles.customer;

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 select-none">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        )}

        <input
          id={id}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          disabled={disabled}
          {...(register ? register(name) : {})}
          {...rest}
          className={`w-full py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 bg-white border rounded-xl outline-hidden transition-all duration-200 placeholder:text-slate-400 ${
            Icon ? 'pl-10 sm:pl-11' : 'pl-3.5'
          } ${isPassword ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-100'
              : `border-slate-200 hover:border-slate-300 ${focusStyle}`
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-slate-500" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 font-medium mt-0.5 animate-fadeIn">
          {error.message || error}
        </p>
      )}
    </div>
  );
};

export default InputWithIcon;
