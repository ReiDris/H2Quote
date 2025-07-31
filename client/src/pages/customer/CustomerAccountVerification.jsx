import React, { useState } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

const CustomerAccountVerification = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload').click();
  };

  const handleBack = () => {
    window.location.href = '/customer/account-settings';
  };

  const handleSubmit = () => {
    // Placeholder function - will be implemented later
    console.log("Verification submitted", uploadedFiles);
  };

  return (
    <CustomerLayout>
      <div>
        <div className="bg-[#F5F7F9] rounded-lg shadow-sm border border-gray-300 p-8">
          <h1 className="text-2xl font-semibold text-[#004785] mb-8 border-b border-gray-300 pb-2">
            Account Verification
          </h1>

          {/* Not Verified Status */}
          <div className="bg-gray-300 border border-gray-300 p-4 mb-8 flex items-center">
            <AlertTriangle className="text-gray-600 mr-3" size={20} />
            <div>
              <h3 className="font-semibold text-gray-800">Not Verified</h3>
              <p className="text-gray-600 text-sm">
                Your account is not yet verified. Please submit verification documents to proceed.
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dotted border-gray-700 p-12 mb-8 text-center">
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Upload File</h3>
            <p className="text-gray-600 text-sm mb-6">
              Upload a valid ID, company ID, and certificate of employment.<br />
              Make sure each document is clear, unaltered, and up to date.
            </p>
            
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={handleUploadClick}
              className="px-6 py-2 border border-[#004785] text-[#004785] rounded-md hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
            >
              Upload File
            </button>
          </div>

          {/* Submit Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Submit for Verification</h3>
            <p className="text-gray-600 text-sm mb-6">
              Please review your files before submitting
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerAccountVerification;