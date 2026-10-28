import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  UserCheck,
  LayoutGrid,
  MessageSquare,
  Bell,
  Wrench,
  ExternalLink
} from 'lucide-react';

export const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'sliders', label: 'Hero Header Sliders', icon: Sliders },
    { id: 'owner', label: 'AI Owner & Pointing Text', icon: UserCheck },
    { id: 'categories', label: 'Service Categories', icon: LayoutGrid },
    { id: 'reviews', label: 'Customer Reviews', icon: MessageSquare },
    { id: 'announcement', label: 'Top Announcement Bar', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen text-left">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Apex Admin</h1>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block">
              Control Panel v1.0
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer link to customer website */}
      <div className="p-4 border-t border-slate-800 text-xs">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-medium transition-colors"
        >
          <span>View Live Customer Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </aside>
  );
};
