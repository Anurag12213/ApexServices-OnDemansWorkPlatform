import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const ScreenSwitcherNav = () => {
  return (
    <div className="w-full bg-slate-900 text-white text-xs border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Brand indicator */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight text-slate-200">Apex Design System</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">10 Screens</span>
        </div>

        {/* Screen Links grouped by section */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          
          {/* Section: Logins */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 select-none">Logins:</span>
            <NavLink
              to="/login/customer"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Customer
            </NavLink>
            <NavLink
              to="/login/partner"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Partner
            </NavLink>
            <NavLink
              to="/login/admin"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Admin
            </NavLink>
          </div>

          {/* Section: Register */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 select-none">Register:</span>
            <NavLink
              to="/register/customer"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Customer
            </NavLink>
            <NavLink
              to="/register/partner/select"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Partner Select
            </NavLink>
            <NavLink
              to="/register/partner/individual"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Individual
            </NavLink>
            <NavLink
              to="/register/partner/organization"
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Organization
            </NavLink>
          </div>

          {/* Section: Dashboards */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 select-none">Dashboards:</span>
            <NavLink
              to="/dashboard/customer"
              className={({ isActive }) =>
                `px-2 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Customer
            </NavLink>
            <NavLink
              to="/dashboard/partner"
              className={({ isActive }) =>
                `px-2 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Partner
            </NavLink>
            <NavLink
              to="/dashboard/admin"
              className={({ isActive }) =>
                `px-2 py-1 rounded-md transition-colors ${
                  isActive ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              Admin
            </NavLink>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScreenSwitcherNav;
