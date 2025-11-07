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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [currentPage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await messagingAPI.getInbox({
        page: currentPage,
        limit: itemsPerPage,
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        setTotalCount(data.data.pagination.totalCount);
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
    if (!isRead) {
      try {
        const response = await messagingAPI.markAsRead([messageId]);
        const data = await response.json();

        if (data.success) {
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && messages.length === 0) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Messages
          </h1>
          <p className="text-gray-600 text-sm">
            Manage client communications and inquiries
          </p>
        </div>

        {/* Messages Tab - Fixed height */}
        <div className="flex-shrink-0 border-b border-gray-200 mb-4">
          <div className="flex">
            <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              Messages
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Messages Table Container - Flexible height with fixed table */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
          {/* Table wrapper - Fixed height, no vertical scroll */}
          <div className="flex-1 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 h-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-black whitespace-nowrap">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-black whitespace-nowrap">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-black whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-black whitespace-nowrap">
                    Replies
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <tr
                      key={message.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        !message.isRead ? "bg-blue-50" : ""
                      }`}
                      onClick={() =>
                        handleMessageClick(message.id, message.isRead)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p
                          className={`text-sm ${
                            !message.isRead
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {message.sender}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 truncate max-w-md">
                          {message.subject}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {message.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {message.hasReplies ? (
                          <p className="text-xs text-blue-600">
                            {message.replyCount}{" "}
                            {message.replyCount === 1 ? "reply" : "replies"}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">No replies</p>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No messages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Fixed at bottom, matching ServiceTracker exactly */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-1 border rounded-md font-medium transition-colors duration-300 cursor-pointer ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed border-gray-400"
                    : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
                }`}
              >
                <LucideArrowLeft className="w-4 mr-2" />
                Previous
              </button>

              {/* Page Numbers - Centered */}
              <div className="flex items-center space-x-3">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm font-base rounded-md transition-colors duration-300 cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-gray-200 text-gray-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Ellipsis if needed */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 py-2 text-base text-gray-400">
                      ...
                    </span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors duration-300"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-1 border rounded-lg font-medium transition-colors duration-300 cursor-pointer ${
                  currentPage === totalPages
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