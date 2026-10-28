import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

export default function RecentActivity() {
  const [requests, setRequests] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchRequests = () => {
      fetch(`${API_BASE_URL}/work-requests`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Sort newest first by id or createdAt
            const sorted = [...data].reverse();
            setRequests(sorted);
          }
        })
        .catch(err => console.error('Failed to fetch work requests for admin activity:', err));
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const defaultActivities = [
    {
      title: 'Order #ORD-7812 completed',
      desc: 'Emergency plumbing payment received ($240.00)',
      time: '45 mins ago',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Database sync notice',
      desc: 'Spring Boot REST sync executed cleanly',
      time: '2 hours ago',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
      case 'ARRIVED':
      case 'EN_ROUTE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WAITING_ACCEPTANCE':
      case 'FINDING_PARTNER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const displayedRequests = showAll ? requests : requests.slice(0, 4);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-700" />
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          {requests.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {requests.length} total
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Sync
        </span>
      </div>

      <div className="space-y-3">
        {/* Live Customer Work Requests from DB */}
        {displayedRequests.map((req) => (
          <div key={req.id} className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs bg-blue-100 text-blue-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{req.category}</p>
                <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">#{req.id}</span>
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                <span className="font-medium text-slate-800">{req.customerName || 'Customer'}</span>
                {req.urgency && <span className="text-slate-400"> • {req.urgency}</span>}
              </p>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
                  {req.address || 'Address provided'}
                </span>
                <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wider shrink-0 ${getStatusBadge(req.status)}`}>
                  {req.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Fallback activities if DB has no requests */}
        {requests.length === 0 && defaultActivities.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div key={idx} className="flex items-start space-x-3 p-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${act.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-800">{act.title}</p>
                <p className="text-xs text-slate-500">{act.desc}</p>
                <span className="text-[10px] text-slate-400">{act.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All / Show Less Toggle Button */}
      {requests.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              Show Less (Top 4)
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              View All Activities ({requests.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
