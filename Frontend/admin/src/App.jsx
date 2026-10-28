import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardSection from './components/DashboardSection';
import ServiceCategoriesSection from './components/ServiceCategoriesSection';
import ServiceOperationsSection from './components/ServiceOperationsSection';
import UserManagementSection from './components/UserManagementSection';
import ContentControlSection from './components/ContentControlSection';
import PaymentTransactionsSection from './components/PaymentTransactionsSection';
import NotificationsSection from './components/NotificationsSection';
import ReportsSection from './components/ReportsSection';
import SettingsSection from './components/SettingsSection';
import ProfileSection from './components/ProfileSection';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import AdminLoginPage from './pages/AdminLoginPage';

function AdminDashboardApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Protected Admin Authentication State
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_admin_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    if (adminSession?.token) {
      fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminSession.token}` }
      }).catch(err => console.warn('Admin logout server notification failed', err));
    }
    localStorage.removeItem('apex_admin_auth');
    setAdminSession(null);
  };

  // If not authenticated, require Admin Login
  if (!adminSession) {
    return <AdminLoginPage onLogin={(data) => setAdminSession(data)} />;
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardSection />;
      case 'categories':
        return <ServiceCategoriesSection />;
      case 'operations':
        return <ServiceOperationsSection onNavigateTab={setActiveTab} />;
      case 'users':
        return <UserManagementSection />;
      case 'content':
        return <ContentControlSection onNavigateTab={setActiveTab} />;
      case 'payments':
        return <PaymentTransactionsSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return <SettingsSection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
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
