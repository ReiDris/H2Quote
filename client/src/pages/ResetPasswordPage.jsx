import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm.jsx';
import { authAPI } from '../config/api';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValidation, setTokenValidation] = useState({
    isValidating: true,
    isValid: false,
    error: null
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setTokenValidation({
          isValidating: false,
          isValid: false,
          error: 'Invalid reset link. Please request a new password reset.'
        });
        return;
      }

      try {
        const response = await authAPI.validateResetToken(token, email);
        const data = await response.json();

        if (data.success) {
          setTokenValidation({
            isValidating: false,
            isValid: true,
            error: null
          });
        } else {
          setTokenValidation({
            isValidating: false,
            isValid: false,
            error: data.message || 'Invalid or expired reset token.'
          });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenValidation({
          isValidating: false,
          isValid: false,
          error: 'Failed to validate reset token. Please try again.'
        });
      }
    };

    validateToken();
  }, [token, email]);

  const handleResetPassword = async (passwordData) => {
    setIsSubmitting(true);
    try {
      const response = await authAPI.resetPassword({
        token,
        email,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to login with success message
        navigate('/login', {
          state: {
            message: 'Password has been reset successfully. You can now log in with your new password.',
            email: email
          }
        });
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResetPasswordForm
      onResetPassword={handleResetPassword}
      isSubmitting={isSubmitting}
      tokenValidation={tokenValidation}
    />
  );
};

export default ResetPasswordPage;