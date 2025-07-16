import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import AboutUsPage from "./pages/AboutUsPage";
import ServicesPage from "./pages/ServicesPage";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";

// Admin Pages
import ServiceTrackerPage from "./pages/admin/ServiceTracker";
import ServiceRequestDetails from "./pages/admin/ServiceRequestDetails";
import VerifyAccountsPage from "./pages/admin/VerifyAccounts";
import ClientProfilesPage from "./pages/admin/ClientProfiles";
import UserManagementPage from "./pages/admin/UserManagement";
import ActivityLogPage from "./pages/admin/ActivityLog";
import AccountSettings from "./pages/admin/AccountSettings";
import Messages from "./pages/admin/Messages";
import MessageDetail from "./pages/admin/MessageDetail";

// Staff Pages (will be created later)
// import StaffServiceTrackerPage from "./pages/staff/ServiceTrackerPage";

// Customer Pages (will be created later)
// import CustomerDashboard from "./pages/customer/CustomerDashboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />

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
              path="/admin/service-request/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ServiceRequestDetails />
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
                  <div>Staff Service Tracker - Coming Soon</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/service-request/:id"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <ServiceRequestDetails />
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

            {/* Protected Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <div>Customer Dashboard - Coming Soon</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/account-settings"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/messages"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/messages/:messageId"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <MessageDetail />
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
              element={<Navigate to="/customer/dashboard" replace />} 
            />
            
            {/* Catch-all route for 404 - redirects to home */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;