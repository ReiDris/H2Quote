import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import SignupForm from "../components/auth/SignupForm.jsx";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignup = async (signupData) => {
    setIsSubmitting(true);
    try {
      console.log("Signup data:", signupData);
      const response = await signup(signupData);
      // Ignore response.message and set your own custom message
      setSuccessMessage(""); // You don't even need to use response.message
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/login");
  };

  return (
    <>
      <SignupForm onSignup={handleSignup} isSubmitting={isSubmitting} />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Registration Successful
            </h2>
            <div className="text-black mb-6 text-sm space-y-3">
              <p className="font-semibold text-green-600">
                ✓ Your account has been created successfully!
              </p>
              <p>
                Your account is currently{" "}
                <span className="font-semibold text-yellow-600">
                  pending admin verification
                </span>
                .
              </p>
              <p>
                You will receive an email notification once your account has
                been approved.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignupPage;
