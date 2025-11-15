import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ListFilter,
  LucideArrowLeft,
  LucideArrowRight,
  X,
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    itemType: "",
    priceMin: "",
    priceMax: "",
    serviceStatus: "",
    paymentStatus: "",
    warrantyStatus: "",
  });
  const [pendingSearch, setPendingSearch] = useState("");

  const userRole = user?.role || "admin";
  const userType = user?.userType || "admin";
  const itemsPerPage = 10;

  const fetchServiceRequests = async (
    page = 1,
    search = "",
    appliedFilters = {}
  ) => {
    try {
      setLoading(true);

      const queryParams = {
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(appliedFilters.dateFrom && { dateFrom: appliedFilters.dateFrom }),
        ...(appliedFilters.dateTo && { dateTo: appliedFilters.dateTo }),
        ...(appliedFilters.itemType && { itemType: appliedFilters.itemType }),
        ...(appliedFilters.priceMin && { priceMin: appliedFilters.priceMin }),
        ...(appliedFilters.priceMax && { priceMax: appliedFilters.priceMax }),
        ...(appliedFilters.serviceStatus && {
          serviceStatus: appliedFilters.serviceStatus,
        }),
        ...(appliedFilters.paymentStatus && {
          paymentStatus: appliedFilters.paymentStatus,
        }),
        ...(appliedFilters.warrantyStatus && {
          warrantyStatus: appliedFilters.warrantyStatus,
        }),
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
      console.error("❌ Error fetching service requests:", error);
      setError("Failed to fetch service requests");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchServiceRequests(currentPage, searchTerm, filters);
  }, [currentPage]);

  useEffect(() => {}, []);

  const handleSearchSubmit = () => {
    if (currentPage === 1) {
      fetchServiceRequests(1, pendingSearch, filters);
    } else {
      setCurrentPage(1);
    }
    setSearchTerm(pendingSearch);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

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

  const handleApplyFilters = () => {
    if (currentPage === 1) {
      fetchServiceRequests(1, searchTerm, filters);
    } else {
      setCurrentPage(1);
    }
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: "",
      dateTo: "",
      itemType: "",
      priceMin: "",
      priceMax: "",
      serviceStatus: "",
      paymentStatus: "",
      warrantyStatus: "",
    };
    setFilters(clearedFilters);
    if (currentPage === 1) {
      fetchServiceRequests(1, searchTerm, clearedFilters);
    } else {
      setCurrentPage(1);
    }
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length;
  };

  const handleClearAll = () => {
    // Clear search
    setPendingSearch("");
    setSearchTerm("");

    // Clear filters
    const clearedFilters = {
      dateFrom: "",
      dateTo: "",
      itemType: "",
      priceMin: "",
      priceMax: "",
      serviceStatus: "",
      paymentStatus: "",
      warrantyStatus: "",
    };
    setFilters(clearedFilters);

    // Fetch fresh data
    if (currentPage === 1) {
      fetchServiceRequests(1, "", clearedFilters);
    } else {
      setCurrentPage(1);
    }
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
          <div className="flex items-center gap-3">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by customer name or request ID..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              <button
                onClick={handleSearchSubmit}
                className="px-8 py-2 bg-[#004785] text-white rounded-md hover:bg-[#003666] transition-colors font-medium cursor-pointer"
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-5 py-2 border border-gray-400 rounded-md hover:bg-gray-200 transition-colors font-medium cursor-pointer"
              >
                <ListFilter size={20} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-6 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition-colors font-medium cursor-pointer"
                title="Clear search and all filters"
              >
                Clear All
              </button>
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

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-4xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-10">
            <div className="flex items-center justify-between border-b border-gray-300 pb-3">
              <h2 className="text-2xl font-semibold text-[#3C61A8]">
                Filter Service Requests
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-5 pr-4 mr-2">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Requested Date Range
                </label>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Item Type Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Items Requested
                </label>
                <select
                  value={filters.itemType}
                  onChange={(e) =>
                    setFilters({ ...filters, itemType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="service">Services Only</option>
                  <option value="chemical">Chemicals Only</option>
                  <option value="refrigerant">Refrigerants Only</option>
                  <option value="mixed">Mixed Items</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Estimated Cost Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Min (₱)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={filters.priceMin}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMin: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Max (₱)
                    </label>
                    <input
                      type="number"
                      placeholder="999999.99"
                      step="0.01"
                      min="0"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMax: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Service Status Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Service Status
                </label>
                <select
                  value={filters.serviceStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, serviceStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Processing">Processing</option>
                  <option value="Waiting for Approval">
                    Waiting for Approval
                  </option>
                  <option value="Approved">Approved</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, paymentStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Warranty Status Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Warranty Status
                </label>
                <select
                  value={filters.warrantyStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, warrantyStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Valid">Valid</option>
                  <option value="Expired">Expired</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-4 mt-4">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-12 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-10 py-2 bg-[#004785] text-white rounded-md hover:bg-[#003666] font-medium transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ServiceTracker;
