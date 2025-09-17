// Alternative: Remove PublicLayout from SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import SignupForm from '../components/auth/SignupForm.jsx';
// Remove this line: import PublicLayout from '../layouts/PublicLayout.jsx';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (signupData) => {
    setIsSubmitting(true);
    try {
      console.log('Signup data:', signupData);
      const response = await signup(signupData);
      alert(response.message || 'Account created successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Remove PublicLayout wrapper
    <SignupForm 
      onSignup={handleSignup}
      isSubmitting={isSubmitting}
    />
  );
};

export default SignupPage;