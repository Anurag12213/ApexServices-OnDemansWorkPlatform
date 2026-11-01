import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import {
  HelpCircle,
  MessageSquare,
  AlertCircle,
  FileQuestion,
  ChevronDown,
  Plus,
  Send,
  PhoneCall,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export const HelpSupportScreen = () => {
  const { toast } = useToast();
  const { partner } = usePartner();
  const [activeTab, setActiveTab] = useState('FAQS'); // FAQS, TICKETS, CREATE
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Tickets state (Screen 65)
  const [tickets, setTickets] = useState([
    {
      id: 'TCK-8012',
      subject: 'Security Deposit Escrow Receipt Request',
      category: 'DEPOSIT_SUPPORT',
      status: 'RESOLVED',
      createdAt: '2026-10-09',
      lastReply: 'ApexServices Compliance: Official GST escrow payment voucher attached.'
    },
    {
      id: 'TCK-8019',
      subject: 'Customer Rescheduled Time Window on REQ-1004',
      category: 'JOB_ISSUE',
      status: 'OPEN',
      createdAt: '2026-10-10',
      lastReply: 'Dispatch Ops: Noted. Automatic arrival window adjusted.'
    }
  ]);

  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('JOB_ISSUE');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      q: 'Why is the ₹5,000 / ₹10,000 security deposit mandatory?',
      a: 'The security deposit protects customer trust, guarantees platform tool and craftsmanship quality, and acts as an escrow assurance fund. It remains segregated from company earnings and is held securely in escrow.'
    },
    {
      q: 'How does ApexServices handle replacement parts and product purchases?',
      a: 'ApexServices does not sell products or collect product fees. The customer may purchase required products independently from an outside market or directly from you. The price is negotiated directly with the seller and is never part of ApexServices service fees.'
    },
    {
      q: 'When do I receive my 80% partner net earnings?',
      a: 'Earnings are credited immediately upon successful job completion OTP. You can request instant payouts via UPI or Bank NEFT from the Earnings screen.'
    },
    {
      q: 'What should I do if a customer asks for work outside the booked category?',
      a: 'You must submit an out-of-scope report or category modification ticket before proceeding. Partners are strictly prohibited from collecting arbitrary cash labor outside platform scope.'
    }
  ];

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newTck = {
        id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
        subject: newSubject,
        category: newCategory,
        status: 'OPEN',
        createdAt: new Date().toLocaleDateString('en-IN'),
        lastReply: 'Support Officer: Your request has been queued with priority compliance dispatch.'
      };
      setTickets([newTck, ...tickets]);
      setNewSubject('');
      setNewMessage('');
      setIsSubmitting(false);
      setActiveTab('TICKETS');
      toast.success(`Support ticket ${newTck.id} created!`, 'Ticket Submitted');
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            ApexServices Partner Support
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#3867FF]" />
            <span>Help Center & Support Grievances</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            24/7 dedicated assistance for active jobs, escrow deposits, and payout settlements
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('FAQS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'FAQS' ? 'bg-[#3867FF] text-white shadow-xs' : 'bg-white border text-slate-700'
            }`}
          >
            FAQs & Guides
          </button>
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'TICKETS' ? 'bg-[#3867FF] text-white shadow-xs' : 'bg-white border text-slate-700'
            }`}
          >
            My Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'CREATE' ? 'bg-[#3867FF] text-white shadow-xs' : 'bg-white border text-slate-700'
            }`}
          >
            + New Ticket
          </button>
        </div>
      </div>

      {/* SCREEN 64: HELP CENTER & FAQS */}
      {activeTab === 'FAQS' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
              <PhoneCall className="w-8 h-8 text-[#3867FF]" />
              <div>
                <h4 className="font-bold text-xs text-slate-900">Partner Helpline</h4>
                <p className="text-xs text-slate-500">+91 1800 200 4567 (Toll Free)</p>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
              <div>
                <h4 className="font-bold text-xs text-slate-900">Compliance & Escrow Desk</h4>
                <p className="text-xs text-slate-500">partner-escrow@apexservices.in</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {faqs.map((f, i) => (
              <div key={i} className="p-4">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 gap-2"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {expandedFaq === i && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 65: SUPPORT TICKETS LIST */}
      {activeTab === 'TICKETS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Submitted Support & Dispute Tickets</h3>
            <button
              onClick={() => setActiveTab('CREATE')}
              className="text-xs font-bold text-[#3867FF] hover:underline"
            >
              + Create Ticket
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div key={t.id} className="py-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{t.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{t.createdAt}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{t.subject}</h4>
                <p className="text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                  {t.lastReply}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 66 & 67: CREATE SUPPORT TICKET */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm">Open Official Support Ticket</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Issue Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="JOB_ISSUE">Active Job Issue</option>
                <option value="DEPOSIT_SUPPORT">Security Deposit / Escrow Inquiry</option>
                <option value="PAYOUT_SUPPORT">Payout / Bank Settlement Support</option>
                <option value="COMPLIANCE">Document Verification Status</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Subject / Summary *</label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Detailed Explanation *</label>
              <textarea
                rows={4}
                placeholder="Provide complete context, booking ID if applicable..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('TICKETS')}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#3867FF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transmitting...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
