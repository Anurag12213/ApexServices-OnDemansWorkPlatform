import React, { useState, useEffect } from 'react';
import { Mail, Send, Bell, CheckCircle2, Clock, Users, RefreshCw, Loader2, Sparkles, Filter } from 'lucide-react';
import { useToast } from './Toast';
import { adminFetch } from '../utils/api';

export default function NotificationsSection() {
  const toast = useToast();
  const [template, setTemplate] = useState('Booking Confirmation');
  const [subject, setSubject] = useState('Your ApexServices Booking is Confirmed!');
  const [recipient, setRecipient] = useState('All Active Customers');
  const [content, setContent] = useState('Thank you for booking with ApexServices. Your assigned technician will arrive at the scheduled time.');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/notifications/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setHistory(data);
      }
    } catch (err) {
      console.warn('Could not fetch notification history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleTemplateChange = (e) => {
    const t = e.target.value;
    setTemplate(t);
    if (t === 'Booking Confirmation') {
      setSubject('Your ApexServices Booking is Confirmed!');
      setContent('Thank you for booking with ApexServices. Your assigned technician will arrive at the scheduled time.');
    } else if (t === 'Special Promotion / Discount') {
      setSubject('Festive Delight: Up to 25% Off Premium Services');
      setContent('Use coupon code APEXFIRST at checkout to redeem flat ₹150 off your next home cleaning or maintenance visit.');
    } else if (t === 'Emergency Service Update') {
      setSubject('Monsoon Alert: 45-Minute Emergency Response Active');
      setContent('Heavy rains expected in your zone. Plumbers and electricians are deployed on rapid-response duty.');
    } else if (t === 'Service Completion Survey') {
      setSubject('How was your ApexServices experience today?');
      setContent('Please take 30 seconds to rate your technician. Your feedback ensures guaranteed five-star craftsmanship.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await adminFetch('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ template, subject, recipient, content })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.record) {
          setHistory((prev) => [result.record, ...prev]);
        }
        toast.success(`Broadcast dispatched to ${recipient}`, 'Campaign Delivered');
      } else {
        toast.warning('Broadcast recorded locally, server status non-200');
      }
    } catch (err) {
      toast.error('Network error dispatching broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications & Broadcast Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch real-time push announcements, SMS alerts, and transactional email campaigns to customers and technicians across India.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          title="Reload broadcast campaign history"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Compose Form */}
        <form onSubmit={handleSend} className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Compose Broadcast Notification</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">Multi-channel: Push + Email</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Select Preset Template</label>
              <select
                value={template}
                onChange={handleTemplateChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold outline-none"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold outline-none"
              >
                <option>All Active Customers</option>
                <option>All Certified Technicians</option>
                <option>Pending Service Requesters</option>
                <option>VIP Gold Subscribed Users</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Broadcast Subject Line</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Message Body</label>
              <textarea
                required
                rows="4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none leading-relaxed"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{sending ? 'Dispatching Broadcast...' : 'Send Broadcast Campaign'}</span>
          </button>
        </form>

        {/* Right: Broadcast History Feed */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Broadcast History</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">{history.length} Campaigns</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No previous broadcast campaigns.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{item.subject}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                    <span>{item.recipient} ({item.reach || 120} sent)</span>
                    <span>{item.sentAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
