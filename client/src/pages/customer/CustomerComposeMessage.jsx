import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import { messagingAPI } from '../../config/api';

const CustomerComposeMessage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get request details from navigation state
  const { requestId, requestNumber } = location.state || {};
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If no request context, redirect back
    if (!requestId || !requestNumber) {
      navigate("/customer/messages");
    }
  }, [requestId, requestNumber, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both subject and message");
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await messagingAPI.createServiceRequestMessage(requestId, {
        subject: subject.trim(),
        content: message.trim()
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to messages page after successful send
        navigate("/customer/messages", {
          state: { 
            successMessage: `Message sent successfully to TRISHKAYE team regarding Request #${requestNumber}`
          }
        });
      } else {
        setError(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSend();
    }
  };

  if (!requestId || !requestNumber) {
    return null; // Will redirect in useEffect
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            New Message to TRISHKAYE
          </h1>
          <p className="text-gray-600 text-sm">
            Regarding Service Request #{requestNumber}
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-gray-700">
              <p className="font-medium text-blue-900 mb-1">
                This message will be sent to the TRISHKAYE team
              </p>
              <p>
                All admin and staff members will be notified via email about your message 
                regarding service request <strong>#{requestNumber}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Compose Form */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Recipient (Read-only) */}
          <div className="border-b border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To:
            </label>
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
              TRISHKAYE Team (All Staff & Admins)
            </div>
          </div>

          {/* Subject */}
          <div className="border-b border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E.g., Question about quotation, Request for changes..."
              disabled={sending}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {subject.length}/200 characters
            </p>
          </div>

          {/* Message Body */}
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              rows={12}
              disabled={sending}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Ctrl+Enter to send quickly
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mb-20">
          <button
            onClick={handleBack}
            disabled={sending}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!subject.trim() || !message.trim() || sending}
            className="flex items-center gap-2 px-6 py-3 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerComposeMessage;