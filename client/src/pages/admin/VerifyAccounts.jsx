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
import { adminAPI } from "../../config/api";
import API_URL from "../../config/api";

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

  // New modal states for alerts
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [userToReject, setUserToReject] = useState(null);

  // Fetch pending users from backend
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);

      const response = await adminAPI.getPendingUsers();

      if (response.status === 401 || response.status === 403) {
        const data = await response.json();
        setError(`Authentication error: ${data.message}`);
        return;
      }

      const data = await response.json();

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

      // Create the URL for viewing the document
      // Note: For iframe src, we need to construct the full URL with token as query param
      const token = localStorage.getItem("h2quote_token");
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const url = `${API_BASE}/admin/verification-file/${
        user.user_id
      }?token=${encodeURIComponent(token)}`;

      setDocumentUrl(url);
      setSelectedUser(user);
      setShowDocumentModal(true);
    } catch (error) {
      console.error("Error loading document:", error);
      setModalMessage("Failed to load document");
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (user) => {
  setUserToReject(user);
  setShowRejectModal(true);
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

      const response = await adminAPI.approveUser(
        selectedUser.user_id,
        selectedRole
      );
      const data = await response.json();

      if (data.success) {
        setPendingUsers((prevUsers) =>
          prevUsers.filter((u) => u.user_id !== selectedUser.user_id)
        );
        setModalMessage(`User approved as ${selectedRole}!`);
        setShowSuccessModal(true);
        setShowApprovalModal(false);
        setShowDocumentModal(false);
        setSelectedUser(null);
      } else {
        setModalMessage(data.message || "Failed to approve user");
        setShowErrorModal(true);
        // Remove from processing set if failed so they can retry
        setProcessingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedUser.user_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error approving user:", error);
      setModalMessage("Failed to approve user");
      setShowErrorModal(true);
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

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setModalMessage("Please provide a reason for rejection");
      setShowErrorModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingUsers((prev) => new Set(prev).add(userToReject.user_id));

      const response = await adminAPI.rejectUser(
        userToReject.user_id,
        rejectionReason
      );
      const data = await response.json();

      if (data.success) {
        setPendingUsers((prevUsers) =>
          prevUsers.filter((u) => u.user_id !== userToReject.user_id)
        );
        setModalMessage("User rejected successfully");
        setShowSuccessModal(true);
        setShowRejectModal(false);
        setUserToReject(null);
        setRejectionReason("");
      } else {
        setModalMessage(data.message || "Failed to reject user");
        setShowErrorModal(true);
        // Remove from processing set if failed so they can retry
        setProcessingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userToReject.user_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      setModalMessage("Failed to reject user");
      setShowErrorModal(true);
      // Remove from processing set if failed so they can retry
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userToReject.user_id);
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
            className="px-4 py-3 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-all cursor-pointer"
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
                                    handleRejectClick(user);
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#004785]">
                  Verification Document
                </h2>
                <p className="text-sm text-black">
                  {selectedUser?.first_name} {selectedUser?.last_name} -{" "}
                  {selectedUser?.companies?.company_name}
                </p>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-100 rounded-lg flex items-center justify-center">
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004785]"></div>
                </div>
              ) : (
                <iframe
                  src={documentUrl}
                  className="w-full h-full min-h-[500px] border-0 rounded-lg"
                  title="Verification Document"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal with Role Selection */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md mx-4">
            <div className="pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Approve User</h2>
            </div>

            <div className="mb-6">
              <p className="text-black text-sm mb-2">
                <strong>Name:</strong> {selectedUser?.first_name}{" "}
                {selectedUser?.last_name}
              </p>
              <p className="text-black text-sm mb-2">
                <strong>Company:</strong>{" "}
                {selectedUser?.companies?.company_name}
              </p>
              <p className="text-black text-sm mb-4">
                <strong>Email:</strong> {selectedUser?.email}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Select User Role <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    checked={selectedRole === "client"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3 h-4 w-4 text-[#004785]"
                  />
                  <div>
                    <div className="font-medium text-black">Customer</div>
                    <div className="text-sm text-black">
                      Regular client with access to request services
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={selectedRole === "staff"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3 h-4 w-4 text-[#004785]"
                  />
                  <div>
                    <div className="font-medium text-black">Staff</div>
                    <div className="text-sm text-black">
                      Staff member with service management access
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={selectedRole === "admin"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3 h-4 w-4 text-[#004785]"
                  />
                  <div>
                    <div className="font-medium text-black">Administrator</div>
                    <div className="text-sm text-black">
                      Full system access and user management
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={
                  isProcessing && processingUsers.has(selectedUser?.user_id)
                }
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={
                  isProcessing ||
                  !selectedRole ||
                  processingUsers.has(selectedUser?.user_id)
                }
                className="flex-1 bg-[#004785] text-white px-4 py-2 rounded-lg hover:bg-[#003666] transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing && processingUsers.has(selectedUser?.user_id)
                  ? "Approving..."
                  : "Approve as " +
                    selectedRole.charAt(0).toUpperCase() +
                    selectedRole.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md mx-4">
            <div className="pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Reject User</h2>
            </div>

            <p className="text-black text-sm mb-4">
              Please provide a reason for rejecting this user application.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004785] focus:border-[#004785] text-sm"
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setUserToReject(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 bg-[#004785] text-white px-4 py-2 rounded-lg hover:bg-[#003666] transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Success
            </h2>
            <p className="text-black mb-6 text-sm">{modalMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Error
            </h2>
            <p className="text-black mb-6 text-sm">{modalMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default VerifyAccountsPage;
