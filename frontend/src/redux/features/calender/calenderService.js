import apiService from "../../../services/api";

// ============================================
// CALENDAR EVENTS API SERVICE
// ============================================

const calendarService = {
  // ============================================
  // CALENDAR EVENTS
  // ============================================

  /**
   * Create a new calendar event
   * @param {Object} eventData - Event data
   * @returns {Promise} Response data
   */
  createEvent: async (eventData) => {
    return apiService.post("/calendar/events", eventData);
  },

  /**
   * Get all calendar events with filters
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  getAllEvents: async (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null),
    ).toString();
    return apiService.get(`/calendar/events?${queryString}`);
  },

  /**
   * Get single event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise} Response data
   */
  getEvent: async (eventId) => {
    return apiService.get(`/calendar/events/${eventId}`);
  },

  /**
   * Update calendar event
   * @param {string} eventId - Event ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Response data
   */
  updateEvent: async (eventId, updateData) => {
    return apiService.patch(`/calendar/events/${eventId}`, updateData);
  },

  /**
   * Delete (soft delete) calendar event
   * @param {string} eventId - Event ID
   * @returns {Promise} Response data
   */
  deleteEvent: async (eventId) => {
    return apiService.delete(`/calendar/events/${eventId}`);
  },

  /**
   * Restore deleted event
   * @param {string} eventId - Event ID
   * @returns {Promise} Response data
   */
  restoreEvent: async (eventId) => {
    return apiService.patch(`/calendar/events/${eventId}/restore`);
  },

  /**
   * Update event status
   * @param {string} eventId - Event ID
   * @param {Object} statusData - Status update data
   * @returns {Promise} Response data
   */
  updateEventStatus: async (eventId, statusData) => {
    return apiService.patch(`/calendar/events/${eventId}/status`, statusData);
  },

  /**
   * Respond to event invitation
   * @param {string} eventId - Event ID
   * @param {Object} responseData - Response data
   * @returns {Promise} Response data
   */
  respondToInvitation: async (eventId, responseData) => {
    return apiService.patch(
      `/calendar/events/${eventId}/respond`,
      responseData,
    );
  },

  /**
   * Get my calendar events
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  getMyCalendar: async (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null),
    ).toString();
    return apiService.get(`/calendar/my-calendar?${queryString}`);
  },

  /**
   * Get upcoming events
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  getUpcomingEvents: async (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null),
    ).toString();
    return apiService.get(`/calendar/upcoming?${queryString}`);
  },

  /**
   * Get events by matter
   * @param {string} matterId - Matter ID
   * @returns {Promise} Response data
   */
  getEventsByMatter: async (matterId) => {
    return apiService.get(`/calendar/matter/${matterId}`);
  },

  /**
   * Get calendar statistics
   * @returns {Promise} Response data
   */
  getCalendarStats: async () => {
    return apiService.get("/calendar/stats");
  },

  // ============================================
  // CALENDAR SYNC OPERATIONS
  // ============================================

  /**
   * Sync hearing to calendar
   * @param {Object} syncData - Sync data containing litigationDetail, hearing, and matter
   * @returns {Promise} Response data
   */
  syncHearingToCalendar: async (syncData) => {
    return apiService.post("/calendar/sync/hearing", syncData);
  },

  /**
   * Update next hearing date in calendar
   * @param {Object} updateData - Update data containing litigationDetail and matter
   * @returns {Promise} Response data
   */
  updateNextHearingDate: async (updateData) => {
    return apiService.patch("/calendar/sync/next-hearing", updateData);
  },

  /**
   * Mark past hearings as completed
   * @param {Object} completionData - Completion data containing litigationDetail and matter
   * @returns {Promise} Response data
   */
  completeHearings: async (completionData) => {
    return apiService.patch("/calendar/sync/complete-hearings", completionData);
  },

  /**
   * Create deadline from court order
   * @param {Object} deadlineData - Deadline data containing litigationDetail, courtOrder, and matter
   * @returns {Promise} Response data
   */
  createCourtOrderDeadline: async (deadlineData) => {
    return apiService.post("/calendar/sync/court-order-deadline", deadlineData);
  },

  // ============================================
  // BLOCKED DATES
  // ============================================

  /**
   * Create a blocked date
   * @param {Object} blockData - Block data
   * @returns {Promise} Response data
   */
  createBlockedDate: async (blockData) => {
    return apiService.post("/calendar/blocked-dates", blockData);
  },

  /**
   * Get all blocked dates
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  getAllBlockedDates: async (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null),
    ).toString();
    return apiService.get(`/calendar/blocked-dates?${queryString}`);
  },

  /**
   * Get single blocked date by ID
   * @param {string} blockId - Block ID
   * @returns {Promise} Response data
   */
  getBlockedDate: async (blockId) => {
    return apiService.get(`/calendar/blocked-dates/${blockId}`);
  },

  /**
   * Update blocked date
   * @param {string} blockId - Block ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Response data
   */
  updateBlockedDate: async (blockId, updateData) => {
    return apiService.patch(`/calendar/blocked-dates/${blockId}`, updateData);
  },

  /**
   * Delete blocked date
   * @param {string} blockId - Block ID
   * @returns {Promise} Response data
   */
  deleteBlockedDate: async (blockId) => {
    return apiService.delete(`/calendar/blocked-dates/${blockId}`);
  },

  /**
   * Restore deleted blocked date
   * @param {string} blockId - Block ID
   * @returns {Promise} Response data
   */
  restoreBlockedDate: async (blockId) => {
    return apiService.patch(`/calendar/blocked-dates/${blockId}/restore`);
  },

  /**
   * Grant exception to user
   * @param {string} blockId - Block ID
   * @param {Object} exceptionData - Exception data
   * @returns {Promise} Response data
   */
  grantException: async (blockId, exceptionData) => {
    return apiService.post(
      `/calendar/blocked-dates/${blockId}/exceptions`,
      exceptionData,
    );
  },

  /**
   * Revoke exception from user
   * @param {string} blockId - Block ID
   * @param {string} userId - User ID
   * @returns {Promise} Response data
   */
  revokeException: async (blockId, userId) => {
    return apiService.delete(
      `/calendar/blocked-dates/${blockId}/exceptions/${userId}`,
    );
  },

  /**
   * Check if date is blocked
   * @param {Object} checkData - Date check data
   * @returns {Promise} Response data
   */
  checkIfBlocked: async (checkData) => {
    return apiService.post("/calendar/blocked-dates/check", checkData);
  },

  /**
   * Get blocked dates in range
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  getBlockedDatesInRange: async (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null),
    ).toString();
    return apiService.get(`/calendar/blocked-dates/range?${queryString}`);
  },

  /**
   * Get my blocked dates
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  getMyBlockedDates: async (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null),
    ).toString();
    return apiService.get(`/calendar/blocked-dates/my-blocks?${queryString}`);
  },
};

export default calendarService;
