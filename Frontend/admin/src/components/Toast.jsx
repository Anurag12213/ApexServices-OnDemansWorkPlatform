import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  };

  const toast = {
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    warning: (msg, title) => showToast(msg, 'warning', title),
    info: (msg, title) => showToast(msg, 'info', title),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((item) => {
          const config = {
            error: {
              border: 'border-red-200 bg-white',
              icon: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
              defaultTitle: 'Error',
              accentBar: 'bg-red-500',
            },
            warning: {
              border: 'border-amber-200 bg-white',
              icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
              defaultTitle: 'Notice',
              accentBar: 'bg-amber-500',
            },
            success: {
              border: 'border-emerald-200 bg-white',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
              defaultTitle: 'Success',
              accentBar: 'bg-emerald-500',
            },
            info: {
              border: 'border-slate-200 bg-white',
              icon: <Info className="w-5 h-5 text-[#ff3b47] flex-shrink-0" />,
              defaultTitle: 'Info',
              accentBar: 'bg-[#ff3b47]',
            },
          }[item.type] || {
            border: 'border-slate-200 bg-white',
            icon: <Info className="w-5 h-5 text-slate-500 flex-shrink-0" />,
            defaultTitle: 'Notice',
            accentBar: 'bg-slate-400',
          };

          return (
            <div
              key={item.id}
              role="alert"
              className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-slate-900/5 ${config.border} transition-all duration-200 ease-out pointer-events-auto`}
            >
              <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${config.accentBar}`} />
              <div className="pl-1 pt-0.5">{config.icon}</div>
              <div className="flex-1 min-w-0 pr-2">
                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                  {item.title || config.defaultTitle}
                </h5>
                <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">
                  {item.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside Provider
    return {
      showToast: (msg) => console.log(msg),
      toast: {
        success: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
        warning: (msg) => console.warn(msg),
        info: (msg) => console.info(msg),
      },
      dismissToast: () => {},
    };
  }
  return context;
};
