import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { usersAPI } from "../../config/api";
import { CgMaximizeAlt } from "react-icons/cg";
import { X } from "lucide-react";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState("success"); // "success" or "error"
  const [alertMessage, setAlertMessage] = useState("");
  
  const usersPerPage = 10;

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersAPI.getAllUsers();
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setUsers(data.data);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        throw new Error("Unexpected data format");
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoreActions = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.user_type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setSelectedRole("");
  };

  const showAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const closeAlertModal = () => {
    setShowAlertModal(false);
    setAlertMessage("");
  };

  const handleRoleChange = async () => {
    if (!selectedUser || selectedRole === selectedUser.user_type) {
      return;
    }

    try {
      setIsUpdating(true);
      
      const response = await usersAPI.updateUser(selectedUser.user_id, {
        user_type: selectedRole
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setUsers(users.map(u => 
          u.user_id === selectedUser.user_id 
            ? { ...u, user_type: selectedRole }
            : u
        ));
        
        handleCloseModal();
        showAlert("success", "User role updated successfully!");
      } else {
        throw new Error(data.message || 'Failed to update user role');
      }
      
    } catch (err) {
      console.error('Error updating user role:', err);
      showAlert("error", "Failed to update user role: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveUser = () => {
    // Function to be implemented later
    showAlert("success", "Archive functionality will be implemented later");
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatUserId = (userId) => {
    return `#USER${userId.toString().padStart(2, '0')}`;
  };

  const formatRole = (userType) => {
    if (userType === 'admin') return 'Administrator';
    if (userType === 'staff') return 'Staff';
    return 'Client';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 text-lg">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-600 text-center">
            <p className="font-semibold">Error loading users</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#004785]">Users</h1>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    User Id
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    More Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatUserId(user.user_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {`${user.first_name} ${user.last_name}`.trim()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRole(user.user_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleMoreActions(user)}
                          className="text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                          title="Manage User"
                        >
                          <CgMaximizeAlt size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-md">
                {currentPage}
              </span>
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">
                Manage User
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">User ID:</span>
                  <span className="text-sm text-gray-900">{formatUserId(selectedUser.user_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <span className="text-sm text-gray-900">
                    {`${selectedUser.first_name} ${selectedUser.last_name}`.trim()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <span className="text-sm text-gray-900">{selectedUser.email}</span>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  User Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004785] focus:border-[#004785] text-sm"
                  disabled={isUpdating}
                >
                  <option value="admin">Administrator</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleRoleChange}
                  disabled={isUpdating || selectedRole === selectedUser.user_type}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    isUpdating || selectedRole === selectedUser.user_type
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#004785] text-white hover:bg-[#003666]"
                  }`}
                >
                  {isUpdating ? "Updating..." : "Update Role"}
                </button>

                <button
                  onClick={handleArchiveUser}
                  disabled={isUpdating}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    isUpdating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  Archive User
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={handleCloseModal}
                disabled={isUpdating}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal for Success/Error */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              {alertType === "success" ? "Success" : "Error"}
            </h2>
            <p className="text-black mb-6 text-sm">
              {alertMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeAlertModal}
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

export default UserManagementPage;