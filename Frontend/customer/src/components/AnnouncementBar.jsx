import React from 'react';
import { useData } from '../context/DataContext';
import { Bell } from 'lucide-react';

export const AnnouncementBar = () => {
  const { data, siteBranding } = useData();
  const { announcement } = data;
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';

  if (!announcement || !announcement.enabled) return null;

  return (
    <div className="bg-[#0A2540] text-slate-200 text-xs sm:text-sm py-2.5 px-4 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2.5 font-medium text-center">
        <span
          className="text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
          style={{ backgroundColor: brandDotColor }}
        >
          Notice
        </span>
        <p className="truncate text-xs font-semibold">{announcement.text}</p>
      </div>
    </div>
  );
};
