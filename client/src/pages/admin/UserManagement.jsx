import React, { useState } from "react";
import {
  LucideArrowLeft,
  LucideArrowRight,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const UserManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for user management
  const mockData = [
    {
      id: "#USER01",
      name: "Staff 1",
      email: "sample@gmail.com",
      role: "Administrator",
    },
    {
      id: "#USER02",
      name: "Staff 2",
      email: "sample@gmail.com",
      role: "Staff",
    },
    {
      id: "#USER02",
      name: "Staff 3",
      email: "sample@gmail.com",
      role: "Administrator",
    },
    {
      id: "#USER02",
      name: "Staff 4",
      email: "dustin@gmail.com",
      role: "Administrator",
    },
  ];

  const getRoleBadge = (role) => {
    const roleStyles = {
      Administrator: "bg-blue-100 text-blue-800",
      Staff: "bg-green-100 text-green-800",
      Customer: "bg-purple-100 text-purple-800",
    };

    const style = roleStyles[role] || "bg-gray-100 text-gray-800";

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${style}`}>
        {role}
      </span>
    );
  };

  const handleEdit = (userId) => {
    // Handle edit logic here
    console.log(`Editing user: ${userId}`);
  };

  const totalPages = Math.ceil(mockData.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedData = mockData.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#004785]">Users</h1>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    User Id
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Role
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    More Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-6 whitespace-nowrap text-xs xl:text-sm font-medium text-gray-800">
                      {item.id}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                      {item.name}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                      {item.email}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                      {item.role}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-center">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-[#004785] hover:text-blue-800 cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
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

export default UserManagementPage;