import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
//import PublicLayout from '../layouts/PublicLayout.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if there's a success message from signup
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location.state]);

  const handleLogin = async (credentials) => {
    setIsSubmitting(true);
    try {
      setLoginError(''); // Clear previous errors
      setSuccessMessage(''); // Clear success message
      
      const user = await login(credentials);
      
      // Redirect based on user role - using correct routes that exist in App.jsx
      switch (user.role) {
        case 'admin':
          navigate('/admin/service-tracker');
          break;
        case 'staff':
          navigate('/staff/service-tracker');
          break;
        case 'customer':
          navigate('/customer/service-tracker');
          break;
        default:
          navigate('/customer/service-tracker'); // Default to customer service tracker
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToSignup = () => {
    navigate('/signup');
  };

  return (
      <LoginForm 
        onLogin={handleLogin}
        onSwitchToSignup={handleSwitchToSignup}
        error={loginError}
        defaultEmail={location.state?.email}
        isSubmitting={isSubmitting}
      />
  );
};

export default LoginPage;