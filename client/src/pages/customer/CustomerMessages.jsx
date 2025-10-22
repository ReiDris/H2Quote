import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import { messagingAPI } from '../../config/api';  

const CustomerMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    // Check for success message from navigation state
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
  }, [location]);

  useEffect(() => {
    fetchMessages();
  }, [pagination.page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messagingAPI.getInbox({
        page: pagination.page,
        limit: pagination.limit
      });
      
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        setPagination(prev => ({
          ...prev,
          ...data.data.pagination
        }));
      } else {
        setError(data.message || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
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
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          ));
        }
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }

    navigate(`/customer/messages/${messageId}`);
  };

  const handleCheckboxChange = (messageId) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  if (loading && messages.length === 0) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            My Messages
          </h1>
          <p className="text-gray-600 text-sm">
            Click any message to view the full conversation and reply
          </p>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-green-700 text-sm mt-1">
                  You'll receive a response via email and in this Messages tab.
                </p>
              </div>
            </div>
          </div>
        )}

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
                    {message.hasReplies && (
                      <p className="mt-1 text-xs text-blue-600">
                        {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerMessages;