import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

const CustomerMessages = () => {
  const navigate = useNavigate();
  const [selectedMessages, setSelectedMessages] = useState([]);

  // Mock data for customer's messages (their conversations with support)
  const messages = [
    {
      id: "REQ001",
      sender: "Juan Dela Cruz",
      subject: "Hi TRISHKAYE, I hope this message finds you well. Just to clarify, does the amount already include the installation fee and maintenance visits?",
      date: "Apr 25",
      isRead: false,
      requestId: "REQ001"
    },
    {
      id: "REQ002",
      sender: "John Doe",
      subject: "Hi TRISHKAYE, I hope this message finds you well. We're interested in your operation, maintenance, and chemical cleaning services for our facility.",
      date: "Apr 25",
      isRead: true,
      requestId: "REQ002"
    },
    {
      id: "REQ003",
      sender: "Jose Francisco",
      subject: "Hi TRISHKAYE, I hope this message finds you well. We're interested in your operation, maintenance, and chemical cleaning services for our facility.",
      date: "Apr 25",
      isRead: true,
      requestId: "REQ003"
    },
    {
      id: "REQ004",
      sender: "Jane Dalisay",
      subject: "Hi TRISHKAYE, I hope this message finds you well. We're interested in your operation, maintenance, and chemical cleaning services for our facility.",
      date: "Apr 25",
      isRead: true,
      requestId: "REQ004"
    }
  ];

  const handleMessageClick = (messageId) => {
    navigate(`/customer/messages/${messageId}`);
  };

  const handleCheckboxChange = (messageId) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleNewMessage = () => {
    // Placeholder function - will be implemented later
    console.log("New message clicked");
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Viewing Message from TRISHKAYE
          </h1>
          <p className="text-gray-600 text-sm">
            Double check the message inquiry before proceeding
          </p>
        </div>

        {/* Messages Tab */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              Messages
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                  !message.isRead ? "bg-blue-50" : ""
                }`}
                onClick={() => handleMessageClick(message.id)}
              >
                {/* Checkbox */}
                <div className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={selectedMessages.includes(message.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(message.id);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${!message.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {message.sender}
                    </p>
                    <p className="text-sm text-gray-500">{message.date}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {message.subject}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerMessages;