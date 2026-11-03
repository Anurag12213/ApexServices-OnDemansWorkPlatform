import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Layers,
  CreditCard,
  LifeBuoy,
  Palette,
  Tag,
  ShieldAlert,
  BarChart3,
  History,
  ShieldCheck,
  Smartphone,
  Sliders,
  ArrowUpCircle,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  onLogout,
  brandName = 'ApexServices',
  onCloseMobile
}) {
  const displayBrand = brandName || 'ApexServices';
  const initialChar = displayBrand.charAt(0).toUpperCase();

  // Exactly 16 functional navigation items in strict approved sequence
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'partners', label: 'Partner Management', icon: Briefcase },
    { id: 'bookings', label: 'Booking Management', icon: Calendar },
    { id: 'categories', label: 'Service Catalog & Pricing', icon: Layers },
    { id: 'payments', label: 'Payments & Escrow', icon: CreditCard },
    { id: 'support', label: 'Support & Ticket Management', icon: LifeBuoy },
    { id: 'content', label: 'Content Management (CMS)', icon: Palette },
    { id: 'coupons', label: 'Coupons & Discounts', icon: Tag },
    { id: 'moderation', label: 'Content Moderation', icon: ShieldAlert },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs & Activity History', icon: History },
    { id: 'roles', label: 'Roles & Permissions (RBAC)', icon: ShieldCheck },
    { id: 'sessions', label: 'Session & Device Management', icon: Smartphone },
    { id: 'feature-flags', label: 'Feature Flags & App Configuration', icon: Sliders },
    { id: 'versions', label: 'Force Update & App Version Management', icon: ArrowUpCircle },
  ];

  const handleItemClick = (id) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-200 select-none text-left z-30 flex-shrink-0 shadow-xs`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
            {initialChar}
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-slate-900 tracking-tight text-base truncate max-w-[130px]">
                {displayBrand}
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                Admin
              </span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button on Desktop / Close on Mobile */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition hidden md:flex items-center justify-center cursor-pointer"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition md:hidden flex items-center justify-center cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Admin Profile Mini Card */}
      {!sidebarCollapsed && (
        <div className="p-2.5 mx-3 my-2 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#3867FF] flex items-center justify-center font-bold text-xs flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              Anurag Founder
            </p>
            <div className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-semibold text-emerald-700">
                Master Admin
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 16 Continuous Vertical Navigation Links (Zero Categories, Zero Separators) */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#3867FF] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!sidebarCollapsed && (
                <span className="truncate flex-1 tracking-tight">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* External Portal Links */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 space-y-0.5 flex-shrink-0">
          <a
            href="https://apexservicesondemand.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition"
          >
            <span>Customer Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://apexservices-partner-portal.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition"
          >
            <span>Partner Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      )}

      {/* Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
          title={sidebarCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-semibold">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
