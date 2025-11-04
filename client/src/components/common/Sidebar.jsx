import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  ScrollText,
  Inbox,
  Users,
  MessageCircle,
  History,
  UserCheck,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  Package,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = ({ userRole }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isHomeExpanded, setIsHomeExpanded] = useState(false);

  // Use the user role from auth context instead of props for reliability
  const actualUserRole = user?.role || userRole;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    // Notify Vincent to clear data BEFORE navigation
    window.dispatchEvent(new Event("user-logout"));

    logout();
    navigate("/login");
    setShowLogoutModal(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const toggleHomeExpanded = () => {
    setIsHomeExpanded(!isHomeExpanded);
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    // Admin and Staff items (staff will have fewer items)
    const adminStaffItems = [
      {
        to: `/${actualUserRole}/service-tracker`,
        icon: ScrollText,
        label: "Service Tracker",
        roles: ["admin", "staff"],
      },
      {
        to: `/${actualUserRole}/verify-accounts`,
        icon: Inbox,
        label: "Verify Accounts",
        roles: ["admin"], // Only admin can see this
      },
      {
        to: `/${actualUserRole}/client-profiles`,
        icon: Users,
        label: "Client Profiles",
        roles: ["admin", "staff"],
      },
      {
        to: `/${actualUserRole}/messages`,
        icon: MessageCircle,
        label: "Messages",
        roles: ["admin", "staff"],
      },
      {
        to: `/${actualUserRole}/activity-log`,
        icon: History,
        label: "Activity Log",
        roles: ["admin", "staff"],
      },
      {
        to: `/${actualUserRole}/user-management`,
        icon: UserCheck,
        label: "User Management",
        roles: ["admin"], // Only admin can see this
      },
      {
        to: `/${actualUserRole}/account-settings`,
        icon: Settings,
        label: "Account Settings",
        roles: ["admin", "staff"],
      },
    ];

    // Customer-specific items
    const customerItems = [
      {
        to: "/customer/service-tracker",
        icon: ScrollText,
        label: "Service Tracker",
        roles: ["customer"],
      },
      {
        to: "/customer/messages",
        icon: MessageCircle,
        label: "Messages",
        roles: ["customer"],
      },
      {
        to: "/customer/account-settings",
        icon: Settings,
        label: "Account Settings",
        roles: ["customer"],
      },
    ];

    const items =
      actualUserRole === "customer" ? customerItems : adminStaffItems;
    return items.filter((item) => item.roles.includes(actualUserRole));
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className="bg-[#004785] text-white w-16 lg:w-20 xl:w-50 2xl:w-60 min-h-screen flex flex-col fixed left-0 top-16 z-40">
        {/* Navigation */}
        <div className="flex-1 py-6 mt-2">
          <nav className="space-y-4 px-2 lg:px-3 xl:px-5 text-xs xl:text-sm">
            {/* Home Section - Only for customers */}
            {actualUserRole === "customer" && (
              <div>
                <div
                  onClick={toggleHomeExpanded}
                  className="group relative flex items-center justify-center xl:justify-start gap-3 px-2 py-2 transition-colors duration-200 text-white border-b border-[#004785] hover:border-b-2 hover:border-amber-300 cursor-pointer"
                >
                  <Home size={20} />
                  <span className="hidden xl:block font-normal">Home</span>
                  <div className="hidden xl:block ml-auto">
                    {isHomeExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>

                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 xl:hidden transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Home
                  </div>
                </div>

                {/* Home Submenu */}
                {isHomeExpanded && (
                  <div className="ml-4 xl:ml-8 space-y-2 mt-2">
                    <NavLink
                      to="/customer/company-overview"
                      className={({ isActive }) =>
                        `group relative flex items-center justify-center xl:justify-start gap-3 px-2 py-2 transition-colors duration-200 ${
                          isActive
                            ? "text-white border-b-2 border-amber-300"
                            : "text-white border-b-2 border-[#004785] hover:border-b-2 hover:border-amber-300"
                        }`
                      }
                    >
                      <Building2 size={16} />
                      <span className="hidden xl:block font-normal text-xs">
                        Company Overview
                      </span>

                      {/* Tooltip for collapsed state */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 xl:hidden transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Company Overview
                      </div>
                    </NavLink>

                    <NavLink
                      to="/customer/services"
                      className={({ isActive }) =>
                        `group relative flex items-center justify-center xl:justify-start gap-3 px-2 py-2 transition-colors duration-200 ${
                          isActive
                            ? "text-white border-b-2 border-amber-300"
                            : "text-white border-b-2 border-[#004785] hover:border-b-2 hover:border-amber-300"
                        }`
                      }
                    >
                      <Package size={16} />
                      <span className="hidden xl:block font-normal text-xs">
                        Product List
                      </span>

                      {/* Tooltip for collapsed state */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 xl:hidden transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Services
                      </div>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Regular Navigation Items */}
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
                        : "text-white border-b-2 border-[#004785] hover:border-b-2 hover:border-amber-300"
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
