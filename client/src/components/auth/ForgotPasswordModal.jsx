import React, { useState } from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-4xl w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          disabled={isSubmitting}
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-10">
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#004785] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-[#004785]" size={24} />
                </div>
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-4">
                  Forgot Password?
                </h2>
                <p className="text-xs lg:text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="reset-email" className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl text-xs lg:text-base border-2 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200"
                    placeholder="Enter your email address"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-md font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="text-center mt-6">
                <button
                  onClick={handleClose}
                  className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 cursor-pointer"
                  disabled={isSubmitting}
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-4">
                Check Your Email
              </h2>
              <p className="text-xs lg:text-sm text-gray-600 mb-6">
                If an account exists with this email, a password reset link has been sent to:
              </p>
              <p className="font-medium text-gray-900 mb-6 text-sm lg:text-base">{email}</p>
              <p className="text-xs text-gray-500 mb-8">
                Check your spam folder if you don't see the email in your inbox.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-md font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] transition-colors duration-200 cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;