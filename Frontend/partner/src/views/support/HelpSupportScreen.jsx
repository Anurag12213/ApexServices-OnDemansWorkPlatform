import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { api } from '../../services/api';
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
  ShieldCheck,
  RefreshCw,
  Loader2,
  X,
  Clock,
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export const HelpSupportScreen = () => {
  const { toast } = useToast();
  const { partner } = usePartner();
  const [activeTab, setActiveTab] = useState('TICKETS'); // TICKETS, FAQS, CREATE
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // New Ticket form state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('JOB_ISSUE');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newWorkRequestId, setNewWorkRequestId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const list = await api.getMyTickets();
      setTickets(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Error loading partner tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getLastMessageText = (t) => {
    if (t?.messages && t.messages.length > 0) {
      const last = t.messages[t.messages.length - 1];
      return last.messageText || last.text || 'Message attached';
    }
    return t?.lastReply || 'Ticket initialized. Awaiting officer dispatch.';
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error('Please provide both a subject and explanation.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        workRequestId: newWorkRequestId.trim() || null,
        message: newMessage.trim()
      });

      if (created) {
        setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        setSelectedTicket(created);
        setNewSubject('');
        setNewMessage('');
        setNewWorkRequestId('');
        setActiveTab('TICKETS');
        toast.success(`Support ticket ${created.id} submitted to Dispatch Desk!`, 'Ticket Submitted');
      } else {
        toast.error('Failed to create ticket. Please check connection.', 'Error');
      }
    } catch (err) {
      toast.error('Network error transmitting ticket.', 'Transmission Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const result = await api.replyTicket(selectedTicket.id, replyText.trim());
      if (result) {
        const serverMsg = result.message || {};
        const newMsg = {
          id: serverMsg.id || Date.now(),
          senderName: partner?.fullName || partner?.name || 'Trade Partner (You)',
          messageText: serverMsg.messageText || replyText.trim(),
          createdAt: serverMsg.createdAt || new Date().toISOString(),
          isStaff: false
        };

        const updatedMessages = [...(selectedTicket.messages || []), newMsg];
        const updatedTicket = {
          ...selectedTicket,
          status: 'OPEN',
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };

        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t))
        );
        setReplyText('');
        toast.success('Your message has been sent to the support desk.', 'Reply Sent');
      } else {
        toast.error('Unable to send reply. Please try again.', 'Send Failed');
      }
    } catch (err) {
      toast.error('Network error sending message.', 'Reply Error');
    } finally {
      setIsReplying(false);
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            ApexServices Partner Support Desk
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#3867FF]" />
            <span>Help Center & Support Grievances</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            24/7 dedicated assistance for active jobs, escrow deposits, and payout settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedTicket(null);
              setActiveTab('FAQS');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'FAQS' ? 'bg-[#3867FF] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            FAQs & Guides
          </button>
          <button
            onClick={() => {
              setActiveTab('TICKETS');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'TICKETS' ? 'bg-[#3867FF] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            My Tickets ({tickets.length})
          </button>
          <button
            onClick={() => {
              setSelectedTicket(null);
              setActiveTab('CREATE');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'CREATE' ? 'bg-[#3867FF] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            + New Ticket
          </button>
        </div>
      </div>

      {/* TAB 1: FAQS & GUIDES */}
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
                  className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 gap-2 cursor-pointer"
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

      {/* TAB 2: MY TICKETS LIST & CONVERSATION THREAD */}
      {activeTab === 'TICKETS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Left Column: Tickets List */}
          <div className={`${selectedTicket ? 'hidden lg:block lg:col-span-5' : 'col-span-12'} space-y-3`}>
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm">Submitted Support & Dispute Tickets</h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {tickets.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTickets}
                  disabled={loading}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Refresh tickets"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#3867FF]' : ''}`} />
                </button>
                <button
                  onClick={() => setActiveTab('CREATE')}
                  className="text-xs font-bold text-[#3867FF] hover:underline cursor-pointer"
                >
                  + Create Ticket
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#3867FF]" />
                <span className="text-xs font-semibold">Loading support tickets...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-[#3867FF] rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">No support tickets yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Have an issue with an active job, escrow deposit, or payout settlement? Submit an official ticket to get priority assistance.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('CREATE')}
                  className="px-4 py-2 bg-[#3867FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Open First Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  const isResolved = t.status === 'RESOLVED';
                  const isInProgress = t.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300 shadow-xs ring-1 ring-[#3867FF]'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{t.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isResolved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {t.status || 'OPEN'}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{formatDateTime(t.createdAt)}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{t.subject}</h4>

                      {t.workRequestId && (
                        <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1">
                          Ref: {t.workRequestId}
                        </span>
                      )}

                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] mt-2 line-clamp-2">
                        {getLastMessageText(t)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Ticket Conversation Thread */}
          {selectedTicket && (
            <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between min-h-[520px] animate-in fade-in">
              <div className="space-y-4">
                {/* Thread Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="lg:hidden p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 mr-1"
                        title="Back to list"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {selectedTicket.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          selectedTicket.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : selectedTicket.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {selectedTicket.status || 'OPEN'}
                      </span>
                      {selectedTicket.workRequestId && (
                        <span className="text-[11px] font-bold text-slate-500">
                          Ref: {selectedTicket.workRequestId}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1.5">{selectedTicket.subject}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Category: <span className="font-semibold text-slate-700">{selectedTicket.category || 'General'}</span> • Created {formatDateTime(selectedTicket.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Close discussion view"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Notice if Resolved */}
                {selectedTicket.status === 'RESOLVED' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>This ticket has been officially resolved by the ApexServices Support & Compliance Team.</span>
                  </div>
                )}

                {/* Conversation Thread Bubbles */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {(selectedTicket.messages && selectedTicket.messages.length > 0) ? (
                    selectedTicket.messages.map((m, idx) => {
                      const isStaff = m.isStaff || m.staff;
                      return (
                        <div
                          key={m.id || idx}
                          className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                            isStaff
                              ? 'bg-blue-50/80 border border-blue-200 text-blue-950 ml-6 sm:ml-10'
                              : 'bg-slate-50 border border-slate-200 text-slate-800 mr-6 sm:mr-10'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`font-bold flex items-center gap-1 ${isStaff ? 'text-blue-700' : 'text-slate-700'}`}>
                              {isStaff ? (
                                <>
                                  <Shield className="w-3 h-3 text-blue-600" />
                                  <span>{m.senderName || 'ApexServices Support Desk'}</span>
                                  <span className="text-[9px] bg-blue-200/60 text-blue-800 px-1 rounded font-bold uppercase">Staff</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3 text-slate-500" />
                                  <span>{m.senderName || 'You (Trade Partner)'}</span>
                                </>
                              )}
                            </span>
                            <span className="text-slate-400">{formatDateTime(m.createdAt)}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap text-[11px] sm:text-xs">
                            {m.messageText || m.text}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700 mb-1">Ticket Summary:</p>
                      <p className="text-[11px] leading-relaxed">{selectedTicket.lastReply || 'Ticket opened. Official staff is reviewing this request.'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Form (Partner Response) */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 space-y-2 mt-4">
                <textarea
                  rows="3"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a message or response to the support officer..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-[#3867FF] transition"
                />
                <div className="flex justify-end gap-2 items-center">
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="px-4 py-2 bg-[#3867FF] hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isReplying ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE SUPPORT TICKET */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in max-w-3xl mx-auto">
          <div>
            <h3 className="font-black text-slate-900 text-base">Open Official Partner Support Ticket</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your inquiry will be directly routed to the ApexServices Compliance & Dispatch desk with SLA priority.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-[#3867FF]"
                >
                  <option value="JOB_ISSUE">Active Job Issue</option>
                  <option value="DEPOSIT_SUPPORT">Security Deposit / Escrow Inquiry</option>
                  <option value="PAYOUT_SUPPORT">Payout / Bank Settlement Support</option>
                  <option value="COMPLIANCE">Document Verification Status</option>
                  <option value="GENERAL">General Inquiry / Policy Question</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-[#3867FF]"
                >
                  <option value="MEDIUM">Medium Priority (Standard SLA)</option>
                  <option value="HIGH">High Priority (Urgent Job Conflict)</option>
                  <option value="URGENT">Urgent (Safety / Escrow Critical)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Related Job / Work Request ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. REQ-1004"
                value={newWorkRequestId}
                onChange={(e) => setNewWorkRequestId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject / Summary *</label>
              <input
                type="text"
                placeholder="Brief summary of the issue (e.g. Customer rescheduled time window on REQ-1004)..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Detailed Explanation & Context *</label>
              <textarea
                rows={5}
                placeholder="Provide complete context, customer details, or escrow receipt number..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('TICKETS')}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#3867FF] hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Support Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
