import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ApexLogo from '../components/common/ApexLogo';

export const PartnerIndividualRegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = () => {
    navigate('/dashboard/partner');
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Matching: Partner Registration (Individual) without document upload */}
      <div className="w-full max-w-[680px] rounded-[32px] bg-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-100 text-left">
        
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                {...register('fullName')}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Email address
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* Mobile Number with India code */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Mobile Number
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  type="tel"
                  {...register('mobileNumber')}
                  placeholder="98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-r-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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

export default PartnerIndividualRegisterPage;
