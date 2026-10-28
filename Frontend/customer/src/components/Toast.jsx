import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const ToastItem = ({ toast, onClose }) => {
  const { id, type = 'info', message, title } = toast;

  const config = {
    error: {
      border: 'border-red-200 bg-white',
      badge: 'bg-red-50 text-red-700 border-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
      defaultTitle: 'Attention Required',
      accentBar: 'bg-red-500',
    },
    warning: {
      border: 'border-amber-200 bg-white',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
      defaultTitle: 'Validation Notice',
      accentBar: 'bg-amber-500',
    },
    success: {
      border: 'border-emerald-200 bg-white',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
      defaultTitle: 'Completed',
      accentBar: 'bg-emerald-500',
    },
    info: {
      border: 'border-blue-200 bg-white',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      defaultTitle: 'Notice',
      accentBar: 'bg-blue-600',
    },
  }[type] || {
    border: 'border-slate-200 bg-white',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: <Info className="w-5 h-5 text-slate-500 flex-shrink-0" />,
    defaultTitle: 'Notice',
    accentBar: 'bg-slate-400',
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-slate-900/5 ${config.border} transition-all duration-200 ease-out animate-in slide-in-from-top-2 sm:slide-in-from-right-4 pointer-events-auto`}
    >
      <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${config.accentBar}`} />
      
      <div className="pl-1 pt-0.5">{config.icon}</div>

      <div className="flex-1 min-w-0 pr-2">
        <h5 className="text-xs font-bold text-slate-900 leading-tight">
          {title || config.defaultTitle}
        </h5>
        <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onClose(id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts = [], onClose }) => {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-5 z-[9999] flex flex-col gap-2 w-auto sm:w-96 max-w-full sm:max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
