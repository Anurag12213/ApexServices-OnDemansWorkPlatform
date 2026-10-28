import React, { useState } from 'react';
import { User, Save, Lock, CheckCircle2 } from 'lucide-react';

export default function ProfileSection() {
  const [name, setName] = useState('Sarah Jenkins');
  const [email, setEmail] = useState('sarah.jenkins@apexservices.com');
  const [role, setRole] = useState('System Administrator');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administrator Profile</h1>
          <p className="text-sm text-slate-500">Manage account credentials, personal contact, and security settings</p>
        </div>

        {savedNotice && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Profile changes saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5 text-xs">
        <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Profile Avatar"
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{name}</h3>
            <p className="text-slate-400 text-xs">{role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">New Password (leave blank to keep current)</label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded text-xs flex items-center gap-1.5 shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Profile Changes</span>
        </button>
      </form>
    </div>
  );
}
