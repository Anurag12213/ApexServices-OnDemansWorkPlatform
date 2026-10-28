import React from 'react';
import { Search, Bell, LayoutDashboard, Users, UserCheck, Building2, Calendar, CreditCard, BarChart2, Settings, ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import ApexLogo from '../components/common/ApexLogo';

export const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <ApexLogo portal="admin" />
          
          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users, partners, orders..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border-0 focus:ring-1 focus:ring-purple-500 text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5"></span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-xs font-bold text-slate-900 hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden lg:flex flex-col gap-1 text-xs font-bold text-slate-600">
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Users className="w-4 h-4" />
            <span>Users</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <UserCheck className="w-4 h-4" />
            <span>Partners</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Building2 className="w-4 h-4" />
            <span>Organizations</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Bookings</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <CreditCard className="w-4 h-4" />
            <span>Payments</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <BarChart2 className="w-4 h-4" />
            <span>Reports</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </a>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Welcome back, Admin!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Platform Overview
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shadow-xs">
              <span>Last 30 Days</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 5 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Users</span>
              <div className="text-xl font-black text-slate-900 mt-1">1,248</div>
              <span className="text-[10px] font-bold text-emerald-600">+12%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Partners</span>
              <div className="text-xl font-black text-slate-900 mt-1">342</div>
              <span className="text-[10px] font-bold text-emerald-600">+8%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Pending Approvals</span>
              <div className="text-xl font-black text-amber-600 mt-1">28</div>
              <span className="text-[10px] font-bold text-red-500">-4%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Bookings</span>
              <div className="text-xl font-black text-slate-900 mt-1">2,156</div>
              <span className="text-[10px] font-bold text-emerald-600">+18%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
              <div className="text-xl font-black text-slate-900 mt-1">₹12,48,560</div>
              <span className="text-[10px] font-bold text-emerald-600">+22%</span>
            </div>
          </div>

          {/* Lists: Recent Activities & Partner Approvals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Recent Activities */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Activities</h3>
                <span className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer">View All Activities →</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      ✍️
                    </div>
                    <span className="font-semibold text-slate-800">New partner application</span>
                  </div>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      📅
                    </div>
                    <span className="font-semibold text-slate-800">New booking created</span>
                  </div>
                  <span className="text-[10px] text-slate-400">3 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                      💳
                    </div>
                    <span className="font-semibold text-slate-800">Payment received</span>
                  </div>
                  <span className="text-[10px] text-slate-400">5 hours ago</span>
                </div>
              </div>
            </div>

            {/* Partner Approvals */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Partner Approvals</h3>
                <span className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer">View All →</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Sharma Services</h4>
                    <p className="text-[10px] text-slate-500">Plumbing, Electrical</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    Review
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cool Air Solutions</h4>
                    <p className="text-[10px] text-slate-500">AC Service</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    Review
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Home Fixers</h4>
                    <p className="text-[10px] text-slate-500">General Maintenance</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    Review
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

export default AdminDashboardPage;
