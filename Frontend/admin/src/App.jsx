import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardSection from './components/DashboardSection';
import ServiceCategoriesSection from './components/ServiceCategoriesSection';
import UserManagementSection from './components/UserManagementSection';
import ContentControlSection from './components/ContentControlSection';
import PaymentTransactionsSection from './components/PaymentTransactionsSection';
import ReportsSection from './components/ReportsSection';
import ProfileSection from './components/ProfileSection';

// The 16 Complete Founder's Admin Panel Checklist Modules (unmerged)
import OrderBookingManagementSection from './components/OrderBookingManagementSection';
import VendorPartnerManagementSection from './components/VendorPartnerManagementSection';
import RolesPermissionsSection from './components/RolesPermissionsSection';
import SupportTicketManagementSection from './components/SupportTicketManagementSection';
import AuditLogsSection from './components/AuditLogsSection';
import FeatureFlagsConfigSection from './components/FeatureFlagsConfigSection';
import CouponsDiscountsSection from './components/CouponsDiscountsSection';
import ContentModerationSection from './components/ContentModerationSection';
import SessionDeviceManagementSection from './components/SessionDeviceManagementSection';
import ForceUpdateVersionControlSection from './components/ForceUpdateVersionControlSection';

import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import AdminLoginPage from './pages/AdminLoginPage';
import { API_BASE_URL } from './utils/api';

function AdminDashboardApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [brandName, setBrandName] = useState(() => {
    try {
      const cached = localStorage.getItem('apex_custom_branding');
      return cached ? JSON.parse(cached).brandName || 'ApexServices' : 'ApexServices';
    } catch {
      return 'ApexServices';
    }
  });

  // Sync brandName from backend API and listen to updates
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/data`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const name = data?.siteBranding?.brandName || data?.publicConfig?.brandName;
          if (name) {
            setBrandName(name);
            try {
              localStorage.setItem('apex_custom_branding', JSON.stringify(data.siteBranding || { brandName: name }));
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Failed to load branding in admin:', e);
      }
    };

    fetchBranding();

    // Cross-tab real-time sync via BroadcastChannel
    let ch;
    try {
      ch = new BroadcastChannel('apex_services_sync');
      ch.onmessage = (event) => {
        if (event.data?.type === 'BRANDING_UPDATED' || event.data?.type === 'DATA_UPDATED') {
          if (event.data?.brandName) {
            setBrandName(event.data.brandName);
          } else {
            fetchBranding();
          }
        }
      };
    } catch (e) {}

    const handleFocus = () => fetchBranding();
    window.addEventListener('focus', handleFocus);

    return () => {
      try { ch?.close(); } catch {}
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Update document title dynamically
  useEffect(() => {
    document.title = `${brandName} Admin Panel`;
  }, [brandName]);

  // Protected Admin Authentication State
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_admin_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthExpired = () => {
      setAdminSession(null);
    };
    window.addEventListener('apex_admin_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('apex_admin_auth_expired', handleAuthExpired);
    };
  }, []);

  const handleLogout = () => {
    if (adminSession?.token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminSession.token}` }
      }).catch(err => console.warn('Admin logout server notification failed', err));
    }
    localStorage.removeItem('apex_admin_auth');
    setAdminSession(null);
  };

  // If not authenticated, require Admin Login
  if (!adminSession) {
    return <AdminLoginPage onLogin={(data) => setAdminSession(data)} brandName={brandName} />;
  }

  // Explicit, unmerged rendering for each of the 16 Founder's Admin Panel modules
  const renderSection = () => {
    switch (activeTab) {
      // Module 9: Live Analytics Dashboard
      case 'dashboard':
        return <DashboardSection onNavigateTab={setActiveTab} />;

      // Module 7: Order / Booking Management
      case 'bookings':
        return <OrderBookingManagementSection />;

      // Module 13: Vendor / Partner Management
      case 'partners':
        return <VendorPartnerManagementSection />;

      // Module 1: User Management
      case 'users':
        return <UserManagementSection />;

      // Module 3: Payments & Transactions
      case 'payments':
        return <PaymentTransactionsSection />;

      // Module 12: Coupons & Discount Management
      case 'coupons':
        return <CouponsDiscountsSection />;

      // Module 5: Reports & Exports
      case 'reports':
        return <ReportsSection />;

      // Module 8: Support & Ticket Management
      case 'support':
        return <SupportTicketManagementSection />;

      // Module 2: Content Management (CMS)
      case 'content':
        return <ContentControlSection onNavigateTab={setActiveTab} />;

      // Module 14: Content Moderation Tools
      case 'moderation':
        return <ContentModerationSection />;

      // Core Service Offerings & Pricing Catalog
      case 'categories':
        return <ServiceCategoriesSection />;

      // Module 6: Roles & Permissions (RBAC)
      case 'roles':
        return <RolesPermissionsSection />;

      // Module 10: Audit Logs & Activity History
      case 'audit':
        return <AuditLogsSection />;

      // Module 11: Feature Flags & App Configuration
      case 'feature-flags':
      case 'settings':
        return <FeatureFlagsConfigSection />;

      // Module 15: Session & Device Management
      case 'sessions':
        return <SessionDeviceManagementSection />;

      // Module 16: Force-Update & App Version Control
      case 'versions':
        return <ForceUpdateVersionControlSection />;

      // Auxiliary Admin Profile
      case 'profile':
        return <ProfileSection />;

      default:
        return <DashboardSection onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
        brandName={brandName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar with 16-module mega-switcher, instant search, and quick horizontal pills */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          adminUser={adminSession.admin}
          onLogout={handleLogout}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <AdminDashboardApp />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
