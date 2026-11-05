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
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-[#ff3b47] selection:text-white">
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <div>
        <TopBar />
        <Navbar />
        <main>{renderPage()}</main>
      </div>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <ConfirmDialogProvider>
        <MainContent />
      </ConfirmDialogProvider>
    </DataProvider>
  );
}
