import React, { useState } from "react";
import { Eye, EyeOff, Info } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

const CustomerAccountSettings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@company.com",
    contactNo: "09123456789",
    company: "Company ABC",
    password: "************",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    // Placeholder function - will be implemented later
    console.log("Save changes clicked", formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleVerifyNowClick = () => {
    setShowVerificationModal(true);
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
  };

  const handleProceedToVerification = () => {
    setShowVerificationModal(false);
    // Navigate to verification page
    window.location.href = '/customer/account-verification';
  };

  return (
    <CustomerLayout>
      <div>
        <div className="bg-[#F5F7F9] rounded-lg shadow-sm border border-gray-300 p-8">
          <h1 className="text-2xl font-semibold text-[#004785] mb-8 border-b border-gray-300 pb-2">
            Account Details
          </h1>

          <div className="space-y-8">
            {/* Name Row */}
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NAME
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    placeholder="Enter your name"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyNowClick}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0260A0] hover:text-blue-800 text-sm font-medium flex items-center underline cursor-pointer"
                  >
                    <Info size={16} className="mr-1" />
                    Verify Now
                  </button>
                </div>
              </div>
            </div>

            {/* Company and Company Number Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  COMPANY
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  placeholder="Enter your company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  COMPANY NUMBER
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
            </div>

            {/* Email Address and Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
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
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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

        {/* Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-5 w-150 mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-300">
                Account Verification Needed Before Requesting a Service
              </h2>
              
              <div className="text-gray-900 text-sm space-y-4 mb-6">
                <p>
                  To ensure the security and legitimacy of all transactions, TRISHKAYE Enterprises 
                  requires users to verify their accounts before requesting any services.
                </p>
                
                <p>
                  You'll be redirected to a separate page where you'll need to upload the following:
                </p>
                
                <ul className="list-disc ml-6 space-y-1">
                  <li>A valid government-issued ID</li>
                  <li>Your company ID</li>
                  <li>Certificate of employment</li>
                </ul>
                
                <p>
                  This step helps us ensure the security and authenticity of all service requests. 
                  It's a simple process that only takes a few minutes.
                </p>
                
                <p>Thank you for your cooperation!</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleProceedToVerification}
                  className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
                >
                  Proceed to Verification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerAccountSettings;