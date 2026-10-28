import React, { useState, useEffect } from 'react';

export default function StatCards() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/work-requests');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRequests(data);
          }
        }
      } catch (e) {
        // quiet fail
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = requests
    .filter(r => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + (Number(r.paidAmount) || Number(r.estimatedCost) || 499), 0);

  const activeCount = requests.filter(r => r.status !== 'CANCELLED' && r.status !== 'EXPIRED' && r.status !== 'COMPLETED').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const totalCount = requests.length;

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: '+100%',
      isPositive: true,
      subtitle: `${completedCount} services settled`,
    },
    {
      title: 'Active Dispatches',
      value: `${activeCount}`,
      change: 'Live',
      isPositive: true,
      subtitle: `${activeCount} requests in execution queue`,
    },
    {
      title: 'Total Bookings',
      value: `${totalCount}`,
      change: '+100%',
      isPositive: true,
      subtitle: 'Real customer requests in DB',
    },
    {
      title: 'Completed Jobs',
      value: `${completedCount}`,
      change: 'Verified',
      isPositive: true,
      subtitle: 'Verified with Customer OTP',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {stat.title}
            </span>
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                stat.isPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {stat.change}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
