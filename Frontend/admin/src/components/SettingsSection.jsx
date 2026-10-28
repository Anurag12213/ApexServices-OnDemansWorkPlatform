import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  AlertTriangle,
  Calendar,
  Bell,
  Shield,
  History,
  Save,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  Clock,
  Globe,
  Sliders,
  Check,
  Power
} from 'lucide-react';
import { adminFetch, API_BASE_URL } from '../utils/api';

const currencyOptions = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
];

export default function SettingsSection() {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Settings State matching PlatformSettings entity
  const [settings, setSettings] = useState({
    id: 'global-settings',
    appName: 'InstantWork Services Hub',
    supportEmail: 'support@instantwork.com',
    supportPhone: '+91 1800 200 4567',
    defaultCountry: 'India',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    defaultLocale: 'en-IN',
    timezone: 'Asia/Kolkata',
    baseVisitFee: 299.00,
    announcement: '🔥 Seasonal Offer: Get 20% OFF on all Carpentry, Plumbing & Electrical Services!',
    // Maintenance Mode
    maintenanceEnabled: false,
    maintenanceTitle: "We'll be back shortly.",
    maintenanceMessage: "InstantWork is undergoing scheduled maintenance. We're working to restore service as quickly as possible.",
    maintenancePlannedStart: '',
    maintenanceExpectedEnd: '',
    maintenanceSupportLink: 'mailto:support@instantwork.com',
    maintenanceScope: 'ALL',
    // Booking Rules
    bookingMinNoticeHours: 2,
    maxAttachmentSizeMb: 5,
    requirePhotos: false,
    cancellationAllowedWindowHours: 1,
    // Notifications & Security
    notifyOnBooking: true,
    notifyOnDispatch: true,
    notifyOnRefund: true,
    sessionTimeoutMinutes: 60,
    requireApprovalForPayouts: true,
    updatedAt: '',
    updatedBy: 'admin@instantwork.com',
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  // Load Settings from Backend
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.warn('Failed to fetch settings from backend:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load Audit Logs from Backend
  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await adminFetch('/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const handleCurrencyChange = (currCode) => {
    const selected = currencyOptions.find((c) => c.code === currCode);
    if (selected) {
      setSettings((prev) => ({
        ...prev,
        defaultCurrency: selected.code,
        currencySymbol: selected.symbol,
        defaultLocale: selected.locale,
      }));
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await adminFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSaveSuccess(true);
        fetchAuditLogs(); // Refresh audit trail
        setTimeout(() => setSaveSuccess(false), 4000);

        // Broadcast to customer tab for instantaneous live update
        try {
          const channel = new BroadcastChannel('apex_services_sync');
          channel.postMessage({ type: 'DATA_UPDATED' });
          channel.close();
        } catch (_) {}
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || err.message || 'Failed to update system settings');
      }
    } catch (e) {
      setSaveError('Network error connecting to backend service');
    } finally {
      setSaving(false);
    }
  };

  // Currency preview helper
  const formatSample = (amount) => {
    try {
      return new Intl.NumberFormat(settings.defaultLocale || 'en-IN', {
        style: 'currency',
        currency: settings.defaultCurrency || 'INR',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${settings.currencySymbol || '₹'}${amount}`;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.adminId && log.adminId.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.resourceName && log.resourceName.toLowerCase().includes(q))
    );
  });

  const subTabs = [
    { id: 'general', label: 'General Configuration', icon: Sliders },
    { id: 'currency', label: 'Currency & Localization', icon: DollarSign },
    { id: 'maintenance', label: 'Maintenance Mode', icon: Power },
    { id: 'booking', label: 'Booking Rules', icon: Calendar },
    { id: 'notifications', label: 'Notification Rules', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'audit', label: 'Configuration Audit History', icon: History },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
        <span className="text-sm font-semibold text-slate-600">Loading platform settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Global Application Settings</h1>
            {settings.maintenanceEnabled && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Maintenance Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure system parameters, multi-currency localization, maintenance lockouts, and administrative policies
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center shadow-xs">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Settings saved & synchronized
            </div>
          )}
          {saveError && (
            <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center shadow-xs">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Publishing...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'maintenance' && settings.maintenanceEnabled && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL CONFIGURATION */}
      {activeSubTab === 'general' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Platform Identity & Contact</h2>
            <p className="text-slate-500 mt-0.5">Define platform branding, operational country, and support lines visible to customers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Company / Platform Name</label>
              <input
                type="text"
                value={settings.appName || ''}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Operating Jurisdiction / Country</label>
              <input
                type="text"
                value={settings.defaultCountry || ''}
                onChange={(e) => setSettings({ ...settings, defaultCountry: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Customer Support Email</label>
              <input
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Customer Toll-Free / Phone</label>
              <input
                type="text"
                value={settings.supportPhone || ''}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Default Platform Timezone</label>
              <select
                value={settings.timezone || 'Asia/Kolkata'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET - UTC+01:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Standard Inspection & Visit Base Fee</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">{settings.currencySymbol || '₹'}</span>
                <input
                  type="number"
                  step="0.01"
                  value={settings.baseVisitFee || 299}
                  onChange={(e) => setSettings({ ...settings, baseVisitFee: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Default visit fee applied when customer creates a booking</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Global Customer Announcement Banner</label>
              <input
                type="text"
                value={settings.announcement || ''}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                placeholder="Notice displayed at the top of the customer website"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRENCY & LOCALIZATION */}
      {activeSubTab === 'currency' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Multi-Currency & Formatting Controls</h2>
            <p className="text-slate-500 mt-0.5">Control live display currency on the customer portal without disrupting historical ledgers</p>
          </div>

          {/* Audit & Compliance Disclaimer */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Historical Ledger Decoupling Guarantee</span>
              Updating the platform currency dynamically updates pricing displays, quotes, and new service requests on the customer website. All historical partner settlement payouts and completed customer refund transactions remain strictly recorded in their original currency to maintain financial audit integrity.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <label className="block font-bold text-slate-700 uppercase">Select Active Customer Display Currency</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currencyOptions.map((curr) => {
                  const isSelected = settings.defaultCurrency === curr.code;
                  return (
                    <div
                      key={curr.code}
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {curr.symbol}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{curr.name}</p>
                          <p className="text-[11px] text-slate-400">Locale: {curr.locale}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Currency Symbol Override</label>
                  <input
                    type="text"
                    value={settings.currencySymbol || ''}
                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Intl NumberFormat Locale</label>
                  <input
                    type="text"
                    value={settings.defaultLocale || ''}
                    onChange={(e) => setSettings({ ...settings, defaultLocale: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Pricing Preview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Live Formatting Preview</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{settings.defaultCurrency}</span>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Base Inspection Fee</span>
                  <span className="font-bold text-slate-900 text-sm">{formatSample(settings.baseVisitFee || 299)}</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Minor Repair Work</span>
                  <span className="font-bold text-slate-900 text-sm">{formatSample(550.00)}</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Comprehensive Fitting</span>
                  <span className="font-bold text-slate-900 text-sm">{formatSample(1850.00)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Values will render on customer quote cards using standard international decimal formatting for {settings.defaultLocale}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MAINTENANCE MODE */}
      {activeSubTab === 'maintenance' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Application Maintenance Guard</h2>
              <p className="text-slate-500 mt-0.5">Temporarily restrict customer work request submissions during system upgrades</p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className={`text-xs font-bold ${settings.maintenanceEnabled ? 'text-amber-600' : 'text-slate-500'}`}>
                {settings.maintenanceEnabled ? 'MAINTENANCE IS ACTIVE' : 'SYSTEM IS ONLINE'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceEnabled}
                  onChange={(e) => setSettings({ ...settings, maintenanceEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {settings.maintenanceEnabled && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Backend Rejection Active (HTTP 503 Service Unavailable)</span>
                While maintenance mode is enabled, new customer work requests via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">POST /api/work-requests</code> will be rejected immediately by the Spring Boot backend with code <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">MAINTENANCE_ACTIVE</code>. The Admin Panel remains fully functional.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Maintenance Scope</label>
                <select
                  value={settings.maintenanceScope || 'ALL'}
                  onChange={(e) => setSettings({ ...settings, maintenanceScope: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                >
                  <option value="ALL">Entire Customer Portal (Display Maintenance Screen)</option>
                  <option value="BOOKING_ONLY">Work Request Submission Only (Allow Browsing)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Notice Title</label>
                <input
                  type="text"
                  value={settings.maintenanceTitle || ''}
                  onChange={(e) => setSettings({ ...settings, maintenanceTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-bold"
                  placeholder="e.g. We'll be back shortly"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Explanation Message</label>
                <textarea
                  rows={3}
                  value={settings.maintenanceMessage || ''}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  placeholder="Explain why the platform is down and when service is expected to resume"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Planned Start Time</label>
                  <input
                    type="text"
                    value={settings.maintenancePlannedStart || ''}
                    onChange={(e) => setSettings({ ...settings, maintenancePlannedStart: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                    placeholder="e.g. 10 Oct 2026, 02:00 AM IST"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Expected Completion Time</label>
                  <input
                    type="text"
                    value={settings.maintenanceExpectedEnd || ''}
                    onChange={(e) => setSettings({ ...settings, maintenanceExpectedEnd: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                    placeholder="e.g. 10 Oct 2026, 05:00 AM IST"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Emergency Support Contact Link</label>
                <input
                  type="text"
                  value={settings.maintenanceSupportLink || ''}
                  onChange={(e) => setSettings({ ...settings, maintenanceSupportLink: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  placeholder="mailto:support@instantwork.com"
                />
              </div>
            </div>

            {/* Live Visual Preview of Customer Screen */}
            <div className="space-y-2">
              <span className="block font-bold text-slate-700 uppercase text-[11px]">Customer Live Preview</span>
              <div className="border border-slate-300 rounded-2xl p-6 bg-gradient-to-b from-slate-50 to-white text-center shadow-xs flex flex-col justify-center items-center min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider mb-2">
                  System Maintenance
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">
                  {settings.maintenanceTitle || "We'll be back shortly"}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mb-4 leading-relaxed">
                  {settings.maintenanceMessage || 'InstantWork is undergoing scheduled maintenance.'}
                </p>
                {settings.maintenanceExpectedEnd && (
                  <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] text-slate-700 mb-4 border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Expected return: <strong>{settings.maintenanceExpectedEnd}</strong></span>
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href={settings.maintenanceSupportLink || '#'}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Need emergency help? Contact Support &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOOKING RULES */}
      {activeSubTab === 'booking' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Customer Booking Parameters</h2>
            <p className="text-slate-500 mt-0.5">Control lead times, media limits, and cancellation boundaries</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Minimum Booking Notice (Hours)</label>
              <input
                type="number"
                min="0"
                value={settings.bookingMinNoticeHours || 2}
                onChange={(e) => setSettings({ ...settings, bookingMinNoticeHours: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Customers cannot book slots earlier than this lead time</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Max Media Attachment Size (MB)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxAttachmentSizeMb || 5}
                onChange={(e) => setSettings({ ...settings, maxAttachmentSizeMb: parseInt(e.target.value) || 5 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Applies to problem diagnosis photo and invoice uploads</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Cancellation Grace Window (Hours)</label>
              <input
                type="number"
                min="0"
                value={settings.cancellationAllowedWindowHours || 1}
                onChange={(e) => setSettings({ ...settings, cancellationAllowedWindowHours: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Window prior to appointment where customer can cancel without fee</p>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requirePhotos || false}
                  onChange={(e) => setSettings({ ...settings, requirePhotos: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Require Photo Upload</span>
                  <span className="text-[11px] text-slate-400">Mandate at least 1 image for plumbing & carpentry submissions</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATION RULES */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Automated Notification Gateways</h2>
            <p className="text-slate-500 mt-0.5">Toggle automated triggers for customer bookings, partner assignments, and payout alerts</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Send Booking Confirmation to Customer</span>
                <span className="text-slate-500 text-[11px]">Triggers transactional email & SMS with estimated visit fee and problem summary</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnBooking || false}
                onChange={(e) => setSettings({ ...settings, notifyOnBooking: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Send Dispatch Alert to Assigned Partner</span>
                <span className="text-slate-500 text-[11px]">Dispatches push alert and SMS to certified partner with customer address and phone</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnDispatch || false}
                onChange={(e) => setSettings({ ...settings, notifyOnDispatch: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Send Refund Notification to Customer</span>
                <span className="text-slate-500 text-[11px]">Sends refund receipt whenever an admin issues full or partial payment refund</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnRefund || false}
                onChange={(e) => setSettings({ ...settings, notifyOnRefund: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">SMTP Email Dispatcher</span>
              <p className="font-bold text-slate-800 text-sm mt-1">SendGrid Gateway</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-2">Active</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">SMS Carrier</span>
              <p className="font-bold text-slate-800 text-sm mt-1">Twilio FastSMS</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-2">Active</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">WebSocket Push</span>
              <p className="font-bold text-slate-800 text-sm mt-1">Live Broadcast Sync</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-2">Connected</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY & ACCESS */}
      {activeSubTab === 'security' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Security Policies & Administrative Safeguards</h2>
            <p className="text-slate-500 mt-0.5">Enforce administrative authorization boundaries and session lifetime</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Admin Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.sessionTimeoutMinutes || 60}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Forces re-authentication when admin portal is idle</p>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireApprovalForPayouts || false}
                  onChange={(e) => setSettings({ ...settings, requireApprovalForPayouts: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Require Authorized Approval for Partner Payouts</span>
                  <span className="text-[11px] text-slate-400">Prevent immediate automated fund settlements without explicit admin sign-off</span>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="font-bold text-slate-800 uppercase text-[11px]">Active Access Role Privileges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Super Administrator</span>
                <span className="text-slate-500 text-[11px]">Full access to currency switches, maintenance, refunds, and partner payouts</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Operations Lead</span>
                <span className="text-slate-500 text-[11px]">Authorized to dispatch partners, modify categories, and issue warnings</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Finance Officer</span>
                <span className="text-slate-500 text-[11px]">Authorized to approve partner settlements and process user refunds</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CONFIGURATION AUDIT HISTORY */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Configuration Audit Trail & Operations Ledger</h2>
              <p className="text-slate-500 mt-0.5">Immutable record of currency modifications, maintenance switches, payouts, and warnings</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchAuditLogs}
                disabled={auditLoading}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                title="Refresh audit trail"
              >
                <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Admin Identity</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Details / Change Summary</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.createdAt}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {log.adminId}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {log.resourceName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
