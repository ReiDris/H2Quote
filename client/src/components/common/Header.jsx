import React, { useState, useRef, useEffect } from "react";
import { Bell, ShoppingCart } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import ServiceRequestModal from "../customer/ServiceRequestModal";

const Header = () => {
  const { user } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] =
    useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' or 'unread'
  const notificationRef = useRef(null);

  // Mock notification data
  const notifications = [
    {
      id: 1,
      type: "quotation",
      title: "New Quotation Request",
      message: "A client has submitted a new quotation request.",
      time: "2 minutes ago",
      isRead: false,
    },
    {
      id: 2,
      type: "approval",
      title: "Quotation Approved",
      message: "A quotation has been approved by the client.",
      time: "1 hour ago",
      isRead: false,
    },
    {
      id: 3,
      type: "payment",
      title: "Payment Received",
      message: "A client has completed their payment.",
      time: "3 hours ago",
      isRead: true,
    },
    {
      id: 4,
      type: "overdue",
      title: "Overdue Payment",
      message: "Notify the client for settlement.",
      time: "1 day ago",
      isRead: true,
    },
    {
      id: 5,
      type: "pending",
      title: "Pending Payment",
      message: "A client has not yet settled the payment.",
      time: "2 days ago",
      isRead: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter notifications based on active filter
  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => !n.isRead);

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const openServiceRequestModal = () => {
    setIsServiceRequestModalOpen(true);
  };

  const closeServiceRequestModal = () => {
    setIsServiceRequestModalOpen(false);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleLogoClick = () => {
    // Open LandingPage in a new tab
    window.open("/", "_blank");
  };

  // Close notification when clicking outside
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
        {/* Left side - Logo */}
        <div className="flex items-center">
          <img
            src="/images/logos/TRISHKAYE LOGO SVG.svg"
            alt="TRISHKAYE Logo"
            className="h-13 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={handleLogoClick}
          />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Service Request Button - Only for customers */}
          {user?.role === "customer" && (
            <button
              onClick={openServiceRequestModal}
              className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 cursor-pointer"
              title="Request Service"
            >
              <ShoppingCart size={25} />
            </button>
          )}

          {/* Notifications */}
          <div className="flex items-center relative" ref={notificationRef}>
            <button
              onClick={toggleNotifications}
              className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <Bell size={25} />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute top-full right-0 mt-5 w-120 bg-[#F1F4F5] rounded-lg shadow-lg border border-gray-200 z-50">
                {/* Header */}
                <div className="pt-4 px-4">
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

                {/* New Section */}
                <div className="p-4 border-b border-gray-200 pb-10">
                  <h4 className="text-sm font-medium text-black mb-3">New</h4>

                  {/* Notification Items */}
                  <div className="space-y-3">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-5 rounded-3xl cursor-pointer transition-colors ${
                            !notification.isRead
                              ? "bg-blue-100 hover:bg-blue-200"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h5
                                  className={`text-sm font-medium ${
                                    !notification.isRead
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h5>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Request Modal */}
      {isServiceRequestModalOpen && (
        <ServiceRequestModal onClose={closeServiceRequestModal} />
      )}
    </>
  );
};

export default Header;
