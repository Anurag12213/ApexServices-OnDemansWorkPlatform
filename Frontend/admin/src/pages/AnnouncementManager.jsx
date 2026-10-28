import React, { useState, useEffect } from 'react';
import { Bell, Save, CheckCircle2 } from 'lucide-react';

export const AnnouncementManager = ({ announcement, onSave }) => {
  const [enabled, setEnabled] = useState(announcement?.enabled ?? true);
  const [text, setText] = useState(announcement?.text || '');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (announcement) {
      setEnabled(announcement.enabled ?? true);
      setText(announcement.text || '');
    }
  }, [announcement]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ enabled, text });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-3xl text-left space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Top Announcement Bar Manager</h2>
        <p className="text-xs text-slate-500">Enable or disable top promo bar and customize banner text.</p>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Announcement Bar successfully updated in Spring Boot database!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-xl space-y-5 shadow-xs text-xs">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
          />
          <span className="font-bold text-slate-900 text-sm">Enable Announcement Ticker on Customer Website</span>
        </label>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Announcement Message</label>
          <input
            required
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="🔥 Special Offer: Get 20% OFF on all Carpentry Services!"
            className="w-full bg-slate-50 border border-slate-300 rounded px-3.5 py-2.5 text-slate-900 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Announcement to Database</span>
        </button>
      </form>
    </div>
  );
};
