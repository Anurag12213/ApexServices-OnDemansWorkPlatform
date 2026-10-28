import React from 'react';
import { CalendarCheck, ShieldCheck, MapPin, BarChart3, Users, Settings, Wallet, Clock, TrendingUp } from 'lucide-react';

export const ValuePropsBar = ({ portal = 'customer' }) => {
  const customerProps = [
    {
      icon: CalendarCheck,
      title: 'Book Services',
      subtitle: 'Quick & Easy',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: ShieldCheck,
      title: 'Verified',
      subtitle: 'Professionals',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: 'Track',
      subtitle: 'Your Bookings',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  const adminProps = [
    {
      icon: BarChart3,
      title: 'Monitor',
      subtitle: 'Operations',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: Users,
      title: 'Manage',
      subtitle: 'Users & Partners',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: Settings,
      title: 'Platform',
      subtitle: 'Settings',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const partnerProps = [
    {
      icon: Wallet,
      title: 'Fast Payouts',
      subtitle: 'Direct to Bank',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Clock,
      title: 'Flexible Hours',
      subtitle: 'Be Your Own Boss',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: TrendingUp,
      title: 'Verified Leads',
      subtitle: 'Daily Requests',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  const props =
    portal === 'admin'
      ? adminProps
      : portal === 'partner'
      ? partnerProps
      : customerProps;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 mt-2 border-t border-slate-100">
      {props.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl transition-all hover:bg-slate-50/80">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${item.bg} flex items-center justify-center mb-1.5`}>
              <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${item.color}`} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
              {item.title}
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">
              {item.subtitle}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ValuePropsBar;
