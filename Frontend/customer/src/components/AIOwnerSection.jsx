import React from 'react';
import { useData } from '../context/DataContext';

export const AIOwnerSection = () => {
  const { data, handleInitiateRequestWork, siteBranding } = useData();
  const aiOwner = data.aiOwnerSection || {};
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';

  return (
    <section className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="w-6 h-0.5" style={{ backgroundColor: brandDotColor }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandDotColor }}>
              {aiOwner.badge || "FOUNDER'S DIRECT GUARANTEE"}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {aiOwner.headingText || 'Your Peace of Mind is Our Priority'}
          </h2>
        </div>

        {/* Layout: AI Owner Image Pointing to Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 border border-slate-200 p-8 rounded-2xl shadow-sm">
          
          {/* Left Column: AI Owner Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative max-w-md w-full">
              <div className="rounded-xl overflow-hidden border border-slate-300 shadow-md bg-white aspect-square">
                <img
                  src={aiOwner.imageUrl || '/anurag_founder.jpg'}
                  alt={aiOwner.ownerName || 'Anurag Vijaywargiy'}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-sm text-left">
                  <p className="text-slate-900 font-bold text-sm">
                    {aiOwner.ownerName || 'Anurag Vijaywargiy'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {aiOwner.ownerTitle || 'Founder & Master Operations Director'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Text Indicated by AI Owner & Request Button */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-0.5" style={{ backgroundColor: brandDotColor }} />
                <span className="font-bold text-xs uppercase tracking-wider" style={{ color: brandDotColor }}>
                  Personal Note From Owner
                </span>
              </div>

              {/* Dynamic Founder Note Content */}
              <p
                className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed italic border-l-4 pl-4 py-1"
                style={{ borderColor: brandDotColor }}
              >
                "{aiOwner.indicatedText || 'We personally guarantee top-quality workmanship on every job.'}"
              </p>
            </div>

            {/* Request Button */}
            <div>
              <button
                onClick={() => handleInitiateRequestWork()}
                className="w-full sm:w-auto text-center font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center hover:opacity-90"
                style={{ backgroundColor: brandDotColor }}
              >
                {aiOwner.buttonText ? aiOwner.buttonText.replace(' -> LOGIN', '') : 'REQUEST NOW'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
