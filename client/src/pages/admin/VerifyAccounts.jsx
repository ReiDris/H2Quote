import React, { useState, useEffect } from "react";
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
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("client");
  const [documentUrl, setDocumentUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingUsers, setProcessingUsers] = useState(new Set());

  // Fetch pending users from backend
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("h2quote_token");

      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/admin/pending-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setError(`Authentication error: ${data.message}`);
        return;
      }

      if (data.success) {
        setPendingUsers(data.data);
        setError("");
      } else {
        setError(data.message || "Failed to fetch pending users");
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
      setError("Failed to fetch pending users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (user) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("h2quote_token");

      // Create the URL for viewing the document
      const url = `http://localhost:5000/api/admin/verification-file/${user.user_id}`;

      setDocumentUrl(url);
      setSelectedUser(user);
      setShowDocumentModal(true);
    } catch (error) {
      console.error("Error loading document:", error);
      alert("Failed to load document");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser || !selectedRole) return;

    // Prevent duplicate submissions
    if (processingUsers.has(selectedUser.user_id)) {
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingUsers((prev) => new Set(prev).add(selectedUser.user_id));

      const token = localStorage.getItem("h2quote_token");

      const response = await fetch(
        `http://localhost:5000/api/admin/approve-user/${selectedUser.user_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: selectedRole }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPendingUsers((prevUsers) =>
          prevUsers.filter((u) => u.user_id !== selectedUser.user_id)
        );
        alert(`User approved as ${selectedRole}!`);
        setShowApprovalModal(false);
        setShowDocumentModal(false);
        setSelectedUser(null);
      } else {
        alert(data.message || "Failed to approve user");
        // Remove from processing set if failed so they can retry
        setProcessingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedUser.user_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
      // Remove from processing set if failed so they can retry
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedUser.user_id);
        return newSet;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (user) => {
    // Prevent duplicate submissions
    if (processingUsers.has(user.user_id)) {
      return;
    }

    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      setIsProcessing(true);
      setProcessingUsers((prev) => new Set(prev).add(user.user_id));

      const token = localStorage.getItem("h2quote_token");

      const response = await fetch(
        `http://localhost:5000/api/admin/reject-user/${user.user_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPendingUsers((prevUsers) =>
          prevUsers.filter((u) => u.user_id !== user.user_id)
        );
        alert("User rejected successfully");
      } else {
        alert(data.message || "Failed to reject user");
        // Remove from processing set if failed so they can retry
        setProcessingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(user.user_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user");
      // Remove from processing set if failed so they can retry
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.user_id);
        return newSet;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Inactive: "bg-blue-100 text-blue-800",
      Active: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };

    const displayStatus = status === "Inactive" ? "Under Review" : status;
    const style = statusStyles[status] || "bg-gray-100 text-gray-800";

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${style}`}>
        {displayStatus}
      </span>
    );
  };

  const filteredData = pendingUsers.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companies?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPendingUsers}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

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
              placeholder="Search by name, email, or company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          <button
            onClick={fetchPendingUsers}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      No pending users found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-3 py-6 whitespace-nowrap text-xs xl:text-sm font-medium text-gray-800">
                        #{user.user_id}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {user.companies?.company_name || "N/A"}
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                        {user.email}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-800">
                        {user.phone}
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status || "Inactive")}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewDocument(user)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Documents"
                            disabled={
                              isProcessing || processingUsers.has(user.user_id)
                            }
                          >
                            <Eye size={16} />
                          </button>
                          {user.status === "Inactive" || !user.status ? (
                            <>
                              <button
                                onClick={() => {
                                  if (!processingUsers.has(user.user_id)) {
                                    setSelectedUser(user);
                                    setSelectedRole("client");
                                    setShowApprovalModal(true);
                                  }
                                }}
                                className="text-green-600 hover:text-green-800 cursor-pointer p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve"
                                disabled={
                                  isProcessing ||
                                  processingUsers.has(user.user_id)
                                }
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (!processingUsers.has(user.user_id)) {
                                    handleReject(user);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 cursor-pointer p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject"
                                disabled={
                                  isProcessing ||
                                  processingUsers.has(user.user_id)
                                }
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {user.status === "Active"
                                ? "Approved"
                                : "Rejected"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
                    <span className="px-2 py-2 text-base text-gray-400">
                      ...
                    </span>
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
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-bold">Verification Document</h2>
                <p className="text-sm text-gray-600">
                  {selectedUser?.first_name} {selectedUser?.last_name} -{" "}
                  {selectedUser?.companies?.company_name}
                </p>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {isProcessing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <iframe
                  src={`${documentUrl}?token=${encodeURIComponent(
                    localStorage.getItem("h2quote_token")
                  )}`}
                  className="w-full h-full min-h-[600px] border-0"
                  title="Verification Document"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal with Role Selection */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Approve User</h2>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  <strong>Name:</strong> {selectedUser?.first_name}{" "}
                  {selectedUser?.last_name}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Company:</strong>{" "}
                  {selectedUser?.companies?.company_name}
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Email:</strong> {selectedUser?.email}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User Role <span className="text-red-500">*</span>
                </label>

                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="client"
                      checked={selectedRole === "client"}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Customer</div>
                      <div className="text-sm text-gray-500">
                        Regular client with access to request services
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="staff"
                      checked={selectedRole === "staff"}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Staff</div>
                      <div className="text-sm text-gray-500">
                        Staff member with service management access
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedRole === "admin"}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-sm text-gray-500">
                        Full system access and user management
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={
                    isProcessing ||
                    !selectedRole ||
                    processingUsers.has(selectedUser?.user_id)
                  }
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing && processingUsers.has(selectedUser?.user_id)
                    ? "Approving..."
                    : "Approve as " +
                      selectedRole.charAt(0).toUpperCase() +
                      selectedRole.slice(1)}
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={
                    isProcessing && processingUsers.has(selectedUser?.user_id)
                  }
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default VerifyAccountsPage;
