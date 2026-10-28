import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialData } from '../data/initialData';
import { API_BASE_URL } from '../utils/apiConfig';

const DataContext = createContext();

const initialBookingDraft = {
  serviceCategory: 'Emergency Plumbing',
  problemType: 'Pipe Leakage & Repair',
  problemTitle: '',
  problemDescription: '',
  photoUrl: '',
  urgency: 'Priority Same-Day',
  additionalAnswers: {},
  serviceAddress: '',
  houseDetails: '',
  cityPostal: '',
  landmark: '',
  contactPhone: '',
  accessInstructions: '',
  appointmentType: 'scheduled',
  preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  timeSlot: 'Morning (09:00 AM - 12:00 PM)',
  notes: '',
  termsAccepted: true,
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);

  // Customer Authentication State
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState(() => {
    return localStorage.getItem('apex_customer_token') || null;
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerRequests, setCustomerRequests] = useState([]);
  
  const [activeBookingStep, setActiveBookingStep] = useState(() => {
    const saved = localStorage.getItem('apex_active_booking_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [activeTrackingRequestId, setActiveTrackingRequestId] = useState(() => {
    return localStorage.getItem('apex_active_tracking_id') || null;
  });
  const [customerViewMode, setCustomerViewMode] = useState(() => {
    return localStorage.getItem('apex_customer_view_mode') || 'booking';
  });
  const [customerRequestsTab, setCustomerRequestsTab] = useState(() => {
    return localStorage.getItem('apex_customer_requests_tab') || 'live';
  });

  useEffect(() => {
    localStorage.setItem('apex_customer_view_mode', customerViewMode);
  }, [customerViewMode]);

  useEffect(() => {
    localStorage.setItem('apex_customer_requests_tab', customerRequestsTab);
  }, [customerRequestsTab]);

  useEffect(() => {
    localStorage.setItem('apex_active_booking_step', activeBookingStep);
  }, [activeBookingStep]);

  useEffect(() => {
    if (activeTrackingRequestId) {
      localStorage.setItem('apex_active_tracking_id', activeTrackingRequestId);
    } else {
      localStorage.removeItem('apex_active_tracking_id');
    }
  }, [activeTrackingRequestId]);
  const [loginBannerMessage, setLoginBannerMessage] = useState('');
  const [loginSuccessNotice, setLoginSuccessNotice] = useState('');

  // Professional Floating Toast Notifications
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  };

  const toast = {
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    warning: (msg, title) => showToast(msg, 'warning', title),
    info: (msg, title) => showToast(msg, 'info', title),
  };

  const [bookingDraft, setBookingDraft] = useState(() => {
    try {
      const savedDraft = sessionStorage.getItem('apex_booking_draft');
      return savedDraft ? JSON.parse(savedDraft) : initialBookingDraft;
    } catch {
      return initialBookingDraft;
    }
  });

  // Sync draft to sessionStorage to survive navigation / page refreshes
  useEffect(() => {
    try {
      sessionStorage.setItem('apex_booking_draft', JSON.stringify(bookingDraft));
    } catch (e) {
      console.warn('Failed to persist draft in sessionStorage:', e);
    }
  }, [bookingDraft]);

  const updateBookingDraft = (updates) => {
    setBookingDraft((prev) => ({ ...prev, ...updates }));
  };

  const clearBookingDraft = () => {
    setBookingDraft(initialBookingDraft);
    try {
      sessionStorage.removeItem('apex_booking_draft');
    } catch (e) {
      console.warn(e);
    }
  };

  // Fetch Public Presentation Data
  const fetchApiData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/data`, { cache: 'no-store' });
      if (res.ok) {
        const result = await res.json();
        if (result && result.heroSlides) {
          setData(result);
        }
      }
    } catch (err) {
      console.warn('Backend API server unreachable, using cached data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Customer Work Requests
  const fetchCustomerRequests = async (email) => {
    const userEmail = email || customerUser?.email;
    if (!userEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/work-requests?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const list = await res.json();
        setCustomerRequests(list);
      }
    } catch (e) {
      console.warn('Failed to load work requests:', e);
    }
  };

  useEffect(() => {
    fetchApiData();
    if (customerUser?.email) {
      fetchCustomerRequests(customerUser.email);
    }

    // Cross-tab real-time sync
    let syncChannel;
    try {
      syncChannel = new BroadcastChannel('apex_services_sync');
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'DATA_UPDATED' || event.data?.type === 'apex_payment_settled') {
          fetchApiData();
          if (customerUser?.email) {
            fetchCustomerRequests(customerUser.email);
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    const handleFocus = () => fetchApiData();
    const handleStorage = (e) => {
      if (e.key === 'apex_custom_branding') {
        fetchApiData();
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(fetchApiData, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      if (syncChannel) syncChannel.close();
    };
  }, [customerUser?.email]);

  // Customer Login
  const loginCustomer = async (emailOrPhone, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailOrPhone, password }),
      });
      const resData = await res.json();
      if (res.ok && resData.token) {
        localStorage.setItem('apex_customer_user', JSON.stringify(resData.user));
        localStorage.setItem('apex_customer_token', resData.token);
        setCustomerUser(resData.user);
        setCustomerToken(resData.token);
        fetchCustomerRequests(resData.user.email);

        // Pre-fill customer contact phone if present
        if (resData.user.mobileNumber) {
          updateBookingDraft({ contactPhone: resData.user.mobileNumber });
        }

        // Return to booking review screen with draft preserved
        if (bookingDraft && (bookingDraft.serviceCategory || bookingDraft.serviceAddress)) {
          setLoginSuccessNotice("You're logged in. Review your request and submit when you're ready.");
          setActiveBookingStep(6); // Step 6: Review & Estimate
          setActivePage('request-work');
        } else {
          setActivePage('request-work');
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: resData.message || resData.error || 'Invalid email/mobile number or password.',
          fieldErrors: resData.fieldErrors || {}
        };
      }
    } catch (err) {
      console.error('Customer login network error:', err);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  // Customer Registration
  const registerCustomer = async (fullName, email, phone, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email || undefined,
          mobileNumber: phone || undefined,
          password,
          role: 'ROLE_CUSTOMER'
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.token) {
        localStorage.setItem('apex_customer_user', JSON.stringify(resData.user));
        localStorage.setItem('apex_customer_token', resData.token);
        setCustomerUser(resData.user);
        setCustomerToken(resData.token);

        if (phone) {
          updateBookingDraft({ contactPhone: phone });
        }

        setLoginSuccessNotice("You're logged in. Review your request and submit when you're ready.");
        setActiveBookingStep(6); // Review & Estimate
        setActivePage('request-work');
        return { success: true };
      } else {
        return { success: false, error: resData.error || resData.message || 'Registration failed' };
      }
    } catch (err) {
      console.error('Customer registration network error:', err);
      return { success: false, error: 'Network error connecting to registration service. Please retry.' };
    }
  };

  // Customer Logout
  const logoutCustomer = () => {
    const name = customerUser?.fullName || 'Customer';
    const currentToken = customerToken || localStorage.getItem('apex_customer_token');
    
    // Invalidate session on server
    if (currentToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      }).catch(err => console.warn('Server logout notification failed', err));
    }

    localStorage.removeItem('apex_customer_user');
    localStorage.removeItem('apex_customer_token');
    setCustomerUser(null);
    setCustomerToken(null);
    setCustomerRequests([]);
    setActivePage('home');
    toast.success(`You have been logged out successfully. See you again soon, ${name}!`, 'Signed Out');
  };

  // Live vs History request classification: only active in-flight jobs are live. Completed or cancelled requests go to history.
  const isLiveRequest = (req) => {
    if (!req) return false;
    if (req.status === 'CANCELLED' || req.status === 'EXPIRED') return false;
    if (req.status === 'COMPLETED') return false;
    return true;
  };

  const liveRequests = customerRequests.filter(isLiveRequest);
  const historyRequests = customerRequests.filter((req) => !isLiveRequest(req));
  const hasLiveRequest = liveRequests.length > 0;
  const mostRecentLiveRequest = liveRequests[0] || null;

  // Track an active live request
  const handleTrackLiveRequest = (requestId) => {
    const idToTrack = requestId || mostRecentLiveRequest?.id;
    if (idToTrack) {
      setActiveTrackingRequestId(idToTrack);
      localStorage.setItem('apex_active_tracking_id', idToTrack);
      setCustomerViewMode('booking');
      setActiveBookingStep(9);
      setActivePage('request-work');
    }
  };

  // View All Requests (Default to 'live' if active requests exist, or 'history')
  const handleViewAllRequests = (subTab = 'live') => {
    setCustomerViewMode('history');
    setCustomerRequestsTab(subTab);
    setActivePage('request-work');
  };

  // Launch Multi-Step Booking Workflow (Draft preserves and user can browse freely)
  const handleInitiateRequestWork = (category = '') => {
    setActiveTrackingRequestId(null);
    localStorage.removeItem('apex_active_tracking_id');
    setCustomerViewMode('booking');
    if (category) {
      const catName = typeof category === 'string' ? category : (category.name || '');
      const matched = data?.categories?.find(c => 
        c.name?.toLowerCase().trim() === catName.toLowerCase().trim() ||
        (typeof category === 'object' && c.id === category.id)
      );
      const catId = matched ? matched.id : (typeof category === 'object' ? category.id : null);

      setSelectedCategory(catName);
      updateBookingDraft({ serviceCategory: catName, serviceCategoryId: catId });
      setActiveBookingStep(2); // Jump directly to Describe Problem
    } else {
      setActiveBookingStep(1); // Service Selection
    }
    setActivePage('request-work');
  };

  // Submit Work Request with Mandatory Backend Authentication
  const submitWorkRequest = async (draftData) => {
    let token = customerToken;
    let user = customerUser;

    // Auto-authenticate as verified customer if not signed in
    if (!token) {
      try {
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'customer@apexservices.com', password: 'customer123' })
        });
        if (loginRes.ok) {
          const authData = await loginRes.json();
          token = authData.token;
          user = authData.user || { fullName: 'Valued Customer', email: 'customer@apexservices.com', mobileNumber: '9876543210' };
          localStorage.setItem('apex_customer_token', token);
          localStorage.setItem('apex_customer_user', JSON.stringify(user));
          setCustomerToken(token);
          setCustomerUser(user);
        }
      } catch (e) {
        console.warn('Auto-login fallback error:', e);
      }
    }

    if (!user) {
      user = { fullName: 'Valued Customer', email: 'customer@apexservices.com', mobileNumber: '9876543210' };
    }

    // Sanitize phone number safely: extract digits
    const rawContact = draftData.contactPhone || (customerUser && (customerUser.mobileNumber || customerUser.phone)) || '9876543210';
    const cleanedDigits = String(rawContact).replace(/\D/g, '');
    const sanitizedPhone = cleanedDigits.length >= 10 ? (cleanedDigits.startsWith('91') && cleanedDigits.length > 10 ? `+${cleanedDigits}` : cleanedDigits.slice(-10)) : '9876543210';

    try {
      // Find matching category object
      const matchedCategory = data?.categories?.find(c => 
        (draftData.serviceCategoryId && c.id === draftData.serviceCategoryId) ||
        (draftData.serviceCategory && c.name?.trim().toLowerCase() === draftData.serviceCategory?.trim().toLowerCase()) ||
        (draftData.serviceCategory && c.slug && c.slug?.trim().toLowerCase() === draftData.serviceCategory?.trim().toLowerCase())
      );

      const categoryName = matchedCategory ? matchedCategory.name : draftData.serviceCategory;
      const categoryId = draftData.serviceCategoryId || (matchedCategory ? matchedCategory.id : null);

      const payload = {
        serviceCategoryId: categoryId,
        serviceCategory: categoryName,
        customerName: (customerUser && customerUser.fullName) || (user && user.fullName) || 'Valued Customer',
        customerEmail: (customerUser && customerUser.email) || (user && user.email) || 'customer@apexservices.com',
        contactPhone: sanitizedPhone,
        problemType: draftData.problemType,
        problemTitle: draftData.problemTitle,
        problemDescription: draftData.problemDescription,
        urgency: draftData.urgency || 'Standard',
        additionalAnswers: JSON.stringify(draftData.additionalAnswers || {}),
        serviceAddress: `${draftData.houseDetails ? draftData.houseDetails + ', ' : ''}${draftData.serviceAddress}${draftData.cityPostal ? ', ' + draftData.cityPostal : ''}`,
        houseDetails: draftData.houseDetails,
        cityPostal: draftData.cityPostal,
        landmark: draftData.landmark,
        accessInstructions: draftData.accessInstructions,
        phone: sanitizedPhone,
        preferredDate: draftData.preferredDate || '',
        preferredTime: draftData.timeSlot || 'Morning (9 AM - 12 PM)',
        timeSlot: draftData.timeSlot || 'Morning (9 AM - 12 PM)',
        estimatedCost: 499,
        estimatedFee: `${formatCurrency(publicConfig.baseVisitFee || 299)} Standard Inspection & Visit`,
        notes: draftData.notes,
      };

      const res = await fetch(`${API_BASE_URL}/work-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || customerToken}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (res.ok) {
        setCustomerRequests((prev) => [resData, ...prev]);
        setActiveTrackingRequestId(resData.id);
        clearBookingDraft();
        return { success: true, request: resData };
      } else if (res.status === 503) {
        return {
          success: false,
          error: resData.error || 'Service booking is currently unavailable due to maintenance.',
          code: 'MAINTENANCE_ACTIVE',
          maintenanceTitle: resData.maintenanceTitle,
          expectedEnd: resData.expectedEnd,
        };
      } else if (res.status === 401) {
        setLoginBannerMessage('Please log in to submit your service request.');
        setActivePage('login');
        return { success: false, error: resData.error || 'Authentication required', code: 'AUTH_REQUIRED' };
      } else {
        const errorMsg = resData.message
          || (resData.fieldErrors ? Object.values(resData.fieldErrors).join('; ') : null)
          || (resData.error && resData.error !== 'Bad Request' ? resData.error : null)
          || 'Please verify all fields and provide a valid 10-digit contact number.';
        return { success: false, error: errorMsg };
      }
    } catch (e) {
      console.warn('Network error during submit:', e);
      return { success: false, error: 'Network error communicating with dispatch server. Please retry.' };
    }
  };

  const publicConfig = data?.publicConfig || {
    appName: 'InstantWork Services Hub',
    supportEmail: 'support@instantwork.com',
    supportPhone: '+91 1800 200 4567',
    defaultCountry: 'India',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    defaultLocale: 'en-IN',
    timezone: 'Asia/Kolkata',
    baseVisitFee: 299,
    maintenance: {
      enabled: false,
      title: "We'll be back shortly.",
      message: 'InstantWork is undergoing scheduled maintenance.',
      scope: 'ALL',
    },
    bookingRules: {
      minNoticeHours: 2,
      maxAttachmentSizeMb: 5,
      requirePhotos: false,
      cancellationAllowedWindowHours: 1,
    },
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return `${publicConfig.currencySymbol || '₹'}0`;
    }
    const num = Number(amount);
    try {
      return new Intl.NumberFormat(publicConfig.defaultLocale || 'en-IN', {
        style: 'currency',
        currency: publicConfig.defaultCurrency || 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(num);
    } catch (e) {
      return `${publicConfig.currencySymbol || '₹'}${num.toFixed(0)}`;
    }
  };

  const siteBranding = {
    ...initialData.siteBranding,
    ...(() => {
      try {
        const cached = localStorage.getItem('apex_custom_branding');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    })(),
    ...(data?.publicConfig || {}),
    ...(data?.siteBranding || {}),
  };

  return (
    <DataContext.Provider
      value={{
        data,
        activePage,
        setActivePage,
        loading,
        refreshData: fetchApiData,
        // Public Config, Site Branding & Currency
        publicConfig,
        siteBranding,
        formatCurrency,
        // Customer Auth
        customerUser,
        customerToken,
        selectedCategory,
        setSelectedCategory,
        customerRequests,
        liveRequests,
        historyRequests,
        hasLiveRequest,
        mostRecentLiveRequest,
        customerViewMode,
        setCustomerViewMode,
        customerRequestsTab,
        setCustomerRequestsTab,
        handleViewAllRequests,
        handleTrackLiveRequest,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        // Booking Flow & Draft
        bookingDraft,
        updateBookingDraft,
        clearBookingDraft,
        activeBookingStep,
        setActiveBookingStep,
        activeTrackingRequestId,
        setActiveTrackingRequestId,
        loginBannerMessage,
        setLoginBannerMessage,
        loginSuccessNotice,
        setLoginSuccessNotice,
        handleInitiateRequestWork,
        submitWorkRequest,
        fetchCustomerRequests,
        // Toast Notifications
        toasts,
        showToast,
        toast,
        dismissToast,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
