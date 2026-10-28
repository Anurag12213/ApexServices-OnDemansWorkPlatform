import React, { useState } from 'react';
import { PartnerProvider, usePartner } from './context/PartnerContext';
import { PartnerNavbar } from './components/layout/PartnerNavbar';
import { PartnerSidebar } from './components/layout/PartnerSidebar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { ActiveJobBanner } from './components/layout/ActiveJobBanner';
import { IncomingRequestOverlay } from './components/alerts/IncomingRequestOverlay';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';

// Auth Pages
import { WelcomeScreen } from './pages/auth/WelcomeScreen';
import { AccountTypeSelect } from './pages/auth/AccountTypeSelect';
import { SignupScreen } from './pages/auth/SignupScreen';
import { ContactVerificationScreen } from './pages/auth/ContactVerificationScreen';
import { LoginScreen } from './pages/auth/LoginScreen';
import { ForgotPasswordScreen } from './pages/auth/ForgotPasswordScreen';

// Core Partner Workflow Pages
import { PartnerDashboardScreen } from './pages/dashboard/PartnerDashboardScreen';
import { IncomingRequestsListScreen } from './pages/requests/IncomingRequestsListScreen';
import { NotificationsInboxScreen } from './pages/requests/NotificationsInboxScreen';
import { JobExecutionFlow } from './pages/jobs/JobExecutionFlow';
import { AssignedJobsScreen } from './pages/jobs/AssignedJobsScreen';
import { DocumentsManagerScreen } from './pages/documents/DocumentsManagerScreen';
import { DepositPaymentFlow } from './pages/deposit/DepositPaymentFlow';
import { CategoryPricingInfoScreen } from './pages/pricing/CategoryPricingInfoScreen';
import { OnboardingProgressScreen } from './pages/onboarding/OnboardingProgressScreen';
import { EarningsManagerScreen } from './pages/earnings/EarningsManagerScreen';
import { PartnerProfileScreen } from './pages/profile/PartnerProfileScreen';
import { HelpSupportScreen } from './pages/support/HelpSupportScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainApp = () => {
  const { partner, activeTab, setActiveTab } = usePartner();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth flow sub-steps when partner is not authenticated
  const [authStep, setAuthStep] = useState('WELCOME'); // 'WELCOME', 'TYPE_SELECT', 'SIGNUP', 'VERIFY', 'LOGIN', 'FORGOT'
  const [selectedAccountType, setSelectedAccountType] = useState('INDIVIDUAL');

  // If partner is not signed in, render onboarding & auth workflow
  if (!partner) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col justify-between">
        <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between">
          <div
            onClick={() => setAuthStep('WELCOME')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              A
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                Apex<span className="text-blue-600">Services</span>
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                Partner
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            {authStep !== 'LOGIN' && (
              <button
                onClick={() => setAuthStep('LOGIN')}
                className="text-slate-600 hover:text-slate-900"
              >
                Sign In
              </button>
            )}
            {authStep !== 'SIGNUP' && authStep !== 'TYPE_SELECT' && (
              <button
                onClick={() => setAuthStep('TYPE_SELECT')}
                className="px-3.5 py-1.5 bg-[#3867FF] text-white rounded-xl shadow-xs hover:bg-blue-600 transition-colors"
              >
                Register
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center">
          {authStep === 'WELCOME' && (
            <WelcomeScreen
              onGetStarted={() => setAuthStep('TYPE_SELECT')}
              onLogin={() => setAuthStep('LOGIN')}
            />
          )}

          {authStep === 'TYPE_SELECT' && (
            <AccountTypeSelect
              onSelect={(type) => {
                setSelectedAccountType(type);
                setAuthStep('SIGNUP');
              }}
              onBack={() => setAuthStep('WELCOME')}
            />
          )}

          {authStep === 'SIGNUP' && (
            <SignupScreen
              accountType={selectedAccountType}
              onBack={() => setAuthStep('TYPE_SELECT')}
              onComplete={() => {
                setAuthStep('VERIFY');
              }}
            />
          )}

          {authStep === 'VERIFY' && (
            <ContactVerificationScreen
              onVerified={() => {
                setActiveTab('deposit');
              }}
            />
          )}

          {authStep === 'LOGIN' && (
            <LoginScreen
              onRegisterClick={() => setAuthStep('TYPE_SELECT')}
              onForgotPasswordClick={() => setAuthStep('FORGOT')}
            />
          )}

          {authStep === 'FORGOT' && (
            <ForgotPasswordScreen
              onBackToLogin={() => setAuthStep('LOGIN')}
            />
          )}
        </main>
      </div>
    );
  }

  // Authenticated Partner Shell
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <PartnerDashboardScreen />;
      case 'requests':
        return <IncomingRequestsListScreen />;
      case 'jobs':
        return <JobExecutionFlow />;
      case 'schedule':
        return <AssignedJobsScreen />;
      case 'earnings':
        return <EarningsManagerScreen />;
      case 'documents':
        return <DocumentsManagerScreen />;
      case 'deposit':
        return <DepositPaymentFlow />;
      case 'pricing':
        return <CategoryPricingInfoScreen />;
      case 'onboarding':
        return <OnboardingProgressScreen />;
      case 'notifications':
        return <NotificationsInboxScreen />;
      case 'profile':
        return <PartnerProfileScreen />;
      case 'support':
        return <HelpSupportScreen />;
      default:
        return <PartnerDashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex selection:bg-[#3867FF] selection:text-white">
      {/* Desktop Sidebar & Mobile Drawer Navigation */}
      <PartnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Layout Column (full width on mobile/tablet, offset by 256px sidebar on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Navbar */}
        <PartnerNavbar onOpenMenu={() => setSidebarOpen(true)} />

        {/* Persistent Active Job Banner (if active job in progress) */}
        <ActiveJobBanner />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 w-full pb-20 lg:pb-8">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 core tabs) */}
      <BottomNavigation />

      {/* Uber Partner-Style Incoming Request Alert Overlay (Global trigger) */}
      <IncomingRequestOverlay />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <PartnerProvider>
          <MainApp />
        </PartnerProvider>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
