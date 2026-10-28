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

  // Initial load
  useEffect(() => {
    refreshState();
    setIsLoading(false);
  }, []);

  // Sync sound settings
  useEffect(() => {
    audioService.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    audioService.setVibrationEnabled(vibrationEnabled);
  }, [vibrationEnabled]);

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
    const currentToken = localStorage.getItem('apex_partner_token');
    if (currentToken) {
      fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      }).catch(err => console.warn('Partner server logout notification failed', err));
    }
    const state = api.getState();
    state.partner = null;
    state.activeJob = null;
    state.offers = [];
    api.saveState(state);
    localStorage.removeItem('apex_partner_token');
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
        refreshState
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
