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
  const itemsPerPage = 10;

  // Fetch service requests from API
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
        console.log("Fetched service requests:", data.data.requests);
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
        setCurrentPage(1); // This will trigger the above useEffect
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
    // Remove # from request number if present
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

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format items summary with debugging
  const formatItemsSummary = (item) => {
    const servicesCount = item.services_count || 0;
    const chemicalsCount = item.chemicals_count || 0;
    const refrigerantsCount = item.refrigerants_count || 0;
    const totalItems = servicesCount + chemicalsCount + refrigerantsCount;

    // Debug logging
    console.log(`Request ${item.request_number}:`, {
      services: servicesCount,
      chemicals: chemicalsCount,
      refrigerants: refrigerantsCount,
      total: totalItems,
      summary: item.items_summary,
    });

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

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Choose layout based on user role
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
      <div className="space-y-6">
        {/* Search and Filter Section */}
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Request ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Requested At
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Company
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Items Requested
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Estimated Cost
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Assigned Staff
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Service Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Payment Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Warranty Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    More Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceRequests.length > 0 ? (
                  serviceRequests.map((item, index) => (
                    <tr key={item.request_id} className="hover:bg-gray-50">
                      <td className="px-3 py-6 whitespace-nowrap text-xs xl:text-sm font-medium text-gray-800">
                        {item.request_number}
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.customer_name}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.company_name}
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                        {formatItemsSummary(item)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        ₱
                        {parseFloat(item.estimated_cost || 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.assigned_staff_name || "-"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {getStatusBadge(item.service_status, "serviceStatus")}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {getStatusBadge(item.payment_status, "paymentStatus")}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {getStatusBadge(item.warranty_status, "warrantyStatus")}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
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
                        : "No service requests found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
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
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages} ({totalCount} total)
                </span>
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
