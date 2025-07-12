import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AboutUsPage from "./pages/AboutUsPage";
import ServicesPage from "./pages/ServicesPage";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
// Import other pages as you create them
// import LoginPage from "./pages/LoginPage";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import StaffDashboard from "./pages/staff/StaffDashboard";
// import CustomerDashboard from "./pages/customer/CustomerDashboard";

function App() {
  return (
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

          {/* Dashboard Routes - add these when you create the dashboard pages */}
          {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
          {/* <Route path="/staff/dashboard" element={<StaffDashboard />} /> */}
          {/* <Route path="/customer/dashboard" element={<CustomerDashboard />} /> */}
          
          {/* Catch-all route for 404 - redirects to home */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;