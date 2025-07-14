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
import VerifyAccountsPage from "./pages/admin/VerifyAccounts";
import ClientProfilesPage from "./pages/admin/ClientProfiles";
import UserManagementPage from "./pages/admin/UserManagement";
import ActivityLogPage from "./pages/admin/ActivityLog";

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

            {/* Protected Staff Routes */}
            <Route
              path="/staff/service-tracker"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <div>Staff Service Tracker - Coming Soon</div>
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