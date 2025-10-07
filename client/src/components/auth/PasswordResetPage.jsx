import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import API_URL from '../../config/api';

const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setError("Invalid reset link. Please request a new password reset.");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/validate-reset-token?token=${encodeURIComponent(
            token
          )}&email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        if (data.success) {
          setTokenValid(true);
        } else {
          setError(data.message || "Invalid or expired reset token");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setError("Network error. Please try again.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setError(
        "Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            email,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Password reset successfully! You can now log in with your new password.",
              email: email,
            },
          });
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 12,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004785] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-xs lg:text-sm">
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-gray-50 rounded-4xl p-10 text-center m-10">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-4">
            Invalid Reset Link
          </h2>
          <p className="text-xs lg:text-sm text-gray-600 mb-8">{error}</p>
          <Link
            to="/login"
            className="inline-block w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-md font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] transition-colors duration-200 cursor-pointer"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-gray-50 rounded-4xl p-10 text-center m-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-4">
            Password Reset Successful!
          </h2>
          <p className="text-xs lg:text-sm text-gray-600 mb-8">
            Your password has been reset successfully. You will be redirected to
            the login page shortly.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-md font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] transition-colors duration-200 cursor-pointer"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-gray-50 rounded-4xl p-10 m-10">
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src="/images/logos/TRISHKAYE LOGO SVG.svg"
              alt="TRISHKAYE Logo"
              className="w-32 lg:w-40 xl:w-48 mx-auto mb-6 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785] mb-2">
            Reset Your Password
          </h2>
          <p className="text-xs lg:text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 rounded-xl text-xs lg:text-base border-2 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200"
                placeholder="Enter your new password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-3">
                <div className="flex space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded ${
                        passwordStrength.strength >= level
                          ? passwordStrength.strength <= 2
                            ? "bg-red-500"
                            : passwordStrength.strength <= 4
                            ? "bg-yellow-500"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs space-y-1">
                  {Object.entries(passwordStrength.checks).map(
                    ([key, passed]) => (
                      <div
                        key={key}
                        className={`flex items-center ${
                          passed ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <span className="mr-1 text-xs">
                          {passed ? "✓" : "○"}
                        </span>
                        <span className="text-xs">
                          {key === "length" && "At least 12 characters"}
                          {key === "lowercase" && "One lowercase letter"}
                          {key === "uppercase" && "One uppercase letter"}
                          {key === "numbers" && "One number"}
                          {key === "special" &&
                            "One special character (@$!%*?&)"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs lg:text-sm xl:text-lg text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 rounded-xl text-xs lg:text-base border-2 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-black transition-colors duration-200"
                placeholder="Confirm your new password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword &&
              formData.newPassword !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  Passwords do not match
                </p>
              )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !validatePassword(formData.newPassword) ||
                formData.newPassword !== formData.confirmPassword
              }
              className="w-full bg-[#004785] text-white text-xs lg:text-sm xl:text-md font-light py-3 lg:py-3 xl:py-4 px-3 rounded-4xl hover:bg-[#0056A3] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting Password...
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
