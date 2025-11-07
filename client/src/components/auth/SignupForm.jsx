import React, { useState } from "react";
import { Eye, EyeOff, Upload, ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';

const SignupForm = ({ onSignup, isSubmitting }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    customerName: "",
    email: "",
    contactNo: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.contactNo.trim()) {
      newErrors.contactNo = "Contact number is required";
    } else {
      const cleanNumber = formData.contactNo.replace(/[\s\-()]/g, '');
      const phMobilePattern = /^(09|\+639|639)\d{9}$/;
      const phLandlinePattern = /^(02|\+632|632)\d{7,8}$/;
      
      const isValidMobile = phMobilePattern.test(cleanNumber);
      const isValidLandline = phLandlinePattern.test(cleanNumber);
      
      if (!isValidMobile && !isValidLandline) {
        newErrors.contactNo = "Please enter a valid Philippine contact number (e.g., 09XXXXXXXXX or +639XXXXXXXXX)";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 12) {
      newErrors.password = "Password must be at least 12 characters";
    } else {
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasSpecial = /[@$!%*?&]/.test(formData.password);

      if (!hasUppercase) {
        newErrors.password = "Password must contain at least 1 uppercase letter";
      } else if (!hasLowercase) {
        newErrors.password = "Password must contain at least 1 lowercase letter";
      } else if (!hasNumber) {
        newErrors.password = "Password must contain at least 1 number";
      } else if (!hasSpecial) {
        newErrors.password = "Password must contain at least 1 special character";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!uploadedFile) {
      newErrors.file = "Please upload a verification document";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async (e) => {
    e.preventDefault();

    if (!validateStep1()) return;

    setCurrentStep(2);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ file: "File size must be less than 10MB" });
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ file: "Please upload a JPG, PNG, or PDF file" });
        return;
      }

      setUploadedFile(file);
      setErrors({ ...errors, file: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setErrors({});

    try {
      const signupData = {
        ...formData,
        verificationDocument: uploadedFile
      };

      await onSignup(signupData);
    } catch (error) {
      console.error("Signup form error:", error);
      setErrors({ general: error.message || "Signup failed. Please try again." });
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const renderStep1 = () => (
    <div className="w-full max-w m-6 lg:m-10 xl:m-15">
      <div className="mb-6">
        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-2">
          Create an account
        </h2>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      {/* Step 1 Form */}
      <form onSubmit={handleNextStep} className="space-y-3">
        {/* Company Name */}
        <div>
          <label
            htmlFor="companyName"
            className="block text-xs lg:text-sm xl:text-base text-gray-700 mb-1"
          >
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 rounded-lg text-xs lg:text-sm border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
              errors.companyName
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
            placeholder="Enter Company"
            disabled={isSubmitting}
          />
          {errors.companyName && (
            <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>
          )}
        </div>

        {/* Customer Name */}
        <div>
          <label
            htmlFor="customerName"
            className="block text-xs lg:text-sm xl:text-base text-gray-700 mb-1"
          >
            Customer Name
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 rounded-lg text-xs lg:text-sm border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
              errors.customerName
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
            placeholder="Enter Customer"
            disabled={isSubmitting}
          />
          {errors.customerName && (
            <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs lg:text-sm xl:text-base text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 rounded-lg text-xs lg:text-sm border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
              errors.email
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
            placeholder="Enter Email"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label
            htmlFor="contactNo"
            className="block text-xs lg:text-sm xl:text-base text-gray-700 mb-1"
          >
            Contact No.
          </label>
          <input
            type="tel"
            id="contactNo"
            name="contactNo"
            value={formData.contactNo}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 rounded-lg text-xs lg:text-sm border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
              errors.contactNo
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
            placeholder="Enter Contact No."
            disabled={isSubmitting}
          />
          {errors.contactNo && (
            <p className="mt-1 text-xs text-red-600">{errors.contactNo}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs lg:text-sm xl:text-base text-gray-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg text-xs lg:text-sm border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
                errors.password
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              placeholder="Enter Password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("password")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}

          {/* Password Requirements */}
          <div className="mt-1 text-xs text-gray-600">
            <p className="mb-1">Password must contain:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span
                className={
                  formData.password.length >= 12 ? "text-green-600" : ""
                }
              >
                • A minimum of 12 characters
              </span>
              <span
                className={
                  /[A-Z]/.test(formData.password) ? "text-green-600" : ""
                }
              >
                • At least 1 uppercase letter
              </span>
              <span
                className={
                  /[a-z]/.test(formData.password) ? "text-green-600" : ""
                }
              >
                • At least 1 lowercase letter
              </span>
              <span
                className={/\d/.test(formData.password) ? "text-green-600" : ""}
              >
                • At least 1 number
              </span>
              <span
                className={
                  /[@$!%*?&]/.test(formData.password)
                    ? "text-green-600"
                    : ""
                }
              >
                • At least 1 special character
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs lg:text-sm xl:text-base text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg text-xs lg:text-sm border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
                errors.confirmPassword
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-gray-50"
            }`}
              placeholder="Confirm Password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirmPassword")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Next Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-base font-light py-2.5 lg:py-3 xl:py-3 px-3 rounded-4xl hover:bg-[#0056A3] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer mt-4"
        >
          Next
        </button>
      </form>

      {/* Login Link */}
      <div className="text-center mt-4">
        <p className="text-xs lg:text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="w-full max-w m-10 lg:m-15 xl:m-30">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackToStep1}
            className="text-[#004785] hover:text-[#0056A3] transition-colors duration-200"
            disabled={isSubmitting}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785]">
            Account Verification
          </h2>
        </div>
        <p className="text-xs lg:text-sm text-gray-600">
          Upload documents to verify your organization or vendor account.
        </p>
      </div>

      {/* Verification Status */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">!</span>
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">Not Verified</h3>
            <p className="text-sm text-yellow-700">
              Your account is not yet verified. Please submit your
              identification document to proceed.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      {/* Upload Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-4">
            Upload File
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
            <input
              type="file"
              id="fileUpload"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isSubmitting}
            />

            {!uploadedFile ? (
              <label htmlFor="fileUpload" className="cursor-pointer block">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Upload File
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Submit an identity document to complete account creation and
                  verify your status for work documents in human, whiteboard
                  startup, or other.
                </p>
                <div className="bg-[#004785] text-white px-6 py-2 rounded-lg inline-block hover:bg-[#0056A3] transition-colors duration-200">
                  Upload File
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">{uploadedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setErrors({ ...errors, file: "" });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  disabled={isSubmitting}
                >
                  Change file
                </button>
              </div>
            )}
          </div>

          {errors.file && (
            <p className="mt-2 text-sm text-red-600">{errors.file}</p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Accepted formats: JPG, PNG, PDF (max 10MB)
          </p>
        </div>

        {/* Submit for Verification */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Submit for Verification
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please review your files before submitting.
          </p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleBackToStep1}
              disabled={isSubmitting}
              className="flex-1 border-2 border-gray-200 text-gray-700 text-xs lg:text-sm xl:text-base font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-gray-300 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !uploadedFile}
              className="flex-1 bg-[#004785] text-white text-xs lg:text-sm xl:text-base font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Section */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background*/}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/logos/login bg.jpg"
            alt="Background"
            className="w-full h-full object-cover scale-110"
            style={{ objectPosition: "35% center" }}
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
              {currentStep === 1
                ? "Log in with your details and you're all set!"
                : "Log in with your details and you're all set!"}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
}

export default SignupForm;