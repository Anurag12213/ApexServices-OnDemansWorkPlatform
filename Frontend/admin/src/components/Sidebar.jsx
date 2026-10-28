import React from 'react';
import {
  PieChart,
  Radio,
  Users,
  Image,
  CreditCard,
  Mail,
  BarChart3,
  Settings,
  ExternalLink,
  ShieldCheck,
  Palette,
  Layers,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarCollapsed }) {
  const navigationGroups = [
    {
      groupTitle: 'Overview',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: PieChart },
      ],
    },
    {
      groupTitle: 'Service Management',
      items: [
        { id: 'categories', name: 'Service Categories', icon: Layers, badge: 'Active' },
        { id: 'operations', name: 'Service Operations', icon: Radio, badge: 'Live' },
      ],
    },
    {
      groupTitle: 'Financial Management',
      items: [
        { id: 'payments', name: 'Payment & Transactions', icon: CreditCard },
      ],
    },
    {
      groupTitle: 'Platform Management',
      items: [
        { id: 'users', name: 'User Management', icon: Users },
        { id: 'content', name: 'Website & Header Control', icon: Palette, badge: 'Customizable' },
        { id: 'notifications', name: 'Notifications & Email', icon: Mail },
        { id: 'reports', name: 'Reports Import/Export', icon: BarChart3 },
        { id: 'settings', name: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900 text-slate-300 flex flex-col min-h-screen transition-all duration-300 relative z-30 select-none text-left`}
    >
      {/* Brand Logo & Name */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            AS
          </div>
          {!sidebarCollapsed && (
            <div className="truncate">
              <span className="font-bold text-base text-white tracking-wide block truncate">
                ApexServices Admin
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                CONTROL CENTER
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-thin">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!sidebarCollapsed ? (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">
                {group.groupTitle}
              </div>
            ) : (
              groupIdx > 0 && <div className="border-t border-slate-800 my-2" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.name : ''}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                  } py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Customer Site Preview Link */}
      <div className="px-3 pb-3">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition`}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Customer Portal</span>
            </div>
          )}
          <ExternalLink className="w-4 h-4 text-blue-400" />
        </a>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 flex items-center space-x-3 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          alt="Admin Avatar"
          className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
        />
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Sarah Jenkins</p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400 inline" /> Master Admin
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
