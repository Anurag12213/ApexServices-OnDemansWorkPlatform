import React, { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Sliders,
  DollarSign,
  Shield,
  Zap,
  Save,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import { adminFetch } from '../utils/api';

export default function FeatureFlagsConfigSection() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // App Configurations & Numerical Parameters
  const [configs, setConfigs] = useState({
    platformCommissionPct: 15,
    individualDepositAmount: 5000,
    orgDepositAmount: 15000,
    autoDispatchTimeoutSeconds: 45,
    emergencySurchargeAmount: 199,
    customerCancelWindowMinutes: 10,
    maxConcurrentPartnerJobs: 2,
    serviceRadiusKm: 25
  });

  // Feature Flags & Circuit Breaker Toggles
  const [flags, setFlags] = useState({
    instant_booking_enabled: {
      name: '1-Click Instant Booking',
      desc: 'Allow customer to book immediate dispatch without prior technician quote.',
      enabled: true,
      category: 'Customer Experience'
    },
    surge_pricing_enabled: {
      name: 'Dynamic Surge Pricing Engine',
      desc: 'Automatically apply multiplier (1.2x) during peak monsoon/summer slots.',
      enabled: false,
      category: 'Revenue Optimization'
    },
    partner_phone_otp_required: {
      name: 'Mandatory Phone OTP on Partner App',
      desc: 'Enforces 6-digit SMS OTP verification on partner login and withdrawal.',
      enabled: true,
      category: 'Security & Auth'
    },
    customer_cash_on_delivery: {
      name: 'Cash on Service Completion (COD)',
      desc: 'Permits customers to settle invoice balance via cash directly to partner.',
      enabled: true,
      category: 'Payments'
    },
    ai_smart_dispatch: {
      name: 'AI Geolocation Dispatch Matcher',
      desc: 'Ranks active fleet by distance, customer rating, and tool readiness.',
      enabled: true,
      category: 'Dispatch Automation'
    },
    emergency_service_mode: {
      name: '24x7 Emergency Service Protocol',
      desc: 'Activates 45-minute guaranteed technician response with overtime payout.',
      enabled: true,
      category: 'Operations'
    },
    maintenance_lockdown: {
      name: 'Platform Maintenance Mode',
      desc: 'Pauses incoming bookings platform-wide and displays maintenance notice.',
      enabled: false,
      category: 'System Governance'
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/feature-flags');
      if (res.ok) {
        const data = await res.json();
        if (data.configs) setConfigs(data.configs);
        if (data.flags) setFlags(data.flags);
      }
    } catch (err) {
      console.warn('Could not fetch feature flags from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFlag = (key) => {
    setFlags((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled
      }
    }));
    toast.info(`Toggled "${flags[key]?.name || key}" to ${!flags[key]?.enabled ? 'ON' : 'OFF'}`);
  };

  const handleSaveConfigs = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch('/admin/feature-flags', {
        method: 'PUT',
        body: JSON.stringify({ configs, flags })
      });
      if (res.ok) {
        toast.success('App configurations and feature flags synchronized across all client applications.', 'Settings Saved');
      } else {
        toast.warning('Updated locally, server returned non-200 status.');
      }
    } catch (err) {
      toast.error('Network error updating backend flags.');
    } finally {
      localStorage.setItem('apex_app_configs', JSON.stringify(configs));
      localStorage.setItem('apex_feature_flags', JSON.stringify(flags));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Feature Flags & App Configuration</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic runtime switches and business rules: modify platform commission, security deposit amounts, and feature availability instantly without code releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Reload from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleSaveConfigs}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes to Production'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business Parameters (Config) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase">Core Financial & Dispatch Rules</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Platform Commission Rate</span>
                <span className="text-blue-600 font-black">{configs.platformCommissionPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={configs.platformCommissionPct}
                onChange={(e) => setConfigs({ ...configs, platformCommissionPct: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <span className="text-[10px] text-slate-400">Deducted automatically from gross order value upon job completion.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Individual Tech Deposit (₹)</label>
                <input
                  type="number"
                  value={configs.individualDepositAmount}
                  onChange={(e) => setConfigs({ ...configs, individualDepositAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization Deposit (₹)</label>
                <input
                  type="number"
                  value={configs.orgDepositAmount}
                  onChange={(e) => setConfigs({ ...configs, orgDepositAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Auto-Dispatch Window (Sec)</label>
                <input
                  type="number"
                  value={configs.autoDispatchTimeoutSeconds}
                  onChange={(e) => setConfigs({ ...configs, autoDispatchTimeoutSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Surcharge (₹)</label>
                <input
                  type="number"
                  value={configs.emergencySurchargeAmount}
                  onChange={(e) => setConfigs({ ...configs, emergencySurchargeAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Technician Service Radius (Km)</label>
              <input
                type="number"
                value={configs.serviceRadiusKm}
                onChange={(e) => setConfigs({ ...configs, serviceRadiusKm: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Feature Flags */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 uppercase">Live Feature Flag Switches</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Instantly updates Customer & Partner apps</span>
          </div>

          <div className="space-y-3">
            {Object.entries(flags).map(([key, flag]) => (
              <div
                key={key}
                onClick={() => handleToggleFlag(key)}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                  flag.enabled
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{flag.name}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      {flag.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{flag.desc}</p>
                </div>

                <button
                  type="button"
                  className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 cursor-pointer ${
                    flag.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
