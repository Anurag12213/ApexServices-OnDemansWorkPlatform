import React from 'react';
import {
  Users,
  Palette,
  CreditCard,
  Mail,
  BarChart3,
  ShieldCheck,
  Calendar,
  LifeBuoy,
  PieChart,
  History,
  Sliders,
  Tag,
  Wrench,
  ShieldAlert,
  Smartphone,
  ArrowUpCircle,
  Layers,
  LogOut,
  ExternalLink,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed, onLogout, brandName = 'ApexServices' }) {
  const displayBrand = brandName || 'ApexServices';
  const initialChar = displayBrand.charAt(0).toUpperCase();

  // All 16 core modules in strict sequence
  const navigationItems = [
    { id: 'dashboard', label: 'Live Analytics Dashboard', icon: PieChart },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'content', label: 'Content Management (CMS)', icon: Palette },
    { id: 'payments', label: 'Payments & Transactions', icon: CreditCard, badge: 'Escrow' },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
    { id: 'roles', label: 'Roles & Permissions (RBAC)', icon: ShieldCheck },
    { id: 'bookings', label: 'Order / Booking Management', icon: Calendar, badge: 'Live' },
    { id: 'support', label: 'Support & Ticket Management', icon: LifeBuoy, badge: 'Desk' },
    { id: 'audit', label: 'Audit Logs & Activity History', icon: History },
    { id: 'feature-flags', label: 'Feature Flags & App Configuration', icon: Sliders },
    { id: 'coupons', label: 'Coupons & Discount Management', icon: Tag, badge: 'Promo' },
    { id: 'partners', label: 'Vendor / Partner Management', icon: Wrench, badge: 'Fleet' },
    { id: 'moderation', label: 'Content Moderation Tools', icon: ShieldAlert, badge: 'Safety' },
    { id: 'sessions', label: 'Session & Device Management', icon: Smartphone, badge: 'Security' },
    { id: 'versions', label: 'Force-Update & App Version Control', icon: ArrowUpCircle },
    { id: 'categories', label: 'Service Catalog & Pricing', icon: Layers },
  ];

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-slate-200 flex flex-col min-h-screen transition-all duration-200 select-none text-left z-30 flex-shrink-0`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
            {initialChar}
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base truncate max-w-[140px]">
                {displayBrand}
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Profile Card */}
      {!sidebarCollapsed && (
        <div className="p-3 mx-3 my-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#3867FF] flex items-center justify-center font-bold text-sm flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              Anurag Founder
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Approved
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sequential Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : ''}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
              } py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#3867FF] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Portal Links */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 space-y-1 border-t border-slate-100 bg-slate-50/50">
          <a
            href="https://apexservicesondemand.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition"
          >
            <span>Customer Website</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://apexservices-partner-portal.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition"
          >
            <span>Partner Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
          } py-2.5 rounded-xl font-medium text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
          title={sidebarCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
