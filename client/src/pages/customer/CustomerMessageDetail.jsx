import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

const CustomerMessageDetail = () => {
  const navigate = useNavigate();
  const { messageId } = useParams();
  const [replyMessage, setReplyMessage] = useState("");

  // Mock data for the specific message conversation
  const messageData = {
    id: "REQ001",
    requestId: "#REQ001",
    requestedAt: "May 07, 2025 - 10:34 AM",
    services: "Service A, Chemical A, Service B",
    assignedStaff: "Staff 1",
    sender: {
      name: "Juan Dela Cruz",
      email: "juan.dela.cruz@email.com"
    },
    message: "Hi TRISHKAYE, thank you for the quotation. Just to clarify, does the amount already include the installation fee and maintenance visits?"
  };

  const handleBack = () => {
    navigate("/customer/messages");
  };

  const handleSendReply = () => {
    if (replyMessage.trim()) {
      // Placeholder function - will be implemented later
      console.log("Reply sent:", replyMessage);
      setReplyMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Service Request Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Request ID:
              </label>
              <span className="ml-2 text-sm text-gray-900">
                {messageData.requestId}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                List of Requested Services:
              </label>
              <span className="ml-2 text-sm text-gray-900">
                {messageData.services}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Requested At:
              </label>
              <span className="ml-2 text-sm text-gray-900">
                {messageData.requestedAt}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Assigned Staff:
              </label>
              <span className="ml-2 text-sm text-gray-900">
                {messageData.assignedStaff}
              </span>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Sender Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {messageData.sender.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {messageData.sender.name}
              </h3>
              <p className="text-sm text-gray-600">
                To {messageData.sender.email}
              </p>
            </div>
          </div>

          {/* Message Text */}
          <div className="mb-8">
            <p className="text-gray-800 leading-relaxed">
              {messageData.message}
            </p>
          </div>

          {/* Reply Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="relative">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Reply"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <button
                onClick={handleSendReply}
                className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerMessageDetail;
