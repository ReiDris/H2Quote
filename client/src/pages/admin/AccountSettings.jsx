import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import CustomerLayout from "../../layouts/CustomerLayout";
import { useAuth } from "../../hooks/useAuth";

const AccountSettings = () => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "johndoe@gmail.com",
    contactNo: "09123456789",
    password: "************",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = () => {
    // Placeholder function - will be implemented later
    console.log("Save changes clicked", formData);
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  placeholder="Enter your name"
                />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  placeholder="Enter your email"
                />
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSaveChanges}
                className="px-20 py-3 bg-[#004785] text-white rounded-lg font-medium hover:bg-[#003366] transition-colors duration-200 cursor-pointer"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
};

export default AccountSettings;