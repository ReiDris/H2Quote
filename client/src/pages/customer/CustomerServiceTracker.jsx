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
import { serviceRequestsAPI } from "../../config/api"

const CustomerServiceTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mockData, setMockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const itemsPerPage = 10;

  // Helper function to parse service category from counts
  const parseServiceCategory = (servicesCount, chemicalsCount, refrigerantsCount) => {
    const categories = [];
    
    if (servicesCount > 0) categories.push("Services");
    if (chemicalsCount > 0) categories.push("Chemicals");
    if (refrigerantsCount > 0) categories.push("Refrigerants");
    
    return categories.length > 0 ? categories.join(", ") : "-";
  };

  // Helper function to parse requested service details from items_summary
  const parseRequestedService = (itemsSummary) => {
    if (!itemsSummary) return "-";
    
    // The items_summary comes as: "2x Service Name (Service), 1x Chemical Name (Chemical)"
    // We'll split it and clean it up for display
    const items = itemsSummary.split(", ");
    
    if (items.length === 0) return "-";
    
    // For better readability, we'll format each item
    const formattedItems = items.map(item => {
      // Remove the type suffix in parentheses for cleaner display
      return item.replace(/\s*\((Service|Chemical|Refrigerant)\)/, '');
    });
    
    // If there are too many items, show first few and add count
    if (formattedItems.length > 3) {
      return `${formattedItems.slice(0, 3).join(", ")} +${formattedItems.length - 3} more`;
    }
    
    return formattedItems.join(", ");
  };

  // Fetch customer requests from API
  const fetchCustomerRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('h2quote_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await serviceRequestsAPI.getMyRequests();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('h2quote_token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch service requests');
      }

      const data = await response.json();

      if (data.success) {
        console.log('Fetched customer requests:', data.data);
        
        // Transform backend data to match your existing UI structure
        const transformedData = (data.data || []).map(item => ({
          id: item.request_number,
          requestedAt: item.created_at, // Backend formats the date
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
          requestId: item.request_id, // Keep original ID for navigation
          // Store raw data for search functionality
          itemsSummary: item.items_summary
        }));

        setMockData(transformedData);
      } else {
        setError(data.message || 'Failed to fetch service requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch service requests');
      setMockData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerRequests();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₱0";
    return `₱${parseFloat(amount).toLocaleString('en-PH')}`;
  };

  const handleMoreActions = (item) => {
    // Navigate using the actual request_id from backend
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
      <span className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${style}`}>
        {status}
      </span>
    );
  };

  const filteredData = mockData.filter(
    (item) =>
      item.requestedService.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedStaff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Search and Filter Section */}
        <div className="flex-shrink-0 mb-4 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search my requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-28">
                    Request ID
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-40">
                    Requested At
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-28">
                    Service Category
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-48">
                    Requested Service
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-32">
                    Assigned Staff
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-28">
                    Service Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-28">
                    Payment Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-28">
                    Warranty Status
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-black w-24">
                    Total Cost
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-black w-20">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-4 text-xs font-medium text-gray-800 w-28 truncate">
                      {item.id}
                    </td>
                    <td className="px-2 py-4 text-xs text-gray-800 w-40 truncate">
                      {item.requestedAt}
                    </td>
                    <td className="px-2 py-4 text-xs text-gray-800 w-28 truncate">
                      {item.serviceCategory}
                    </td>
                    <td className="px-2 py-4 text-xs text-gray-800 w-48 truncate" title={item.requestedService}>
                      {item.requestedService}
                    </td>
                    <td className="px-2 py-4 text-xs text-gray-800 w-32 truncate">
                      {item.assignedStaff || "-"}
                    </td>
                    <td className="px-2 py-4 w-28">
                      {getStatusBadge(item.serviceStatus, "serviceStatus")}
                    </td>
                    <td className="px-2 py-4 w-28">
                      {getStatusBadge(item.paymentStatus, "paymentStatus")}
                    </td>
                    <td className="px-2 py-4 w-28">
                      {getStatusBadge(item.warrantyStatus, "warrantyStatus")}
                    </td>
                    <td className="px-2 py-4 text-xs font-medium text-gray-800 w-24 truncate">
                      {item.totalCost}
                    </td>
                    <td className="px-2 py-4 text-center w-20">
                      <button
                        onClick={() => handleMoreActions(item)}
                        className="text-gray-800 cursor-pointer hover:text-blue-600 transition-colors inline-block"
                        title="View Details"
                      >
                        <CgMaximizeAlt size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm font-base rounded-md transition-colors duration-300 cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-gray-200 text-gray-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Ellipsis if needed */}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 py-2 text-base text-gray-400">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors duration-300"
                  >
                    {totalPages}
                  </button>
                </>
              )}
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
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-500 mb-2">No service requests found</div>
            <p className="text-sm text-gray-400">
              {searchTerm 
                ? "Try adjusting your search"
                : "You haven't made any service requests yet"}
            </p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerServiceTracker;