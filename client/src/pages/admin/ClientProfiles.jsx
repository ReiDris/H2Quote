import React, { useState, useEffect } from "react";
import {
  Search,
  LucideArrowLeft,
  LucideArrowRight,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import { clientsAPI } from "../../config/api";

const ClientProfilesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch clients from API
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientsAPI.getAll();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch clients');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setClients(data.data);
      } else if (Array.isArray(data)) {
        setClients(data);
      } else {
        throw new Error("Unexpected data format");
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = clients.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 text-lg">Loading clients...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-600 text-center">
            <p className="font-semibold">Error loading clients</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button
            onClick={fetchClients}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Search Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Client ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Company
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Contact No.
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Years as Customer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.client_id || index} className="hover:bg-gray-50">
                      <td className="px-3 py-6 whitespace-nowrap text-xs xl:text-sm font-medium text-gray-800">
                        {item.client_id}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.name}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.company}
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                        {item.email}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {item.contact_number}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800 text-center">
                        {item.years_as_customer}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 py-8 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
      </div>
    </AdminLayout>
  );
};

export default ClientProfilesPage;