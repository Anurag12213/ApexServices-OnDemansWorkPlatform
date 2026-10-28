import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScreenSwitcherNav from './components/layout/ScreenSwitcherNav';

// Row 1: Login Pages (Desktop matching SS)
import CustomerLoginPage from './pages/CustomerLoginPage';
import PartnerLoginPage from './pages/PartnerLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Row 2: Registration Pages (Desktop matching SS)
import CustomerRegisterPage from './pages/CustomerRegisterPage';
import PartnerTypeSelectPage from './pages/PartnerTypeSelectPage';
import PartnerIndividualRegisterPage from './pages/PartnerIndividualRegisterPage';
import PartnerOrgRegisterPage from './pages/PartnerOrgRegisterPage';

// Row 3: Dashboards (Desktop matching SS)
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export function App() {
  return (
    <BrowserRouter>
      {/* Top persistent switcher bar allowing instantaneous jump to any screen from the SS */}
      <ScreenSwitcherNav />

      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login/customer" replace />} />

        {/* ROW 1: Logins */}
        <Route path="/login/customer" element={<CustomerLoginPage />} />
        <Route path="/customer" element={<Navigate to="/login/customer" replace />} />
        
        <Route path="/login/partner" element={<PartnerLoginPage />} />
        <Route path="/partner" element={<Navigate to="/login/partner" replace />} />

        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/login/admin" replace />} />

        {/* ROW 2: Registrations */}
        <Route path="/register/customer" element={<CustomerRegisterPage />} />
        <Route path="/register/partner/select" element={<PartnerTypeSelectPage />} />
        <Route path="/register/partner/individual" element={<PartnerIndividualRegisterPage />} />
        <Route path="/register/partner/organization" element={<PartnerOrgRegisterPage />} />

        {/* ROW 3: Dashboards */}
        <Route path="/dashboard/customer" element={<CustomerDashboardPage />} />
        <Route path="/dashboard/partner" element={<PartnerDashboardPage />} />
        <Route path="/dashboard/admin" element={<AdminDashboardPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login/customer" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
