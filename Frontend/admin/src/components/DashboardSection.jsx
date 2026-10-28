import React from 'react';
import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import RecentActivity from './RecentActivity';

export default function DashboardSection() {
  return (
    <div className="space-y-6">
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
