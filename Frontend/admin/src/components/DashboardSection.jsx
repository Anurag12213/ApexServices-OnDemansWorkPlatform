import React from 'react';
import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import RecentActivity from './RecentActivity';
import {
  PieChart,
  Radio,
  ArrowUpRight,
  TrendingUp,
  Users,
  ShieldCheck,
  CreditCard,
  LifeBuoy,
  Layers,
  Wrench,
  Sparkles
} from 'lucide-react';

export default function DashboardSection({ onNavigateTab }) {
  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Analytics Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time executive nerve center surfacing active fleet dispatch, revenue velocity, user signups, and live platform health the moment you open the panel.
          </p>
        </div>

        {/* Live System Beacon */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-emerald-800 text-xs font-bold shadow-xs">
          <Radio className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Spring Boot REST Backend Connected & Synchronized</span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <StatCards />

      {/* Revenue Chart & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
