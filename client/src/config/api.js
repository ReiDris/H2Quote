// src/config/api.js
// Unified API Configuration

// Get the API URL from environment variables
// In development: uses VITE_API_URL from .env.local or defaults to localhost
// In production: uses VITE_API_URL from .env
/*const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to make PUBLIC API calls (no auth required)
export const fetchPublic = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  return response;
};

// Helper function to make authenticated API calls
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('h2quote_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Remove Content-Type header if body is FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('h2quote_token');
    localStorage.removeItem('h2quote_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  return response;
};

// Service Requests API
export const serviceRequestsAPI = {
  // Get all service requests (admin/staff)
  getAll: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/service-requests?${queryString}`);
  },

  // Get customer's own requests
  getMyRequests: () => {
    return fetchWithAuth('/service-requests/my-requests');
  },

  // Get request details
  getDetails: (requestId) => {
    return fetchWithAuth(`/service-requests/${requestId}/details`);
  },

  // Create new service request
  create: (data) => {
    return fetchWithAuth('/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get services catalog - PUBLIC (no auth required)
  getServicesCatalog: (category) => {
    const queryString = category ? `?category=${category}` : '';
    return fetchPublic(`/service-requests/services/catalog${queryString}`);
  },

  // Get chemicals catalog - PUBLIC (no auth required)
  getChemicalsCatalog: () => {
    return fetchPublic('/service-requests/chemicals/catalog');
  },

  // Get refrigerants catalog - PUBLIC (no auth required)
  getRefrigerantsCatalog: () => {
    return fetchPublic('/service-requests/refrigerants/catalog');
  },

  // Get catalog by type (generic method) - PUBLIC (no auth required)
  getCatalog: (type) => {
    // type can be: 'services', 'chemicals', 'refrigerants'
    return fetchPublic(`/service-requests/${type}/catalog`);
  },

  // Add chemicals to a request
  addChemicals: (requestId, chemicals, adminNotes) => {
    return fetchWithAuth(`/service-requests/${requestId}/add-chemicals`, {
      method: 'POST',
      body: JSON.stringify({
        chemicals, // Array of { id, quantity }
        adminNotes,
      }),
    });
  },

  // Add refrigerants to a request
  addRefrigerants: (requestId, refrigerants, adminNotes) => {
    return fetchWithAuth(`/service-requests/${requestId}/add-refrigerants`, {
      method: 'POST',
      body: JSON.stringify({
        refrigerants, // Array of { id, quantity }
        adminNotes,
      }),
    });
  },

  // Remove chemicals from a request
  removeChemicals: (requestId, chemicalItemIds) => {
    return fetchWithAuth(`/service-requests/${requestId}/remove-chemicals`, {
      method: 'DELETE',
      body: JSON.stringify({ chemicalItemIds }), // Array of item IDs
    });
  },

  // Remove refrigerants from a request
  removeRefrigerants: (requestId, refrigerantItemIds) => {
    return fetchWithAuth(`/service-requests/${requestId}/remove-refrigerants`, {
      method: 'DELETE',
      body: JSON.stringify({ refrigerantItemIds }), // Array of item IDs
    });
  },

  // Get staff list
  getStaffList: () => {
    return fetchWithAuth('/service-requests/staff-list');
  },

  // Update service request details
  updateRequest: (requestId, data) => {
    return fetchWithAuth(`/service-requests/${requestId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Auth API
export const authAPI = {
  login: (credentials) => {
    return fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  },

  signup: (formData) => {
    return fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      body: formData, // FormData, no Content-Type header needed
    });
  },

  getCurrentUser: () => {
    return fetchWithAuth('/auth/me');
  },

  logout: () => {
    return fetchWithAuth('/auth/logout', { method: 'POST' });
  },

  forgotPassword: (email) => {
    return fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: (token, email, newPassword, confirmPassword) => {
    return fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        email,
        newPassword,
        confirmPassword,
      }),
    });
  },

  googleAuth: (authData) => {
    return fetch(`${API_URL}/auth/google-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData),  
    });
  },

  validateResetToken: (token, email) => {
    const params = new URLSearchParams({
      token: token,
      email: email,
    });
    return fetch(`${API_URL}/auth/validate-reset-token?${params}`);
  },
};

// Messaging API
export const messagingAPI = {
  getInbox: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/messaging/inbox?${queryString}`);
  },

  getSent: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/messaging/sent?${queryString}`);
  },

  getMessageDetails: (messageId) => {
    return fetchWithAuth(`/messaging/${messageId}`);
  },

  send: (data) => {
    return fetchWithAuth('/messaging', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reply: (messageId, content) => {
    return fetchWithAuth(`/messaging/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  getUnreadCount: () => {
    return fetchWithAuth('/messaging/unread-count');
  },

  markAsRead: (messageIds) => {
    return fetchWithAuth('/messaging/mark-read', {
      method: 'PUT',
      body: JSON.stringify({ messageIds }),
    });
  },

  deleteMessages: (messageIds) => {
    return fetchWithAuth('/messaging', {
      method: 'DELETE',
      body: JSON.stringify({ messageIds }),
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (unreadOnly = false) => {
    return fetchWithAuth(`/notifications?unreadOnly=${unreadOnly}`);
  },

  markAsRead: (notificationId) => {
    return fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: () => {
    return fetchWithAuth('/notifications/mark-all-read', {
      method: 'PUT',
    });
  },
};

// Account Settings API
export const accountAPI = {
  getAccount: () => {
    return fetchWithAuth('/account');
  },

  updateAccount: (data) => {
    return fetchWithAuth('/account', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: (currentPassword, newPassword) => {
    return fetchWithAuth('/account/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },
};

// Admin API
export const adminAPI = {
  getPendingUsers: () => {
    return fetchWithAuth('/admin/pending-users');
  },

  approveUser: (userId, role) => {
    return fetchWithAuth(`/admin/approve-user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  rejectUser: (userId, reason) => {
    return fetchWithAuth(`/admin/reject-user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getVerificationFile: (userId) => {
    return fetchWithAuth(`/admin/verification-file/${userId}`);
  },
};

// Payments API
export const paymentsAPI = {
  getPaymentProof: (paymentId) => {
    return fetchWithAuth(`/payments/${paymentId}/proof`);
  },

  uploadPaymentProof: (paymentId, file) => {
    const formData = new FormData();
    formData.append('paymentProof', file);
    return fetchWithAuth(`/payments/${paymentId}/upload-proof`, {
      method: 'POST',
      body: formData,
    });
  },

  deletePaymentProof: (paymentId) => {
    return fetchWithAuth(`/payments/${paymentId}/proof`, {
      method: 'DELETE',
    });
  },
};

// Export the base API_URL for direct use if needed
export default API_URL;*/
// src/config/api.js
// Unified API Configuration

// ✅ DEBUG MODE - Set to false in production
const DEBUG_MODE = true;

// ✅ Environment Check and Debug Logging
if (DEBUG_MODE) {
  console.log("🔧 API Configuration Debug:");
  console.log("═══════════════════════════════════════");
  console.log("Environment Mode:", import.meta.env.MODE);
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("All env vars:", import.meta.env);
  console.log("═══════════════════════════════════════");
}

// Get the API URL from environment variables
// In development: uses VITE_API_URL from .env.local or defaults to localhost
// In production: uses VITE_API_URL from .env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

if (DEBUG_MODE) {
  console.log("✅ Final API_URL:", API_URL);
  console.log("═══════════════════════════════════════\n");
}

// Helper function to make PUBLIC API calls (no auth required)
export const fetchPublic = async (endpoint, options = {}) => {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const fullUrl = `${API_URL}${endpoint}`;

  if (DEBUG_MODE) {
    console.log("🌐 Public API Call:", {
      url: fullUrl,
      method: config.method || "GET",
    });
  }

  const response = await fetch(fullUrl, config);

  if (DEBUG_MODE) {
    console.log("📡 Public Response:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
  }

  return response;
};

// Helper function to make authenticated API calls
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("h2quote_token");

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Remove Content-Type header if body is FormData
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const fullUrl = `${API_URL}${endpoint}`;

  // ✅ Enhanced Debug Logging
  if (DEBUG_MODE) {
    console.log("🔐 Authenticated API Call:");
    console.log("═══════════════════════════════════════");
    console.log("URL:", fullUrl);
    console.log("Method:", config.method || "GET");
    console.log("Has FormData:", options.body instanceof FormData);
    console.log("Has Token:", !!token);
    console.log("Headers:", config.headers);
    console.log("═══════════════════════════════════════");
  }

  try {
    const response = await fetch(fullUrl, config);

    // ✅ Enhanced Response Logging
    if (DEBUG_MODE) {
      console.log("📡 Response Received:");
      console.log("═══════════════════════════════════════");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Response URL:", response.url);
      console.log("OK:", response.ok);
      console.log("═══════════════════════════════════════");
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.error("❌ Authentication failed - redirecting to login");
      localStorage.removeItem("h2quote_token");
      localStorage.removeItem("h2quote_user");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error) {
    // ✅ Enhanced Error Logging
    if (DEBUG_MODE) {
      console.error("❌ API Call Failed:");
      console.error("═══════════════════════════════════════");
      console.error("URL:", fullUrl);
      console.error("Error:", error);
      console.error("Error Message:", error.message);
      console.error("═══════════════════════════════════════");
    }
    throw error;
  }
};

// Service Requests API
export const serviceRequestsAPI = {
  // Get all service requests (admin/staff)
  getAll: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/service-requests?${queryString}`);
  },

  // Get customer's own requests
  getMyRequests: () => {
    return fetchWithAuth("/service-requests/my-requests");
  },

  // Get request details
  getDetails: (requestId) => {
    return fetchWithAuth(`/service-requests/${requestId}/details`);
  },

  // Create new service request
  create: (data) => {
    return fetchWithAuth("/service-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get services catalog - PUBLIC (no auth required)
  getServicesCatalog: (category) => {
    const queryString = category ? `?category=${category}` : "";
    return fetchPublic(`/service-requests/services/catalog${queryString}`);
  },

  // Get chemicals catalog - PUBLIC (no auth required)
  getChemicalsCatalog: () => {
    return fetchPublic("/service-requests/chemicals/catalog");
  },

  // Get refrigerants catalog - PUBLIC (no auth required)
  getRefrigerantsCatalog: () => {
    return fetchPublic("/service-requests/refrigerants/catalog");
  },

  // Get catalog by type (generic method) - PUBLIC (no auth required)
  getCatalog: (type) => {
    // type can be: 'services', 'chemicals', 'refrigerants'
    return fetchPublic(`/service-requests/${type}/catalog`);
  },

  // Add chemicals to a request
  addChemicals: (requestId, chemicals, adminNotes) => {
    return fetchWithAuth(`/service-requests/${requestId}/add-chemicals`, {
      method: "POST",
      body: JSON.stringify({
        chemicals, // Array of { id, quantity }
        adminNotes,
      }),
    });
  },

  // Add refrigerants to a request
  addRefrigerants: (requestId, refrigerants, adminNotes) => {
    return fetchWithAuth(`/service-requests/${requestId}/add-refrigerants`, {
      method: "POST",
      body: JSON.stringify({
        refrigerants, // Array of { id, quantity }
        adminNotes,
      }),
    });
  },

  // Remove chemicals from a request
  removeChemicals: (requestId, chemicalItemIds) => {
    return fetchWithAuth(`/service-requests/${requestId}/remove-chemicals`, {
      method: "DELETE",
      body: JSON.stringify({ chemicalItemIds }), // Array of item IDs
    });
  },

  // Remove refrigerants from a request
  removeRefrigerants: (requestId, refrigerantItemIds) => {
    return fetchWithAuth(`/service-requests/${requestId}/remove-refrigerants`, {
      method: "DELETE",
      body: JSON.stringify({ refrigerantItemIds }), // Array of item IDs
    });
  },

  // Get staff list
  getStaffList: () => {
    return fetchWithAuth("/service-requests/staff-list");
  },

  // Update service request details
  updateRequest: (requestId, data) => {
    return fetchWithAuth(`/service-requests/${requestId}/update`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Approve or reject quotation (customer only)
  approveQuotation: (quotationId, approved, customerNotes = "") => {
    return fetchWithAuth(`/service-requests/quotations/${quotationId}/respond`, {
      method: "PUT",
      body: JSON.stringify({
        approved,
        customerNotes,
      }),
    });
  },

  // ✅ ADDED: Approve service request (customer only)
  approveServiceRequest: (requestId, notes = null) => {
    return fetchWithAuth(`/service-requests/${requestId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ customerNotes: notes }),
    });
  },
};
// Auth API
export const authAPI = {
  login: (credentials) => {
    return fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  },

  signup: (formData) => {
    return fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      body: formData, // FormData, no Content-Type header needed
    });
  },

  getCurrentUser: () => {
    return fetchWithAuth("/auth/me");
  },

  logout: () => {
    return fetchWithAuth("/auth/logout", { method: "POST" });
  },

  forgotPassword: (email) => {
    return fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: (token, email, newPassword, confirmPassword) => {
    return fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        email,
        newPassword,
        confirmPassword,
      }),
    });
  },

  googleAuth: (authData) => {
    return fetch(`${API_URL}/auth/google-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authData),
    });
  },

  validateResetToken: (token, email) => {
    const params = new URLSearchParams({
      token: token,
      email: email,
    });
    return fetch(`${API_URL}/auth/validate-reset-token?${params}`);
  },
};

// Messaging API
export const messagingAPI = {
  getInbox: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/messaging/inbox?${queryString}`);
  },

  getSent: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/messaging/sent?${queryString}`);
  },

  getMessageDetails: (messageId) => {
    return fetchWithAuth(`/messaging/${messageId}`);
  },

  send: (data) => {
    return fetchWithAuth("/messaging", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  reply: (messageId, content) => {
    return fetchWithAuth(`/messaging/${messageId}/reply`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  getUnreadCount: () => {
    return fetchWithAuth("/messaging/unread-count");
  },

  markAsRead: (messageIds) => {
    return fetchWithAuth("/messaging/mark-read", {
      method: "PUT",
      body: JSON.stringify({ messageIds }),
    });
  },

  deleteMessages: (messageIds) => {
    return fetchWithAuth("/messaging", {
      method: "DELETE",
      body: JSON.stringify({ messageIds }),
    });
  },

  createServiceRequestMessage: (requestId, data) => {
    return fetchWithAuth(`/messaging/service-request/${requestId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (unreadOnly = false) => {
    return fetchWithAuth(`/notifications?unreadOnly=${unreadOnly}`);
  },

  markAsRead: (notificationId) => {
    return fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  markAllAsRead: () => {
    return fetchWithAuth("/notifications/read-all", {
      method: "PUT",
    });
  },

  deleteNotification: (notificationId) => {
    return fetchWithAuth(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};

// Account Settings API
export const accountAPI = {
  getAccount: () => {
    return fetchWithAuth("/account");
  },

  updateAccount: (data) => {
    return fetchWithAuth("/account", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  changePassword: (currentPassword, newPassword) => {
    return fetchWithAuth("/account/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },
};

// Admin API
export const adminAPI = {
  getPendingUsers: () => {
    return fetchWithAuth("/admin/pending-users");
  },

  approveUser: (userId, role) => {
    return fetchWithAuth(`/admin/approve-user/${userId}`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },

  rejectUser: (userId, reason) => {
    return fetchWithAuth(`/admin/reject-user/${userId}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  getVerificationFile: (userId) => {
    return fetchWithAuth(`/admin/verification-file/${userId}`);
  },
};

// Payments API
export const paymentsAPI = {
  // Get payment proof
  getPaymentProof: (paymentId) => {
    return fetchWithAuth(`/payments/${paymentId}/proof`);
  },

  // ✅ Upload payment proof with enhanced debugging
  uploadPaymentProof: (paymentId, file) => {
    if (DEBUG_MODE) {
      console.log("📤 Preparing Payment Proof Upload:");
      console.log("═══════════════════════════════════════");
      console.log("Payment ID:", paymentId);
      console.log("File Name:", file.name);
      console.log("File Type:", file.type);
      console.log("File Size:", `${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log("═══════════════════════════════════════");
    }

    const formData = new FormData();
    formData.append("paymentProof", file);

    return fetchWithAuth(`/payments/${paymentId}/upload-proof`, {
      method: "POST",
      body: formData,
    });
  },

  // Delete payment proof
  deletePaymentProof: (paymentId) => {
    return fetchWithAuth(`/payments/${paymentId}/proof`, {
      method: "DELETE",
    });
  },

  // Update payment status (admin/staff only)
  updatePaymentStatus: (paymentId, status) => {
    return fetchWithAuth(`/payments/${paymentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
};

// Clients API
export const clientsAPI = {
  // Get all clients (admin only)
  getAll: () => {
    return fetchWithAuth("/clients");
  },
};

// ✅ Export DEBUG_MODE so it can be toggled from outside if needed
export { DEBUG_MODE };

// Export the base API_URL for direct use if needed
export default API_URL;