import React, { useState } from 'react';
import { Mail, Send, Bell, CheckCircle2 } from 'lucide-react';

export default function NotificationsSection() {
  const [template, setTemplate] = useState('Booking Confirmation');
  const [subject, setSubject] = useState('Your ApexServices Booking is Confirmed!');
  const [recipient, setRecipient] = useState('All Active Customers');
  const [content, setContent] = useState('Thank you for booking with ApexServices. Your assigned technician will arrive at the scheduled time.');
  const [sentNotice, setSentNotice] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 3000);
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications & Email Center</h1>
          <p className="text-sm text-slate-500">Dispatch system updates, service reminders, and customer emails</p>
        </div>

        {sentNotice && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Broadcast email sent successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase">Compose Broadcast Notification</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
            >
              <option>Booking Confirmation</option>
              <option>Special Promotion / Discount</option>
              <option>Service Completion Survey</option>
              <option>Emergency Service Update</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Target Audience</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
            >
              <option>All Active Customers</option>
              <option>Pending Service Requesters</option>
              <option>Subscribed Newsletter Users</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">Email Subject Line</label>
            <input
              required
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">Message Body</label>
            <textarea
              required
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-slate-900 outline-none"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded text-xs flex items-center gap-1.5 shadow-xs"
        >
          <Send className="w-4 h-4" />
          <span>Send Broadcast Now</span>
        </button>
      </form>
    </div>
  );
}
