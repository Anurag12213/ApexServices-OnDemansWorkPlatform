import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  Copy,
  Check,
  CheckCheck,
  Sparkles
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
  const [copiedId, setCopiedId] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const CANNED_REPLIES = [
    "I have arrived at the customer location.",
    "Customer is currently unavailable at the address.",
    "Required spare parts are being procured.",
    "Work has been completed. Awaiting completion verification OTP.",
  ];

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const handleCopyTicketId = (id) => {
    if (!id) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(id);
      }
      setCopiedId(true);
      toast.info(`Ticket ID ${id} copied to clipboard!`, 'Copied');
      setTimeout(() => setCopiedId(false), 2000);
    } catch (e) {
      toast.info(`Ticket ID: ${id}`, 'Ticket Reference');
    }
  };

  const handleQuickReply = (text) => {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'nearest' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [selectedTicket?.messages?.length]);

  useEffect(() => {
    if (selectedTicket?.id) {
      setTimeout(() => scrollToBottom('auto'), 60);
    }
  }, [selectedTicket?.id]);

  // New Ticket form state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('JOB_ISSUE');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newWorkRequestId, setNewWorkRequestId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const list = await api.getMyTickets();
      const incoming = Array.isArray(list) ? list : [];
      setTickets(incoming);
      setSelectedTicket((current) => {
        if (!current) return null;
        const fresh = incoming.find((t) => t.id === current.id);
        return fresh || current;
      });
    } catch (err) {
      console.warn('Error loading partner tickets:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    let channel;
    try {
      channel = new BroadcastChannel('apex_services_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'TICKET_UPDATED') {
          fetchTickets(true);
        }
      };
    } catch (e) {}

    // Auto-poll every 60s for bi-directional live sync (instant on focus and BroadcastChannel)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchTickets(true);
    }, 60000);

    const handleFocus = () => fetchTickets(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (channel) channel.close();
    };
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
    if (e) e.preventDefault();
    const textToSend = replyText.trim();
    if (!textToSend || !selectedTicket || isReplying) return;

    // Immediately clear typing section for instant feedback
    setReplyText('');
    setIsReplying(true);

    try {
      const result = await api.replyTicket(selectedTicket.id, textToSend);
      if (result) {
        const serverMsg = result.message || {};
        const newMsg = {
          id: serverMsg.id || Date.now(),
          senderName: partner?.fullName || partner?.name || 'Trade Partner (You)',
          messageText: serverMsg.messageText || textToSend,
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
        toast.success('Your message has been sent to the support desk.', 'Reply Sent');
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        setReplyText(textToSend);
        toast.error('Unable to send reply. Please try again.', 'Send Failed');
      }
    } catch (err) {
      setReplyText(textToSend);
      toast.error('Network error sending message.', 'Reply Error');
    } finally {
      setIsReplying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply(e);
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
          <div className={`${selectedTicket ? 'hidden lg:flex lg:col-span-5' : 'col-span-12 lg:flex lg:col-span-5'} flex-col h-[640px] sm:h-[700px] space-y-3`}>
            {/* List Header */}
            <div className="shrink-0 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm">Support Tickets</h3>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {tickets.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTickets}
                  disabled={loading}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title="Refresh tickets"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#3867FF]' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setActiveTab('CREATE');
                  }}
                  className="text-xs font-bold text-[#3867FF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ticket</span>
                </button>
              </div>
            </div>

            {/* List Content */}
            {loading ? (
              <div className="flex-1 bg-white p-12 text-center rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#3867FF]" />
                <span className="text-xs font-semibold">Loading tickets...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex-1 bg-white p-10 text-center rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-[#3867FF] rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">No support tickets yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Have an issue with an active job, escrow deposit, or payout settlement? Submit an official ticket for fast dispatch assistance.
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
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  const isResolved = t.status === 'RESOLVED';
                  const isInProgress = t.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 rounded-2xl border transition-all text-left cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-2 ring-[#3867FF]/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-[#3867FF] transition-colors">
                            {t.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                              isResolved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isInProgress && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                            {t.status || 'OPEN'}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{formatDateTime(t.createdAt)}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-slate-950">
                        {t.subject}
                      </h4>

                      {t.workRequestId && (
                        <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1.5">
                          Ref: {t.workRequestId}
                        </span>
                      )}

                      <p className="text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-[11px] mt-2 line-clamp-2 leading-relaxed">
                        {getLastMessageText(t)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Desktop Placeholder when no ticket is selected */}
          {!selectedTicket && (
            <div className="hidden lg:flex lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm h-[640px] sm:h-[700px] flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#3867FF] flex items-center justify-center mb-4 ring-8 ring-blue-50/60">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">Select a Ticket to Open Conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Choose an existing support or dispute ticket from the list on the left to review the discussion, or start a new grievance.
              </p>
              <button
                onClick={() => setActiveTab('CREATE')}
                className="mt-5 px-4 py-2 bg-[#3867FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Open New Ticket</span>
              </button>
            </div>
          )}

          {/* Right Column: Active Ticket Conversation Thread (REDESIGNED CHATBOX) */}
          {selectedTicket && (
            <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[640px] sm:h-[700px] overflow-hidden relative animate-in fade-in">
              {/* 1. STICKY HEADER (Fixed, shrink-0, never moves) */}
              <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition mr-0.5 cursor-pointer"
                      title="Back to tickets list"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {/* Ticket ID Chip with Copy */}
                    <button
                      type="button"
                      onClick={() => handleCopyTicketId(selectedTicket.id)}
                      className="font-mono font-bold text-xs text-[#3867FF] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 transition cursor-pointer"
                      title="Click to copy Ticket ID"
                    >
                      <span>{selectedTicket.id}</span>
                      {copiedId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-blue-500 opacity-70" />
                      )}
                    </button>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1.5 ${
                        selectedTicket.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedTicket.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {selectedTicket.status === 'IN_PROGRESS' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      )}
                      {selectedTicket.status === 'RESOLVED' && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                      {selectedTicket.status || 'OPEN'}
                    </span>

                    {/* Work Request Reference */}
                    {selectedTicket.workRequestId && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Ref: <strong className="text-slate-700">{selectedTicket.workRequestId}</strong>
                      </span>
                    )}
                  </div>

                  {/* Subject Title */}
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mt-2 truncate">
                    {selectedTicket.subject}
                  </h3>

                  {/* Meta Subtitle */}
                  <p className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-700">{selectedTicket.category || 'General Issue'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(selectedTicket.createdAt)}
                    </span>
                  </p>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => fetchTickets(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Refresh conversation"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#3867FF]' : ''}`} />
                  </button>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Close discussion view"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Notice if Resolved */}
              {selectedTicket.status === 'RESOLVED' && (
                <div className="shrink-0 mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>This ticket has been officially resolved. You can send a message below to reopen it anytime.</span>
                  </div>
                </div>
              )}

              {/* 2. SCROLLABLE MESSAGES VIEWPORT (flex-1 min-h-0, scrollable independently) */}
              <div
                ref={messagesContainerRef}
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                  setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 80);
                }}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-slate-50/50 to-white"
              >
                {/* Initial Ticket Summary Card */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-b border-slate-100 pb-1.5">
                    <span className="flex items-center gap-1.5 text-[#3867FF]">
                      <FileQuestion className="w-3.5 h-3.5" />
                      <span>Original Grievance Record</span>
                    </span>
                    <span className="text-slate-400">{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs">{selectedTicket.subject}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.lastReply || 'Ticket initialized. Official support officer assigned to case.'}
                  </p>
                </div>

                {/* Timeline Separator */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200/70"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                    Official Conversation Thread
                  </span>
                  <div className="flex-grow border-t border-slate-200/70"></div>
                </div>

                {/* Messages List */}
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m, idx) => {
                    const isStaff = m.isStaff || m.staff;
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isStaff ? 'items-start mr-4 sm:mr-10' : 'items-end ml-4 sm:ml-10'}`}
                      >
                        {/* Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 max-w-[92%] sm:max-w-[85%] shadow-xs ${
                            isStaff
                              ? 'bg-white border border-blue-100 text-slate-800 rounded-tl-sm ring-1 ring-blue-50'
                              : 'bg-gradient-to-r from-[#3867FF] to-blue-600 text-white rounded-tr-sm shadow-blue-500/10'
                          }`}
                        >
                          {/* Sender Info Row */}
                          <div
                            className={`flex items-center justify-between gap-4 text-[10px] pb-1 border-b ${
                              isStaff ? 'border-slate-100 text-slate-500' : 'border-blue-400/40 text-blue-100'
                            }`}
                          >
                            <span className={`font-bold flex items-center gap-1.5 ${isStaff ? 'text-[#3867FF]' : 'text-white'}`}>
                              {isStaff ? (
                                <>
                                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#3867FF] flex items-center justify-center shrink-0">
                                    <Shield className="w-3 h-3" />
                                  </span>
                                  <span>{m.senderName || 'ApexServices Support Desk'}</span>
                                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-extrabold uppercase">
                                    Staff
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                                    <User className="w-3 h-3" />
                                  </span>
                                  <span>{m.senderName || 'You (Partner)'}</span>
                                </>
                              )}
                            </span>
                            <span className={isStaff ? 'text-slate-400' : 'text-blue-100 text-[9px]'}>
                              {formatDateTime(m.createdAt)}
                            </span>
                          </div>

                          {/* Message Body */}
                          <p className={`leading-relaxed whitespace-pre-wrap text-xs ${isStaff ? 'text-slate-700' : 'text-white'}`}>
                            {m.messageText || m.text}
                          </p>

                          {/* Partner checkmark indicator */}
                          {!isStaff && (
                            <div className="flex justify-end pt-0.5">
                              <span className="text-blue-200 text-[10px] flex items-center gap-0.5" title="Delivered to support desk">
                                <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">No additional replies yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Type your message below to send direct notes or questions to the support officer.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating Jump to Latest Button */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-24 right-6 z-20 bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Scroll to latest</span>
                </button>
              )}

              {/* 3. SOLID BOTTOM TYPING DOCK (Fixed, shrink-0, guaranteed never to move or jump) */}
              <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] z-10 space-y-2.5">
                {/* Quick Canned Action Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#3867FF]" /> Quick:
                  </span>
                  {CANNED_REPLIES.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickReply(text)}
                      className="shrink-0 bg-slate-100 hover:bg-blue-50 hover:text-[#3867FF] hover:border-blue-200 border border-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-semibold transition cursor-pointer"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {/* Input Field and Send Action */}
                <form onSubmit={handleSendReply} className="relative">
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 focus-within:bg-white focus-within:border-[#3867FF] focus-within:ring-2 focus-within:ring-[#3867FF]/15 transition-all">
                    <textarea
                      rows="2"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isReplying}
                      placeholder="Type a message or response to the support officer... (Press Enter to send, Shift+Enter for new line)"
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        Press <kbd className="px-1 py-0.5 bg-slate-200/70 text-slate-600 rounded text-[9px] font-mono">Enter ↵</kbd> to send • <kbd className="px-1 py-0.5 bg-slate-200/70 text-slate-600 rounded text-[9px] font-mono">Shift+Enter</kbd> for new line
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium sm:hidden">
                        {replyText.length} characters
                      </span>

                      <button
                        type="submit"
                        disabled={isReplying || !replyText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-[#3867FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                      >
                        {isReplying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
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
