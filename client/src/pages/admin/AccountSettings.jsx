import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import CustomerLayout from "../../layouts/CustomerLayout";
import { useAuth } from "../../hooks/useAuth";
import { accountAPI } from "../../config/api";

const AccountSettings = () => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNo: "",
    password: "",
  });

  // Fetch user account data on component mount
  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      const response = await accountAPI.getAccount();
      const data = await response.json();

      if (data.success) {
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          contactNo: data.data.contactNo || '',
          password: '************', // Always show placeholder for password
        });
      } else {
        setErrors({ general: data.message || 'Failed to load account data' });
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
      setErrors({ general: 'Failed to load account data' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.password && formData.password !== '************') {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        contactNo: formData.contactNo.trim(),
      };

      // Only include password if it's been changed
      if (formData.password && formData.password !== '************') {
        updateData.password = formData.password;
      }

      const response = await accountAPI.updateAccount(updateData);
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Account updated successfully!');
        
        // Update local storage if user data changed
        const currentUser = JSON.parse(localStorage.getItem('h2quote_user') || '{}');
        const updatedUser = {
          ...currentUser,
          name: data.data.name,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
        };
        localStorage.setItem('h2quote_user', JSON.stringify(updatedUser));

        // Reset password field to placeholder
        setFormData(prev => ({
          ...prev,
          password: '************'
        }));

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrors({ general: data.message || 'Failed to update account' });
      }
    } catch (error) {
      console.error('Error updating account:', error);
      setErrors({ general: 'Failed to update account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getLayout = () => {
    switch (user?.role) {
      case "admin":
        return AdminLayout;
      case "staff":
        return StaffLayout;
      case "customer":
        return CustomerLayout;
      default:
        return AdminLayout;
    }
  };

  const LayoutComponent = getLayout();

  return (
    <LayoutComponent>
      <div>
        <div className="bg-[#F5F7F9] rounded-lg shadow-sm border border-gray-300 p-8">
          <h1 className="text-2xl font-semibold text-[#004785] mb-8 border-b border-gray-300 pb-2">
            Account Details
          </h1>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Messages */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-8">
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your name"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Contact Number and Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CONTACT NO.
                </label>
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  placeholder="Enter your contact number"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PASSWORD
                  <span className="text-xs text-gray-500 ml-2">(Leave as asterisks to keep current password)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password or leave unchanged"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="px-20 py-3 bg-[#004785] text-white rounded-lg font-medium hover:bg-[#003366] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    SAVING...
                  </div>
                ) : (
                  'SAVE CHANGES'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
};

export default AccountSettings;