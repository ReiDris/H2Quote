import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (credentials) => {
    try {
      setLoginError(''); // Clear previous errors
      const user = await login(credentials);
      
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'staff':
          navigate('/staff/dashboard');
          break;
        case 'customer':
          navigate('/customer/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error.message);
    }
  };

  const handleSwitchToSignup = () => {
    navigate('/signup');
  };

  return (
    <PublicLayout>
      <LoginForm 
        onLogin={handleLogin}
        onSwitchToSignup={handleSwitchToSignup}
        error={loginError}
      />
    </PublicLayout>
  );
};

export default LoginPage;