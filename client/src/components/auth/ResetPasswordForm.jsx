import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResetPasswordForm = ({ onResetPassword, isSubmitting, tokenValidation }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 12) {
      newErrors.newPassword = 'Password must be at least 12 characters';
    } else {
      // Check password requirements (matching backend validation)
      const hasUppercase = /[A-Z]/.test(formData.newPassword);
      const hasLowercase = /[a-z]/.test(formData.newPassword);
      const hasNumber = /\d/.test(formData.newPassword);
      const hasSpecial = /[@$!%*?&]/.test(formData.newPassword);

      if (!hasUppercase) {
        newErrors.newPassword = 'Password must contain at least 1 uppercase letter';
      } else if (!hasLowercase) {
        newErrors.newPassword = 'Password must contain at least 1 lowercase letter';
      } else if (!hasNumber) {
        newErrors.newPassword = 'Password must contain at least 1 number';
      } else if (!hasSpecial) {
        newErrors.newPassword = 'Password must contain at least 1 special character (@$!%*?&)';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setErrors({});

    try {
      await onResetPassword(formData);
    } catch (error) {
      console.error('Reset password form error:', error);
      setErrors({ general: error.message || 'Failed to reset password. Please try again.' });
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'newPassword') {
      setShowNewPassword(!showNewPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Section */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/logos/login bg.jpg"
            alt="Background"
            className="w-full h-full object-cover scale-110"
            style={{ objectPosition: '35% center' }}
          />
          {/* Light blue tint */}
          <div className="absolute inset-0 bg-[#002052] opacity-80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-center">
              <Link to="/">
                <img
                  src="/images/logos/TRISHKAYE LOGO SVG.svg"
                  alt="TRISHKAYE Logo"
                  className="w-50 lg:w-60 xl:w-70 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>
          </div>
          {/* Welcome Message */}
          <div className="text-center max-w">
            <h1 className="text-2xl lg:text-4xl xl:text-5xl leading-7 lg:leading-10 xl:leading-13 tracking-tight font-medium mb-4">
              Welcome to TRISHKAYE <br />
              ENTERPRISES
            </h1>
            <p className="text-xs lg:text-lg xl:text-xl">
              Reset your password to continue
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w m-10 lg:m-15 xl:m-30">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-2">
              Reset Password
            </h2>
            <p className="text-xs lg:text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>

          {/* Token Validation Loading */}
          {tokenValidation.isValidating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700">Validating reset link...</span>
              </div>
            </div>
          )}

          {/* Token Validation Error */}
          {!tokenValidation.isValidating && !tokenValidation.isValid && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {tokenValidation.error}
              </div>
              <Link
                to="/login"
                className="inline-block w-full text-center bg-[#004785] text-white text-xs lg:text-sm xl:text-base py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] transition-colors duration-200"
              >
                Return to Login
              </Link>
            </div>
          )}

          {/* Reset Password Form - Only show if token is valid */}
          {!tokenValidation.isValidating && tokenValidation.isValid && (
            <>
              {/* Password Requirements Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• At least 12 characters long</li>
                  <li>• Contains at least 1 uppercase letter</li>
                  <li>• Contains at least 1 lowercase letter</li>
                  <li>• Contains at least 1 number</li>
                  <li>• Contains at least 1 special character (@$!%*?&)</li>
                </ul>
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.general}
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 rounded-xl text-xs lg:text-base border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
                        errors.newPassword
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="Enter your new password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('newPassword')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      disabled={isSubmitting}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 rounded-xl text-xs lg:text-base border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
                        errors.confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="Confirm your new password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-base py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="text-center mt-6">
                <p className="text-xs lg:text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                  >
                    Back to Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;