import React from 'react';

export const SegmentedTab = ({ activeTab, onChange, portal = 'customer' }) => {
  const activeStyles = {
    customer: 'bg-blue-100/90 text-blue-700 font-bold shadow-xs',
    partner: 'bg-emerald-100/90 text-emerald-800 font-bold shadow-xs',
    admin: 'bg-purple-100/90 text-purple-800 font-bold shadow-xs',
  };

  const currentActiveStyle = activeStyles[portal] || activeStyles.customer;

  return (
    <div className="w-full bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
      <button
        type="button"
        onClick={() => onChange('email')}
        className={`flex-1 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 text-center ${
          activeTab === 'email'
            ? currentActiveStyle
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        Email
      </button>

      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`flex-1 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 text-center ${
          activeTab === 'mobile'
            ? currentActiveStyle
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        Mobile Number
      </button>
    </div>
  );
};

export default SegmentedTab;
