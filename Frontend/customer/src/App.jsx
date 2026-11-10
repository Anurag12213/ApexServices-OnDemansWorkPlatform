'use client';

import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import { TopBar } from './components/TopBar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './views/HomePage';
import { ServicesPage } from './views/ServicesPage';
import { AboutPage } from './views/AboutPage';
import { ReviewsPage } from './views/ReviewsPage';
import { ContactPage } from './views/ContactPage';
import { LoginPage } from './views/LoginPage';
import { RequestWorkPage } from './views/RequestWorkPage';
import { MaintenancePage } from './views/MaintenancePage';
import { ToastContainer } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import { CookieConsent } from './components/CookieConsent';

const MainContent = () => {
  const { activePage, publicConfig, refreshData, toasts, dismissToast } = useData();

  // 1. Check Full Platform Maintenance Lockout
  if (publicConfig?.maintenance?.enabled && (publicConfig?.maintenance?.scope === 'ALL' || !publicConfig?.maintenance?.scope || publicConfig?.maintenance?.scope === 'GLOBAL')) {
    return (
      <MaintenancePage
        config={publicConfig.maintenance}
        supportEmail={publicConfig.supportEmail || 'support@apexservices.com'}
        supportPhone={publicConfig.supportPhone || '+91 1800 200 4567'}
        onRefresh={refreshData}
      />
    );
  }

  const renderPage = () => {
    // 2. Check Booking-Only Maintenance Lockout
    if (publicConfig?.maintenance?.enabled && publicConfig?.maintenance?.scope === 'BOOKING_ONLY' && activePage === 'request-work') {
      return (
        <MaintenancePage
          config={publicConfig.maintenance}
          supportEmail={publicConfig.supportEmail || 'support@apexservices.com'}
          supportPhone={publicConfig.supportPhone || '+91 1800 200 4567'}
          onRefresh={refreshData}
        />
      );
    }

    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'services':
        return <ServicesPage />;
      case 'about':
        return <AboutPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'contact':
        return <ContactPage />;
      case 'login':
        return <LoginPage />;
      case 'request-work':
        return <RequestWorkPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-[#ff3b47] selection:text-white overflow-x-hidden w-full max-w-full">
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <div>
        {activePage !== 'request-work' && <TopBar />}
        <Navbar />
        <main>{renderPage()}</main>
      </div>
      <Footer />
      <CookieConsent />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
            <div className="w-14 h-14 bg-purple-50 text-[#6355F6] rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
              ⚡
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Something went wrong</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              An unexpected issue occurred while rendering this page. Refreshing will restore the latest state.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('apex_active_page');
                  } catch {}
                  window.location.reload();
                }}
                className="px-6 py-2.5 bg-[#6355F6] hover:bg-[#5244E8] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <ConfirmDialogProvider>
          <MainContent />
        </ConfirmDialogProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}
