import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Wrench, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { LegalModal } from './LegalModal';

export const Footer = () => {
  const { setActivePage, siteBranding } = useData();
  const [legalModalType, setLegalModalType] = useState(null);

  const brandName = siteBranding?.brandName || 'ApexServices';
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';
  const logoImageUrl = siteBranding?.logoImageUrl;
  const tagline = siteBranding?.footerTagline || 'Premium home repair, custom carpentry, plumbing, and electrical solutions.';
  const address = siteBranding?.footerAddress || '124 Executive Parkway, Suite 400';
  const phone = siteBranding?.supportPhone || '+91 1800 200 4567';
  const email = siteBranding?.supportEmail || 'support@apexservices.com';
  const copyright = siteBranding?.footerCopyright || 'ApexServices. All rights reserved.';

  return (
    <footer className="bg-[#0A2540] text-slate-300 border-t border-slate-800/80 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActivePage('home')}>
              {logoImageUrl ? (
                <img
                  src={logoImageUrl}
                  alt={brandName}
                  className="h-9 w-auto max-w-[160px] object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm bg-blue-600">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-white tracking-tight">
                    {brandName}<span className="text-blue-500">.</span>
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {tagline}
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">Certified Master Technicians</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setActivePage('home')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('services')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Services
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('about')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('reviews')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Customer Reviews
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('contact')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4">Direct Contact</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-white transition-colors font-medium">{phone}</a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors font-medium">{email}</a>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-400">{address}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <button
              onClick={() => setLegalModalType('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalType('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalType('cookies')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
          <p className="text-slate-500 hidden lg:block">ApexServices Unified Platform</p>
        </div>
      </div>
      <LegalModal
        isOpen={!!legalModalType}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </footer>
  );
};
