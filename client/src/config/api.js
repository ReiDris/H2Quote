// src/config/api.js
// Unified API Configuration

// Get the API URL from environment variables
// In development: uses VITE_API_URL from .env.local or defaults to localhost
// In production: uses VITE_API_URL from .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  // Get services catalog
  getServicesCatalog: (category) => {
    const queryString = category ? `?category=${category}` : '';
    return fetchWithAuth(`/service-requests/services/catalog${queryString}`);
  },

  // Get chemicals catalog
  getChemicalsCatalog: () => {
    return fetchWithAuth('/service-requests/chemicals/catalog');
  },

  // Get refrigerants catalog
  getRefrigerantsCatalog: () => {
    return fetchWithAuth('/service-requests/refrigerants/catalog');
  },

  // Get catalog by type (generic method)
  getCatalog: (type) => {
    // type can be: 'services', 'chemicals', 'refrigerants'
    return fetchWithAuth(`/service-requests/${type}/catalog`);
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
export default API_URL;