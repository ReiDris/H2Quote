import React, { useState, useEffect } from "react";
import {
  LucideArrowLeft,
  LucideArrowRight,
  Download,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import { activityLogsAPI } from "../../config/api";

const ActivityLogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    searchTerm: "",
  });

  const fetchActivityLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: 10,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
      };

      const response = await activityLogsAPI.getActivityLogs(params);
      const data = await response.json();

      if (data.success) {
        setActivityLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs(currentPage);
  }, [currentPage]);

  const handleExport = async () => {
    try {
      const params = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
      };

      const response = await activityLogsAPI.exportActivityLogs(params);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `activity_logs_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("Activity log exported successfully");
    } catch (error) {
      console.error("Error exporting activity logs:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchActivityLogs(1);
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      searchTerm: "",
    });
    setCurrentPage(1);
    setTimeout(() => {
      fetchActivityLogs(1);
    }, 100);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785]">
            Activity Log
          </h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-15 py-3 border border-gray-300 rounded-md hover:border-gray-400 duration-200 cursor-pointer text-[#0083E2]"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>

        {/* Filters Section */}
        <div className="flex-shrink-0 bg-white rounded-md shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004785]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004785]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search name, email, or action..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004785]"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-md hover:bg-[#003366] transition-colors duration-200"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 overflow-y-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading activity logs...</div>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">No activity logs found</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                      User ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                      Role
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                      Time
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-5 whitespace-nowrap text-xs xl:text-sm font-medium text-gray-800">
                        {item.userId}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.name}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.role}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.date}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.time}
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                        {item.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
         <div className="flex-shrink-0 bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className={`flex items-center px-3 py-1 border rounded-md font-medium transition-colors duration-300 cursor-pointer ${
                !pagination.hasPrevPage || loading
                  ? "text-gray-400 cursor-not-allowed border-gray-400"
                  : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
              }`}
            >
              <LucideArrowLeft className="w-4 mr-2" />
              Previous
            </button>

            {/* Page Numbers - Centered */}
            <div className="flex items-center space-x-3">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`px-3 py-1 text-sm font-base rounded-md transition-colors duration-300 cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-gray-200 text-gray-600"
                        : "text-gray-600 hover:bg-gray-100"
                    } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Ellipsis if needed */}
              {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                <>
                  <span className="px-2 py-2 text-base text-gray-400">...</span>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={loading}
                    className="px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors duration-300"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className={`flex items-center px-3 py-1 border rounded-lg font-medium transition-colors duration-300 cursor-pointer ${
                !pagination.hasNextPage || loading
                  ? "text-gray-400 cursor-not-allowed border-gray-400"
                  : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
              }`}
            >
              Next
              <LucideArrowRight className="w-4 ms-2" />
            </button>
          </div>
        </div>

        {/* Pagination Info */}
        {!loading && activityLogs.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            Showing page {currentPage} of {pagination.totalPages} ({pagination.totalRecords} total records)
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ActivityLogPage;