import React, { useState } from 'react';
import { Search, LayoutDashboard, ClipboardList, Briefcase, DollarSign, User, FileText, Settings, Check, Eye } from 'lucide-react';
import ApexLogo from '../components/common/ApexLogo';

export const PartnerDashboardPage = () => {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <ApexLogo portal="partner" />
          
          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bookings, requests..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border-0 focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Availability Toggle */}
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{isAvailable ? 'Available' : 'Offline'}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              R
            </div>
            <span className="text-xs font-bold text-slate-900 hidden sm:block">Rajesh</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden lg:flex flex-col gap-1 text-xs font-bold text-slate-600">
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <ClipboardList className="w-4 h-4" />
            <span>Service Requests</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Briefcase className="w-4 h-4" />
            <span>My Jobs</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <DollarSign className="w-4 h-4" />
            <span>Earnings</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </a>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Welcome back, Rajesh!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                You have 5 new booking requests in your service radius.
              </p>
            </div>
          </div>

          {/* 4 Stat Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Requests</span>
              <div className="text-2xl font-black text-blue-600 mt-1">5</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Jobs</span>
              <div className="text-2xl font-black text-amber-600 mt-1">3</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">18</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Earnings</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹24,560</div>
            </div>
          </div>

          {/* Recent Service Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Recent Service Requests</h3>
              <span className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">View All Requests →</span>
            </div>

            <div className="space-y-3">
              {/* Row 1 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    ❄️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">AC Repair</h4>
                    <p className="text-[11px] text-slate-500">Malviya Nagar, Jaipur • Today, 11:00 AM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">₹500</span>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
                    Accept
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100">
                    View
                  </button>
                </div>
              </div>

              {/* Row 2 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    🔧
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Plumbing Issue</h4>
                    <p className="text-[11px] text-slate-500">Vaishali Nagar, Jaipur • Today, 2:00 PM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">₹350</span>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
                    Accept
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100">
                    View
                  </button>
                </div>
              </div>

              {/* Row 3 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Electrical Repair</h4>
                    <p className="text-[11px] text-slate-500">Mansarovar, Jaipur • Tomorrow, 10:00 AM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">₹400</span>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
                    Accept
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default PartnerDashboardPage;
