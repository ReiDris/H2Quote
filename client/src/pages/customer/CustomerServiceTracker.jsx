import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ListFilter,
  LucideArrowLeft,
  LucideArrowRight,
} from "lucide-react";
import { CgMaximizeAlt } from "react-icons/cg";
import CustomerLayout from "../../layouts/CustomerLayout";
import { serviceRequestsAPI } from "../../config/api";
import { formatDateTime } from "../../utils/dateUtils";

const CustomerServiceTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mockData, setMockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
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
  const [pendingFilters, setPendingFilters] = useState({
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

  const itemsPerPage = 10;

  const parseServiceCategory = (
    servicesCount,
    chemicalsCount,
    refrigerantsCount
  ) => {
    const categories = [];

    if (servicesCount > 0) categories.push("Services");
    if (chemicalsCount > 0) categories.push("Chemicals");
    if (refrigerantsCount > 0) categories.push("Refrigerants");

    return categories.length > 0 ? categories.join(", ") : "-";
  };

  const parseRequestedService = (itemsSummary) => {
    if (!itemsSummary) return "-";

    const items = itemsSummary.split(", ");

    if (items.length === 0) return "-";

    const formattedItems = items.map((item) => {
      return item.replace(/\s*\((Service|Chemical|Refrigerant)\)/, "");
    });

    if (formattedItems.length > 3) {
      return `${formattedItems.slice(0, 3).join(", ")} +${
        formattedItems.length - 3
      } more`;
    }

    return formattedItems.join(", ");
  };

  const fetchCustomerRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("h2quote_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await serviceRequestsAPI.getMyRequests();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("h2quote_token");
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch service requests");
      }

      const data = await response.json();

      if (data.success) {
        const transformedData = (data.data || []).map((item) => ({
          id: item.request_number,
          requestedAt: formatDateTime(item.created_at),
          serviceCategory: parseServiceCategory(
            item.services_count || 0,
            item.chemicals_count || 0,
            item.refrigerants_count || 0
          ),
          requestedService: parseRequestedService(item.items_summary),
          assignedStaff: item.assigned_staff_name || "-",
          serviceStatus: item.service_status || "Pending",
          paymentStatus: item.payment_status || "Pending",
          warrantyStatus: item.warranty_status || "N/A",
          totalCost: formatCurrency(item.estimated_cost),
          requestId: item.request_id,
          itemsSummary: item.items_summary,
        }));

        setMockData(transformedData);
      } else {
        setError(data.message || "Failed to fetch service requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Failed to fetch service requests");
      setMockData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerRequests();
  }, []);

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) return "₱0.00";

    return `₱${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleMoreActions = (item) => {
    navigate(`/customer/service-request/${item.requestId}`);
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

  const handleSearchSubmit = () => {
    setSearchTerm(pendingSearch);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setShowFilters(false);
    setCurrentPage(1);
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
    setPendingFilters(clearedFilters);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setPendingSearch("");
    setSearchTerm("");
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
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length;
  };

  const filteredData = mockData.filter((item) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      item.requestedService.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedStaff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceCategory.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range filter
    let matchesDateFrom = true;
    let matchesDateTo = true;

    if (filters.dateFrom || filters.dateTo) {
      const dateStr = item.requestedAt;
      const itemDate = new Date(dateStr.replace(" at ", " "));

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        itemDate.setHours(0, 0, 0, 0);
        matchesDateFrom = itemDate >= fromDate;
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        itemDate.setHours(0, 0, 0, 0);
        matchesDateTo = itemDate <= toDate;
      }
    }

    // Item type filter
    let matchesItemType = true;
    if (filters.itemType) {
      const category = item.serviceCategory.toLowerCase();
      if (filters.itemType === "service") {
        matchesItemType = category === "services";
      } else if (filters.itemType === "chemical") {
        matchesItemType = category === "chemicals";
      } else if (filters.itemType === "refrigerant") {
        matchesItemType = category === "refrigerants";
      } else if (filters.itemType === "mixed") {
        matchesItemType = category.includes(",");
      }
    }

    // Price range filter
    const costValue = parseFloat(item.totalCost.replace(/[₱,]/g, ""));
    const matchesPriceMin =
      !filters.priceMin || costValue >= parseFloat(filters.priceMin);
    const matchesPriceMax =
      !filters.priceMax || costValue <= parseFloat(filters.priceMax);

    // Status filters
    const matchesServiceStatus =
      !filters.serviceStatus || item.serviceStatus === filters.serviceStatus;
    const matchesPaymentStatus =
      !filters.paymentStatus || item.paymentStatus === filters.paymentStatus;
    const matchesWarrantyStatus =
      !filters.warrantyStatus || item.warrantyStatus === filters.warrantyStatus;

    return (
      matchesSearch &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesItemType &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesServiceStatus &&
      matchesPaymentStatus &&
      matchesWarrantyStatus
    );
  });

  const totalPages = Math.ceil(filteredData.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your service requests...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden mb-15">
        {/* Search and Filter Section */}
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
                  placeholder="Search my requests..."
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

        {/* Table Section */}
        <div className="flex-1 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Request ID
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-36">
                    Requested At
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-36">
                    Service Category
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-40">
                    Requested Service
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-32">
                    Assigned Staff
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-32">
                    Service Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-32">
                    Payment Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-32">
                    Warranty Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black whitespace-nowrap w-28">
                    Total Cost
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-black whitespace-nowrap w-24">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {item.id}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-800 whitespace-nowrap">
                        {item.requestedAt}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[9rem]"
                        title={item.serviceCategory}
                      >
                        {item.serviceCategory}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[10rem]"
                        title={item.requestedService}
                      >
                        {item.requestedService}
                      </td>
                      <td
                        className="px-2 py-4 text-sm text-gray-800 truncate max-w-[8rem]"
                        title={item.assignedStaff || "-"}
                      >
                        {item.assignedStaff || "-"}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        {getStatusBadge(item.serviceStatus, "serviceStatus")}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        {getStatusBadge(item.paymentStatus, "paymentStatus")}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        {getStatusBadge(item.warrantyStatus, "warrantyStatus")}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {item.totalCost}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleMoreActions(item)}
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
                      colSpan="10"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No service requests found matching your search."
                        : "You haven't made any service requests yet."}
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
                Filter My Service Requests
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
                      value={pendingFilters.dateFrom}
                      onChange={(e) =>
                        setPendingFilters({
                          ...pendingFilters,
                          dateFrom: e.target.value,
                        })
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
                      value={pendingFilters.dateTo}
                      onChange={(e) =>
                        setPendingFilters({
                          ...pendingFilters,
                          dateTo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Item Type Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Service Category
                </label>
                <select
                  value={pendingFilters.itemType}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      itemType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="service">Services Only</option>
                  <option value="chemical">Chemicals Only</option>
                  <option value="refrigerant">Refrigerants Only</option>
                  <option value="mixed">Mixed Items</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-3">
                  Total Cost Range
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
                      value={pendingFilters.priceMin}
                      onChange={(e) =>
                        setPendingFilters({
                          ...pendingFilters,
                          priceMin: e.target.value,
                        })
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
                      value={pendingFilters.priceMax}
                      onChange={(e) =>
                        setPendingFilters({
                          ...pendingFilters,
                          priceMax: e.target.value,
                        })
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
                  value={pendingFilters.serviceStatus}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      serviceStatus: e.target.value,
                    })
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
                  value={pendingFilters.paymentStatus}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      paymentStatus: e.target.value,
                    })
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
                  value={pendingFilters.warrantyStatus}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      warrantyStatus: e.target.value,
                    })
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
    </CustomerLayout>
  );
};

export default CustomerServiceTracker;
