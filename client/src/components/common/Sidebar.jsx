import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ScrollText,
  Inbox,
  Users,
  MessageCircle,
  History,
  UserCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = ({ userRole }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate("/login");
    setShowLogoutModal(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        to: `/${userRole}/service-tracker`,
        icon: ScrollText,
        label: "Service Tracker",
        roles: ["admin", "staff"],
      },
      {
        to: `/${userRole}/verify-accounts`,
        icon: Inbox,
        label: "Verify Accounts",
        roles: ["admin"],
      },
      {
        to: `/${userRole}/client-profiles`,
        icon: Users,
        label: "Client Profiles",
        roles: ["admin", "staff"],
      },
      {
        to: `/${userRole}/messages`,
        icon: MessageCircle,
        label: "Messages",
        roles: ["admin", "staff", "customer"],
      },
      {
        to: `/${userRole}/activity-log`,
        icon: History,
        label: "Activity Log",
        roles: ["admin"],
      },
      {
        to: `/${userRole}/user-management`,
        icon: UserCheck,
        label: "User Management",
        roles: ["admin"],
      },
      {
        to: `/${userRole}/account-settings`,
        icon: Settings,
        label: "Account Settings",
        roles: ["admin", "staff", "customer"],
      },
    ];

    // Customer-specific items
    const customerItems = [
      {
        to: "/customer/dashboard",
        icon: ScrollText,
        label: "Dashboard",
        roles: ["customer"],
      },
      {
        to: "/customer/services",
        icon: Inbox,
        label: "Services",
        roles: ["customer"],
      },
      {
        to: "/customer/requests",
        icon: Users,
        label: "My Requests",
        roles: ["customer"],
      },
    ];

    const items = userRole === "customer" ? customerItems : baseItems;
    return items.filter((item) => item.roles.includes(userRole));
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className="bg-[#004785] text-white w-16 lg:w-20 xl:w-50 2xl:w-60 min-h-screen flex flex-col fixed left-0 top-16 z-40">
        {/* Navigation */}
        <div className="flex-1 py-6 mt-2">
          <nav className="space-y-4 px-2 lg:px-3 xl:px-5 text-xs xl:text-sm">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={index}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-center xl:justify-start gap-3 px-2 py-2 transition-colors duration-200 ${
                      isActive
                        ? "text-white border-b-2 border-amber-300"
                        : "text-white hover:border-b-2 border-amber-300"
                    }`
                  }
                >
                  <IconComponent size={20} />

                  {/* Label - only visible on xl screens and up */}
                  <span className="hidden xl:block font-normal">
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state - only show when sidebar is collapsed */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 xl:hidden transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </NavLink>
              );
            })}

            <button
              onClick={handleLogoutClick}
              className="group relative flex items-center justify-center xl:justify-start gap-3 px-2 py-2 transition-colors duration-200 hover:border-b-2 border-red-600 w-full cursor-pointer"
            >
              <LogOut size={20} />

              {/* Label - only visible on xl screens and up */}
              <span className="hidden xl:block font-medium">Log Out</span>

              {/* Tooltip for collapsed state - only show when sidebar is collapsed */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 xl:hidden transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Log Out
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            {/* Modal */}
            <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
              <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
                Log Out
              </h2>
              <p className="text-black mb-6 text-sm">
                Are you sure you want to log out?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;