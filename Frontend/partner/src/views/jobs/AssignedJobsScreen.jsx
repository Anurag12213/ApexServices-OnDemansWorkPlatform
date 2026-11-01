import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { api } from '../../services/api';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Calendar,
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  History,
  Star,
  FileText
} from 'lucide-react';

export const AssignedJobsScreen = () => {
  const { activeJob, setActiveTab } = usePartner();
  const [tab, setTab] = useState('SCHEDULED');

  const state = api.getState();
  const upcomingAppointments = [];
  if (activeJob) {
    upcomingAppointments.push({
      id: activeJob.id,
      category: activeJob.serviceCategory || activeJob.category || 'General Service',
      title: activeJob.problemTitle || activeJob.title || 'Assigned Service Request',
      customerName: activeJob.customerName || 'Valued Customer',
      address: activeJob.serviceAddress || activeJob.address || 'Address provided upon dispatch',
      timeSlot: activeJob.preferredTime || activeJob.timeSlot || 'Scheduled Visit',
      fee: activeJob.estimatedCost || activeJob.fee || 499,
      status: activeJob.status || 'ASSIGNED'
    });
  }
  if (Array.isArray(state.scheduledJobs)) {
    upcomingAppointments.push(...state.scheduledJobs);
  }

  const completedJobs = Array.isArray(state.jobHistory) ? state.jobHistory : [];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Appointments & Job History
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#3867FF] shrink-0" />
            <span>Service Schedule & Completed Jobs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage confirmed visits, view appointment slots, and inspect job history ratings
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTab('SCHEDULED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              tab === 'SCHEDULED'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Upcoming Schedule
          </button>
          <button
            onClick={() => setTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              tab === 'HISTORY'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Completed History
          </button>
        </div>
      </div>

      {/* Active Job Callout if running */}
      {activeJob && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-2xl shadow-md flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              Active Job In Progress
            </span>
            <h3 className="text-base font-extrabold">{activeJob.title}</h3>
            <p className="text-xs text-blue-100">{activeJob.customerName} • {activeJob.timeSlot}</p>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="px-4 py-2 bg-white text-[#3867FF] font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 shrink-0"
          >
            Resume Job →
          </button>
        </div>
      )}

      {/* SCREEN 33: APPOINTMENT CALENDAR / UPCOMING SCHEDULE */}
      {tab === 'SCHEDULED' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Confirmed Upcoming Appointments
          </h3>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No Upcoming Appointments</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you accept incoming service requests, your confirmed appointments and customer visit details will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#3867FF]">
                        {app.category}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{app.id}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">{app.title}</h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.timeSlot}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.customerName} • {app.address}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Fixed Fee</p>
                    <div className="text-lg font-black text-slate-900">
                      <CurrencyDisplay amount={app.fee} />
                    </div>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <span>View Assignment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCREEN 45: COMPLETED JOB HISTORY */}
      {tab === 'HISTORY' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Past Completed Jobs & Ratings
          </h3>

          {completedJobs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No Completed Jobs Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you complete service visits, your job history, earned net pay, and customer reviews will be displayed here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#3867FF]">
                        {job.category || job.serviceCategory || 'Service'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{job.title || job.problemTitle || 'Completed Request'}</h4>
                      <p className="text-xs text-slate-500">
                        Customer: {job.customerName || 'Customer'} • Completed on {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs font-semibold text-slate-400">Earned Net</span>
                      <div className="text-lg font-black text-emerald-600">
                        <CurrencyDisplay amount={job.financials?.partnerNetEarning || job.estimatedCost || 400} />
                      </div>
                    </div>
                  </div>

                  {job.review && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-xs">
                      <div className="flex items-center text-amber-500 shrink-0 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold ml-1">{job.rating || 5}.0</span>
                      </div>
                      <p className="text-slate-600 italic">"{job.review}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
