import apiService from "../../../services/api";

const matterService = {
  // ======================
  // CREATE
  // ======================
  createMatter: (matterData) => apiService.post("/matters", matterData),

  // ======================
  // READ
  // ======================
  getAllMatters: (filters = {}) =>
    apiService.get("/matters", { params: filters }),

  getMatter: (matterId) => apiService.get(`/matters/${matterId}`),

  getMyMatters: (filters = {}) =>
    apiService.get("/matters/my-matters", { params: filters }),

  getMyMattersSummary: () => apiService.get("/matters/my-matters-summary"),

  getAllMattersWithOfficers: (filters = {}) =>
    apiService.get("/matters/with-officers", { params: filters }),

  getMatterStats: () => apiService.get("/matters/stats"),

  // ======================
  // UPDATE
  // ======================
  updateMatter: ({ matterId, matterData }) =>
    apiService.patch(`/matters/${matterId}`, matterData),

  restoreMatter: (matterId) => apiService.patch(`/matters/${matterId}/restore`),

  // ======================
  // DELETE
  // ======================
  deleteMatter: (matterId) => apiService.delete(`/matters/${matterId}`),

  // ======================
  // SEARCH
  // ======================
  searchMatters: (criteria) => apiService.post("/matters/search", criteria),

  // ======================
  // BULK OPERATIONS
  // ======================
  bulkUpdateMatters: (matterIds, updateData) =>
    apiService.patch("/matters/bulk-update", {
      matterIds,
      updates: updateData,
    }),

  bulkDeleteMatters: (matterIds) =>
    apiService.delete("/matters/bulk-delete", { data: { matterIds } }),

  bulkAssignOfficer: (matterIds, officerId) =>
    apiService.post("/matters/bulk-assign-officer", { matterIds, officerId }),

  // bulkExportMatters uses apiService.download but needs POST, so we call
  // the underlying axios instance directly via apiService.download with a
  // custom config. Since apiService.download is GET-only, we use apiService.post
  // with responseType blob handled manually here — the one case where we need
  // a slight extension of the pattern.
  bulkExportMatters: async (matterIds, format = "csv") => {
    const acceptHeader =
      format === "pdf"
        ? "application/pdf"
        : format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv";

    // apiService.post resolves res.data, but we need blob — pass responseType
    return apiService.post(
      "/matters/export",
      { matterIds, format },
      {
        responseType: "blob",
        headers: { Accept: acceptHeader },
      },
    );
  },

  // Convenience wrappers — delegate to bulkUpdateMatters
  bulkChangeStatus: (matterIds, status) =>
    matterService.bulkUpdateMatters(matterIds, { status }),

  bulkChangePriority: (matterIds, priority) =>
    matterService.bulkUpdateMatters(matterIds, { priority }),

  bulkAddTags: (matterIds, tags) =>
    matterService.bulkUpdateMatters(matterIds, {
      $addToSet: { tags: { $each: tags } },
    }),

  // ======================
  // VALIDATION & UTILITIES
  // ======================
  validateMatterNumber: (matterNumber) =>
    apiService.get(`/matters/validate-matter-number/${matterNumber}`),

  getMatterTimeline: (matterId) =>
    apiService.get(`/matters/${matterId}/timeline`),

  getRecentActivity: (days = 7, limit = 10) =>
    apiService.get("/matters/recent-activity", { params: { days, limit } }),

  getMattersByType: (matterType, filters = {}) =>
    apiService.get(`/matters/type/${matterType}`, { params: filters }),

  getMattersByStatus: (status, filters = {}) =>
    apiService.get(`/matters/status/${status}`, { params: filters }),

  getPendingMatters: (filters = {}) =>
    apiService.get("/matters/pending", { params: filters }),

  getUrgentMatters: (filters = {}) =>
    apiService.get("/matters/urgent", { params: filters }),

  // ======================
  // FILE & ATTACHMENT OPERATIONS
  // ======================
  uploadDocument: (matterId, formData, onUploadProgress) =>
    apiService.upload(
      `/matters/${matterId}/documents`,
      formData,
      onUploadProgress,
    ),

  deleteDocument: (matterId, documentId) =>
    apiService.delete(`/matters/${matterId}/documents/${documentId}`),

  getDocuments: (matterId) => apiService.get(`/matters/${matterId}/documents`),

  // ======================
  // COLLABORATION & COMMENTS
  // ======================
  addComment: (matterId, comment) =>
    apiService.post(`/matters/${matterId}/comments`, { comment }),

  getComments: (matterId) => apiService.get(`/matters/${matterId}/comments`),

  deleteComment: (matterId, commentId) =>
    apiService.delete(`/matters/${matterId}/comments/${commentId}`),

  // ======================
  // TASK & EVENT MANAGEMENT
  // ======================
  addTask: (matterId, taskData) =>
    apiService.post(`/matters/${matterId}/tasks`, taskData),

  getTasks: (matterId) => apiService.get(`/matters/${matterId}/tasks`),

  addEvent: (matterId, eventData) =>
    apiService.post(`/matters/${matterId}/events`, eventData),

  getEvents: (matterId) => apiService.get(`/matters/${matterId}/events`),

  // ======================
  // BILLING & FINANCIAL
  // ======================
  createInvoice: (matterId, invoiceData) =>
    apiService.post(`/matters/${matterId}/invoices`, invoiceData),

  getInvoices: (matterId) => apiService.get(`/matters/${matterId}/invoices`),

  updateBilling: (matterId, billingData) =>
    apiService.patch(`/matters/${matterId}/billing`, billingData),

  getBillingSummary: (matterId) =>
    apiService.get(`/matters/${matterId}/billing/summary`),

  // ======================
  // REPORTING & ANALYTICS
  // ======================
  generateReport: (matterId, reportType) =>
    apiService.download(`/matters/${matterId}/reports/${reportType}`),

  getMatterInsights: (matterId) =>
    apiService.get(`/matters/${matterId}/insights`),

  getTimeEntries: (matterId) =>
    apiService.get(`/matters/${matterId}/time-entries`),

  logTimeEntry: (matterId, timeData) =>
    apiService.post(`/matters/${matterId}/time-entries`, timeData),

  // ======================
  // NOTIFICATIONS & ALERTS
  // ======================
  subscribeToMatter: (matterId) =>
    apiService.post(`/matters/${matterId}/subscribe`),

  unsubscribeFromMatter: (matterId) =>
    apiService.delete(`/matters/${matterId}/subscribe`),

  setAlert: (matterId, alertData) =>
    apiService.post(`/matters/${matterId}/alerts`, alertData),

  getAlerts: (matterId) => apiService.get(`/matters/${matterId}/alerts`),

  // ======================
  // PERMISSIONS & SHARING
  // ======================
  shareMatter: (matterId, userIds, permissions) =>
    apiService.post(`/matters/${matterId}/share`, { userIds, permissions }),

  updateSharing: (matterId, sharingData) =>
    apiService.patch(`/matters/${matterId}/share`, sharingData),

  getCollaborators: (matterId) =>
    apiService.get(`/matters/${matterId}/collaborators`),
};

export default matterService;
