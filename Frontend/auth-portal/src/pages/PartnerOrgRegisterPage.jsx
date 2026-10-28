import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ApexLogo from '../components/common/ApexLogo';

export const PartnerOrgRegisterPage = () => {
  const navigate = useNavigate();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      orgName: '',
      businessAddress: '',
      contactPerson: '',
      regNumber: '',
      businessEmail: '',
      businessMobile: '',
    },
  });

  const onSubmit = () => {
    navigate('/dashboard/partner');
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Matching: Partner Registration (Organization) without document upload */}
      <div className="w-full max-w-[720px] rounded-[32px] bg-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-100 text-left">
        
        {/* Header with Logo */}
        <div className="mb-6 flex justify-between items-center">
          <ApexLogo portal="partner" />
          <Link
            to="/register/partner/select"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Type</span>
          </Link>
        </div>

        {/* 4-Step Wizard Indicator */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-8 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Account</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">2</span>
            <span>Profile</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">3</span>
            <span>Services</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">4</span>
            <span>Review</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Business Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tell us about your organization</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Organization Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Organization Name
              </label>
              <input
                type="text"
                {...register('orgName')}
                placeholder="Enter business name"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* 2. Business Address */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Business Address
              </label>
              <input
                type="text"
                {...register('businessAddress')}
                placeholder="Enter address"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* 3. Contact Person Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                {...register('contactPerson')}
                placeholder="Enter contact person name"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* 4. Registration Number (Optional) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Registration Number (Optional)
              </label>
              <input
                type="text"
                {...register('regNumber')}
                placeholder="GST / Business Registration No."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* 5. Business Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Business Email
              </label>
              <input
                type="email"
                {...register('businessEmail')}
                placeholder="business@example.com"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* 6. Business Mobile with +91 */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Business Mobile
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  type="tel"
                  {...register('businessMobile')}
                  placeholder="98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-r-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-6">
            <Link
              to="/register/partner/select"
              className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Back
            </Link>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PartnerOrgRegisterPage;
