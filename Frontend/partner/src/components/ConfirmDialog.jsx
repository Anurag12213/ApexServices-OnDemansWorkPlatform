import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle, Info, Trash2, LogOut } from 'lucide-react';

const ConfirmDialogContext = createContext(null);

export const ConfirmDialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'info'
    icon = null
  }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({ title, message, confirmText, cancelText, variant, icon });
    });
  };

  const handleConfirm = () => {
    if (resolverRef.current) resolverRef.current(true);
    setDialogState(null);
  };

  const handleCancel = () => {
    if (resolverRef.current) resolverRef.current(false);
    setDialogState(null);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialogState && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  dialogState.variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : dialogState.variant === 'warning'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                {dialogState.icon === 'logout' ? (
                  <LogOut className="w-6 h-6 stroke-[2]" />
                ) : dialogState.variant === 'danger' ? (
                  <Trash2 className="w-6 h-6 stroke-[2]" />
                ) : dialogState.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <Info className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {dialogState.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                  {dialogState.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-98 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                {dialogState.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer ${
                  dialogState.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : dialogState.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-[#3867FF] hover:bg-blue-600 shadow-blue-500/20'
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context.confirm;
};
