import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Bell, CheckCheck, Clock, Zap, IndianRupee, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export const NotificationsInboxScreen = () => {
  const { notifications, markAllNotificationsRead, setActiveTab } = usePartner();
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, OFFERS, JOBS, EARNINGS, DEPOSIT

  const filtered = (notifications || []).filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'OFFERS') return n.category === 'OFFER';
    if (filter === 'JOBS') return n.category === 'JOB';
    if (filter === 'EARNINGS') return n.category === 'EARNINGS';
    if (filter === 'DEPOSIT') return n.category === 'DEPOSIT' || n.category === 'DOCUMENTS';
    return true;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'OFFER': return <Zap className="w-4 h-4 text-[#3867FF]" />;
      case 'JOB': return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'EARNINGS': return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      case 'DEPOSIT': return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'DOCUMENTS': return <FileText className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Notifications & Alerts
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#3867FF]" />
            <span>Activity & Operational Inbox</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time administrative notices, job status updates, and financial alerts
          </p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-slate-500" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Notices' },
          { id: 'UNREAD', label: 'Unread Only' },
          { id: 'OFFERS', label: 'Job Offers' },
          { id: 'JOBS', label: 'Assignments' },
          { id: 'EARNINGS', label: 'Earnings' },
          { id: 'DEPOSIT', label: 'Deposit & Docs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              filter === tab.id
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">No notifications in this filter.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                !item.read
                  ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#3867FF]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.message}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {item.actionLink && (
                <button
                  onClick={() => {
                    const tab = item.actionLink.replace('/', '');
                    setActiveTab(tab || 'home');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#3867FF] hover:text-white text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
