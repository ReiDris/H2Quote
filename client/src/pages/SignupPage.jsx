import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import SignupForm from '../components/auth/SignupForm.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (signupData) => {
    try {
      console.log('Signup data:', signupData);
      
      // In a real app, you would:
      // 1. Send signup data to your backend API
      // 2. Backend would create the account and return user data
      // 3. You would then log the user in
      
      // For now, we'll simulate successful signup and auto-login
      const newUser = {
        id: Date.now(),
        email: signupData.email,
        name: signupData.customerName,
        company: signupData.companyName,
        role: 'customer',
        isVerified: false, // Will be true after admin verification
      };
      
      // Auto-login the user after successful signup
      await login({ email: signupData.email, password: signupData.password });
      
      // Redirect to customer dashboard
      navigate('/customer/dashboard');
      
      // You could also show a success message or redirect to a verification pending page
      alert('Account created successfully! Please wait for admin verification.');
      
    } catch (error) {
      console.error('Signup failed:', error);
      // Error handling is already done in the SignupForm component
    }
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <PublicLayout>
      <SignupForm 
        onSignup={handleSignup}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </PublicLayout>
  );
};

export default SignupPage;