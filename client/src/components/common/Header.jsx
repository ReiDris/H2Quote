import React, { useState, useRef, useEffect } from "react";
import { Bell, ShoppingCart } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useServiceRequest } from "../../contexts/ServiceRequestContext";
import ServiceRequestModal from "../customer/ServiceRequestModal";
import { notificationsAPI } from "../../config/api";

const Header = () => {
  const { user } = useAuth();
  const { selectedServices } = useServiceRequest();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] =
    useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const notificationRef = useRef(null);

  const fetchNotifications = async (limit = 20) => {
    try {
      setLoading(true);

      const response = await notificationsAPI.getNotifications(
        activeFilter === "unread",
        limit
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
        setFilteredCount(data.data.filteredCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Clear read notifications
  const clearReadNotifications = async () => {
    try {
      const response = await notificationsAPI.clearReadNotifications();
      if (!response.ok) {
        throw new Error("Failed to clear read notifications");
      }
      await fetchNotifications();
    } catch (error) {
      console.error("Error clearing read notifications:", error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notifTime) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const handleNotificationClick = (notification) => {
    if (notification.is_unread) {
      markAsRead(notification.notification_id);
    }
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setShowAllNotifications(false);
  };

  const openServiceRequestModal = () => {
    setIsServiceRequestModalOpen(true);
  };

  const closeServiceRequestModal = () => {
    setIsServiceRequestModalOpen(false);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowAllNotifications(false);
  };

  const handleLogoClick = () => {
    window.open("/", "_blank");
  };

  const toggleShowAllNotifications = () => {
    if (!showAllNotifications) {
      fetchNotifications(1000);
    }
    setShowAllNotifications(!showAllNotifications);
  };

  // Determine which notifications to display
  const displayedNotifications = showAllNotifications
    ? notifications
    : notifications.slice(0, 4);

  // Fetch notifications on mount and filter change
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, activeFilter]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="bg-[#004785] text-white px-6 pt-3 pb-3 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center">
          <img
            src="/images/logos/TRISHKAYE LOGO SVG.svg"
            alt="TRISHKAYE Logo"
            className="h-13 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={handleLogoClick}
          />
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "customer" && (
            <button
              onClick={openServiceRequestModal}
              className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 cursor-pointer"
              title="Request Service"
            >
              <ShoppingCart size={25} />
              {selectedServices.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {selectedServices.length}
                </div>
              )}
            </button>
          )}

          <div className="flex items-center relative" ref={notificationRef}>
            <button
              onClick={toggleNotifications}
              className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <Bell size={25} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute top-full right-0 mt-2 w-[480px] max-w-[95vw] bg-[#F1F4F5] rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col">
                {/* Header Section - Fixed at top */}
                <div className="pt-4 px-4 flex-shrink-0 bg-[#F1F4F5]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#004785]">
                      Notifications
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFilterChange("all")}
                        className={`text-sm px-3 py-1 rounded-full transition-all cursor-pointer ${
                          activeFilter === "all"
                            ? "text-[#004785] bg-[#C9D6E3] font-semibold"
                            : "text-black hover:text-gray-800 font-semibold"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => handleFilterChange("unread")}
                        className={`text-sm px-3 py-1 rounded-full transition-all cursor-pointer ${
                          activeFilter === "unread"
                            ? "text-[#004785] bg-[#C9D6E3] font-semibold"
                            : "text-black hover:text-gray-800 font-semibold"
                        }`}
                      >
                        Unread
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto flex-1">
                  <div className="p-4 pb-5">
                    {/* Action Buttons - Sticky at top of scrollable area */}
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#F1F4F5] pb-2 z-10">
                      <h4 className="text-sm font-medium text-black">New</h4>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-[#004785] hover:underline cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                        {notifications.some((n) => !n.is_unread) && (
                          <button
                            onClick={clearReadNotifications}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            Clear read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                      {loading ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Loading...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        displayedNotifications.map((notification) => (
                          <div
                            key={notification.notification_id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`p-5 rounded-3xl cursor-pointer transition-colors ${
                              notification.is_unread
                                ? "bg-blue-100 hover:bg-blue-200"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h5
                                    className={`text-sm font-medium ${
                                      notification.is_unread
                                        ? "text-gray-900"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {notification.subject}
                                  </h5>
                                  {notification.is_unread && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 break-words">
                                  {notification.message_body}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getTimeAgo(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">
                            No {activeFilter === "unread" ? "unread" : ""}{" "}
                            notifications
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View All / Show Less Button */}
                    {notifications.length > 4 && (
                      <div className="mt-4 text-center border-t border-gray-200 pt-3">
                        <button
                          onClick={toggleShowAllNotifications}
                          className="text-sm text-[#004785] hover:underline font-medium cursor-pointer"
                        >
                          {showAllNotifications
                            ? "Show Less"
                            : `View All (${filteredCount})`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isServiceRequestModalOpen && (
        <ServiceRequestModal onClose={closeServiceRequestModal} />
      )}
    </>
  );
};

export default Header;
