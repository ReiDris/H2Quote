import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../layouts/AdminLayout";
import StaffLayout from "../layouts/StaffLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import { messagingAPI } from '../config/api';

const MessageDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messageId } = useParams();
  const [replyMessage, setReplyMessage] = useState("");
  const [messageData, setMessageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessageDetails();
  }, [messageId]);

  const fetchMessageDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messagingAPI.getMessageDetails(messageId);
      const data = await response.json();

      if (data.success) {
        setMessageData(data.data);
      } else {
        setError(data.message || 'Failed to load message');
      }
    } catch (err) {
      console.error('Error fetching message details:', err);
      setError('Failed to load message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const userRole = user?.role || 'admin';
    navigate(`/${userRole}/messages`);
  };

  const handleSendReply = async () => {
    if (replyMessage.trim()) {
      try {
        setSending(true);
        
        const response = await messagingAPI.reply(messageId, replyMessage.trim());
        const data = await response.json();

        if (data.success) {
          // Refresh message details to show new reply
          await fetchMessageDetails();
          setReplyMessage("");
        } else {
          setError(data.message || 'Failed to send reply');
        }
      } catch (err) {
        console.error('Error sending reply:', err);
        setError('Failed to send reply. Please try again.');
      } finally {
        setSending(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const LayoutComponent = getLayout();

  if (loading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading message...</div>
        </div>
      </LayoutComponent>
    );
  }

  if (error && !messageData) {
    return (
      <LayoutComponent>
        <div className="space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Message Content */}
        {messageData && (
          <>
            {/* Original Message */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Sender Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {getInitials(messageData.message.sender)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{messageData.message.sender}</h3>
                  <p className="text-sm text-gray-600">{formatDate(messageData.message.sentAt)}</p>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{messageData.message.subject}</h2>
              </div>

              {/* Message Text */}
              <div className="mb-6">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {messageData.message.content}
                </p>
              </div>
            </div>

            {/* Replies */}
            {messageData.replies && messageData.replies.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Replies</h3>
                {messageData.replies.map((reply) => (
                  <div key={reply.id} className="bg-white rounded-lg border border-gray-200 p-6 ml-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {getInitials(reply.sender)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{reply.sender}</h4>
                        <p className="text-sm text-gray-600">{formatDate(reply.sentAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply</h3>
              <div className="relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your reply here..."
                  rows={4}
                  disabled={sending}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || sending}
                  className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
              {sending && (
                <p className="mt-2 text-sm text-gray-500">Sending reply...</p>
              )}
            </div>
          </>
        )}
      </div>
    </LayoutComponent>
  );
};

export default MessageDetail;