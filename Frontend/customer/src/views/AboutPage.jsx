import React from 'react';
import { useData } from '../context/DataContext';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Clock, Star, PhoneCall } from 'lucide-react';

export const AboutPage = () => {
  const { data, handleInitiateRequestWork, siteBranding } = useData();
  const owner = data.aiOwnerSection || {};
  const supportPhone = siteBranding?.supportPhone || '+91 1800 200 4567';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-left">
      
      {/* 1. Hero Header */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              About ApexServices
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Master Craftsmanship & Reliable Home Services
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Founded on the pillars of integrity, technical mastery, and uncompromising customer care, ApexServices bridges the gap between verified master craftsmen and homeowners who demand excellence.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Key Metric Numbers Strip */}
      <section className="bg-white border-b border-slate-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="space-y-1 p-2">
              <div className="text-xl sm:text-3xl font-black text-slate-900">15,000+</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Jobs Completed</div>
            </div>
            <div className="space-y-1 p-2">
              <div className="text-xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-1">
                4.9 <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400 inline" />
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Customer Rating</div>
            </div>
            <div className="space-y-1 p-2">
              <div className="text-xl sm:text-3xl font-black text-slate-900">120+</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Master Technicians</div>
            </div>
            <div className="space-y-1 p-2">
              <div className="text-xl sm:text-3xl font-black text-emerald-600">&lt; 45 Min</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Leadership & Guarantee Section */}
      <section className="py-8 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center bg-white border border-slate-200 p-4 sm:p-8 rounded-2xl shadow-xs">
          
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              <img
                src={owner.imageUrl || '/anurag_founder.jpg'}
                alt={owner.ownerName || 'Anurag Vijaywargiy'}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-xs p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-900 font-bold text-xs sm:text-sm">
                  {owner.ownerName || 'Anurag Vijaywargiy'}
                </p>
                <p className="text-slate-500 text-[10px] sm:text-xs">
                  {owner.ownerTitle || 'Founder & Master Operations Director'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Leadership & Commitment
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Personal Accountability for Every Project
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              "We built ApexServices with one clear mission: to eliminate the uncertainty, poor communication, and inconsistent quality that too often plagues residential repairs. Every specialist representing Apex is rigorously verified and held to the highest standard of technical discipline."
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
              <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Licensed & Background Verified</span>
                </div>
                <p className="text-xs text-slate-500">Every pro undergoes ID check and trade qualification review.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Direct Workmanship Warranty</span>
                </div>
                <p className="text-xs text-slate-500">30-day comprehensive guarantee on all completed jobs.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleInitiateRequestWork()}
                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
              >
                <span>Book Service Online</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Bottom Support Bar */}
      <section className="bg-[#0A2540] text-white py-10 sm:py-12 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-base sm:text-lg font-black tracking-tight">Have questions or need a custom corporate service contract?</h4>
            <p className="text-slate-300 text-xs mt-0.5">Our support team is ready to assist your facility or household.</p>
          </div>
          <a
            href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto justify-center bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <span>Call {supportPhone}</span>
          </a>
        </div>
      </section>

    </div>
  );
};
