import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ServiceRequestProvider } from "./contexts/ServiceRequestContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import AboutUsPage from "./pages/AboutUsPage";
import ServicesPage from "./pages/ServicesPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import GoogleCallback from "./pages/GoogleCallback"; // ADD THIS

// Admin Pages
import ServiceTrackerPage from "./pages/admin/ServiceTracker";
import AdminServiceRequestDetails from "./pages/admin/ServiceRequestDetails";
import VerifyAccountsPage from "./pages/admin/VerifyAccounts";
import ClientProfilesPage from "./pages/admin/ClientProfiles";
import UserManagementPage from "./pages/admin/UserManagement";
import ActivityLogPage from "./pages/admin/ActivityLog";
import AccountSettings from "./pages/admin/AccountSettings";
import Messages from "./pages/admin/Messages";
import MessageDetail from "./pages/admin/MessageDetail";

// Staff Pages
import StaffServiceRequestDetails from "./pages/staff/ServiceRequestDetails";

// Customer Pages
import CustomerServiceTracker from "./pages/customer/CustomerServiceTracker";
import CustomerServiceRequestDetails from "./pages/customer/CustomerServiceRequestDetails";
import CustomerMessages from "./pages/customer/CustomerMessages";
import CustomerMessageDetail from "./pages/customer/CustomerMessageDetail";
import CustomerAccountSettings from "./pages/customer/CustomerAccountSettings";
import CustomerAccountVerification from "./pages/customer/CustomerAccountVerification";
import CompanyOverview from "./pages/customer/CompanyOverview";
import Services from "./pages/customer/Services";

function App() {
  return (
    <AuthProvider>
      <ServiceRequestProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} /> {/* ADD THIS */}

              {/* Protected Admin Routes */}
              <Route
                path="/admin/service-tracker"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ServiceTrackerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/service-request/:requestNumber"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminServiceRequestDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verify-accounts"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <VerifyAccountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/client-profiles"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ClientProfilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/user-management"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/activity-log"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ActivityLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/account-settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AccountSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/messages"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/messages/:messageId"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MessageDetail />
                  </ProtectedRoute>
                }
              />

              {/* Protected Staff Routes */}
              <Route
                path="/staff/service-tracker"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <ServiceTrackerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/service-request/:requestNumber"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <StaffServiceRequestDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/client-profiles"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <ClientProfilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/account-settings"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <AccountSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/messages"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/messages/:messageId"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <MessageDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/activity-log"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <ActivityLogPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Customer Routes */}
              <Route
                path="/customer/company-overview"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CompanyOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/services"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Services />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/service-tracker"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerServiceTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/service-request/:requestId"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerServiceRequestDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/messages"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/messages/:messageId"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerMessageDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/account-settings"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerAccountSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/account-verification"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerAccountVerification />
                  </ProtectedRoute>
                }
              />

              {/* Role-based default redirects */}
              <Route 
                path="/admin" 
                element={<Navigate to="/admin/service-tracker" replace />} 
              />
              <Route 
                path="/staff" 
                element={<Navigate to="/staff/service-tracker" replace />} 
              />
              <Route 
                path="/customer" 
                element={<Navigate to="/customer/service-tracker" replace />} 
              />
              
              {/* Catch-all route for 404 - redirects to home */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
        </Router>
      </ServiceRequestProvider>
    </AuthProvider>
  );
}

export default App;