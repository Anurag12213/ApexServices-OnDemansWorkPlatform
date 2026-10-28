import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import {
  Home,
  Zap,
  Wrench,
  Calendar,
  IndianRupee,
  FileText,
  ShieldCheck,
  Tag,
  CheckSquare,
  HelpCircle,
  User,
  LogOut,
  X
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useConfirm } from '../ConfirmDialog';

export const PartnerSidebar = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, partner, logout, offers, activeJob } = usePartner();
  const confirm = useConfirm();

  const pendingOffersCount = (offers || []).filter(o => o.status === 'PENDING').length;

  const links = [
    { id: 'home', label: 'Home Dashboard', icon: Home },
    {
      id: 'requests',
      label: 'Live Job Offers',
      icon: Zap,
      badge: pendingOffersCount > 0 ? pendingOffersCount : null
    },
    {
      id: 'jobs',
      label: 'Job Execution',
      icon: Wrench,
      highlight: !!activeJob
    },
    { id: 'schedule', label: 'Appointment Calendar', icon: Calendar },
    { id: 'earnings', label: 'Earnings & Payouts', icon: IndianRupee },
    { id: 'documents', label: 'Document Verification', icon: FileText },
    { id: 'deposit', label: 'Security Deposit', icon: ShieldCheck },
    { id: 'pricing', label: 'Fixed Category Pricing', icon: Tag },
    { id: 'onboarding', label: 'Onboarding Checklist', icon: CheckSquare },
    { id: 'support', label: 'Help & Support Tickets', icon: HelpCircle },
    { id: 'profile', label: 'Partner Profile', icon: User }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              A
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                Apex<span className="text-blue-600">Services</span>
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                Partner
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Partner Profile Badge */}
        {partner && (
          <div className="p-4 mx-3 my-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#3867FF] flex items-center justify-center font-bold text-sm">
              {partner.fullName?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {partner.fullName}
              </p>
              <div className="mt-1">
                <StatusBadge status={partner.onboardingState} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Navigation Items */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                  isActive
                    ? 'bg-[#3867FF] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
                {link.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Logout & Footer */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={async () => {
              const ok = await confirm({
                title: 'Sign Out of Partner Portal?',
                message: 'Are you sure you want to sign out of Apex Certified Partner? You will stop receiving live incoming dispatch alerts.',
                confirmText: 'Sign Out',
                variant: 'danger',
                icon: 'logout'
              });
              if (ok) {
                logout();
                onClose();
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
