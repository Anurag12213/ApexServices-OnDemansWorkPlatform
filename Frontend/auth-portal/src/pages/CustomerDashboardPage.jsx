import React from 'react';
import { Search, MapPin, LayoutDashboard, Calendar, BookmarkCheck, MessageSquare, Wallet, User, Settings, ArrowRight, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ApexLogo from '../components/common/ApexLogo';

export const CustomerDashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <ApexLogo portal="customer" />
          
          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for services, e.g. cleaning, plumbing..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border-0 focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold">Jaipur, Rajasthan</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-xs font-bold text-slate-900 hidden sm:block">Anurag</span>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden lg:flex flex-col gap-1 text-xs font-bold text-slate-600">
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Book Services</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <BookmarkCheck className="w-4 h-4" />
            <span>My Bookings</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Wallet className="w-4 h-4" />
            <span>Wallet & Payments</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </a>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </a>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, Anurag!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Find and book trusted professionals for your home services.
            </p>
          </div>

          {/* Service Category Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-2">
                🧹
              </div>
              <h4 className="text-xs font-black text-slate-900">Cleaning</h4>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">From ₹199</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-2">
                🔧
              </div>
              <h4 className="text-xs font-black text-slate-900">Plumbing</h4>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">From ₹299</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-2">
                ⚡
              </div>
              <h4 className="text-xs font-black text-slate-900">Electrical</h4>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">From ₹249</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-2">
                ❄️
              </div>
              <h4 className="text-xs font-black text-slate-900">AC Service</h4>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">From ₹399</span>
            </div>
          </div>

          <div className="flex justify-start">
            <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span>Browse All Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upcoming Bookings & Promo Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Upcoming Booking */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Upcoming Bookings</h3>
                <span className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">View Details →</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                    ❄️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">AC Repair Service</h4>
                    <p className="text-[10px] text-slate-500">Today, 2:00 PM - 4:00 PM • John Doe</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Confirmed
                </span>
              </div>
            </div>

            {/* Promo Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between relative overflow-hidden shadow-sm">
              <div className="relative z-10 max-w-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Special Offer
                </span>
                <h3 className="text-base font-black mt-2 leading-tight">
                  Get 20% Off On Your First Booking!
                </h3>
                <button className="mt-3 px-3.5 py-1.5 rounded-lg bg-white text-blue-600 font-bold text-xs shadow-xs hover:bg-blue-50 transition-colors">
                  Book Now →
                </button>
              </div>

              <div className="w-24 h-24 rounded-2xl overflow-hidden opacity-90 shrink-0 border border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80"
                  alt="Living room"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
};

export default CustomerDashboardPage;
