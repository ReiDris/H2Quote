import React, { useState } from "react";
import {
  Search,
  ListFilter,
  LucideArrowLeft,
  LucideArrowRight,
  Eye,
  Check,
  X,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const VerifyAccountsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for account verification requests
  const mockData = [
    {
      id: "#APPLICANT01",
      name: "John Doe",
      company: "Company A",
      email: "company@gmail.com",
      contactNo: "0283 555 0674",
      appliedAt: "May 07, 2025 - 10:34 AM",
      status: "Under Review",
      documents: ["Business Permit", "DTI Registration"],
    },
    {
      id: "#APPLICANT02",
      name: "Courtney Henry",
      company: "Company B",
      email: "email@gmail.com",
      contactNo: "0283 555 4001",
      appliedAt: "May 07, 2025 - 09:15 AM",
      status: "Under Review",
      documents: ["Business Permit", "SEC Registration"],
    },
    {
      id: "#APPLICANT03",
      name: "Ralph Edwards",
      company: "Company C",
      email: "email@gmail.com",
      contactNo: "0928 555 8724",
      appliedAt: "May 06, 2025 - 02:45 PM",
      status: "Under Review",
      documents: ["Business Permit", "DTI Registration", "Mayor's Permit"],
    },
    {
      id: "#APPLICANT04",
      name: "Marvin McKinney",
      company: "Company D",
      email: "email@gmail.com",
      contactNo: "0932 555 9943",
      appliedAt: "May 06, 2025 - 11:20 AM",
      status: "Approved",
      documents: ["Business Permit", "SEC Registration"],
    },
    {
      id: "#APPLICANT05",
      name: "Jacob Jones",
      company: "Company E",
      email: "email@gmail.com",
      contactNo: "0933 555 6897",
      appliedAt: "May 05, 2025 - 04:30 PM",
      status: "Rejected",
      documents: ["Business Permit"],
    },
    {
      id: "#APPLICANT06",
      name: "Dianne Russell",
      company: "Company F",
      email: "email@gmail.com",
      contactNo: "0929 555 5726",
      appliedAt: "May 05, 2025 - 01:15 PM",
      status: "Under Review",
      documents: ["Business Permit", "DTI Registration"],
    },
    {
      id: "#APPLICANT07",
      name: "Robert Fox",
      company: "Company G",
      email: "email@gmail.com",
      contactNo: "0919 555 3815",
      appliedAt: "May 04, 2025 - 03:45 PM",
      status: "Under Review",
      documents: ["Business Permit", "SEC Registration", "BIR Registration"],
    },
  ];

  const getStatusBadge = (status) => {
    const statusStyles = {
      "Under Review": "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };

    const style = statusStyles[status] || "bg-gray-100 text-gray-800";

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${style}`}>
        {status}
      </span>
    );
  };

  const handleApprove = (applicantId) => {
    // Handle approval logic here
    console.log(`Approving applicant: ${applicantId}`);
  };

  const handleReject = (applicantId) => {
    // Handle rejection logic here
    console.log(`Rejecting applicant: ${applicantId}`);
  };

  const handleViewDocuments = (applicantId) => {
    // Handle view documents logic here
    console.log(`Viewing documents for: ${applicantId}`);
  };

  const filteredData = mockData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <AdminLayout>
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
                    Applicant ID
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
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Applied At
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Status
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
                    <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                      {item.company}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                      {item.email}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                      {item.contactNo}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                      {item.appliedAt}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDocuments(item.id)}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                          title="View Documents"
                        >
                          <Eye size={16} />
                        </button>
                        {item.status === "Pending" || item.status === "Under Review" ? (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="text-green-600 hover:text-green-800 cursor-pointer p-1"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {item.status === "Approved" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </div>
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

export default VerifyAccountsPage;