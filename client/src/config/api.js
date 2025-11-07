const DEBUG_MODE = false;

//Environment Check and Debug Logging
if (DEBUG_MODE) {
  console.log("🔧 API Configuration Debug:");
  console.log("═══════════════════════════════════════");
  console.log("Environment Mode:", import.meta.env.MODE);
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("All env vars:", import.meta.env);
  console.log("═══════════════════════════════════════");
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

if (DEBUG_MODE) {
  console.log("✅ Final API_URL:", API_URL);
  console.log("═══════════════════════════════════════\n");
}

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

  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const fullUrl = `${API_URL}${endpoint}`;

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

    if (DEBUG_MODE) {
      console.log("📡 Response Received:");
      console.log("═══════════════════════════════════════");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Response URL:", response.url);
      console.log("OK:", response.ok);
      console.log("═══════════════════════════════════════");
    }

    if (response.status === 401) {
      console.error("Authentication failed - redirecting to login");
      localStorage.removeItem("h2quote_token");
      localStorage.removeItem("h2quote_user");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error) {
    if (DEBUG_MODE) {
      console.error("API Call Failed:");
      console.error("═══════════════════════════════════════");
      console.error("URL:", fullUrl);
      console.error("Error:", error);
      console.error("Error Message:", error.message);
      console.error("═══════════════════════════════════════");
    }
    throw error;
  }
};

export const serviceRequestsAPI = {
  getAll: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/service-requests?${queryString}`);
  },

  getMyRequests: () => {
    return fetchWithAuth("/service-requests/my-requests");
  },

  getDetails: (requestId) => {
    return fetchWithAuth(`/service-requests/${requestId}/details`);
  },

  create: (data) => {
    return fetchWithAuth("/service-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getServicesCatalog: (category) => {
    const queryString = category ? `?category=${category}` : "";
    return fetchPublic(`/service-requests/services/catalog${queryString}`);
  },

  getChemicalsCatalog: () => {
    return fetchPublic("/service-requests/chemicals/catalog");
  },

  getRefrigerantsCatalog: () => {
    return fetchPublic("/service-requests/refrigerants/catalog");
  },

  getCatalog: (type) => {
    return fetchPublic(`/service-requests/${type}/catalog`);
  },

  addChemicals: (requestId, chemicals, adminNotes) => {
    return fetchWithAuth(`/service-requests/${requestId}/add-chemicals`, {
      method: "POST",
      body: JSON.stringify({
        chemicals,
        adminNotes,
      }),
    });
  },

  addRefrigerants: (requestId, refrigerants, adminNotes) => {
    return fetchWithAuth(`/service-requests/${requestId}/add-refrigerants`, {
      method: "POST",
      body: JSON.stringify({
        refrigerants,
        adminNotes,
      }),
    });
  },

  removeChemicals: (requestId, chemicalItemIds) => {
    return fetchWithAuth(`/service-requests/${requestId}/remove-chemicals`, {
      method: "DELETE",
      body: JSON.stringify({ chemicalItemIds }),
    });
  },

  removeRefrigerants: (requestId, refrigerantItemIds) => {
    return fetchWithAuth(`/service-requests/${requestId}/remove-refrigerants`, {
      method: "DELETE",
      body: JSON.stringify({ refrigerantItemIds }),
    });
  },

  getStaffList: () => {
    return fetchWithAuth("/service-requests/staff-list");
  },

  updateRequest: (requestId, data) => {
    return fetchWithAuth(`/service-requests/${requestId}/update`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  approveQuotation: (quotationId, approved, customerNotes = "") => {
    return fetchWithAuth(
      `/service-requests/quotations/${quotationId}/respond`,
      {
        method: "PUT",
        body: JSON.stringify({
          approved,
          customerNotes,
        }),
      }
    );
  },

  approveServiceRequest: (requestId, notes = null) => {
    return fetchWithAuth(`/service-requests/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({ customerNotes: notes }),
    });
  },
};

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
      body: formData,
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

  resetPassword: (data) => {
    return fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  validateResetToken: (token, email) => {
    const params = new URLSearchParams({
      token: token,
      email: email,
    });
    return fetch(`${API_URL}/auth/validate-reset-token?${params}`);
  },

  googleAuth: (authData) => {
    return fetch(`${API_URL}/auth/google-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authData),
    });
  },
};

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

export const notificationsAPI = {
  getNotifications: (unreadOnly = false, limit = 20) => {
    return fetchWithAuth(
      `/notifications?unreadOnly=${unreadOnly}&limit=${limit}`
    );
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

  clearReadNotifications: () => {
    return fetchWithAuth("/notifications/clear-read", {
      method: "DELETE",
    });
  },
};

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

export const usersAPI = {
  getAllUsers: () => {
    return fetchWithAuth("/users");
  },

  getUserById: (userId) => {
    return fetchWithAuth(`/users/${userId}`);
  },

  updateUser: (userId, data) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteUser: (userId) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: "DELETE",
    });
  },

  archiveUser: (userId) => {
    return fetchWithAuth(`/users/${userId}/archive`, {
      method: "PUT",
    });
  },

  getArchivedUsers: () => {
    return fetchWithAuth("/users/archived");
  },

  restoreUser: (userId) => {
    return fetchWithAuth(`/users/${userId}/restore`, {
      method: "PUT",
    });
  },
};

export const paymentsAPI = {
  getPaymentProof: (paymentId) => {
    return fetchWithAuth(`/payments/${paymentId}/proof`);
  },

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

  deletePaymentProof: (paymentId) => {
    return fetchWithAuth(`/payments/${paymentId}/proof`, {
      method: "DELETE",
    });
  },

  updatePaymentStatus: (paymentId, status) => {
    return fetchWithAuth(`/payments/${paymentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
};

export const clientsAPI = {
  getAll: () => {
    return fetchWithAuth("/clients");
  },
};

export const activityLogsAPI = {
  getActivityLogs: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/activity-logs?${queryString}`);
  },

  exportActivityLogs: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/activity-logs/export?${queryString}`);
  },

  getActivityLogStats: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/activity-logs/stats?${queryString}`);
  },
};

export const chatbotAPI = {
  startSession: (userContext = {}) => {
    return fetchPublic("/chatbot/start-session", {
      method: "POST",
      body: JSON.stringify({ userContext }),
    });
  },

  sendMessage: (sessionId, message, messageType = "user") => {
    return fetchPublic("/chatbot/send-message", {
      method: "POST",
      body: JSON.stringify({ sessionId, message, messageType }),
    });
  },

  getChatHistory: (sessionId, limit = 50) => {
    return fetchPublic(`/chatbot/chat-history/${sessionId}?limit=${limit}`);
  },

  endSession: (sessionId) => {
    return fetchPublic(`/chatbot/end-session/${sessionId}`, {
      method: "POST",
    });
  },

  getQuickActions: () => {
    return fetchPublic("/chatbot/quick-actions");
  },
};

export { DEBUG_MODE };

export default API_URL;
