import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { audioService } from '../services/audioService';
import { useToast } from '../components/Toast';

const PartnerContext = createContext(null);

export const PartnerProvider = ({ children }) => {
  const { toast } = useToast();
  const [partner, setPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home, requests, schedule, earnings, profile, support
  const [activeJob, setActiveJob] = useState(null);
  const [offers, setOffers] = useState([]);
  const [currentIncomingAlert, setCurrentIncomingAlert] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [docRequirements, setDocRequirements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [depositTransactions, setDepositTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [brandName, setBrandName] = useState(() => {
    try {
      const cached = localStorage.getItem('apex_custom_branding');
      return cached ? JSON.parse(cached).brandName || 'ApexServices' : 'ApexServices';
    } catch {
      return 'ApexServices';
    }
  });

  // Sync state from authoritative store
  const refreshState = useCallback(() => {
    const state = api.getState();
    setPartner(state.partner || null);
    setActiveJob(state.activeJob || null);
    setOffers(state.offers || []);
    setNotifications(state.notifications || []);
    setDocRequirements(state.docRequirements || []);
    setCategories(state.categories || []);
    setDepositTransactions(state.depositTransactions || []);

    // Check for active unexpired pending offer to show in overlay
    const pendingOffer = (state.offers || []).find(
      o => o.status === 'PENDING' && o.expiresAt > Date.now()
    );
    if (pendingOffer && (!currentIncomingAlert || currentIncomingAlert.id !== pendingOffer.id)) {
      setCurrentIncomingAlert(pendingOffer);
      audioService.playIncomingAlertSound();
    } else if (!pendingOffer && currentIncomingAlert) {
      setCurrentIncomingAlert(null);
    }
  }, [currentIncomingAlert]);

  // Initial load & fetch branding
  useEffect(() => {
    refreshState();
    setIsLoading(false);

    const apiUrl = (
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
      'https://apexservices-backend.onrender.com/api'
    ).replace(/\/+$/, '');

    fetch(`${apiUrl}/data`)
      .then(res => res.json())
      .then(d => {
        if (d?.siteBranding?.brandName) {
          setBrandName(d.siteBranding.brandName);
          try {
            localStorage.setItem('apex_custom_branding', JSON.stringify(d.siteBranding));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Update browser tab title dynamically
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brandName} Partner Portal - Technician Field Operations`;
    }
  }, [brandName]);

  // Sync sound settings
  useEffect(() => {
    audioService.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    audioService.setVibrationEnabled(vibrationEnabled);
  }, [vibrationEnabled]);

  // Cross-portal BroadcastChannel listener for incoming Customer Payments and Brand Updates
  useEffect(() => {
    let syncChannel;
    try {
      syncChannel = new BroadcastChannel('apex_services_sync');
      syncChannel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'BRANDING_UPDATED') {
          if (data.brandName) {
            setBrandName(data.brandName);
            try {
              localStorage.setItem('apex_custom_branding', JSON.stringify(data.siteBranding || { brandName: data.brandName }));
            } catch {}
          }
          return;
        }

        if (data.type === 'CUSTOMER_PAYMENT_PROCESSED') {
          const state = api.getState();
          if (state.partner) {
            const net = Number(data.net || 0);
            const gross = Number(data.gross || 0);
            const cut = Number(data.platformCut || 0);

            if (!state.partner.earnings) {
              state.partner.earnings = {
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                lifetime: 0,
                pendingPayout: 0,
                availableBalance: 0,
              };
            }

            state.partner.jobsCompleted = (state.partner.jobsCompleted || 0) + 1;
            state.partner.earnings.today = (state.partner.earnings.today || 0) + net;
            state.partner.earnings.thisWeek = (state.partner.earnings.thisWeek || 0) + net;
            state.partner.earnings.thisMonth = (state.partner.earnings.thisMonth || 0) + net;
            state.partner.earnings.lifetime = (state.partner.earnings.lifetime || 0) + net;
            state.partner.earnings.availableBalance = (state.partner.earnings.availableBalance || 0) + net;
            state.partner.walletBalance = state.partner.earnings.availableBalance;

            if (!state.notifications) state.notifications = [];
            state.notifications.unshift({
              id: 'NOTIF-' + Date.now(),
              category: 'EARNINGS',
              title: 'Customer Payment Confirmed — Earnings Credited',
              message: `Customer payment of ₹${gross.toLocaleString('en-IN')} confirmed. 20% platform charge (₹${cut.toLocaleString('en-IN')}) deducted. Net ₹${net.toLocaleString('en-IN')} credited to your wallet balance.`,
              timestamp: new Date().toISOString(),
              read: false,
              actionLink: '/earnings',
            });

            api.saveState(state);
            refreshState();
            audioService.playSuccessSound();
            toast.success(
              `Payment Confirmed! ₹${net.toLocaleString('en-IN')} credited to your wallet after 20% platform deduction.`,
              'Earnings Added'
            );
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel sync error in PartnerContext:', e);
    }

    return () => {
      if (syncChannel) syncChannel.close();
    };
  }, [refreshState, toast]);

  // Periodic poll to fetch live partner feed from backend and check for expiring offers
  useEffect(() => {
    let active = true;
    const timer = setInterval(async () => {
      if (partner?.isAvailable && partner?.depositStatus === 'VERIFIED') {
        try {
          await api.fetchLiveFeed(); // Poll for all incoming broadcasts across all categories
        } catch (e) {
          // Ignore transient poll error
        }
      }
      if (active) {
        refreshState();
      }
    }, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [partner?.isAvailable, partner?.depositStatus, refreshState]);

  // Availability toggle with mandatory backend eligibility guard
  const toggleOnline = async () => {
    if (!partner) return;

    if (partner.depositStatus !== 'VERIFIED') {
      toast.warning('Eligibility Lock: You cannot go online until your mandatory security deposit is verified.', 'Security Deposit Required');
      return;
    }
    if (partner.onboardingState !== 'APPROVED') {
      toast.warning('Eligibility Lock: You cannot go online until all required documents are approved by ApexServices Admin.', 'Documents Pending Approval');
      return;
    }

    const state = api.getState();
    state.partner.isAvailable = !state.partner.isAvailable;
    api.saveState(state);
    refreshState();
  };

  // Auth: Login
  const login = async (emailOrPhone, password) => {
    const res = await api.login(emailOrPhone, password);
    refreshState();
    return res;
  };

  // Auth: Register
  const register = async (partnerData) => {
    const res = await api.register(partnerData);
    refreshState();
    return res;
  };

  // Auth: Logout
  const logout = () => {
    const name = partner?.name || partner?.fullName || 'Partner';
    const currentToken = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('apex_partner_token') : null;
    const apiUrl = (
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
      'https://apexservices-backend.onrender.com/api'
    ).replace(/\/+$/, '');
    if (currentToken) {
      fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      }).catch(err => console.warn('Partner server logout notification failed', err));
    }
    const state = api.getState();
    state.partner = null;
    state.activeJob = null;
    state.offers = [];
    api.saveState(state);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('apex_partner_token');
    }
    setCurrentIncomingAlert(null);
    setPartner(null);
    setActiveJob(null);
    refreshState();
    toast.info(`You have logged out successfully. Take care, ${name}!`, 'Logged Out');
  };

  // Deposit: Process payment
  const payDeposit = async (details) => {
    const res = await api.processDepositPayment(details);
    audioService.playSuccessSound();
    refreshState();
    return res;
  };

  // Documents: Upload
  const uploadDocument = async (reqId, fileDetails) => {
    const res = await api.uploadDocument(reqId, fileDetails);
    refreshState();
    return res;
  };

  // Accept offer
  const acceptOffer = async (offerId) => {
    try {
      const res = await api.acceptOffer(offerId);
      audioService.playSuccessSound();
      setCurrentIncomingAlert(null);
      refreshState();
      setActiveTab('jobs');
      return res;
    } catch (err) {
      toast.error(err.message, 'Accept Failed');
      refreshState();
      throw err;
    }
  };

  // Decline offer
  const declineOffer = async (offerId) => {
    audioService.playDeclineSound();
    await api.declineOffer(offerId);
    setCurrentIncomingAlert(null);
    refreshState();
  };

  // Advance Job status
  const updateJobStatus = async (jobId, newStatus, payload) => {
    const res = await api.updateJobStatus(jobId, newStatus, payload);
    if (newStatus === 'COMPLETED') {
      audioService.playSuccessSound();
    }
    refreshState();
    return res;
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = () => {
    const state = api.getState();
    (state.notifications || []).forEach(n => { n.read = true; });
    api.saveState(state);
    refreshState();
  };

  return (
    <PartnerContext.Provider
      value={{
        partner,
        activeTab,
        setActiveTab,
        activeJob,
        offers,
        currentIncomingAlert,
        notifications,
        unreadNotificationCount,
        markAllNotificationsRead,
        docRequirements,
        categories,
        depositTransactions,
        isLoading,
        soundEnabled,
        setSoundEnabled,
        vibrationEnabled,
        setVibrationEnabled,
        toggleOnline,
        login,
        register,
        logout,
        payDeposit,
        uploadDocument,
        acceptOffer,
        declineOffer,
        updateJobStatus,
        refreshState,
        brandName
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (!context) throw new Error('usePartner must be used within PartnerProvider');
  return context;
};
