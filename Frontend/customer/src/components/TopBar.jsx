import React from 'react';
import { useData } from '../context/DataContext';
import { Clock, PhoneCall, Mail } from 'lucide-react';

export const TopBar = () => {
  const { data, publicConfig, siteBranding } = useData();
  const { announcement } = data || {};
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';
  const activeAnnouncement = (announcement && announcement.enabled && announcement.text) || siteBranding?.announcement || publicConfig?.announcement;
  const operatingHours = siteBranding?.headerOperatingHours || "MON - SAT: 7:00 AM - 9:00 PM | SUN: EMERGENCY DISPATCH";
  const supportPhone = siteBranding?.supportPhone || publicConfig?.supportPhone || '+91 1800 200 4567';
  const supportEmail = siteBranding?.supportEmail || publicConfig?.supportEmail || 'support@apexservices.com';

  return (
    <div className="bg-[#0A2540] text-slate-300 text-xs py-1.5 sm:py-2 px-2.5 sm:px-6 lg:px-8 border-b border-slate-800/80 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Timing & Operating Hours */}
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium min-w-0">
          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: brandDotColor }} />
          {/* Detailed text on desktop/tablet (>= 768px) */}
          <span className="hidden md:inline tracking-tight sm:tracking-wide text-xs truncate">
            {operatingHours}
          </span>
          {/* Concise text on mobile (< 768px) */}
          <span className="md:hidden text-[10px] sm:text-[11px] tracking-tight truncate font-medium">
            Mon - Sat: 7am - 9pm | 24/7 Dispatch
          </span>
        </div>

        {/* Center: Global Announcement */}
        {activeAnnouncement && (
          <div className="hidden xl:flex items-center space-x-2 text-white font-medium shrink-0">
            <span className="text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider" style={{ backgroundColor: brandDotColor }}>
              NOTICE
            </span>
            <span className="truncate max-w-xs text-xs">{activeAnnouncement}</span>
          </div>
        )}

        {/* Right: Customer Contact */}
        <div className="flex items-center justify-end gap-x-2 sm:gap-x-4 shrink-0 text-[10px] sm:text-xs text-slate-300">
          <a
            href={`tel:${supportPhone}`}
            className="hover:text-white transition-colors flex items-center gap-1 font-semibold whitespace-nowrap"
            title={`Call Support: ${supportPhone}`}
          >
            <PhoneCall className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: brandDotColor }} />
            <span className="hidden sm:inline">{supportPhone}</span>
            <span className="sm:hidden text-[10px] font-bold">{supportPhone.replace('+91 ', '')}</span>
          </a>
          <a
            href={`mailto:${supportEmail}`}
            className="hover:text-white transition-colors hidden sm:flex items-center gap-1.5"
            title={`Email Support: ${supportEmail}`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: brandDotColor }} />
            <span className="truncate max-w-[150px]">{supportEmail}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
