import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Home, Zap, Calendar, IndianRupee, User, Wrench } from 'lucide-react';

export const BottomNavigation = () => {
  const { activeTab, setActiveTab, offers, activeJob } = usePartner();

  const pendingOffersCount = (offers || []).filter(o => o.status === 'PENDING').length;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    {
      id: 'requests',
      label: 'Requests',
      icon: Zap,
      badge: pendingOffersCount > 0 ? pendingOffersCount : null
    },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: IndianRupee },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-[#3867FF]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
