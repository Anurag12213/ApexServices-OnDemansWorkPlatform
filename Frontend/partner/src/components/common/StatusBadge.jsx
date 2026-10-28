import React from 'react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  if (!status) return null;

  const config = {
    // Deposit & Verification statuses
    VERIFIED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Verified' },
    PAYMENT_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Payment Pending' },
    NOT_STARTED: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'Not Started' },
    PAYMENT_FAILED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Payment Failed' },
    VERIFICATION_PENDING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Verification In Progress' },
    VERIFICATION_REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Verification Rejected' },

    // Document review statuses
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Approved' },
    UNDER_REVIEW: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Under Review' },
    SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Submitted' },
    NOT_SUBMITTED: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'Not Submitted' },
    REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },
    RESUBMISSION_REQUIRED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Resubmission Required' },

    // Job Lifecycle
    ASSIGNED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Assigned' },
    EN_ROUTE: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'En Route' },
    ARRIVED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Arrived On-Site' },
    DIAGNOSING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Diagnosing' },
    AWAITING_PARTS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Awaiting Customer Parts' },
    IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'In Progress' },
    COMPLETION_SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Completion Submitted' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Cancelled' },

    // Partner Account State
    DEPOSIT_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Deposit Pending' },
    DOCUMENTS_PENDING: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Docs Incomplete' },
    DOCUMENTS_REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Docs Rejected' },
    SUSPENDED: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', label: 'Account Suspended' }
  };

  const style = config[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: status.replace(/_/g, ' ')
  };

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-xs font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {style.label}
    </span>
  );
};
