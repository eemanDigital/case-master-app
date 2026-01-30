// features/matter/matterService.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized – redirecting to login");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/users/login";
    }
    return Promise.reject(error);
  },
);

const matterService = {
  // ======================
  // CREATE
  // ======================
  createMatter: async (matterData) => {
    const res = await API.post("/matters", matterData);
    return res.data;
  },

  // ======================
  // READ
  // ======================
  getAllMatters: async (filters = {}) => {
    const res = await API.get("/matters", { params: filters });
    return res.data;
  },

  getMatter: async (matterId) => {
    const res = await API.get(`/matters/${matterId}`);
    return res.data;
  },

  getMyMatters: async (filters = {}) => {
    const res = await API.get("/matters/my-matters", { params: filters });
    return res.data;
  },

  getMatterStats: async () => {
    const res = await API.get("/matters/stats");
    return res.data;
  },

  // ======================
  // UPDATE
  // ======================
  updateMatter: async ({ matterId, matterData }) => {
    const res = await API.patch(`/matters/${matterId}`, matterData);
    return res.data;
  },

  restoreMatter: async (matterId) => {
    const res = await API.patch(`/matters/${matterId}/restore`);
    return res.data;
  },

  // ======================
  // DELETE
  // ======================
  deleteMatter: async (matterId) => {
    const res = await API.delete(`/matters/${matterId}`);
    return res.data;
  },

  // ======================
  // SEARCH
  // ======================
  searchMatters: async (criteria) => {
    const res = await API.post("/matters/search", criteria);
    return res.data;
  },

  // ======================
  // BULK OPERATIONS - NEW
  // ======================

  // Bulk update matters
  bulkUpdateMatters: async (matterIds, updateData) => {
    const res = await API.patch("/matters/bulk-update", {
      matterIds,
      updates: updateData,
    });
    return res.data;
  },

  // Bulk delete matters
  bulkDeleteMatters: async (matterIds) => {
    const res = await API.delete("/matters/bulk-delete", {
      data: { matterIds },
    });
    return res.data;
  },

  // Bulk assign account officer
  bulkAssignOfficer: async (matterIds, officerId) => {
    const res = await API.post("/matters/bulk-assign-officer", {
      matterIds,
      officerId,
    });
    return res.data;
  },

  // Bulk export matters
  bulkExportMatters: async (matterIds, format = "csv") => {
    const res = await API.post(
      "/matters/export",
      { matterIds, format },
      {
        responseType: "blob",
        headers: {
          Accept:
            format === "pdf"
              ? "application/pdf"
              : format === "excel"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv",
        },
      },
    );
    // RETURN ONLY DATA
    return res.data;
  },
  // Bulk status change (convenience method)
  bulkChangeStatus: async (matterIds, status) => {
    const res = await API.patch("/matters/bulk-update", {
      matterIds,
      updates: { status },
    });
    return res.data;
  },

  // Bulk priority change (convenience method)
  bulkChangePriority: async (matterIds, priority) => {
    const res = await API.patch("/matters/bulk-update", {
      matterIds,
      updates: { priority },
    });
    return res.data;
  },

  // Bulk add tags/labels (convenience method)
  bulkAddTags: async (matterIds, tags) => {
    const res = await API.patch("/matters/bulk-update", {
      matterIds,
      updates: {
        $addToSet: { tags: { $each: tags } },
      },
    });
    return res.data;
  },

  // ======================
  // VALIDATION & UTILITIES
  // ======================

  // Validate matter number uniqueness
  validateMatterNumber: async (matterNumber) => {
    const res = await API.get(
      `/matters/validate-matter-number/${matterNumber}`,
    );
    return res.data;
  },

  // Get matter timeline/activity
  getMatterTimeline: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/timeline`);
    return res.data;
  },

  // Get recent activity across all matters
  getRecentActivity: async (days = 7, limit = 10) => {
    const res = await API.get("/matters/recent-activity", {
      params: { days, limit },
    });
    return res.data;
  },

  // Get matters by type
  getMattersByType: async (matterType, filters = {}) => {
    const res = await API.get(`/matters/type/${matterType}`, {
      params: filters,
    });
    return res.data;
  },

  // Get matters by status
  getMattersByStatus: async (status, filters = {}) => {
    const res = await API.get(`/matters/status/${status}`, { params: filters });
    return res.data;
  },

  // Get pending matters (shortcut)
  getPendingMatters: async (filters = {}) => {
    const res = await API.get("/matters/pending", { params: filters });
    return res.data;
  },

  // Get urgent matters (shortcut)
  getUrgentMatters: async (filters = {}) => {
    const res = await API.get("/matters/urgent", { params: filters });
    return res.data;
  },

  // ======================
  // FILE & ATTACHMENT OPERATIONS
  // ======================

  // Upload matter document
  uploadDocument: async (matterId, formData) => {
    const res = await API.post(`/matters/${matterId}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Delete matter document
  deleteDocument: async (matterId, documentId) => {
    const res = await API.delete(
      `/matters/${matterId}/documents/${documentId}`,
    );
    return res.data;
  },

  // Get matter documents
  getDocuments: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/documents`);
    return res.data;
  },

  // ======================
  // COLLABORATION & COMMENTS
  // ======================

  // Add comment to matter
  addComment: async (matterId, comment) => {
    const res = await API.post(`/matters/${matterId}/comments`, { comment });
    return res.data;
  },

  // Get matter comments
  getComments: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/comments`);
    return res.data;
  },

  // Delete comment
  deleteComment: async (matterId, commentId) => {
    const res = await API.delete(`/matters/${matterId}/comments/${commentId}`);
    return res.data;
  },

  // ======================
  // TASK & EVENT MANAGEMENT
  // ======================

  // Add task to matter
  addTask: async (matterId, taskData) => {
    const res = await API.post(`/matters/${matterId}/tasks`, taskData);
    return res.data;
  },

  // Get matter tasks
  getTasks: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/tasks`);
    return res.data;
  },

  // Add event to matter
  addEvent: async (matterId, eventData) => {
    const res = await API.post(`/matters/${matterId}/events`, eventData);
    return res.data;
  },

  // Get matter events
  getEvents: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/events`);
    return res.data;
  },

  // ======================
  // BILLING & FINANCIAL
  // ======================

  // Create invoice for matter
  createInvoice: async (matterId, invoiceData) => {
    const res = await API.post(`/matters/${matterId}/invoices`, invoiceData);
    return res.data;
  },

  // Get matter invoices
  getInvoices: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/invoices`);
    return res.data;
  },

  // Update matter billing
  updateBilling: async (matterId, billingData) => {
    const res = await API.patch(`/matters/${matterId}/billing`, billingData);
    return res.data;
  },

  // Get billing summary
  getBillingSummary: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/billing/summary`);
    return res.data;
  },

  // ======================
  // REPORTING & ANALYTICS
  // ======================

  // Generate matter report
  generateReport: async (matterId, reportType) => {
    const res = await API.get(`/matters/${matterId}/reports/${reportType}`, {
      responseType: "blob",
    });
    return res;
  },

  // Get matter insights/analytics
  getMatterInsights: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/insights`);
    return res.data;
  },

  // Get time tracking data
  getTimeEntries: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/time-entries`);
    return res.data;
  },

  // Log time entry
  logTimeEntry: async (matterId, timeData) => {
    const res = await API.post(`/matters/${matterId}/time-entries`, timeData);
    return res.data;
  },

  // ======================
  // NOTIFICATIONS & ALERTS
  // ======================

  // Subscribe to matter updates
  subscribeToMatter: async (matterId) => {
    const res = await API.post(`/matters/${matterId}/subscribe`);
    return res.data;
  },

  // Unsubscribe from matter updates
  unsubscribeFromMatter: async (matterId) => {
    const res = await API.delete(`/matters/${matterId}/subscribe`);
    return res.data;
  },

  // Set matter alerts/reminders
  setAlert: async (matterId, alertData) => {
    const res = await API.post(`/matters/${matterId}/alerts`, alertData);
    return res.data;
  },

  // Get matter alerts
  getAlerts: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/alerts`);
    return res.data;
  },

  // ======================
  // PERMISSIONS & SHARING
  // ======================

  // Share matter with other users
  shareMatter: async (matterId, userIds, permissions) => {
    const res = await API.post(`/matters/${matterId}/share`, {
      userIds,
      permissions,
    });
    return res.data;
  },

  // Update sharing permissions
  updateSharing: async (matterId, sharingData) => {
    const res = await API.patch(`/matters/${matterId}/share`, sharingData);
    return res.data;
  },

  // Get matter collaborators
  getCollaborators: async (matterId) => {
    const res = await API.get(`/matters/${matterId}/collaborators`);
    return res.data;
  },
};

export default matterService;
