import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initialData } from '../data/initialData';
import { API_BASE_URL } from '../utils/apiConfig';

const DataContext = createContext();

const CACHE_KEY = 'apex_bootstrap_v2';
const LEGACY_CACHE_KEYS = ['apex_cached_presentation_data', 'apex_etag'];

const defaultPublicConfig = {
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

const getCategoryImagesMap = () => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const saved = localStorage.getItem('apex_category_images');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const mergeCategoryImages = (categories, serverMap = {}) => {
  if (!Array.isArray(categories)) return categories;
  const localMap = getCategoryImagesMap();
  const combined = { ...serverMap, ...localMap };
  return categories.map((c) => ({
    ...c,
    bannerImageUrl:
      c.bannerImageUrl ||
      c.imageUrl ||
      combined[String(c.id)] ||
      combined[c.name] ||
      combined[c.slug] ||
      '',
  }));
};

const readCachedBootstrap = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    // Purge legacy cache keys
    for (const key of LEGACY_CACHE_KEYS) {
      localStorage.removeItem(key);
    }
    const saved = localStorage.getItem(CACHE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && parsed.data && parsed.data.heroSlides && Array.isArray(parsed.data.categories)) {
      return parsed; // { etag, timestamp, data }
    }
  } catch (e) {
    console.warn('Failed to parse cached bootstrap:', e);
  }
  return null;
};

const writeCachedBootstrap = (etag, data) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        etag: etag || null,
        timestamp: Date.now(),
        data,
      })
    );
  } catch (e) {
    console.warn('Failed to write cached presentation data:', e);
  }
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const cachedEntry = readCachedBootstrap();
    if (cachedEntry && cachedEntry.data) {
      if (cachedEntry.data.categories) {
        cachedEntry.data.categories = mergeCategoryImages(cachedEntry.data.categories);
      }
      return cachedEntry.data;
    }
    const initialWithImages = { ...initialData };
    if (initialWithImages.categories) {
      initialWithImages.categories = mergeCategoryImages(initialWithImages.categories);
    }
    return initialWithImages;
  });
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('home')) return 'home';
      if (hash.includes('services')) return 'services';
      if (hash.includes('about')) return 'about';
      if (hash.includes('reviews')) return 'reviews';
      if (hash.includes('contact')) return 'contact';
      if (hash.includes('login')) return 'login';
    }
    return 'request-work';
  });
  const [loading, setLoading] = useState(() => {
    const cachedEntry = readCachedBootstrap();
    return !Boolean(cachedEntry?.data);
  });

  // Customer Authentication State (Defaults to Rahul Sharma from reference mockup)
  const [customerUser, setCustomerUser] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('apex_customer_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      id: 101,
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@apexservices.com',
      mobileNumber: '+91 98765 43210'
    };
  });

  const [customerToken, setCustomerToken] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('apex_customer_token') || 'demo_customer_token';
    }
    return 'demo_customer_token';
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerRequests, setCustomerRequests] = useState([]);
  
  const [activeBookingStep, setActiveBookingStep] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('apex_active_booking_step');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });
  const [activeTrackingRequestId, setActiveTrackingRequestId] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('apex_active_tracking_id') || null;
    }
    return null;
  });
  const [customerViewMode, setCustomerViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('apex_customer_view_mode');
      if (saved) return saved;
    }
    return 'history';
  });
  const [customerRequestsTab, setCustomerRequestsTab] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('apex_customer_requests_tab') || 'live';
    }
    return 'live';
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
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const savedDraft = sessionStorage.getItem('apex_booking_draft');
        return savedDraft ? JSON.parse(savedDraft) : initialBookingDraft;
      } catch {
        return initialBookingDraft;
      }
    }
    return initialBookingDraft;
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

  const isFetchingRef = useRef(false);
  const lastDataHashRef = useRef('');
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef(null);
  const [coldStartStatus, setColdStartStatus] = useState({ isWaking: false, retryCount: 0 });

  // Fetch Public Presentation Data with SWR (apex_bootstrap_v2), ETag and Cold-Start Recovery
  const fetchApiData = async (isRetry = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // In-flight request cancellation setup
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const cached = readCachedBootstrap();
      const headers = {};
      // Strict coupling: Send If-None-Match ONLY if both cached ETag and valid cached data exist
      if (cached?.etag && cached?.data) {
        headers['If-None-Match'] = cached.etag;
      }

      const res = await fetch(`${API_BASE_URL}/data`, {
        headers,
        signal: controller.signal,
      });

      // 1. HTTP 304 Not Modified: Cache is perfectly fresh; touch timestamp without React re-render
      if (res.status === 304) {
        if (cached?.data) {
          writeCachedBootstrap(cached.etag, cached.data);
        }
        setColdStartStatus({ isWaking: false, retryCount: 0 });
        retryCountRef.current = 0;
        return;
      }

      // 2. HTTP 200 OK: Process and cache new server payload
      if (res.ok) {
        const etagHeader = res.headers.get('ETag') || res.headers.get('etag');
        const text = await res.text();

        // Skip re-rendering if server data has not changed
        if (text === lastDataHashRef.current) {
          if (cached?.data) {
            writeCachedBootstrap(etagHeader || cached.etag, cached.data);
          }
          setColdStartStatus({ isWaking: false, retryCount: 0 });
          retryCountRef.current = 0;
          return;
        }

        lastDataHashRef.current = text;
        const result = JSON.parse(text);

        if (result && result.heroSlides) {
          const serverCategoryImages =
            result.siteBranding?.categoryImages ||
            result.publicConfig?.categoryImages ||
            {};
          if (result.categories) {
            result.categories = mergeCategoryImages(result.categories, serverCategoryImages);
          }
          // Store coupled ETag + timestamp + normalized data
          writeCachedBootstrap(etagHeader, result);
          setData(result);
        }
        setColdStartStatus({ isWaking: false, retryCount: 0 });
        retryCountRef.current = 0;
      } else if (res.status >= 500 && retryCountRef.current < 3) {
        // Render cold start (502/503/504): exponential backoff (2s, 4s, 8s)
        handleColdStartRetry();
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Normal cancellation
      }
      if (retryCountRef.current < 3) {
        handleColdStartRetry();
      } else {
        console.warn('Backend API server unreachable, serving from local cache:', err);
        setColdStartStatus({ isWaking: false, retryCount: retryCountRef.current, error: 'Server unreachable' });
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleColdStartRetry = () => {
    retryCountRef.current += 1;
    const backoffMs = Math.min(8000, Math.pow(2, retryCountRef.current) * 1000);
    setColdStartStatus({ isWaking: true, retryCount: retryCountRef.current });
    setTimeout(() => {
      fetchApiData(true);
    }, backoffMs);
  };

  // Revalidate only when cache is older than minAgeMs (default 60s)
  const revalidateIfStale = (minAgeMs = 60000) => {
    const cached = readCachedBootstrap();
    const age = Date.now() - (cached?.timestamp || 0);
    if (age > minAgeMs) {
      fetchApiData();
    }
  };

  // Fetch Customer Work Requests
  const fetchCustomerRequests = async (email) => {
    const userEmail = email || customerUser?.email;
    if (!userEmail) return;
    try {
      const headers = {};
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }
      const res = await fetch(`${API_BASE_URL}/work-requests?email=${encodeURIComponent(userEmail)}`, { headers });
      if (res.ok) {
        const list = await res.json();
        setCustomerRequests(list);
      }
    } catch (e) {
      console.warn('Failed to load work requests:', e);
    }
  };

  useEffect(() => {
    // Initial fetch (if cache exists, this acts as background revalidation)
    fetchApiData();
    if (customerUser?.email) {
      fetchCustomerRequests(customerUser.email);
    }

    // Cross-tab real-time sync via BroadcastChannel
    let syncChannel;
    try {
      syncChannel = new BroadcastChannel('apex_services_sync');
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'DATA_UPDATED' || event.data?.type === 'apex_payment_settled' || event.data?.type === 'BRANDING_UPDATED') {
          if (event.data?.type === 'BRANDING_UPDATED' && event.data.siteBranding) {
            setData(prev => ({
              ...prev,
              siteBranding: { ...prev?.siteBranding, ...event.data.siteBranding },
              publicConfig: { ...prev?.publicConfig, ...event.data.siteBranding },
            }));
            if (event.data.brandName) {
              document.title = `${event.data.brandName} - Certified Home Services & Craftsmanship`;
            }
          }
          fetchApiData();
          if (customerUser?.email) {
            fetchCustomerRequests(customerUser.email);
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    // Throttled revalidation on focus & visibility changes (minimum 60s interval)
    const handleFocus = () => revalidateIfStale(60000);
    const handleVisibility = () => {
      if (!document.hidden) revalidateIfStale(60000);
    };
    const handleStorage = (e) => {
      if (e.key === 'apex_custom_branding' || e.key === 'apex_category_images') {
        fetchApiData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    // 60s background heartbeat (only if tab is visible)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      revalidateIfStale(60000);
    }, 60000);

    return () => {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch {}
      }
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
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

  // Customer Login via Google OAuth2 ID Token
  const loginWithGoogleCustomer = async (idToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'ROLE_CUSTOMER' }),
      });
      const resData = await res.json();
      if (res.ok && resData.token) {
        localStorage.setItem('apex_customer_user', JSON.stringify(resData.user));
        localStorage.setItem('apex_customer_token', resData.token);
        setCustomerUser(resData.user);
        setCustomerToken(resData.token);
        fetchCustomerRequests(resData.user.email);

        if (resData.user.mobileNumber) {
          updateBookingDraft({ contactPhone: resData.user.mobileNumber });
        }

        if (bookingDraft && (bookingDraft.serviceCategory || bookingDraft.serviceAddress)) {
          setLoginSuccessNotice("You're logged in with Google. Review your request and submit when ready.");
          setActiveBookingStep(6);
          setActivePage('request-work');
        } else {
          setActivePage('request-work');
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: resData.message || resData.error || 'Google authentication failed. Please try again.',
        };
      }
    } catch (err) {
      console.error('Customer Google login network error:', err);
      return { success: false, error: 'Could not connect to authentication service.' };
    }
  };

  // Customer Registration
  const registerCustomer = async (fullName, email, phone, password, verificationGrant) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email || undefined,
          mobileNumber: phone || undefined,
          password,
          role: 'ROLE_CUSTOMER',
          verificationGrant: verificationGrant || undefined,
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
    const currentToken = customerToken || (typeof window !== 'undefined' ? localStorage.getItem('apex_customer_token') : null);
    
    // Invalidate session on server (fire & forget, don't block client logout)
    if (currentToken && typeof window !== 'undefined') {
      try {
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(err => console.warn('Server logout notification failed', err));
      } catch (err) {
        console.warn('Logout fetch failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('apex_customer_user');
      localStorage.removeItem('apex_customer_token');
    }
    setCustomerUser(null);
    setCustomerToken(null);
    setCustomerRequests([]);
    setActivePage('home');
    toast.success(`You have been logged out successfully. See you again soon, ${name}!`, 'Signed Out');
  };

  // Live vs History request classification: only active in-flight jobs are live. Completed or cancelled requests go to history.
  const isLiveRequest = useCallback((req) => {
    if (!req) return false;
    if (req.status === 'CANCELLED' || req.status === 'EXPIRED') return false;
    if (req.status === 'COMPLETED') return false;
    return true;
  }, []);

  const liveRequests = useMemo(() => customerRequests.filter(isLiveRequest), [customerRequests, isLiveRequest]);
  const historyRequests = useMemo(() => customerRequests.filter((req) => !isLiveRequest(req)), [customerRequests, isLiveRequest]);
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

  // Submit Work Request
  const submitWorkRequest = async (draftData) => {
    const token = customerToken;

    // Sanitize phone number safely: extract digits
    const rawContact = draftData.contactPhone || (customerUser && (customerUser.mobileNumber || customerUser.phone)) || '';
    const cleanedDigits = String(rawContact).replace(/\D/g, '');
    const sanitizedPhone = cleanedDigits.length >= 10 ? (cleanedDigits.startsWith('91') && cleanedDigits.length > 10 ? `+${cleanedDigits}` : cleanedDigits.slice(-10)) : (draftData.contactPhone || '9876543210');

    try {
      // Find matching category object
      const matchedCategory = data?.categories?.find(c => 
        (draftData.serviceCategoryId && c.id === draftData.serviceCategoryId) ||
        (draftData.serviceCategory && c.name?.trim().toLowerCase() === draftData.serviceCategory?.trim().toLowerCase()) ||
        (draftData.serviceCategory && c.slug && c.slug?.trim().toLowerCase() === draftData.serviceCategory?.trim().toLowerCase())
      );

      const categoryName = matchedCategory ? matchedCategory.name : draftData.serviceCategory;
      const categoryId = draftData.serviceCategoryId || (matchedCategory ? matchedCategory.id : null);

      const customerName = (customerUser && customerUser.fullName) || draftData.customerName || 'Valued Customer';
      const customerEmail = (customerUser && customerUser.email) || draftData.customerEmail || (draftData.email ? draftData.email.trim() : null);

      const payload = {
        serviceCategoryId: categoryId,
        serviceCategory: categoryName,
        customerName: customerName,
        customerEmail: customerEmail,
        contactPhone: sanitizedPhone,
        problemType: draftData.problemType,
        problemTitle: draftData.problemTitle,
        problemDescription: draftData.problemDescription,
        urgency: draftData.urgency || 'Standard',
        additionalAnswers: JSON.stringify(draftData.additionalAnswers || {}),
        serviceAddress: `${draftData.houseDetails ? draftData.houseDetails + ', ' : ''}${draftData.serviceAddress}${draftData.cityPostal ? ', ' + draftData.cityPostal : ''}`,
        latitude: draftData.latitude || null,
        longitude: draftData.longitude || null,
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

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Proactive warm-up notice if server takes > 2.5 seconds (Render free-tier cold boot)
      let warmUpToastId = null;
      const warmUpTimer = setTimeout(() => {
        warmUpToastId = showToast('Cloud dispatch server is waking up from idle state... Please hold on.', 'info', 'Server Waking Up', 6000);
      }, 2500);

      // Abort controller with 45-second deadline
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 45000);

      try {
        const res = await fetch(`${API_BASE_URL}/work-requests`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);
        clearTimeout(warmUpTimer);
        if (warmUpToastId) dismissToast(warmUpToastId);

        const resData = await res.json();

        if (res.ok) {
          if (resData.customerToken && !customerToken) {
            const userObj = {
              id: resData.customerId,
              fullName: resData.customerName,
              email: resData.customerEmail,
              mobileNumber: resData.contactPhone,
              role: 'ROLE_CUSTOMER'
            };
            setCustomerToken(resData.customerToken);
            setCustomerUser(userObj);
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('apex_customer_token', resData.customerToken);
                localStorage.setItem('apex_customer_user', JSON.stringify(userObj));
              }
            } catch (e) {}
          }
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
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        clearTimeout(warmUpTimer);
        if (warmUpToastId) dismissToast(warmUpToastId);

        if (fetchErr.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out waiting for cloud server to respond. The free-tier server is spinning up. Please retry in 10 seconds.'
          };
        }
        throw fetchErr;
      }
    } catch (e) {
      console.warn('Network error during submit:', e);
      return { success: false, error: 'Network error communicating with dispatch server. Please retry.' };
    }
  };

  const publicConfig = useMemo(() => {
    return data?.publicConfig || defaultPublicConfig;
  }, [data?.publicConfig]);

  const formatCurrency = useCallback((amount) => {
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
  }, [publicConfig.currencySymbol, publicConfig.defaultLocale, publicConfig.defaultCurrency]);

  const siteBranding = useMemo(() => {
    let customBranding = {};
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem('apex_custom_branding');
        if (cached) customBranding = JSON.parse(cached);
      } catch {}
    }
    return {
      ...initialData.siteBranding,
      ...customBranding,
      ...(data?.publicConfig || {}),
      ...(data?.siteBranding || {}),
    };
  }, [data?.publicConfig, data?.siteBranding]);

  const contextValue = useMemo(() => ({
    data,
    activePage,
    setActivePage,
    loading,
    coldStartStatus,
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
    loginWithGoogleCustomer,
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
  }), [
    data,
    activePage,
    loading,
    coldStartStatus,
    publicConfig,
    siteBranding,
    formatCurrency,
    customerUser,
    customerToken,
    selectedCategory,
    customerRequests,
    liveRequests,
    historyRequests,
    hasLiveRequest,
    mostRecentLiveRequest,
    customerViewMode,
    customerRequestsTab,
    bookingDraft,
    activeBookingStep,
    activeTrackingRequestId,
    loginBannerMessage,
    loginSuccessNotice,
    toasts,
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
