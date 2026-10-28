import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  Wrench,
  Hammer,
  Zap,
  Paintbrush,
  Fan,
  Tv,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Phone,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileText,
  Search,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  User,
  Star,
  Check,
  RefreshCw,
  PhoneCall,
  MessageCircle,
  ChevronRight,
  Info,
  Sliders,
  DollarSign,
  AlertTriangle,
  Map,
  Truck,
  Megaphone,
  Headphones,
  MessageSquare,
  HelpCircle,
  Mail,
  Pencil,
  CreditCard,
  Activity,
} from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { useConfirm } from '../components/ConfirmDialog';
import { API_BASE_URL, getAssetUrl } from '../utils/apiConfig';

export const RequestWorkPage = () => {
  const {
    customerUser,
    customerToken,
    customerRequests = [],
    liveRequests = [],
    historyRequests = [],
    hasLiveRequest = false,
    mostRecentLiveRequest = null,
    bookingDraft,
    updateBookingDraft,
    clearBookingDraft,
    activeBookingStep,
    setActiveBookingStep,
    activeTrackingRequestId,
    setActiveTrackingRequestId,
    customerViewMode: viewMode,
    setCustomerViewMode: setViewMode,
    customerRequestsTab: requestsSubTab,
    setCustomerRequestsTab: setRequestsSubTab,
    handleViewAllRequests,
    loginSuccessNotice,
    setLoginSuccessNotice,
    setLoginBannerMessage,
    submitWorkRequest,
    setActivePage,
    formatCurrency,
    publicConfig,
    data,
    toast,
  } = useData();

  const confirm = useConfirm();

  // Inline Validation Errors State
  const [validationErrors, setValidationErrors] = useState({});
  const clearValidationError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Search filter for Screen 1
  const [categorySearch, setCategorySearch] = useState('');

  // Inline photo upload simulation
  const [photoPreview, setPhotoPreview] = useState(bookingDraft.photoUrl || '');

  // Submitting state (Screen 8)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Live tracking request state (Screen 9, 10, 11)
  const [trackedRequest, setTrackedRequest] = useState(null);
  const [completionOtp, setCompletionOtp] = useState('');
  const [pollingLoading, setPollingLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showAssignedBanner, setShowAssignedBanner] = useState(true);
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState(null);

  // Auto-dismiss assigned notification banner after 7 seconds
  useEffect(() => {
    if (showAssignedBanner) {
      const timer = setTimeout(() => {
        setShowAssignedBanner(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [showAssignedBanner]);

  // Auto-dismiss login success notice after 5 seconds
  useEffect(() => {
    if (loginSuccessNotice) {
      const timer = setTimeout(() => {
        setLoginSuccessNotice('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loginSuccessNotice, setLoginSuccessNotice]);

  // Support Ticket & Dispute Refund State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDisputeReq, setSelectedDisputeReq] = useState(null);
  const [disputeReason, setDisputeReason] = useState('Service Incomplete / Unsatisfactory');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Sync Refund Notifications from Admin via BroadcastChannel
  useEffect(() => {
    let syncChannel;
    try {
      syncChannel = new BroadcastChannel('apex_services_sync');
      syncChannel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'USER_REFUND_APPROVED') {
          toast.info(
            `Refund Claim for Order #${data.ticket || data.txnId} has been APPROVED by Admin! Settle payment in progress.`,
            'Refund Approved'
          );
          if (selectedHistoryRequest && (selectedHistoryRequest.id === data.ticket || selectedHistoryRequest.id === data.txnId)) {
            setSelectedHistoryRequest((prev) => ({ ...prev, refundStatus: 'Refund Approved' }));
          }
        }

        if (data.type === 'USER_REFUND_SETTLED') {
          toast.success(
            `Refund Settled & Done! ${data.amount || 'Funds'} successfully credited back to your original payment source.`,
            'Refund Cleared & Done'
          );
          if (selectedHistoryRequest && (selectedHistoryRequest.id === data.ticket || selectedHistoryRequest.id === data.txnId)) {
            setSelectedHistoryRequest((prev) => ({ ...prev, refundStatus: 'Refunded' }));
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    return () => {
      if (syncChannel) syncChannel.close();
    };
  }, [selectedHistoryRequest, toast]);

  const handleSubmitDispute = (e) => {
    e.preventDefault();
    if (!selectedDisputeReq) return;

    setIsSubmittingDispute(true);
    setTimeout(() => {
      const ticket = {
        id: selectedDisputeReq.id,
        serviceTicket: selectedDisputeReq.id,
        customerName: customerUser?.fullName || selectedDisputeReq.customerName || 'Valued Customer',
        customerEmail: customerUser?.email || selectedDisputeReq.customerEmail || 'customer@example.com',
        serviceCategory: selectedDisputeReq.serviceCategory || selectedDisputeReq.category || 'Home Service',
        amount: formatCurrency(selectedDisputeReq.paidAmount || selectedDisputeReq.estimatedCost || 499),
        reason: `${disputeReason}: ${disputeNotes || 'Customer raised support dispute'}`,
        status: 'Dispute / Refund Requested',
        createdAt: new Date().toISOString(),
      };

      try {
        const ch = new BroadcastChannel('apex_services_sync');
        ch.postMessage({ type: 'USER_REFUND_REQUESTED', ticket });
        ch.close();
      } catch (err) {}

      // Update selected item in view
      if (selectedHistoryRequest && selectedHistoryRequest.id === selectedDisputeReq.id) {
        setSelectedHistoryRequest((prev) => ({
          ...prev,
          refundStatus: 'Dispute / Refund Requested',
          disputeReason: ticket.reason,
        }));
      }

      setIsSubmittingDispute(false);
      setShowDisputeModal(false);
      setDisputeNotes('');
      toast.info(
        `Support ticket for Order #${selectedDisputeReq.id} submitted! Admin has received your request and will review & approve the refund.`,
        'Ticket Submitted'
      );
    }, 800);
  };

  // Completed service review state
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [customerPaymentMethod, setCustomerPaymentMethod] = useState('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Submit verified review to backend
  const handleReviewSubmit = async (reqId) => {
    setIsSubmittingReview(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`;
      const res = await fetch(`${API_BASE_URL}/work-requests/${reqId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating: ratingStars,
          reviewText: reviewComment || 'Verified service completed to full satisfaction.'
        })
      });
      if (res.ok) {
        setReviewSubmitted(true);
        toast.success('Your verified rating and review have been published!', 'Review Recorded');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to submit review.', 'Review Error');
      }
    } catch (e) {
      toast.error('Network error submitting review.', 'Review Error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Customer settlement payment handler
  const handleCustomerPay = async (reqId, method = 'UPI') => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch(`${API_BASE_URL}/work-requests/${reqId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });
      if (res.ok) {
        const updated = await res.json();
        setTrackedRequest(updated);
        toast.success(`Payment of ${formatCurrency(updated.paidAmount || updated.estimatedCost || 499)} confirmed! Invoice settled.`, 'Payment Confirmed');
        try {
          window.dispatchEvent(new CustomEvent('apex_payment_settled', {
            detail: { jobId: reqId, net: updated.partnerNetEarning, gross: updated.paidAmount }
          }));
        } catch (e) {}
      } else {
        toast.error('Payment processing failed. Please retry.', 'Payment Error');
      }
    } catch (e) {
      toast.error('Network error processing payment.', 'Payment Error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Default fallback categories
  const defaultCategories = [
    {
      id: 'Emergency Plumbing',
      title: 'Emergency Plumbing',
      iconName: 'Wrench',
      color: 'from-blue-500 to-indigo-600',
      description: 'Pipe leaks, tap replacement, drain clogs, and complete bathroom fixture repair.',
    },
    {
      id: 'Electrical Maintenance',
      title: 'Electrical Maintenance',
      iconName: 'Zap',
      color: 'from-amber-500 to-orange-600',
      description: 'Short circuit diagnosis, breaker upgrades, rewiring, and appliance installations.',
    },
    {
      id: 'Custom Carpentry',
      title: 'Custom Carpentry',
      iconName: 'Hammer',
      color: 'from-rose-500 to-red-600',
      description: 'Cabinet fitting, door alignment, furniture repairs, and precision woodwork.',
    },
    {
      id: 'HVAC & AC Service',
      title: 'HVAC & AC Service',
      iconName: 'Fan',
      color: 'from-cyan-500 to-blue-600',
      description: 'AC deep chemical cleaning, gas refills, compressor checks, and installations.',
    },
    {
      id: 'Painting & Decor',
      title: 'Painting & Decor',
      iconName: 'Paintbrush',
      color: 'from-purple-500 to-pink-600',
      description: 'Interior wall painting, texture coatings, exterior waterproofing, and stain fixes.',
    },
    {
      id: 'Appliance Care',
      title: 'Appliance Care',
      iconName: 'Tv',
      color: 'from-emerald-500 to-teal-600',
      description: 'Refrigerators, washing machines, microwaves, and domestic appliance repairs.',
    },
  ];

  const categoryGradients = [
    'from-blue-500 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-teal-500 to-emerald-600',
    'from-violet-500 to-purple-600',
  ];

  // If activeTrackingRequestId exists, poll it
  useEffect(() => {
    const effectiveTrackingId = activeTrackingRequestId || localStorage.getItem('apex_active_tracking_id');
    if (!effectiveTrackingId) return;

    if (!activeTrackingRequestId && effectiveTrackingId) {
      setActiveTrackingRequestId(effectiveTrackingId);
    }

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const headers = {};
        if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`;
        const res = await fetch(`${API_BASE_URL}/work-requests/${effectiveTrackingId}`, { headers });
        if (res.ok && isMounted) {
          const json = await res.json();
          setTrackedRequest(json);
          if (json.completionOtp) {
            setCompletionOtp(json.completionOtp);
          }
        }

        // Also fetch customer's authoritative completion OTP
        const otpRes = await fetch(`${API_BASE_URL}/work-requests/${effectiveTrackingId}/completion-otp`, { headers });
        if (otpRes.ok && isMounted) {
          const otpData = await otpRes.json();
          const code = otpData.completionOtp || otpData.otp;
          if (code) {
            setCompletionOtp(code);
          }
        }
      } catch (e) {
        console.warn('Status poll error:', e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTrackingRequestId, customerToken, activeBookingStep]);

  // Handle Photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        updateBookingDraft({ photoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    updateBookingDraft({ photoUrl: '' });
  };

  // Step 1 -> Step 2 validation
  const handleSelectCategory = (catId, catObj) => {
    const categoryName = (catObj && (catObj.name || catObj.title)) || (typeof catId === 'string' ? catId : '');
    const dbCat = data?.categories?.find((c) => c.name === categoryName || c.id === catId || c.slug === categoryName);
    const backendCat = dbCat || catObj;

    if (backendCat?.isTemporaryDown) {
      toast.warning(`The ${categoryName} service category is temporarily down for maintenance. Please select another category.`, 'Category Unavailable');
      return;
    }
    if (backendCat && backendCat.active === false) {
      toast.warning(`The ${categoryName} service category is currently inactive. Please select another category.`, 'Category Unavailable');
      return;
    }
    clearValidationError('serviceCategory');
    const resolvedId = dbCat ? dbCat.id : (catObj?.categoryId || (typeof catId === 'number' ? catId : null));
    updateBookingDraft({
      serviceCategory: categoryName,
      serviceCategoryId: resolvedId,
    });
  };

  // Step 2 Validation
  const handleContinueFromProblem = () => {
    if (!bookingDraft.problemDescription?.trim()) {
      setValidationErrors((prev) => ({ ...prev, problemDescription: 'Please provide a brief problem description before continuing.' }));
      toast.warning('Please describe the problem you are experiencing.', 'Description Required');
      return;
    }
    clearValidationError('problemDescription');
    setActiveBookingStep(3);
  };

  // Step 3 Validation
  const handleContinueFromRequirements = () => {
    setActiveBookingStep(4);
  };

  // Step 4 Validation
  const handleContinueFromAddress = () => {
    if (!bookingDraft.serviceAddress?.trim()) {
      setValidationErrors((prev) => ({ ...prev, serviceAddress: 'Street address or building name is required.' }));
      toast.warning('Please enter your street address before continuing.', 'Address Required');
      return;
    }
    clearValidationError('serviceAddress');

    // Phone validation
    const rawPhone = bookingDraft.contactPhone || customerUser?.phone || customerUser?.mobileNumber || '';
    if (rawPhone && rawPhone.trim()) {
      const digits = rawPhone.replace(/\D/g, '');
      if (/[a-zA-Z]/.test(rawPhone) || (digits.length > 0 && digits.length < 10)) {
        setValidationErrors((prev) => ({ ...prev, contactPhone: 'Please enter a valid 10-digit mobile number (digits only).' }));
        toast.warning('Please enter a valid 10-digit contact number for arrival calls.', 'Invalid Phone Number');
        return;
      }
    }
    clearValidationError('contactPhone');
    setActiveBookingStep(5);
  };

  // Step 5 Validation
  const handleContinueFromAppointment = () => {
    if (!bookingDraft.preferredDate) {
      setValidationErrors((prev) => ({ ...prev, preferredDate: 'Please pick a preferred service appointment date.' }));
      toast.warning('Please pick a preferred service date.', 'Date Required');
      return;
    }
    clearValidationError('preferredDate');
    setActiveBookingStep(6);
  };

  // Step 6: Final Submission Trigger
  const handleFinalSubmit = async () => {
    // 1. Mandatory Login Check
    if (!customerUser || !customerToken) {
      setLoginBannerMessage('Please log in to submit your service request.');
      setActivePage('login');
      return;
    }

    // Phone format check
    const rawPhone = bookingDraft.contactPhone || customerUser?.phone || customerUser?.mobileNumber || '';
    if (rawPhone && rawPhone.trim()) {
      const digits = rawPhone.replace(/\D/g, '');
      if (/[a-zA-Z]/.test(rawPhone) || (digits.length > 0 && digits.length < 10)) {
        setSubmitError('Invalid contact phone: Please enter a valid 10-digit mobile number.');
        toast.warning('Please enter a valid 10-digit phone number.', 'Invalid Phone Number');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    const res = await submitWorkRequest(bookingDraft);
    setIsSubmitting(false);

    if (res.success) {
      setTrackedRequest(res.request);
      setActiveTrackingRequestId(res.request.id);
      setActiveBookingStep(9); // Navigate to Finding Service Partner screen
    } else {
      setSubmitError(res.error || 'Failed to submit service request. Please retry.');
    }
  };

  // Cancel Work Request action
  const handleCancelRequest = async (id) => {
    const ok = await confirm({
      title: 'Cancel Service Request?',
      message: 'Are you sure you want to cancel this service request? This will withdraw your request from the technician dispatch queue.',
      confirmText: 'Yes, Cancel Request',
      cancelText: 'Keep Request',
      variant: 'danger',
    });
    if (!ok) return;

    setCancelling(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`;
      const res = await fetch(`${API_BASE_URL}/work-requests/${id}/cancel`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const updated = await res.json();
        setTrackedRequest(updated);
        toast.info('Service request was cancelled.', 'Cancelled');
      } else {
        setTrackedRequest((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
        toast.info('Service request has been cancelled.', 'Cancelled');
      }
    } catch (e) {
      setTrackedRequest((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
      toast.info('Service request has been cancelled.', 'Cancelled');
    } finally {
      setCancelling(false);
    }
  };

  // Dynamically build category list from backend data or fallback
  const availableCategories = (data?.categories && data.categories.length > 0)
    ? data.categories
        .filter((c) => !c.isSoftDeleted && c.active !== false)
        .map((c, idx) => ({
          id: c.name,
          name: c.name,
          categoryId: c.id,
          title: c.name,
          slug: c.slug,
          color: categoryGradients[idx % categoryGradients.length],
          description: c.description || 'Apex certified home repair & craftsmanship service.',
          icon: c.icon,
          iconName: c.iconName || c.icon?.name,
          isTemporaryDown: !!c.isTemporaryDown,
          isSoftDeleted: !!c.isSoftDeleted,
          active: c.active !== false,
        }))
    : defaultCategories;

  // Filter categories by search and backend active status
  const filteredCategories = availableCategories
    .filter((c) => !c.isSoftDeleted && c.active !== false)
    .filter((c) =>
      c.title.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.description.toLowerCase().includes(categorySearch.toLowerCase())
    );

  // Check if viewing active partner assigned or tracking screen
  const isAssignedTrackingView =
    viewMode === 'booking' &&
    activeBookingStep >= 9 &&
    trackedRequest &&
    trackedRequest.status !== 'BROADCASTED' &&
    trackedRequest.status !== 'FINDING_PARTNER' &&
    trackedRequest.status !== 'WAITING_ACCEPTANCE' &&
    trackedRequest.status !== 'EXPIRED' &&
    trackedRequest.status !== 'CANCELLED';

  const formatClaimTime = (dateStr) => {
    if (!dateStr) return 'Today, 10:24 AM';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Today, 10:24 AM';
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `Today, ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return 'Today, 10:24 AM';
    }
  };

  const getStageIndex = (status, stage, paymentStatus) => {
    if (status === 'COMPLETED') {
      return paymentStatus === 'PAID' ? 5 : 4;
    }
    if (stage >= 5) return 4;
    if (status === 'IN_PROGRESS' || stage === 4) return 3;
    if (status === 'ARRIVED') return 2;
    if (status === 'IN_TRANSIT' || status === 'EN_ROUTE' || stage === 3) return 1;
    return 0; // ASSIGNED or stage === 2 or default
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 md:py-12 px-3 sm:px-6 lg:px-8 text-left font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* TOP BAR / NAVIGATION HEADER (Hidden in Assigned Tracking View to match reference layout) */}
        {!isAssignedTrackingView && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  if (activeBookingStep > 1 && activeBookingStep <= 6) {
                    setActiveBookingStep((prev) => prev - 1);
                  } else {
                    setActivePage('home');
                  }
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  Apex Certified Service Requests
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                  Vetted professionals • Verified arrival windows • 100% Satisfaction Guarantee
                </p>
              </div>
            </div>

            {/* Mode Switcher: + New Request | Live Requests | History */}
            <div className="flex items-center w-full md:w-auto">
              <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 w-full sm:w-auto justify-between sm:justify-start overflow-x-auto no-scrollbar">
                {/* 1. + New Request */}
                <button
                  onClick={() => {
                    setViewMode('booking');
                    setActiveTrackingRequestId(null);
                    localStorage.removeItem('apex_active_tracking_id');
                    if (activeBookingStep > 6) setActiveBookingStep(1);
                  }}
                  className={`flex-1 sm:flex-initial text-center justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    viewMode === 'booking' && activeBookingStep <= 6
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + New Request
                </button>

                {/* 2. Live Requests (with real counter & blinking indicator) */}
                <button
                  onClick={() => {
                    setViewMode('history');
                    setRequestsSubTab('live');
                  }}
                  className={`flex-1 sm:flex-initial text-center justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    viewMode === 'history' && requestsSubTab === 'live'
                      ? (hasLiveRequest ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                      : hasLiveRequest
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={hasLiveRequest ? `${liveRequests.length} Active Live Request(s)` : 'No active live requests'}
                >
                  {hasLiveRequest && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <span>Live Requests</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    viewMode === 'history' && requestsSubTab === 'live'
                      ? (hasLiveRequest ? 'bg-white/25 text-white' : 'bg-slate-700 text-white')
                      : hasLiveRequest
                      ? 'bg-emerald-200 text-emerald-950'
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {liveRequests.length}
                  </span>
                </button>

                {/* 3. History (past orders) */}
                <button
                  onClick={() => {
                    setViewMode('history');
                    setRequestsSubTab('history');
                  }}
                  className={`flex-1 sm:flex-initial text-center justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    viewMode === 'history' && requestsSubTab === 'history'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>History</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    viewMode === 'history' && requestsSubTab === 'history'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {historyRequests.length}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN SUCCESS NOTICE BANNER (AFTER LOGIN REDIRECT) */}
        {loginSuccessNotice && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-950">{loginSuccessNotice}</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Your booking draft has been restored. Review your details below and confirm submission to initiate dispatch.
                </p>
              </div>
            </div>
            <button
              onClick={() => setLoginSuccessNotice('')}
              className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* COMPACT & CONCISE LIVE REQUESTS BAR */}
        {hasLiveRequest && viewMode === 'booking' && activeBookingStep <= 6 && (
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-950">
                You have <strong className="font-bold text-emerald-700">{liveRequests.length} active live request{liveRequests.length > 1 ? 's' : ''}</strong> in progress
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode('history');
                setRequestsSubTab('live');
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>View ({liveRequests.length}) →</span>
            </button>
          </div>
        )}

        {/* VIEW MODE 1: ALL REQUESTS (CLEAN SEPARATION: LIVE REQUESTS & HISTORY) */}
        {viewMode === 'history' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {requestsSubTab === 'live' ? 'Active Live Requests' : 'Past Service History & Invoices'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {requestsSubTab === 'live'
                    ? `Showing ${liveRequests.length} in-flight active service order${liveRequests.length === 1 ? '' : 's'}`
                    : `Showing ${historyRequests.length} completed or past service invoice${historyRequests.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewMode('booking');
                  setActiveTrackingRequestId(null);
                  localStorage.removeItem('apex_active_tracking_id');
                  setActiveBookingStep(1);
                }}
                className="bg-[#ff3b47] hover:bg-[#e62e3a] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 self-start sm:self-auto"
              >
                <span>+ Request New Service</span>
              </button>
            </div>

            {/* SUB-SECTION 1: ACTIVE LIVE REQUESTS */}
            {requestsSubTab === 'live' && (
              <div className="space-y-4">
                {liveRequests.length === 0 ? (
                  <div className="text-center py-16 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">No active live requests in progress</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All your previous requests have concluded. When you place a new service request, it will appear here in real-time.
                    </p>
                    <button
                      onClick={() => {
                        setViewMode('booking');
                        setActiveBookingStep(1);
                      }}
                      className="bg-[#ff3b47] hover:bg-[#e62e3a] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      Book a Service Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 rounded-2xl border-2 border-emerald-300 hover:border-emerald-400 hover:shadow-lg transition-all bg-emerald-50/20 shadow-xs space-y-3 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

                        <div className="flex items-center justify-between relative z-10">
                          <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                            {req.id}
                          </span>
                          <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span>{req.status?.replace('_', ' ')}</span>
                          </span>
                        </div>

                        <div className="relative z-10">
                          <h4 className="text-sm font-black text-slate-900">{req.serviceCategory || req.category}</h4>
                          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                            {req.problemTitle || req.problemDescription || req.notes || 'Technician service active'}
                          </p>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-1.5 pt-2 border-t border-emerald-200/60 relative z-10">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{req.serviceAddress || req.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{req.preferredDate} • {req.preferredTime || req.timeSlot || 'Standard Service'}</span>
                          </div>
                          {req.assignedPartnerName && (
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                              {(req.assignedPartnerPhoto || req.partnerPhoto) ? (
                                <img
                                  src={getAssetUrl(req.assignedPartnerPhoto || req.partnerPhoto)}
                                  alt={req.assignedPartnerName}
                                  className="w-4 h-4 rounded-full object-cover border border-emerald-400 shrink-0"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span>Technician: {req.assignedPartnerName}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTrackingRequestId(req.id);
                            setTrackedRequest(req);
                            setViewMode('booking');
                            setActiveBookingStep(9);
                          }}
                          className="w-full mt-2 py-3 bg-[#6246FF] hover:bg-[#5034EA] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer relative z-10"
                        >
                          <Activity className="w-4 h-4 animate-pulse" />
                          <span>Track Live Status Now</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-SECTION 2: PAST ORDER HISTORY */}
            {requestsSubTab === 'history' && (
              <div className="space-y-4">
                {selectedHistoryRequest ? (
                  /* SOBER, CLEAN ORDER DETAILS & RECEIPT VIEW (NO TRACKING/STEPPER) */
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
                    {/* Top Navigation & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryRequest(null)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors w-fit cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to All History</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                          Order #{selectedHistoryRequest.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            selectedHistoryRequest.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {selectedHistoryRequest.paymentStatus === 'PAID'
                            ? '✓ Paid & Settled'
                            : selectedHistoryRequest.status?.replace('_', ' ') || 'Completed'}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Service Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Service Information
                        </h4>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                          <h3 className="text-base font-extrabold text-slate-900">
                            {selectedHistoryRequest.serviceCategory || selectedHistoryRequest.category || 'Home Repair Service'}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {selectedHistoryRequest.problemTitle || selectedHistoryRequest.problemDescription || selectedHistoryRequest.notes || 'Full diagnostic and service completed.'}
                          </p>
                          <div className="pt-2 text-[11px] text-slate-500 space-y-1 border-t border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{selectedHistoryRequest.preferredDate} • {selectedHistoryRequest.timeSlot || 'Morning'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{selectedHistoryRequest.serviceAddress || selectedHistoryRequest.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Specialist Info */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Assigned Specialist
                        </h4>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex items-center gap-3">
                            {(selectedHistoryRequest.assignedPartnerPhoto || selectedHistoryRequest.partnerPhoto) ? (
                              <img
                                src={getAssetUrl(selectedHistoryRequest.assignedPartnerPhoto || selectedHistoryRequest.partnerPhoto)}
                                alt={selectedHistoryRequest.assignedPartnerName || 'Specialist'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {(selectedHistoryRequest.assignedPartnerName || 'S').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                {selectedHistoryRequest.assignedPartnerName || selectedHistoryRequest.partnerName || 'Certified Specialist'}
                              </h4>
                              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Apex Verified Professional
                              </p>
                            </div>
                          </div>
                          {selectedHistoryRequest.assignedPartnerPhone && (
                            <p className="text-xs text-slate-500 pt-1">
                              Contact: <strong>{selectedHistoryRequest.assignedPartnerPhone}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Official Payment & Settlement Receipt */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Official Payment Receipt
                      </h4>
                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                        {/* Concise Payment Method & Settlement Banner (Green container with blue tick) */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-900">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">
                                Payment Method — {(selectedHistoryRequest.paymentMethod || 'UPI').toUpperCase()}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-full">
                                Settled
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-0.5">
                              {(selectedHistoryRequest.paymentMethod || '').toUpperCase() === 'CASH' ? (
                                <div>Details: <span className="font-medium text-slate-800">Cash Received on-site by Specialist</span></div>
                              ) : (
                                <div>Details: UPI ID <span className="font-mono font-semibold text-slate-800">apexservices@icici</span> (Ref #{selectedHistoryRequest.id})</div>
                              )}
                              <div>Time: <span className="font-medium text-slate-800">{formatClaimTime(selectedHistoryRequest.paidAt || selectedHistoryRequest.completedAt || selectedHistoryRequest.updatedAt)}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Line items */}
                        <div className="space-y-2 text-xs pt-1 border-t border-slate-200/80">
                          <div className="flex justify-between text-slate-600">
                            <span>Service Diagnostic & Labor Charges</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(Math.max((selectedHistoryRequest.paidAmount || selectedHistoryRequest.estimatedCost || 499) - 50, 100))}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Platform Safety & Quality Guarantee</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(50)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total Paid & Settled</span>
                            <span className="text-emerald-700">
                              {formatCurrency(selectedHistoryRequest.paidAmount || selectedHistoryRequest.estimatedCost || 499)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Rating / Review */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800">
                        Customer Rating & Feedback
                      </h4>
                      {selectedHistoryRequest.rating ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= selectedHistoryRequest.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-1">
                              {selectedHistoryRequest.rating} / 5 Stars
                            </span>
                          </div>
                          {selectedHistoryRequest.reviewComment && (
                            <p className="text-xs text-slate-600 italic">
                              "{selectedHistoryRequest.reviewComment}"
                            </p>
                          )}
                        </div>
                      ) : reviewSubmitted ? (
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Thank you for your review!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setRatingStars(s)}
                                  className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      s <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-slate-700">{ratingStars} of 5 Stars</span>
                          </div>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Write your feedback regarding service quality..."
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows={2}
                          />
                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleReviewSubmit(selectedHistoryRequest.id)}
                            className="px-4 py-2 bg-[#3867FF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Refund / Dispute Status Banner */}
                    {selectedHistoryRequest.refundStatus && (
                      <div
                        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                          selectedHistoryRequest.refundStatus === 'Refunded'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : selectedHistoryRequest.refundStatus === 'Refund Approved'
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Support Status: <strong>{selectedHistoryRequest.refundStatus}</strong>
                            {selectedHistoryRequest.disputeReason && (
                              <span className="block text-[11px] opacity-80 mt-0.5">
                                Note: {selectedHistoryRequest.disputeReason}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white border shrink-0">
                          {selectedHistoryRequest.refundStatus === 'Refunded'
                            ? 'Settled & Returned'
                            : selectedHistoryRequest.refundStatus === 'Refund Approved'
                            ? 'Admin Approved • Ready to Settle'
                            : 'Under Review'}
                        </span>
                      </div>
                    )}

                    {/* Section 5: Bottom Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>

                        {/* Raise Dispute Button */}
                        {!selectedHistoryRequest.refundStatus && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDisputeReq(selectedHistoryRequest);
                              setShowDisputeModal(true);
                            }}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Raise Dispute / Refund</span>
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryRequest(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Close Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearBookingDraft();
                            updateBookingDraft({
                              serviceCategory: selectedHistoryRequest.serviceCategory || selectedHistoryRequest.category,
                            });
                            setViewMode('booking');
                            setActiveBookingStep(2);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Book Again
                        </button>
                      </div>
                    </div>

                    {/* CUSTOMER SUPPORT DISPUTE / REFUND MODAL */}
                    {showDisputeModal && selectedDisputeReq && (
                      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left animate-in fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">Raise Dispute Ticket</h3>
                              <p className="text-xs text-slate-500">Order #{selectedDisputeReq.id} • {selectedDisputeReq.serviceCategory || selectedDisputeReq.category}</p>
                            </div>
                            <button
                              onClick={() => setShowDisputeModal(false)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleSubmitDispute} className="space-y-3.5 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Select Dispute Reason *</label>
                              <select
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                              >
                                <option>Service Incomplete / Unsatisfactory</option>
                                <option>Technician Late / Did Not Arrive</option>
                                <option>Billed Extra / Pricing Discrepancy</option>
                                <option>Property Damage or Quality Issue</option>
                                <option>Other Service Issue</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Explain Details for Admin Review *</label>
                              <textarea
                                rows={3}
                                required
                                placeholder="Describe what occurred during the service so our administration team can approve your refund..."
                                value={disputeNotes}
                                onChange={(e) => setDisputeNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                              />
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                              <ShieldCheck className="w-4 h-4 text-blue-600 inline mr-1" />
                              <strong>100% Buyer Protection:</strong> Admin will verify your request, approve the refund, and settle the payment back to your original source.
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowDisputeModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSubmittingDispute}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                              >
                                {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute & Request Refund'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : historyRequests.length === 0 ? (
                  <div className="text-center py-16 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">No past history yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Completed orders and settled invoices will appear here once service has ended.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            {req.id}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              req.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : req.status === 'COMPLETED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : req.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {req.paymentStatus === 'PAID'
                              ? 'Paid & Settled'
                              : req.status?.replace('_', ' ')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900">{req.serviceCategory || req.category}</h4>
                            <span className="text-xs font-black text-slate-900">
                              {formatCurrency(req.paidAmount || req.estimatedCost || 499)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {req.problemTitle || req.problemDescription || req.notes || 'Service order completed'}
                          </p>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{req.serviceAddress || req.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{req.preferredDate} • {req.timeSlot || 'Morning'}</span>
                          </div>
                          {req.assignedPartnerName && (
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                              {(req.assignedPartnerPhoto || req.partnerPhoto) ? (
                                <img
                                  src={getAssetUrl(req.assignedPartnerPhoto || req.partnerPhoto)}
                                  alt={req.assignedPartnerName}
                                  className="w-4 h-4 rounded-full object-cover border border-emerald-400 shrink-0"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span>Specialist: {req.assignedPartnerName}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHistoryRequest(req);
                          }}
                          className="w-full mt-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Request Details & Receipt</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: ACTIVE MULTI-STEP BOOKING WORKFLOW */}
        {viewMode === 'booking' && (
          <div className="space-y-6">

            {/* STEP PROGRESS INDICATOR BAR (Steps 1 to 6) */}
            {activeBookingStep <= 6 && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-[#3867FF] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Step {activeBookingStep} of 6
                  </span>
                  <span className="font-bold text-slate-700">
                    {activeBookingStep === 1 && '1. Choose Category'}
                    {activeBookingStep === 2 && '2. Problem Diagnosis'}
                    {activeBookingStep === 3 && '3. Scope & Requirements'}
                    {activeBookingStep === 4 && '4. Service Location'}
                    {activeBookingStep === 5 && '5. Schedule Visit'}
                    {activeBookingStep === 6 && '6. Review & Final Dispatch'}
                  </span>
                </div>

                {/* Progress Bar with Royal Blue Brand Theme */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3867FF] transition-all duration-300 rounded-full"
                    style={{ width: `${(activeBookingStep / 6) * 100}%` }}
                  />
                </div>

                {/* Clickable Quick Step Pills for previously reached steps */}
                <div className="hidden sm:flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  {[
                    '1. Category',
                    '2. Problem',
                    '3. Specifics',
                    '4. Address',
                    '5. Schedule',
                    '6. Review & Dispatch',
                  ].map((label, idx) => {
                    const stepNum = idx + 1;
                    const isDone = activeBookingStep > stepNum;
                    const isCurrent = activeBookingStep === stepNum;
                    return (
                      <button
                        key={idx}
                        disabled={stepNum > activeBookingStep}
                        onClick={() => setActiveBookingStep(stepNum)}
                        className={`transition-all font-semibold flex items-center gap-1 ${
                          isCurrent
                            ? 'text-[#3867FF] font-black'
                            : isDone
                            ? 'text-emerald-600 hover:text-[#3867FF] cursor-pointer'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MAIN TWO-COLUMN CONTAINER (FORM ON LEFT, COMPACT SUMMARY ON RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* LEFT COLUMN: ACTIVE SCREEN CONTENT (2 COLS) */}
              <div className="lg:col-span-2 space-y-6">

                {/* SCREEN 1: SERVICE SELECTION */}
                {activeBookingStep === 1 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        What service do you need?
                      </h2>
                      <p className="text-xs text-slate-500">
                        Choose from our certified home service categories or search by specialty.
                      </p>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search plumbing, woodwork, wiring, AC cleaning..."
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47] transition-all"
                      />
                    </div>

                    {validationErrors.serviceCategory && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>{validationErrors.serviceCategory}</span>
                      </div>
                    )}

                    {/* Category Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredCategories.map((cat) => {
                        const isSelected = bookingDraft.serviceCategory === cat.id ||
                                           bookingDraft.serviceCategory === cat.name ||
                                           bookingDraft.serviceCategory === cat.title;
                        const isDown = cat.isTemporaryDown;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => !isDown && handleSelectCategory(cat.id, cat)}
                            className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden text-left flex flex-col justify-between group ${
                              isDown
                                ? 'border-amber-200 bg-amber-50/20 opacity-75 cursor-not-allowed'
                                : isSelected
                                ? 'border-blue-600 bg-blue-50/30 shadow-sm ring-2 ring-blue-500/20 cursor-pointer'
                                : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div
                                  className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center shadow-xs p-2 overflow-hidden ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-blue-50 border border-blue-200/80 text-blue-700'
                                  }`}
                                >
                                  <CategoryIcon
                                    icon={cat.icon}
                                    iconName={cat.iconName}
                                    iconValue={cat.icon?.iconValue}
                                    className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-700'}`}
                                    imgClassName="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isDown && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                      Temporarily Down
                                    </span>
                                  )}
                                </div>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 mb-1">
                                {cat.title}
                              </h3>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {cat.description}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold">
                              <span className={isDown ? 'text-amber-600' : isSelected ? 'text-blue-600' : 'text-slate-500'}>
                                {isDown ? 'Paused for Maintenance' : isSelected ? 'Selected Category' : 'Choose Service'}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-300 text-transparent'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          if (!bookingDraft.serviceCategory) {
                            setValidationErrors((prev) => ({ ...prev, serviceCategory: 'Please select a service category to continue.' }));
                            toast.warning('Please select a service category before proceeding.', 'Category Required');
                            return;
                          }
                          clearValidationError('serviceCategory');
                          setActiveBookingStep(2);
                        }}
                        className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Problem Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 2: DESCRIBE YOUR PROBLEM */}
                {activeBookingStep === 2 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                    {/* Selected category banner */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0A2540] text-white flex items-center justify-center font-bold shadow-xs">
                          <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff3b47]">
                            Target Specialty
                          </span>
                          <h3 className="text-sm font-black text-slate-900">
                            {bookingDraft.serviceCategory}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveBookingStep(1)}
                        className="text-xs font-bold text-[#ff3b47] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Describe your problem
                      </h2>
                      <p className="text-xs text-slate-500">
                        Provide clear diagnostic details so our certified team can bring the right parts.
                      </p>
                    </div>

                    {/* Short Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Short Issue Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={bookingDraft.problemTitle || ''}
                        onChange={(e) => updateBookingDraft({ problemTitle: e.target.value })}
                        placeholder="e.g. Master bathroom sink drain clogged completely"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47] transition-all"
                      />
                    </div>

                    {/* Detailed Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Detailed Problem Description <span className="text-[#ff3b47]">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={bookingDraft.problemDescription || ''}
                        onChange={(e) => {
                          clearValidationError('problemDescription');
                          updateBookingDraft({ problemDescription: e.target.value });
                        }}
                        placeholder="Describe the issue, when it started, any visible damage, or sounds..."
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all ${
                          validationErrors.problemDescription
                            ? 'bg-red-50/20 border-red-400 ring-2 ring-red-100 text-slate-900 focus:outline-none focus:border-red-500'
                            : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47]'
                        }`}
                      />
                      {validationErrors.problemDescription ? (
                        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                          <span>{validationErrors.problemDescription}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Helpful tip: Mention if water/power needs to be shut down before arrival.
                        </p>
                      )}
                    </div>

                    {/* Optional Photo Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Upload Problem Photo (Optional)
                      </label>
                      {photoPreview ? (
                        <div className="relative inline-block border-2 border-dashed border-slate-300 rounded-xl p-2 bg-slate-50">
                          <img
                            src={photoPreview}
                            alt="Uploaded problem preview"
                            className="w-32 h-24 object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 bg-[#ff3b47] text-white rounded-full p-1 shadow-md hover:bg-[#e62e3a] transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-200 hover:border-[#ff3b47] bg-slate-50 hover:bg-red-50/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-[#ff3b47]">
                            Click to upload picture or drag image here
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            PNG, JPG up to 5MB (helps specialist identify replacement parts)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Urgency Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Urgency Level
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: 'Standard (Within 24-48 hrs)',
                            label: 'Standard',
                            time: 'Within 24-48 hrs',
                            color: 'text-slate-800',
                          },
                          {
                            id: 'Priority Same-Day',
                            label: 'Priority Same-Day',
                            time: 'Within 4-6 hrs',
                            color: 'text-slate-900',
                          },
                          {
                            id: 'Emergency (Within 2 hrs)',
                            label: 'Emergency 24/7',
                            time: 'Within 2 hrs',
                            color: 'text-[#ff3b47]',
                          },
                        ].map((urg) => (
                          <div
                            key={urg.id}
                            onClick={() => updateBookingDraft({ urgency: urg.id })}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              bookingDraft.urgency === urg.id
                                ? 'border-[#ff3b47] bg-red-50/30 shadow-xs ring-1 ring-[#ff3b47]/20'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-xs font-black block ${urg.color}`}>
                              {urg.label}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {urg.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveBookingStep(1)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueFromProblem}
                        className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Requirements</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 3: ADDITIONAL CATEGORY-SPECIFIC REQUIREMENTS */}
                {activeBookingStep === 3 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Additional Requirements for {bookingDraft.serviceCategory}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Dynamic category questions to ensure the technician carries the exact toolset and materials.
                      </p>
                    </div>

                    {/* DYNAMIC QUESTIONS BY CATEGORY */}
                    <div className="space-y-4">
                      {bookingDraft.serviceCategory?.includes('Plumbing') && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Leak Location
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              {['Kitchen Sink', 'Bathroom & Shower', 'Main Supply Line', 'Wall Concealed Pipe', 'Drain Pipe', 'Other'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateBookingDraft({
                                      additionalAnswers: { ...bookingDraft.additionalAnswers, location: opt },
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                                    bookingDraft.additionalAnswers?.location === opt
                                      ? 'border-[#ff3b47] bg-red-50/30 text-[#ff3b47] font-bold ring-1 ring-[#ff3b47]/20'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Is the main water stop-valve shut off?
                            </label>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {['Yes, shut off', 'No, still running', "Can't locate valve", "I don't know"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateBookingDraft({
                                      additionalAnswers: { ...bookingDraft.additionalAnswers, waterShut: opt },
                                    })
                                  }
                                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                    bookingDraft.additionalAnswers?.waterShut === opt
                                      ? 'border-[#ff3b47] bg-red-50/30 text-[#ff3b47] font-bold ring-1 ring-[#ff3b47]/20'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {bookingDraft.serviceCategory?.includes('Carpentry') && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Item Needing Attention
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              {['Wardrobe / Closet', 'Door & Hinges', 'Kitchen Cabinet', 'Wooden Furniture', 'Bed Frame', 'Other'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateBookingDraft({
                                      additionalAnswers: { ...bookingDraft.additionalAnswers, item: opt },
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                                    bookingDraft.additionalAnswers?.item === opt
                                      ? 'border-[#ff3b47] bg-red-50/30 text-[#ff3b47] font-bold ring-1 ring-[#ff3b47]/20'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Are replacement hardware (hinges, handles, screws) available?
                            </label>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {['Yes, on site', 'Specialist should supply', 'Need recommendation', "I don't know"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateBookingDraft({
                                      additionalAnswers: { ...bookingDraft.additionalAnswers, hardware: opt },
                                    })
                                  }
                                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                    bookingDraft.additionalAnswers?.hardware === opt
                                      ? 'border-[#ff3b47] bg-red-50/30 text-[#ff3b47] font-bold ring-1 ring-[#ff3b47]/20'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {bookingDraft.serviceCategory?.includes('Electrical') && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Issue Symptom
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              {['Breaker Tripping', 'Switch Sparking', 'Socket Dead', 'Light Installation', 'Burning Odor', 'Other'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateBookingDraft({
                                      additionalAnswers: { ...bookingDraft.additionalAnswers, symptom: opt },
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                                    bookingDraft.additionalAnswers?.symptom === opt
                                      ? 'border-[#ff3b47] bg-red-50/30 text-[#ff3b47] font-bold ring-1 ring-[#ff3b47]/20'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {!bookingDraft.serviceCategory?.includes('Plumbing') &&
                        !bookingDraft.serviceCategory?.includes('Carpentry') &&
                        !bookingDraft.serviceCategory?.includes('Electrical') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                              Service Scope or Equipment Type
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              {['Standard Maintenance', 'Urgent Diagnostic', 'New Component Fit', 'Periodic Servicing', 'Other'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateBookingDraft({
                                      additionalAnswers: { ...bookingDraft.additionalAnswers, scope: opt },
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                                    bookingDraft.additionalAnswers?.scope === opt
                                      ? 'border-[#ff3b47] bg-red-50/30 text-[#ff3b47] font-bold ring-1 ring-[#ff3b47]/20'
                                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveBookingStep(2)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueFromRequirements}
                        className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Service Address</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 4: SERVICE ADDRESS */}
                {activeBookingStep === 4 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Where should our technician arrive?
                      </h2>
                      <p className="text-xs text-slate-500">
                        Enter precise property details for prompt dispatch and GPS navigation.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Full Street Address */}
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Street Address / Building Name <span className="text-[#ff3b47]">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className={`w-4 h-4 absolute left-3 top-3 pointer-events-none transition-colors ${
                            validationErrors.serviceAddress ? 'text-red-400' : 'text-slate-400'
                          }`} />
                          <input
                            type="text"
                            required
                            value={bookingDraft.serviceAddress || ''}
                            onChange={(e) => {
                              clearValidationError('serviceAddress');
                              updateBookingDraft({ serviceAddress: e.target.value });
                            }}
                            placeholder="e.g. Green Valley Towers, Link Road"
                            className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl transition-all ${
                              validationErrors.serviceAddress
                                ? 'bg-red-50/20 border-red-400 ring-2 ring-red-100 text-slate-900 focus:outline-none focus:border-red-500'
                                : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47]'
                            }`}
                          />
                        </div>
                        {validationErrors.serviceAddress && (
                          <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-fadeIn">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                            <span>{validationErrors.serviceAddress}</span>
                          </p>
                        )}
                      </div>

                      {/* Apartment / House Details & City/Postal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Flat / House No. & Floor
                          </label>
                          <input
                            type="text"
                            value={bookingDraft.houseDetails || ''}
                            onChange={(e) => updateBookingDraft({ houseDetails: e.target.value })}
                            placeholder="e.g. Flat 402, 4th Floor"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            City & Postal Code
                          </label>
                          <input
                            type="text"
                            value={bookingDraft.cityPostal || ''}
                            onChange={(e) => updateBookingDraft({ cityPostal: e.target.value })}
                            placeholder="e.g. Mumbai 400050"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47] transition-all"
                          />
                        </div>
                      </div>

                      {/* Landmark & Contact Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Nearest Landmark
                          </label>
                          <input
                            type="text"
                            value={bookingDraft.landmark || ''}
                            onChange={(e) => updateBookingDraft({ landmark: e.target.value })}
                            placeholder="e.g. Opposite Metro Station"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Contact Phone for Arrival Call <span className="text-[#ff3b47]">*</span>
                          </label>
                          <div className="relative">
                            <Phone className={`w-3.5 h-3.5 absolute left-3 top-3 pointer-events-none transition-colors ${
                              validationErrors.contactPhone ? 'text-red-400' : 'text-slate-400'
                            }`} />
                            <input
                              type="tel"
                              value={bookingDraft.contactPhone || customerUser?.phone || customerUser?.mobileNumber || ''}
                              onChange={(e) => {
                                clearValidationError('contactPhone');
                                updateBookingDraft({ contactPhone: e.target.value.replace(/[^0-9+\s\-]/g, '') });
                              }}
                              placeholder="+91 98765 43210"
                              className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl transition-all ${
                                validationErrors.contactPhone
                                  ? 'bg-red-50/20 border-red-400 ring-2 ring-red-100 text-slate-900 focus:outline-none focus:border-red-500'
                                  : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47]'
                              }`}
                            />
                          </div>
                          {validationErrors.contactPhone && (
                            <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-fadeIn">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                              <span>{validationErrors.contactPhone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Access Instructions */}
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Special Access Instructions (Optional)
                        </label>
                        <input
                          type="text"
                          value={bookingDraft.accessInstructions || ''}
                          onChange={(e) => updateBookingDraft({ accessInstructions: e.target.value })}
                          placeholder="e.g. Service elevator on right, call upon arrival at main gate"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3b47]/20 focus:border-[#ff3b47] transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveBookingStep(3)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueFromAddress}
                        className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Schedule</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 5: APPOINTMENT SCHEDULING */}
                {activeBookingStep === 5 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Select Appointment Slot
                      </h2>
                      <p className="text-xs text-slate-500">
                        Choose when you'd like your certified specialist to arrive at your address.
                      </p>
                    </div>

                    {/* Earliest vs Scheduled Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateBookingDraft({
                            appointmentType: 'earliest',
                            preferredDate: new Date().toISOString().split('T')[0],
                          })
                        }
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          bookingDraft.appointmentType === 'earliest'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        ⚡ Earliest Available (Today)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBookingDraft({ appointmentType: 'scheduled' })}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          bookingDraft.appointmentType === 'scheduled'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        📅 Scheduled Date & Slot
                      </button>
                    </div>

                    {/* Date Selector Pills */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Available Dates
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[0, 1, 2, 3].map((daysAhead) => {
                          const dateObj = new Date(Date.now() + daysAhead * 86400000);
                          const dateStr = dateObj.toISOString().split('T')[0];
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const isSelected = bookingDraft.preferredDate === dateStr;

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                clearValidationError('preferredDate');
                                updateBookingDraft({ preferredDate: dateStr });
                              }}
                              className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-xs ring-1 ring-blue-500/20'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <span className="text-[10px] uppercase tracking-wider block opacity-75">
                                {daysAhead === 0 ? 'Today' : daysAhead === 1 ? 'Tomorrow' : dayName}
                              </span>
                              <span className="text-xs font-black block mt-0.5">
                                {monthDay}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {validationErrors.preferredDate && (
                        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                          <span>{validationErrors.preferredDate}</span>
                        </p>
                      )}
                    </div>

                    {/* Time Slot Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Preferred Arrival Window
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'Morning (09:00 AM - 12:00 PM)', label: 'Morning', time: '09:00 AM - 12:00 PM' },
                          { id: 'Afternoon (12:00 PM - 03:00 PM)', label: 'Afternoon', time: '12:00 PM - 03:00 PM' },
                          { id: 'Evening (03:00 PM - 06:00 PM)', label: 'Evening', time: '03:00 PM - 06:00 PM' },
                          { id: 'Night (06:00 PM - 09:00 PM)', label: 'Night Special', time: '06:00 PM - 09:00 PM' },
                        ].map((slot) => {
                          const isSelected = bookingDraft.timeSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => updateBookingDraft({ timeSlot: slot.id })}
                              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold ring-1 ring-blue-500/20'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="text-xs">{slot.label}</span>
                              </div>
                              <span className="text-[11px] font-mono">{slot.time}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveBookingStep(4)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueFromAppointment}
                        className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Review & Submit</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 6: REVIEW AND CONFIRMATION REDESIGN */}
                {activeBookingStep === 6 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                    {/* Header with Live Status Dot */}
                    <div className="space-y-1.5 pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                          Ready for Final Dispatch
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Review Your Service Request
                      </h2>
                      <p className="text-xs text-slate-500">
                        Please review your service requirements, location, and scheduled window before initiating technician dispatch.
                      </p>
                    </div>

                    {/* Section Review Cards */}
                    <div className="space-y-4">
                      {/* 1. Service & Diagnostic Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-200 transition-colors flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3867FF] border border-blue-200 flex items-center justify-center shrink-0">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Service Scope & Diagnosis
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 break-words leading-tight">
                              {bookingDraft.serviceCategory || 'Certified Home Service'}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed break-words">
                              {bookingDraft.problemTitle ? <strong className="text-slate-800">{bookingDraft.problemTitle} — </strong> : null}
                              {bookingDraft.problemDescription || 'Standard diagnostic inspection requested'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#3867FF] border border-blue-200 whitespace-nowrap inline-flex items-center">
                                Urgency: {bookingDraft.urgency || 'Standard'}
                              </span>
                              {bookingDraft.problemType && (
                                <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 whitespace-nowrap inline-flex items-center">
                                  {bookingDraft.problemType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveBookingStep(2)}
                          className="self-end sm:self-start px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#3867FF] font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* 2. Service Location Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-200 transition-colors flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Service Location & Contact
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                              {bookingDraft.houseDetails ? `${bookingDraft.houseDetails}, ` : ''}
                              {bookingDraft.serviceAddress || 'Address on file'}
                            </p>
                            <p className="text-[11px] text-slate-500 break-words">
                              {bookingDraft.cityPostal || 'Service Territory'} • Phone:{' '}
                              <strong className="text-slate-800">{bookingDraft.contactPhone || customerUser?.phone || customerUser?.mobileNumber || 'Registered Contact'}</strong>
                            </p>
                            {bookingDraft.landmark && (
                              <p className="text-[10px] text-slate-400">Landmark: {bookingDraft.landmark}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveBookingStep(4)}
                          className="self-end sm:self-start px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#3867FF] font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* 3. Appointment Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-200 transition-colors flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-200 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Confirmed Appointment Slot
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              {bookingDraft.preferredDate || 'Tomorrow'}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{bookingDraft.timeSlot || 'Morning (9:00 AM - 12:00 PM)'}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveBookingStep(5)}
                          className="self-end sm:self-start px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#3867FF] font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* 4. Apex Workmanship Protection Banner */}
                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-3.5 text-xs text-emerald-900">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-emerald-950 text-xs">
                            100% Satisfaction & Workmanship Guarantee
                          </h4>
                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                            Pay only after service is completed to your satisfaction. Free re-work within warranty period if you are not 100% pleased.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submission Error Banner if any */}
                    {submitError && (
                      <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Step 6 Action Bar */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveBookingStep(5)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Schedule</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#3867FF] hover:bg-[#2855EB] disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <span>{customerUser ? 'Confirm & Dispatch Request' : 'Sign In & Confirm Dispatch'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 8, 9, 10, 11: POST-SUBMISSION LIVE PARTNER DISPATCH & TRACKING */}
                {activeBookingStep >= 9 && trackedRequest && (
                  <>
                    {/* SCREEN 9: FINDING A SERVICE PARTNER */}
                    {(trackedRequest.status === 'BROADCASTED' || trackedRequest.status === 'FINDING_PARTNER' || trackedRequest.status === 'WAITING_ACCEPTANCE') && (
                      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-6 text-center py-4">
                          {/* Animated Radar Pulse */}
                          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                            <span className="absolute w-full h-full rounded-full bg-blue-500/15 animate-ping" />
                            <span className="absolute w-14 h-14 rounded-full bg-red-500/15 animate-pulse" />
                            <div className="w-12 h-12 rounded-2xl bg-[#0A2540] text-white flex items-center justify-center shadow-md relative z-10">
                              <Search className="w-5 h-5 text-white animate-pulse" />
                            </div>
                          </div>

                          <div className="space-y-2 max-w-md mx-auto">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                              We're finding the right service partner for you.
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Your request has been received. We're contacting eligible certified partners in your area and will update you as soon as someone accepts.
                            </p>
                          </div>

                          {/* Request Reference Pill */}
                          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-slate-800">
                            <span className="text-[#ff3b47]">Ticket #{trackedRequest.id}</span>
                            <span className="text-slate-400">•</span>
                            <span>{trackedRequest.serviceCategory || trackedRequest.category}</span>
                          </div>

                          {/* 4-Stage Progress Timeline */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                              Live Dispatch Status
                            </h4>

                            <div className="space-y-2.5 text-xs">
                              <div className="flex items-center gap-2.5 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>1. Request Received & Verified</span>
                              </div>

                              <div className="flex items-center gap-2.5 text-[#ff3b47] font-bold">
                                <span className="w-4 h-4 rounded-full bg-red-100 text-[#ff3b47] flex items-center justify-center text-[10px] animate-pulse">
                                  2
                                </span>
                                <span>2. Broadcasting to Available Certified Partners</span>
                              </div>

                              <div className={`flex items-center gap-2.5 font-medium ${
                                trackedRequest.status === 'WAITING_ACCEPTANCE'
                                  ? 'text-[#ff3b47] font-bold'
                                  : 'text-slate-400'
                              }`}>
                                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">
                                  3
                                </span>
                                <span>3. Waiting for Partner Acceptance</span>
                              </div>

                              <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">
                                  4
                                </span>
                                <span>4. Partner Assigned</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions: Back to All Requests & Cancel */}
                          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode('history');
                                setRequestsSubTab('live');
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-300 shadow-2xs"
                            >
                              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                              <span>Back to All Requests</span>
                            </button>
                            <button
                              type="button"
                              disabled={cancelling}
                              onClick={() => handleCancelRequest(trackedRequest.id)}
                              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                            >
                              {cancelling ? 'Cancelling...' : 'Cancel Request'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EXPIRED SCREEN */}
                    {trackedRequest.status === 'EXPIRED' && (
                      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center py-8 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">
                          No Available Partners Found in Time
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Certified partners in your category were unavailable within the dispatch window. You can retry your request now.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBookingStep(1);
                            setActiveTrackingRequestId(null);
                          }}
                          className="bg-[#ff3b47] hover:bg-[#e62e3a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Retry Service Request
                        </button>
                      </div>
                    )}

                    {/* CANCELLED SCREEN */}
                    {trackedRequest.status === 'CANCELLED' && (
                      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center py-8 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                          <X className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">
                          Request #{trackedRequest.id} has been Cancelled
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          This service request has been withdrawn. You can initiate a new request anytime.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            clearBookingDraft();
                            setActiveBookingStep(1);
                          }}
                          className="bg-[#ff3b47] hover:bg-[#e62e3a] text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Start New Service Booking
                        </button>
                      </div>
                    )}

                    {/* SCREEN 10 & 11: PARTNER ASSIGNED & LIVE TRACKING REDESIGN */}
                    {isAssignedTrackingView && (
                      <div className="space-y-6">
                        {/* VISIBLE DIRECT NAVIGATION BAR TO ALL REQUESTS & NEW REQUEST */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode('history');
                                setRequestsSubTab('live');
                              }}
                              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-300 shadow-2xs group"
                            >
                              <ArrowLeft className="w-4 h-4 text-[#ff3b47] group-hover:-translate-x-0.5 transition-transform" />
                              <span>← Back to All Requests</span>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Live Tracking</span>
                              <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                                #{trackedRequest.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode('history');
                                setRequestsSubTab('live');
                              }}
                              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                              </span>
                              <span>All Active ({liveRequests.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setViewMode('booking');
                                setActiveTrackingRequestId(null);
                                localStorage.removeItem('apex_active_tracking_id');
                                setActiveBookingStep(1);
                              }}
                              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#ff3b47] hover:bg-[#e62e3a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>+ New Request</span>
                            </button>
                          </div>
                        </div>
                        {/* CARD 1: MINT GREEN BOOKING CONFIRMED BANNER (AUTO-CLOSES & DISMISSIBLE) */}
                        {showAssignedBanner && (
                          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                            <button
                              type="button"
                              onClick={() => setShowAssignedBanner(false)}
                              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 transition-colors cursor-pointer"
                              title="Dismiss notification"
                              aria-label="Close notification"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="space-y-2 max-w-xl text-left">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#065F46] bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Booking Confirmed</span>
                              </span>
                              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Your service partner has been assigned!
                              </h2>
                              <p className="text-emerald-800 text-xs sm:text-sm font-medium leading-relaxed">
                                <strong className="font-bold text-emerald-950">
                                  {trackedRequest.assignedPartnerName || trackedRequest.partnerName || 'Certified Technician'}
                                </strong>{' '}
                                has confirmed your booking for{' '}
                                <strong className="font-bold text-emerald-950">
                                  {trackedRequest.preferredDate || bookingDraft.preferredDate || 'Tomorrow'}
                                  {trackedRequest.preferredTime || bookingDraft.timeSlot
                                    ? `, ${trackedRequest.preferredTime || bookingDraft.timeSlot}`
                                    : ''}
                                </strong>.
                              </p>
                            </div>

                            {/* Desktop SVG Calendar + Confetti Badge Illustration */}
                            <div className="hidden sm:flex items-center justify-center flex-shrink-0 relative w-32 h-28">
                              <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
                                {/* Festive confetti dots */}
                                <circle cx="15" cy="22" r="2.5" fill="#10B981" />
                                <circle cx="95" cy="16" r="2.2" fill="#F59E0B" />
                                <circle cx="106" cy="46" r="2.5" fill="#8B5CF6" />
                                <path d="M22 46L24 41L26 46L31 48L26 50L24 55L22 50L17 48L22 46Z" fill="#F59E0B" opacity="0.85" />
                                <path d="M92 72L93.5 68L95 72L99 73.5L95 75L93.5 79L92 75L88 73.5L92 72Z" fill="#10B981" opacity="0.75" />

                                {/* Calendar Back Drop Shadow */}
                                <rect x="25" y="24" width="66" height="58" rx="10" fill="#CBD5E1" opacity="0.4" />
                                {/* Calendar Main Body */}
                                <rect x="23" y="20" width="66" height="58" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
                                {/* Calendar Top Emerald Bar */}
                                <path d="M23 30C23 24.4772 27.4772 20 33 20H79C84.5228 20 89 24.4772 89 30V33H23V30Z" fill="#059669" />
                                {/* Calendar Spiral Rings */}
                                <rect x="36" y="16" width="4.5" height="8" rx="2" fill="#065F46" />
                                <rect x="70" y="16" width="4.5" height="8" rx="2" fill="#065F46" />
                                {/* Calendar Grid Cells */}
                                <rect x="32" y="42" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="46" y="42" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="60" y="42" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="72" y="42" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="32" y="54" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="46" y="54" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="60" y="54" width="8" height="6" rx="1.5" fill="#F1F5F9" />
                                <rect x="72" y="54" width="8" height="6" rx="1.5" fill="#F1F5F9" />

                                {/* Big Green Confirmed Check Badge */}
                                <circle cx="76" cy="66" r="16" fill="#10B981" />
                                <circle cx="76" cy="66" r="13.5" fill="#059669" />
                                <path d="M70 66L74 70L82 62" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* CARD 1B: SECURE COMPLETION OTP (CLEAN, SOBER & ONLY SHOWN WHILE NOT COMPLETED) */}
                        {trackedRequest.status !== 'COMPLETED' && (trackedRequest.stage || 1) < 5 && (
                          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-left">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-slate-700" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                                  Service Completion Verification Code (OTP)
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
                                Share this 4-digit code with your technician <strong className="text-slate-800 underline">only after</strong> they finish the repair to your complete satisfaction.
                              </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl px-6 py-2.5 shadow-2xs text-center shrink-0">
                              <span className="font-mono text-2xl font-black tracking-widest text-slate-900 block">
                                {completionOtp || trackedRequest?.completionOtp || '----'}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">Authoritative Code</span>
                            </div>
                          </div>
                        )}

                        {/* CARD 2: CERTIFIED PARTNER PROFILE CARD (DYNAMIC) */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                          <div className="flex items-start sm:items-center gap-4 min-w-0">
                            <div className="relative flex-shrink-0">
                              {(trackedRequest.assignedPartnerPhoto || trackedRequest.partnerPhoto) ? (
                                <img
                                  src={getAssetUrl(trackedRequest.assignedPartnerPhoto || trackedRequest.partnerPhoto)}
                                  alt={trackedRequest.assignedPartnerName || trackedRequest.partnerName || 'Technician'}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                                  {(trackedRequest.assignedPartnerName || trackedRequest.partnerName || 'P').charAt(0)}
                                </div>
                              )}
                              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                  {trackedRequest.assignedPartnerName || trackedRequest.partnerName || 'Apex Certified Partner'}
                                </h3>
                                <span className="inline-flex items-center gap-1 bg-[#F3E8FF] text-[#7E22CE] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200/60">
                                  <Sparkles className="w-3 h-3 text-[#7E22CE]" />
                                  <span>Apex Certified Pro</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>{trackedRequest.assignedPartnerRating || trackedRequest.partnerRating || '5.0 (New Specialist)'}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Background Verified</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                                  <span>ID Verified</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>Trained Professional</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Call & Message */}
                          <div className="flex items-center gap-3 self-stretch sm:self-auto sm:flex-shrink-0">
                            <a
                              href={`tel:${trackedRequest.assignedPartnerPhone || trackedRequest.partnerPhone || '+919123456780'}`}
                              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border-2 border-[#6246FF] text-[#6246FF] hover:bg-purple-50 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Call Partner</span>
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                toast.info(
                                  `Direct SMS messaging active for ${trackedRequest.assignedPartnerPhone || trackedRequest.partnerPhone || '+91 91234 56780'}`,
                                  'Direct Messaging'
                                )
                              }
                              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#6246FF] hover:bg-[#5034EA] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Message</span>
                            </button>
                          </div>
                        </div>

                        {/* CARD 3: LIVE SERVICE TIMELINE */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6246FF] flex items-center justify-center flex-shrink-0">
                                <Map className="w-5 h-5 stroke-[2.2]" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-900">Live Service Timeline</h3>
                                <p className="text-xs text-slate-500">Real-time status updates as your technician progresses</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wide self-start sm:self-auto ${
                              trackedRequest.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-purple-50 text-[#6246FF] border border-purple-200'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                trackedRequest.paymentStatus === 'PAID'
                                  ? 'bg-emerald-500'
                                  : 'bg-[#6246FF] animate-pulse'
                              }`}></span>
                              <span>Current Status: {trackedRequest.paymentStatus === 'PAID' ? 'COMPLETED & SETTLED' : trackedRequest.status?.replace('_', ' ')}</span>
                            </span>
                          </div>

                          {/* 5-Step Stepper */}
                          <div className="relative py-2">
                            {/* Horizontal connecting line behind circles across all screen sizes */}
                            <div className="absolute top-4 sm:top-6 left-6 right-6 sm:left-10 sm:right-10 h-0.5 -translate-y-1/2 z-0 border-t-2 border-dashed border-slate-200" />

                            <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center relative z-10">
                              {[
                                {
                                  id: 1,
                                  label: '1. Assigned',
                                  subtext: formatClaimTime(trackedRequest.claimedAt),
                                },
                                {
                                  id: 2,
                                  label: '2. En Route',
                                  subtext: 'Est. 30 mins',
                                },
                                {
                                  id: 3,
                                  label: '3. Arrived',
                                  subtext: 'Location Arrival',
                                },
                                {
                                  id: 4,
                                  label: '4. In Progress',
                                  subtext: 'Diagnosis & Fix',
                                },
                                {
                                  id: 5,
                                  label: '5. Completed',
                                  subtext: trackedRequest.paymentStatus === 'PAID'
                                    ? 'Paid & Settled'
                                    : (trackedRequest.status === 'COMPLETED' ? 'Work Verified' : 'Final Invoicing'),
                                },
                              ].map((step, idx) => {
                                const currentStageIdx = getStageIndex(trackedRequest.status, trackedRequest.stage, trackedRequest.paymentStatus);
                                const isCompleted = idx < currentStageIdx;
                                const isCurrent = idx === currentStageIdx;

                                return (
                                  <div key={step.id} className="flex flex-col items-center">
                                    <div
                                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                                        isCompleted
                                          ? 'bg-emerald-500 text-white shadow-xs'
                                          : isCurrent
                                          ? 'bg-[#6246FF] text-white shadow-md ring-2 sm:ring-4 ring-purple-100'
                                          : 'bg-white border-2 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      ) : isCurrent ? (
                                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                      ) : (
                                        <span>{idx + 1}</span>
                                      )}
                                    </div>
                                    <span
                                      className={`mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold leading-tight ${
                                        isCurrent
                                          ? 'text-[#6246FF]'
                                          : isCompleted
                                          ? 'text-slate-900'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                    <span
                                      className={`hidden md:block text-[10px] mt-0.5 leading-tight ${
                                        isCurrent ? 'text-purple-600 font-semibold' : 'text-slate-400'
                                      }`}
                                    >
                                      {step.subtext}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* IF COMPLETED: PAYMENT PORTAL OR SETTLED INVOICE & RATING */}
                          {trackedRequest.status === 'COMPLETED' && (
                            <div className="space-y-4">
                              {trackedRequest.paymentStatus !== 'PAID' ? (
                                <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-4 animate-in fade-in">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
                                    <div>
                                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                                        Action Required
                                      </span>
                                      <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                                        Work Completed — Please Settle Service Fee
                                      </h4>
                                      <p className="text-xs text-slate-600">
                                        {trackedRequest.assignedPartnerName || 'Your technician'} has marked this service complete. Please inspect the work and proceed with payment.
                                      </p>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                      <span className="text-xs font-semibold text-slate-500 block">Total Due:</span>
                                      <span className="text-2xl font-black text-[#3867FF]">
                                        {formatCurrency(trackedRequest.estimatedCost || 499)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Payment method selector */}
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">Choose Payment Method:</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {[
                                        { id: 'UPI', label: 'UPI / QR', sub: 'GPay, PhonePe, Paytm' },
                                        { id: 'CARD', label: 'Card', sub: 'Debit or Credit' },
                                        { id: 'CASH', label: 'Cash on-site', sub: 'Pay technician directly' }
                                      ].map((m) => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => setCustomerPaymentMethod(m.id)}
                                          className={`p-2.5 rounded-xl border text-left transition-all ${
                                            customerPaymentMethod === m.id
                                              ? 'border-[#3867FF] bg-blue-50/70 text-[#3867FF] ring-2 ring-blue-100 font-bold'
                                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          <p className="text-xs font-bold">{m.label}</p>
                                          <p className="text-[10px] text-slate-500">{m.sub}</p>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isProcessingPayment}
                                    onClick={() => handleCustomerPay(trackedRequest.id, customerPaymentMethod)}
                                    className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                      {isProcessingPayment
                                        ? 'Processing Secure Settlement...'
                                        : `Pay ${formatCurrency(trackedRequest.estimatedCost || 499)} & Settle Service`}
                                    </span>
                                  </button>
                                  <p className="text-[11px] text-center text-slate-500">
                                    🔒 Safe 256-bit encrypted settlement. Net 80% will be released to your technician's verified wallet immediately.
                                  </p>
                                </div>
                              ) : (
                                <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-sm font-bold text-emerald-950">
                                        Service Completed & Paid! 🎉
                                      </h4>
                                      <p className="text-xs text-emerald-800">
                                        Invoice Total: <strong>{formatCurrency(trackedRequest.paidAmount || trackedRequest.estimatedCost || 499)}</strong> (Paid via {trackedRequest.paymentMethod || 'Online Settlement'})
                                      </p>
                                    </div>
                                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                      Paid & Settled
                                    </span>
                                  </div>

                                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        localStorage.removeItem('apex_active_tracking_id');
                                        setActiveTrackingRequestId(null);
                                        setSelectedHistoryRequest(trackedRequest);
                                        setViewMode('history');
                                        setRequestsSubTab('history');
                                      }}
                                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Move to History & View Official Receipt</span>
                                    </button>
                                  </div>

                                  <div className="pt-3 border-t border-emerald-200/60 space-y-3">
                                    <p className="text-xs font-bold text-emerald-950">
                                      Rate Your Experience with {trackedRequest.assignedPartnerName || trackedRequest.partnerName}:
                                    </p>
                                    {reviewSubmitted ? (
                                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Thank you for your review!
                                      </p>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <button
                                                key={s}
                                                type="button"
                                                onClick={() => setRatingStars(s)}
                                                className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                                              >
                                                <Star
                                                  className={`w-5 h-5 ${
                                                    s <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                                  }`}
                                                />
                                              </button>
                                            ))}
                                          </div>
                                          <span className="text-xs font-bold text-slate-700">{ratingStars} of 5 Stars</span>
                                        </div>
                                        <textarea
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                          placeholder="Write a brief review of the service quality, technician professionalism, and satisfaction..."
                                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                          rows={2}
                                        />
                                        <button
                                          type="button"
                                          disabled={isSubmittingReview}
                                          onClick={() => handleReviewSubmit(trackedRequest.id)}
                                          className="px-4 py-2 bg-[#3867FF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                          {isSubmittingReview ? 'Submitting Review...' : 'Submit Verified Review'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CARD 4: NEED HELP? BANNER */}
                        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Headphones className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">Need Help with Your Booking?</h4>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Our customer support team is available 24/7 to assist you.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <a
                              href="tel:+9118002004567"
                              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-800 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>+91 1800 200 4567</span>
                            </a>
                            <a
                              href="mailto:support@apexservices.com"
                              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-800 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                              <span>support@apexservices.com</span>
                            </a>
                          </div>
                        </div>

                        {/* CARD 5: BOTTOM NAVIGATION */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              clearBookingDraft();
                              setActiveBookingStep(1);
                              setActivePage('home');
                            }}
                            className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Home</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewMode('history')}
                            className="px-4 py-2.5 bg-[#6246FF] hover:bg-[#5034EA] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>View All Bookings</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: DYNAMIC ORDER CHECKOUT (STEP 6) / DRAFT PREVIEW (STEPS 1-5) */}
              <div className="lg:col-span-1 space-y-4">
                {activeBookingStep === 6 ? (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-24">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Order Checkout</h3>
                        <p className="text-[11px] text-slate-400">Fixed Transparent Pricing</p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#3867FF] border border-blue-200">
                        Step 6 of 6
                      </span>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span>Diagnostic & Inspection Visit</span>
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(publicConfig?.baseVisitFee || 299)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Certified Technician Dispatch</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <span className="line-through text-slate-400 text-[10px]">₹99</span>
                          <span>FREE</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Safety & Workmanship Cover</span>
                        <span className="font-semibold text-emerald-600">Included</span>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Total Payable on Visit</span>
                          <span className="text-[10px] text-slate-500 font-medium">Inclusive of all platform taxes</span>
                        </div>
                        <span className="text-xl font-black text-[#3867FF]">
                          {formatCurrency(publicConfig?.baseVisitFee || 299)}
                        </span>
                      </div>
                    </div>

                    {/* Zero Prepayment Notice */}
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#3867FF] shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-[11px] text-blue-900">
                        <p className="font-bold">Zero Prepayment Required</p>
                        <p className="text-blue-700 leading-tight">Pay securely via UPI, Card, or Cash only after service is completed.</p>
                      </div>
                    </div>

                    {/* Primary Dispatch CTA */}
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-[#2855EB] disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Request...</span>
                        </>
                      ) : (
                        <>
                          <span>{customerUser ? 'Confirm & Dispatch Request' : 'Sign In & Confirm Dispatch'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Secondary Back/Reschedule */}
                    <button
                      type="button"
                      onClick={() => setActiveBookingStep(5)}
                      className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Change Schedule or Address
                    </button>

                    {/* Trust Badges */}
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-[11px] font-medium">Verified & Background Checked Pros</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-[11px] font-medium">Live Technician GPS Tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-[11px] font-medium">100% Satisfaction or Free Rework</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 sticky top-24">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900">
                        Booking Draft Summary
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isAssignedTrackingView
                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                        }`}
                      >
                        {isAssignedTrackingView && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>Step {activeBookingStep <= 6 ? activeBookingStep : 'Confirmed'}</span>
                      </span>
                    </div>

                    {/* Service & Problem Preview Card */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#3867FF] flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {trackedRequest?.problemTitle ||
                            bookingDraft.problemTitle ||
                            bookingDraft.problemType ||
                            (bookingDraft.serviceCategory ? `${bookingDraft.serviceCategory} Service` : 'Select Service Category')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Category: {trackedRequest?.serviceCategory || bookingDraft.serviceCategory || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Address Preview */}
                    <div className="space-y-1 text-xs pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Service Location
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-xs flex items-start gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {trackedRequest?.serviceAddress ||
                            (bookingDraft.serviceAddress ? `${bookingDraft.houseDetails ? bookingDraft.houseDetails + ', ' : ''}${bookingDraft.serviceAddress}` : 'Provide Address in Step 4')}
                        </span>
                      </p>
                    </div>

                    {/* Scheduled Appointment Preview */}
                    <div className="space-y-1 text-xs pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Appointment Window
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-xs flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>
                          {trackedRequest?.preferredDate || bookingDraft.preferredDate || 'Select Date in Step 5'} •{' '}
                          {trackedRequest?.preferredTime || bookingDraft.timeSlot || 'Select Time Slot'}
                        </span>
                      </p>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>Diagnostic Visit</span>
                          <Info className="w-3 h-3 text-slate-400" />
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(trackedRequest?.estimatedCost || publicConfig?.baseVisitFee || 299)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900">Base Estimate</span>
                        <span className="text-[#3867FF] text-base font-bold">
                          {formatCurrency(trackedRequest?.estimatedCost || publicConfig?.baseVisitFee || 299)}
                        </span>
                      </div>
                    </div>

                    {/* 100% Satisfaction Guarantee */}
                    <div className="pt-1">
                      <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>100% Satisfaction Guarantee</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 leading-tight">
                          Free rework if not completely satisfied with our carpentry, plumbing, or electrical repairs.
                        </p>
                      </div>
                    </div>

                    {/* 3 Value Props */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="font-medium text-[11px]">On-Time Service</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="font-medium text-[11px]">Verified Professionals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="font-medium text-[11px]">Quality Guaranteed</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
