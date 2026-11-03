import React, { useState, useEffect, useCallback } from 'react';
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

// Approved 16 Core Navigation Tabs in Exact Sequence
const VALID_TABS = [
  'dashboard',
  'users',
  'partners',
  'bookings',
  'categories',
  'payments',
  'support',
  'content',
  'coupons',
  'moderation',
  'reports',
  'audit',
  'roles',
  'sessions',
  'feature-flags',
  'versions',
  'profile', // Auxiliary
  'settings'  // Compatibility alias for feature-flags
];

function resolveTabAlias(tab) {
  if (!tab) return 'dashboard';
  const clean = tab.trim().toLowerCase();
  if (clean === 'settings') return 'feature-flags';
  if (clean === 'notifications') return 'audit';
  return clean;
}

function getInitialTab() {
  if (typeof window === 'undefined') return 'dashboard';

  // 1. Check URL Hash (e.g., #users or #/users)
  const hash = resolveTabAlias(window.location.hash.replace(/^#\/?/, ''));
  if (hash && VALID_TABS.includes(hash)) {
    return hash;
  }

  // 2. Check URL Query Param (e.g., ?tab=users)
  const params = new URLSearchParams(window.location.search);
  const tabParam = resolveTabAlias(params.get('tab'));
  if (tabParam && VALID_TABS.includes(tabParam)) {
    return tabParam;
  }

  // 3. Check Pathname (e.g., /users)
  const path = resolveTabAlias(window.location.pathname.replace(/^\//, ''));
  if (path && VALID_TABS.includes(path)) {
    return path;
  }

  return 'dashboard';
}

function AdminDashboardApp() {
  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [brandName, setBrandName] = useState(() => {
    try {
      const cached = localStorage.getItem('apex_custom_branding');
      return cached ? JSON.parse(cached).brandName || 'ApexServices' : 'ApexServices';
    } catch {
      return 'ApexServices';
    }
  });

  // Authoritative tab navigation with browser history and URL sync
  const setActiveTab = useCallback((newTab) => {
    const targetTab = resolveTabAlias(newTab);
    if (!VALID_TABS.includes(targetTab)) return;

    setActiveTabState(targetTab);

    // Update URL hash for direct links, bookmarks, and refresh persistence
    if (window.location.hash.replace(/^#\/?/, '') !== targetTab) {
      window.history.pushState(null, '', `#${targetTab}`);
    }
  }, []);

  // Listen to browser Back/Forward (popstate) and hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      const current = getInitialTab();
      setActiveTabState(current);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Sync brandName from backend API
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

    const handleFocus = () => fetchBranding();
    window.addEventListener('focus', handleFocus);

    return () => {
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
    // Reset to default dashboard on logout
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  // If not authenticated, require Admin Login
  if (!adminSession) {
    return (
      <AdminLoginPage
        onLogin={(data) => {
          setAdminSession(data);
          setActiveTab('dashboard');
        }}
        brandName={brandName}
      />
    );
  }

  // Explicit, unmerged rendering for each of the 16 approved Admin Panel modules
  const renderSection = () => {
    switch (activeTab) {
      // 1. Dashboard
      case 'dashboard':
        return <DashboardSection onNavigateTab={setActiveTab} />;

      // 2. User Management
      case 'users':
        return <UserManagementSection />;

      // 3. Partner Management
      case 'partners':
        return <VendorPartnerManagementSection />;

      // 4. Booking Management
      case 'bookings':
        return <OrderBookingManagementSection />;

      // 5. Service Catalog & Pricing
      case 'categories':
        return <ServiceCategoriesSection />;

      // 6. Payments & Escrow
      case 'payments':
        return <PaymentTransactionsSection />;

      // 7. Support & Ticket Management
      case 'support':
        return <SupportTicketManagementSection />;

      // 8. Content Management (CMS)
      case 'content':
        return <ContentControlSection onNavigateTab={setActiveTab} />;

      // 9. Coupons & Discounts
      case 'coupons':
        return <CouponsDiscountsSection />;

      // 10. Content Moderation
      case 'moderation':
        return <ContentModerationSection />;

      // 11. Reports & Exports
      case 'reports':
        return <ReportsSection />;

      // 12. Audit Logs & Activity History
      case 'audit':
        return <AuditLogsSection />;

      // 13. Roles & Permissions (RBAC)
      case 'roles':
        return <RolesPermissionsSection />;

      // 14. Session & Device Management
      case 'sessions':
        return <SessionDeviceManagementSection />;

      // 15. Feature Flags & App Configuration
      case 'feature-flags':
      case 'settings':
        return <FeatureFlagsConfigSection />;

      // 16. Force Update & App Version Management
      case 'versions':
        return <ForceUpdateVersionControlSection />;

      // Auxiliary Admin Profile
      case 'profile':
        return <ProfileSection />;

      default:
        return <DashboardSection onNavigateTab={setActiveTab} />;
    }
  };

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileNavOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-800">
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation: Responsive Drawer on mobile, Collapsible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 md:static md:z-auto transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
          brandName={brandName}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={handleToggleSidebar}
          adminUser={adminSession.admin}
          onLogout={handleLogout}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
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
