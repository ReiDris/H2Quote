import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { authAPI } from "../../config/api";

const LoginForm = ({ onLogin, error, defaultEmail, isSubmitting }) => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Set default email if provided
  useEffect(() => {
    if (defaultEmail) {
      setFormData((prev) => ({ ...prev, email: defaultEmail }));
    }
  }, [defaultEmail]);

  // Handle messages from password reset or other pages
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state.email) {
        setFormData((prev) => ({ ...prev, email: location.state.email }));
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
          console.error("Google Client ID is missing or not set properly!");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google Identity Services script");
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Clear local errors when parent error changes
  useEffect(() => {
    if (error) {
      setErrors({ general: error });
      setSuccessMessage("");
    } else {
      setErrors({});
    }
  }, [error]);

  const handleGoogleResponse = async (response) => {
    try {
      setIsGoogleLoading(true);
      setErrors({});
      setSuccessMessage("");

      const result = await authAPI.googleAuth({
        credential: response.credential,
      });
      const data = await result.json();

      if (data.success) {
        localStorage.setItem("h2quote_token", data.data.token);
        localStorage.setItem("h2quote_user", JSON.stringify(data.data.user));

        if (onLogin) {
          await onLogin(data.data);
        }
      } else {
        setErrors({ general: data.message || "Google login failed" });
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrors({ general: "Google login failed. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setErrors({});
    setSuccessMessage("");

    try {
      await onLogin(formData);
    } catch (error) {
      console.error("Login form error:", error);
    }
  };

  const handleGoogleLogin = () => {
    console.log("🔵 Google login button clicked");

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Debug logs
    console.log("🔑 Client ID:", clientId);
    console.log("🌍 Environment:", import.meta.env.MODE);
    console.log("📦 All env vars:", import.meta.env);

    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      console.error("❌ Google Client ID not configured");
      setErrors({
        general: "Google Client ID not configured. Please contact support.",
      });
      return;
    }

    setIsGoogleLoading(true);
    setErrors({});

    // Use the current URL's origin for redirect
    const redirectUri = `${window.location.origin}/auth/google/callback`;

    console.log("📍 Redirect URI:", redirectUri);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log("🚀 Redirecting to:", authUrl);

    // Redirect in the same window instead of popup
    window.location.href = authUrl;
  };

  const handleGoogleAuthCode = async (code) => {
    try {
      setIsGoogleLoading(true);
      setErrors({});

      const redirectUri = `${window.location.origin}/auth/google/callback`;

      const result = await authAPI.googleAuth({
        code: code,
        redirect_uri: redirectUri,
      });

      const data = await result.json();

      if (data.success) {
        localStorage.setItem("h2quote_token", data.data.token);
        localStorage.setItem("h2quote_user", JSON.stringify(data.data.user));

        if (onLogin) {
          await onLogin(data.data);
        }
      } else {
        setErrors({ general: data.message || "Google login failed" });
      }
    } catch (error) {
      console.error("Google auth error:", error);
      setErrors({ general: "Google login failed. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

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
              Log in with your details and you're all set!
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 ">
        <div className="w-full max-w m-10 lg:m-15 xl:m-30">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-2">
              Log in
            </h2>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-1 border-black rounded-4xl py-3 px-4 text-gray-700 font-medium text-sm xl:text-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 mb-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-5 bg-gray-50 text-gray-500 text-md lg:text-lg xl:text-xl">
                OR
              </span>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl text-xs lg:text-base border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-gray-50"
                }`}
                placeholder="Enter your email"
                disabled={isSubmitting || isGoogleLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2"
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
                  className={`w-full px-4 py-3 pr-12 rounded-xl text-xs lg:text-base border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200 ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="Enter your password"
                  disabled={isSubmitting || isGoogleLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  disabled={isSubmitting || isGoogleLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 cursor-pointer"
                onClick={handleForgotPassword}
                disabled={isSubmitting || isGoogleLoading}
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-md font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </div>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-xs lg:text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default LoginForm;
