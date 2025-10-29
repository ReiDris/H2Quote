import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LucideArrowLeft, LucideArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import CustomerLayout from "../../layouts/CustomerLayout";
import { messagingAPI } from "../../config/api";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchMessages();
  }, [pagination.page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await messagingAPI.getInbox({
        page: pagination.page,
        limit: pagination.limit,
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        setPagination((prev) => ({
          ...prev,
          ...data.data.pagination,
        }));
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (messageId, isRead) => {
    // Mark as read if unread
    if (!isRead) {
      try {
        const response = await messagingAPI.markAsRead([messageId]);
        const data = await response.json();

        if (data.success) {
          // Update local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, isRead: true } : msg
            )
          );
        }
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    }

    const userRole = user?.role || "admin";
    navigate(`/${userRole}/messages/${messageId}`);
  };

  const handleCheckboxChange = (messageId) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
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

  if (loading && messages.length === 0) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Messages
          </h1>
          <p className="text-gray-600 text-sm">
            Manage client communications and inquiries
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Messages List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No messages found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                    !message.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleMessageClick(message.id, message.isRead)}
                >
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm ${
                          !message.isRead
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {message.sender}
                      </p>
                      <p className="text-sm text-gray-500">{message.date}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 truncate">
                      {message.subject}
                    </p>
                    {message.hasReplies && (
                      <p className="mt-1 text-xs text-blue-600">
                        {message.replyCount}{" "}
                        {message.replyCount === 1 ? "reply" : "replies"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm rounded-lg">
              {/* Previous Button */}
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(prev.page - 1, 1),
                  }))
                }
                disabled={pagination.page === 1}
                className={`flex items-center px-3 py-1 border rounded-md font-medium transition-colors duration-300 cursor-pointer ${
                  pagination.page === 1
                    ? "text-gray-400 cursor-not-allowed border-gray-400"
                    : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
                }`}
              >
                <LucideArrowLeft className="w-4 mr-2" />
                Previous
              </button>

              {/* Page Numbers - Centered */}
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.totalCount} total)
                </span>
              </div>

              {/* Next Button */}
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.page + 1, pagination.totalPages),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className={`flex items-center px-3 py-1 border rounded-lg font-medium transition-colors duration-300 cursor-pointer ${
                  pagination.page === pagination.totalPages
                    ? "text-gray-400 cursor-not-allowed border-gray-400"
                    : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
                }`}
              >
                Next
                <LucideArrowRight className="w-4 ms-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </LayoutComponent>
  );
};

export default Messages;
