import React from 'react';

export const ApexLogo = ({ portal = 'admin', className = '' }) => {
  const colorMap = {
    customer: {
      primary: '#2563EB',
      secondary: '#1D4ED8',
      pillBg: 'bg-blue-100/80',
      pillText: 'text-blue-700',
      badgeText: 'CUSTOMER PORTAL',
    },
    partner: {
      primary: '#16A34A',
      secondary: '#15803D',
      pillBg: 'bg-emerald-100/80',
      pillText: 'text-emerald-700',
      badgeText: 'PARTNER PORTAL',
    },
    admin: {
      primary: '#7C3AED',
      secondary: '#6D28D9',
      pillBg: 'bg-purple-100/80',
      pillText: 'text-purple-700',
      badgeText: 'ADMIN PORTAL',
    },
  };

  const theme = colorMap[portal] || colorMap.admin;

  return (
    <div className={`flex flex-col items-start gap-2.5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
            <path d="M24 6L6 42H18L24 30L30 42H42L24 6Z" fill={theme.primary} />
            <path d="M24 16L15 34H21L24 28L27 34H33L24 16Z" fill="#FFFFFF" />
            <path d="M24 6L42 42H30L24 30V6Z" fill={theme.secondary} opacity="0.25" />
          </svg>
        </div>

        <div className="flex flex-col leading-none">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
            APEX
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-slate-600 uppercase">
            SERVICES
          </span>
        </div>
      </div>

      <div className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${theme.pillBg} ${theme.pillText}`}>
        {theme.badgeText}
      </div>
    </div>
  );
};

export default ApexLogo;
