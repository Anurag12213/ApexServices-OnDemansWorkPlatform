import React from 'react';
import {
  PieChart,
  Calendar,
  Wrench,
  Users,
  CreditCard,
  Tag,
  BarChart3,
  LifeBuoy,
  Mail,
  Palette,
  ShieldAlert,
  Layers,
  ShieldCheck,
  History,
  Sliders,
  Smartphone,
  ArrowUpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarCollapsed }) {
  // The 16 Admin Modules organized into clean, intuitive operational groups
  const navigationGroups = [
    {
      groupTitle: 'Operations & Dispatch',
      items: [
        { id: 'dashboard', name: '9. Live Analytics Dashboard', shortName: 'Analytics', icon: PieChart, badge: 'Live' },
        { id: 'bookings', name: '7. Order / Booking Management', shortName: 'Bookings', icon: Calendar, badge: 'Fleet' },
        { id: 'partners', name: '13. Vendor / Partner Management', shortName: 'Partners', icon: Wrench, badge: 'Fleet' },
        { id: 'users', name: '1. User Management', shortName: 'Users', icon: Users },
      ],
    },
    {
      groupTitle: 'Finance & Growth',
      items: [
        { id: 'payments', name: '3. Payments & Transactions', shortName: 'Payments', icon: CreditCard, badge: 'Escrow' },
        { id: 'coupons', name: '12. Coupons & Discounts', shortName: 'Coupons', icon: Tag, badge: 'Promo' },
        { id: 'reports', name: '5. Reports & Exports', shortName: 'Reports', icon: BarChart3 },
      ],
    },
    {
      groupTitle: 'Support & Messaging',
      items: [
        { id: 'support', name: '8. Support & Ticket Management', shortName: 'Support', icon: LifeBuoy, badge: 'Desk' },
        { id: 'notifications', name: '4. Notifications Center', shortName: 'Push & Mail', icon: Mail },
      ],
    },
    {
      groupTitle: 'Content & Safety',
      items: [
        { id: 'content', name: '2. Content Management (CMS)', shortName: 'CMS', icon: Palette },
        { id: 'moderation', name: '14. Content Moderation', shortName: 'Moderation', icon: ShieldAlert, badge: 'Safety' },
        { id: 'categories', name: 'Service Catalog & Pricing', shortName: 'Services', icon: Layers },
      ],
    },
    {
      groupTitle: 'Governance & Security',
      items: [
        { id: 'roles', name: '6. Roles & Permissions (RBAC)', shortName: 'Roles', icon: ShieldCheck },
        { id: 'audit', name: '10. Audit Logs & History', shortName: 'Audit Logs', icon: History },
        { id: 'feature-flags', name: '11. Feature Flags & Config', shortName: 'Flags', icon: Sliders },
        { id: 'sessions', name: '15. Session & Devices', shortName: 'Sessions', icon: Smartphone, badge: 'Security' },
        { id: 'versions', name: '16. Force-Update & Versions', shortName: 'Versions', icon: ArrowUpCircle },
      ],
    },
  ];

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } bg-slate-900 text-slate-300 flex flex-col min-h-screen transition-all duration-300 relative z-30 select-none text-left border-r border-slate-800`}
    >
      {/* Brand Logo & Name */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
            AS
          </div>
          {!sidebarCollapsed && (
            <div className="truncate">
              <span className="font-extrabold text-sm text-white tracking-wide block truncate">
                Apex<span className="text-blue-500">Services</span> Admin
              </span>
              <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block">
                16 Business Modules
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!sidebarCollapsed ? (
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">
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
                  } py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate text-[11px] font-semibold">{item.name}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Customer & Partner Site Links */}
      <div className="px-3 py-2 space-y-1.5 border-t border-slate-800/80 bg-slate-900/60">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition`}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Customer Portal</span>
            </div>
          )}
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
        </a>

        <a
          href="http://localhost:5175"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition`}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>Partner Portal</span>
            </div>
          )}
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
        </a>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 flex items-center space-x-3 overflow-hidden flex-shrink-0">
        <img
          src="/anurag_founder.jpg"
          alt="Admin Avatar"
          className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
        />
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Anurag Founder</p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-blue-400 inline" /> Master Admin
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
