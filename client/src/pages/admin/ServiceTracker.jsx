import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ListFilter,
  LucideArrowLeft,
  LucideArrowRight,
} from "lucide-react";
import { CgMaximizeAlt } from "react-icons/cg";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import { useAuth } from "../../hooks/useAuth";
import { serviceRequestsAPI } from "../../config/api";
import { formatDateTime } from "../../utils/dateUtils";

const ServiceTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = user?.role || "admin";
  const userType = user?.userType || "admin";
  const itemsPerPage = 10;

  const fetchServiceRequests = async (page = 1, search = "") => {
    try {
      setLoading(true);

      const queryParams = {
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
      };

      const response = await serviceRequestsAPI.getAll(queryParams);

      if (!response.ok) {
        throw new Error("Failed to fetch service requests");
      }

      const data = await response.json();

      if (data.success) {
        setServiceRequests(data.data.requests);
        setTotalCount(data.data.pagination.totalCount);
      } else {
        setError(data.message || "Failed to fetch service requests");
      }
    } catch (error) {
      console.error("Error fetching service requests:", error);
      setError("Failed to fetch service requests");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchServiceRequests(currentPage, searchTerm);
  }, [currentPage]);

  // Search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        fetchServiceRequests(1, searchTerm);
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleMoreActions = (requestNumber) => {
    const basePath =
      userRole === "admin"
        ? "/admin"
        : userRole === "staff"
        ? "/staff"
        : "/admin";
    const cleanRequestNumber = requestNumber.replace("#", "");
    navigate(`${basePath}/service-request/${cleanRequestNumber}`);
  };

  const getStatusBadge = (status, type) => {
    const statusStyles = {
      serviceStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Assigned: "bg-orange-100 text-orange-700",
        Processing: "bg-yellow-100 text-yellow-700",
        Approval: "bg-purple-100 text-purple-700",
        "Waiting for Approval": "bg-purple-100 text-purple-700",
        Ongoing: "bg-blue-100 text-blue-700",
        Completed: "bg-green-100 text-green-700",
        Cancelled: "bg-red-100 text-red-700",
        Approved: "bg-teal-100 text-teal-700",
        "Quote Prepared": "bg-indigo-100 text-indigo-700",
      },
      paymentStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Partial: "bg-blue-100 text-blue-800",
        Paid: "bg-green-100 text-green-800",
        Overdue: "bg-red-100 text-red-800",
        "N/A": "bg-gray-100 text-gray-500",
      },
      warrantyStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Valid: "bg-green-100 text-green-800",
        Expired: "bg-red-100 text-red-800",
        "N/A": "bg-gray-100 text-gray-500",
      },
    };

    const style = statusStyles[type][status] || "bg-gray-100 text-gray-800";

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${style}`}>
        {status}
      </span>
    );
  };

  const formatItemsSummary = (item) => {
    const servicesCount = item.services_count || 0;
    const chemicalsCount = item.chemicals_count || 0;
    const refrigerantsCount = item.refrigerants_count || 0;
    const totalItems = servicesCount + chemicalsCount + refrigerantsCount;

    if (totalItems === 0) {
      return "No items found";
    }

    const itemCounts = [];
    if (servicesCount > 0)
      itemCounts.push(
        `${servicesCount} Service${servicesCount > 1 ? "s" : ""}`
      );
    if (chemicalsCount > 0)
      itemCounts.push(
        `${chemicalsCount} Chemical${chemicalsCount > 1 ? "s" : ""}`
      );
    if (refrigerantsCount > 0)
      itemCounts.push(
        `${refrigerantsCount} Refrigerant${refrigerantsCount > 1 ? "s" : ""}`
      );

    return `${totalItems} Item${totalItems > 1 ? "s" : ""}: ${itemCounts.join(
      ", "
    )}`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const Layout = userRole === "admin" ? AdminLayout : StaffLayout;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Search and Filter Section - Fixed height */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by customer name or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Table Section - Takes remaining space */}
        <div className="flex-1 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-24">
                    Request ID
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-32">
                    Requested At
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Customer
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-32">
                    Company
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-40">
                    Items Requested
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Estimated Cost
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Assigned Staff
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Service Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Payment Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Warranty Status
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-black whitespace-nowrap w-20">
                    More Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceRequests.length > 0 ? (
                  serviceRequests.map((item, index) => (
                    <tr key={item.request_id} className="hover:bg-gray-50">
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {item.request_number}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-800 whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[7rem]"
                        title={item.customer_name}
                      >
                        {item.customer_name}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[8rem]"
                        title={item.company_name}
                      >
                        {item.company_name}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[10rem]"
                        title={formatItemsSummary(item)}
                      >
                        {formatItemsSummary(item)}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-800">
                        ₱
                        {parseFloat(item.estimated_cost || 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[7rem]"
                        title={item.assigned_staff_name || "-"}
                      >
                        {item.assigned_staff_name || "-"}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        {getStatusBadge(item.service_status, "serviceStatus")}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        {getStatusBadge(item.payment_status, "paymentStatus")}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        {getStatusBadge(item.warranty_status, "warrantyStatus")}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleMoreActions(item.request_number)}
                          className="text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <CgMaximizeAlt size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No service requests found matching your search."
                        : userType === "staff" || userRole === "staff"
                        ? "No service requests assigned to you yet."
                        : "No service requests found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Fixed at bottom */}
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
                {(() => {
                  const pages = [];
                  const showEllipsisStart = currentPage > 3;
                  const showEllipsisEnd = currentPage < totalPages - 2;

                  // Always show first page
                  pages.push(
                    <button
                      key={1}
                      onClick={() => setCurrentPage(1)}
                      className={`px-3 py-1 text-sm font-base rounded-md transition-colors duration-300 cursor-pointer ${
                        currentPage === 1
                          ? "bg-gray-200 text-gray-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      1
                    </button>
                  );

                  // Show ellipsis after first page if needed
                  if (showEllipsisStart) {
                    pages.push(
                      <span
                        key="ellipsis-start"
                        className="px-2 py-2 text-base text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  // Show pages around current page
                  const startPage = Math.max(2, currentPage - 1);
                  const endPage = Math.min(totalPages - 1, currentPage + 1);

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 text-sm font-base rounded-md transition-colors duration-300 cursor-pointer ${
                          currentPage === i
                            ? "bg-gray-200 text-gray-600"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Show ellipsis before last page if needed
                  if (showEllipsisEnd) {
                    pages.push(
                      <span
                        key="ellipsis-end"
                        className="px-2 py-2 text-base text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  // Always show last page if there's more than 1 page
                  if (totalPages > 1) {
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-3 py-1 text-sm font-base rounded-md transition-colors duration-300 cursor-pointer ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-600"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
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
    </Layout>
  );
};

export default ServiceTracker;
