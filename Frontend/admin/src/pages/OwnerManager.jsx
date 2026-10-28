import React, { useState, useEffect } from 'react';
import { UserCheck, Save, CheckCircle2 } from 'lucide-react';

export const OwnerManager = ({ aiOwner, onSave }) => {
  const [form, setForm] = useState(aiOwner || {});
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setForm(aiOwner || {});
  }, [aiOwner]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-4xl text-left space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">AI Owner Profile & Pointing Text Manager</h2>
        <p className="text-xs text-slate-500">
          Customize the AI owner image, owner name, designation, and the indicated speech text live on the home page.
        </p>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>AI Owner Profile & Speech Text successfully updated in Spring Boot database!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-xl space-y-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Owner Full Name</label>
            <input
              type="text"
              value={form.ownerName || ''}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Owner Designation / Title</label>
            <input
              type="text"
              value={form.ownerTitle || ''}
              onChange={(e) => setForm({ ...form, ownerTitle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Badge Heading</label>
            <input
              type="text"
              value={form.badge || ''}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Section Title</label>
            <input
              type="text"
              value={form.headingText || ''}
              onChange={(e) => setForm({ ...form, headingText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">AI Owner Image URL / Path</label>
            <input
              type="text"
              value={form.imageUrl || ''}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="/ai_owner.jpg or custom image URL"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-blue-700 uppercase mb-1">
              👉 Pointing Speech Indicated Text (Customizable Message)
            </label>
            <textarea
              rows="4"
              value={form.indicatedText || ''}
              onChange={(e) => setForm({ ...form, indicatedText: e.target.value })}
              placeholder="Enter speech guarantee text indicated by the owner image..."
              className="w-full bg-slate-50 border-2 border-blue-200 rounded p-3 text-slate-900 text-sm font-medium outline-none focus:border-blue-600"
            ></textarea>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Request Button Label</label>
            <input
              type="text"
              value={form.buttonText || ''}
              onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes to Database</span>
        </button>
      </form>
    </div>
  );
};
