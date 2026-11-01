import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Phone, Mail, MapPin, Send, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const ContactPage = () => {
  const { siteBranding } = useData();
  const supportPhone = siteBranding?.supportPhone || '+91 1800 200 4567';
  const supportEmail = siteBranding?.supportEmail || 'support@apexservices.com';
  const operatingHours = siteBranding?.headerOperatingHours || 'MON - SAT: 7:00 AM - 9:00 PM | SUN: EMERGENCY DISPATCH';

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    service: 'General Inquiry',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-left">
      
      {/* 1. Header Banner */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Customer Support & Dispatch
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Contact Our Service Coordination Desk
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Have a repair inquiry, need an urgent technician dispatched, or want to discuss a scheduled project? Our team is available 24/7.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Contact Grid */}
      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 p-4 sm:p-7 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Direct Inquiries & Dispatch</h3>
                <p className="text-xs text-slate-500 mt-1">Get immediate assistance from our central operations team.</p>
              </div>

              <div className="space-y-4 text-sm divide-y divide-slate-100">
                <div className="flex items-start space-x-3.5 pt-3 first:pt-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 mt-0.5">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Toll-Free Dispatch</span>
                    <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="font-black text-slate-900 hover:text-blue-600 transition">
                      {supportPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 pt-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 mt-0.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Support Email</span>
                    <a href={`mailto:${supportEmail}`} className="font-bold text-slate-900 hover:text-blue-600 transition">
                      {supportEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 pt-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 mt-0.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operating Hours</span>
                    <span className="text-xs text-slate-700 font-medium leading-relaxed block">
                      {operatingHours}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 pt-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80 mt-0.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Headquarters</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {siteBranding?.footerAddress || '124 Executive Parkway, Suite 400'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Notice Pill */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-amber-900 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block text-amber-950">Facing a Plumbing or Electrical Emergency?</span>
                Don't wait for form replies. Dial our 24/7 hotline directly for immediate priority dispatch within 45 minutes.
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="md:col-span-7 bg-white border border-slate-200 p-4 sm:p-8 rounded-2xl shadow-xs">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Message Received!</h3>
                <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
                  Thank you for contacting ApexServices. An operations coordinator has received your request and will follow up shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', contact: '', service: 'General Inquiry', message: '' });
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Send A Direct Message</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Fill out your details and we'll reply promptly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Your Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Phone or Email</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Service Specialty</label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition cursor-pointer"
                  >
                    <option value="General Inquiry">General Service Inquiry</option>
                    <option value="Custom Carpentry">Custom Carpentry</option>
                    <option value="Emergency Plumbing">Emergency Plumbing</option>
                    <option value="Electrical Maintenance">Electrical Maintenance</option>
                    <option value="HVAC & AC Service">HVAC & AC Service</option>
                    <option value="Painting & Decor">Painting & Decor</option>
                    <option value="Appliance Care">Appliance Care</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your maintenance issue or project requirements..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Message</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};
