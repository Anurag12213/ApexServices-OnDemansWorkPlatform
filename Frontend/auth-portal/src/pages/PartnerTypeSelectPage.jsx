import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ApexLogo from '../components/common/ApexLogo';

export const PartnerTypeSelectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Matching Screenshot: Partner Registration (Type Selection) */}
      <div className="w-full max-w-[840px] rounded-[32px] bg-gradient-to-b from-[#E8FAF0] via-[#F2FCF6] to-white p-6 sm:p-10 shadow-xl border border-emerald-100 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <ApexLogo portal="partner" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Become a Partner
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Choose your partner type
        </p>

        {/* 2 Comparison Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
          
          {/* Card 1: Individual Partner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-200/80 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 bg-emerald-50 border border-emerald-100">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80"
                  alt="Solo Technician"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <h3 className="text-lg font-black text-slate-900">Individual Partner</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                Work independently and get service requests in your area.
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Manage your profile</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Choose your services</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Receive and manage jobs</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/register/partner/individual')}
              className="w-full mt-6 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#1E5AE6] hover:bg-blue-700 active:scale-[0.99] text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register as Individual</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Organization Partner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-200/80 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 bg-emerald-50 border border-emerald-100">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80"
                  alt="Organization Team"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <h3 className="text-lg font-black text-slate-900">Organization Partner</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                Build a team, manage staff and grow your business.
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Add team members</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Manage multiple services</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Access business tools</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/register/partner/organization')}
              className="w-full mt-6 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register as Organization</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link
            to="/login/partner"
            className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PartnerTypeSelectPage;
