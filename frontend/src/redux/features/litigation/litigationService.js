import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

// ============================================
// LITIGATION MATTERS CRUD
// ============================================

export const getAllLitigationMatters = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/litigation${queryString}`);
};

export const searchLitigationMatters = (searchCriteria, params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.post(`/litigation/search${queryString}`, searchCriteria);
};

// ============================================
// LITIGATION DETAILS
// ============================================

export const getLitigationDetails = (matterId) => {
  return apiService.get(`/litigation/${matterId}/details`);
};

export const createLitigationDetails = (matterId, data) => {
  return apiService.post(`/litigation/${matterId}/details`, data);
};

export const updateLitigationDetails = (matterId, data) => {
  return apiService.patch(`/litigation/${matterId}/details`, data);
};

export const deleteLitigationDetails = (matterId) => {
  return apiService.delete(`/litigation/${matterId}/details`);
};

export const restoreLitigationDetails = (matterId) => {
  return apiService.patch(`/litigation/${matterId}/details/restore`);
};

// ============================================
// HEARINGS MANAGEMENT - UPDATED
// ============================================

/**
 * Get upcoming hearings - NOW RETURNS INDIVIDUAL HEARING RECORDS
 *
 * Response format:
 * {
 *   status: "success",
 *   results: 25,
 *   stats: {
 *     total: 25,
 *     today: 3,
 *     thisWeek: 8,
 *     pending: 10,
 *     completed: 15
 *   },
 *   data: [
 *     {
 *       _id: "hearing123",  // Individual hearing ID
 *       date: "2024-01-15",
 *       outcome: "adjourned",
 *       notes: "...",
 *       nextHearingDate: "2024-02-20",
 *       lawyerPresent: [...],
 *       suitNo: "FHC/L/123/2024",
 *       courtName: "federal high court",
 *       matter: {...},
 *       displayDate: "2024-02-20"
 *     },
 *     // ... more individual hearing records
 *   ]
 * }
 */
export const getUpcomingHearings = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/litigation/upcoming-hearings${queryString}`);
};

/**
 * Get ALL hearings for a specific matter
 * Returns complete hearing history (past, present, future)
 *
 * Response format:
 * {
 *   status: "success",
 *   results: 10,
 *   data: {
 *     litigationDetail: { ... },
 *     hearings: [
 *       { _id, date, outcome, notes, nextHearingDate, ... },
 *       ...
 *     ],
 *     stats: { total, past, today, upcoming, completed, pending }
 *   }
 * }
 */
export const getMatterHearings = (matterId) => {
  return apiService.get(`/litigation/${matterId}/hearings`);
};

export const addHearing = (matterId, hearingData) => {
  return apiService.post(`/litigation/${matterId}/hearings`, hearingData);
};

export const updateHearing = (matterId, hearingId, hearingData) => {
  return apiService.patch(
    `/litigation/${matterId}/hearings/${hearingId}`,
    hearingData,
  );
};

export const deleteHearing = (matterId, hearingId) => {
  return apiService.delete(`/litigation/${matterId}/hearings/${hearingId}`);
};

// ============================================
// COURT ORDERS
// ============================================

export const addCourtOrder = (matterId, orderData) => {
  return apiService.post(`/litigation/${matterId}/court-orders`, orderData);
};

export const updateCourtOrder = (matterId, orderId, orderData) => {
  return apiService.patch(
    `/litigation/${matterId}/court-orders/${orderId}`,
    orderData,
  );
};

export const deleteCourtOrder = (matterId, orderId) => {
  return apiService.delete(`/litigation/${matterId}/court-orders/${orderId}`);
};

// ============================================
// PROCESSES FILED
// ============================================

export const addProcessFiled = (matterId, data) => {
  return apiService.post(`/litigation/${matterId}/processes`, data);
};

export const updateProcessFiled = (
  matterId,
  party,
  processIndex,
  processData,
) => {
  return apiService.patch(
    `/litigation/${matterId}/processes/${party}/${processIndex}`,
    processData,
  );
};

export const deleteProcessFiled = (matterId, party, processIndex) => {
  return apiService.delete(
    `/litigation/${matterId}/processes/${party}/${processIndex}`,
  );
};

// ============================================
// CASE OUTCOMES
// ============================================

export const recordJudgment = (matterId, judgmentData) => {
  return apiService.patch(`/litigation/${matterId}/judgment`, judgmentData);
};

export const recordSettlement = (matterId, settlementData) => {
  return apiService.patch(`/litigation/${matterId}/settlement`, settlementData);
};

export const fileAppeal = (matterId, appealData) => {
  return apiService.patch(`/litigation/${matterId}/appeal`, appealData);
};

// ============================================
// STATISTICS & REPORTS
// ============================================

export const getLitigationStats = () => {
  return apiService.get("/litigation/stats");
};

export const getLitigationDashboard = () => {
  return apiService.get("/litigation/dashboard");
};

// ============================================
// EXPORT
// ============================================

export const exportLitigationMatters = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/litigation/export${queryString}`, {
    responseType: "blob",
  });
};

export const exportSingleMatter = (matterId, format = "pdf") => {
  return apiService.get(`/litigation/${matterId}/export`, {
    params: { format },
    responseType: "blob",
  });
};

// ============================================
// ADDITIONAL LITIGATION OPERATIONS
// ============================================

export const addJudgment = (matterId, judgmentData) => {
  return apiService.post(`/litigation/${matterId}/judgment`, judgmentData);
};

export const updateJudgment = (matterId, judgmentId, judgmentData) => {
  return apiService.patch(
    `/litigation/${matterId}/judgment/${judgmentId}`,
    judgmentData,
  );
};

export const deleteJudgment = (matterId, judgmentId) => {
  return apiService.delete(`/litigation/${matterId}/judgment/${judgmentId}`);
};

export const addSettlement = (matterId, settlementData) => {
  return apiService.post(`/litigation/${matterId}/settlement`, settlementData);
};

export const updateSettlement = (matterId, settlementId, settlementData) => {
  return apiService.patch(
    `/litigation/${matterId}/settlement/${settlementId}`,
    settlementData,
  );
};

export const deleteSettlement = (matterId, settlementId) => {
  return apiService.delete(
    `/litigation/${matterId}/settlement/${settlementId}`,
  );
};

export const addAppeal = (matterId, appealData) => {
  return apiService.post(`/litigation/${matterId}/appeal`, appealData);
};

export const updateAppeal = (matterId, appealId, appealData) => {
  return apiService.patch(
    `/litigation/${matterId}/appeal/${appealId}`,
    appealData,
  );
};

export const deleteAppeal = (matterId, appealId) => {
  return apiService.delete(`/litigation/${matterId}/appeal/${appealId}`);
};

export const getLitigationTimeline = (matterId) => {
  return apiService.get(`/litigation/${matterId}/timeline`);
};

export const addLitigationDocument = (matterId, documentData) => {
  return apiService.post(`/litigation/${matterId}/documents`, documentData);
};

export const getLitigationDocuments = (matterId, params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/litigation/${matterId}/documents${queryString}`);
};

export const deleteLitigationDocument = (matterId, documentId) => {
  return apiService.delete(`/litigation/${matterId}/documents/${documentId}`);
};

export const getLitigationParties = (matterId) => {
  return apiService.get(`/litigation/${matterId}/parties`);
};

export const addLitigationParty = (matterId, partyData) => {
  return apiService.post(`/litigation/${matterId}/parties`, partyData);
};

export const updateLitigationParty = (matterId, partyId, partyData) => {
  return apiService.patch(
    `/litigation/${matterId}/parties/${partyId}`,
    partyData,
  );
};

export const deleteLitigationParty = (matterId, partyId) => {
  return apiService.delete(`/litigation/${matterId}/parties/${partyId}`);
};

// ============================================
// LITIGATION STEPS
// ============================================

export const getLitigationSteps = (matterId) => {
  return apiService.get(`/litigation/${matterId}/steps`);
};

export const addLitigationStep = (matterId, stepData) => {
  return apiService.post(`/litigation/${matterId}/steps`, stepData);
};

export const updateLitigationStep = (matterId, stepId, stepData) => {
  return apiService.patch(`/litigation/${matterId}/steps/${stepId}`, stepData);
};

export const deleteLitigationStep = (matterId, stepId) => {
  return apiService.delete(`/litigation/${matterId}/steps/${stepId}`);
};

export const updateLitigationStepStatus = (matterId, stepId, status) => {
  return apiService.patch(`/litigation/${matterId}/steps/${stepId}/status`, { status });
};

export const reorderLitigationSteps = (matterId, stepIds) => {
  return apiService.patch(`/litigation/${matterId}/steps/reorder`, { stepIds });
};

// ============================================
// COMPREHENSIVE SERVICE OBJECT
// ============================================

const litigationService = {
  // Core CRUD
  getAllLitigationMatters,
  searchLitigationMatters,
  getLitigationDetails,
  createLitigationDetails,
  updateLitigationDetails,
  deleteLitigationDetails,
  restoreLitigationDetails,

  // Hearings - UPDATED to handle individual records
  getUpcomingHearings,
  getMatterHearings, // NEW: Get all hearings for specific matter
  addHearing,
  updateHearing,
  deleteHearing,

  // Court Orders
  addCourtOrder,
  updateCourtOrder,
  deleteCourtOrder,

  // Processes Filed
  addProcessFiled,
  updateProcessFiled,

  // Case Outcomes
  recordJudgment,
  recordSettlement,
  fileAppeal,

  // Additional Case Outcome Operations
  addJudgment,
  updateJudgment,
  deleteJudgment,
  addSettlement,
  updateSettlement,
  deleteSettlement,
  addAppeal,
  updateAppeal,
  deleteAppeal,

  // Statistics & Reports
  getLitigationStats,
  getLitigationDashboard,

  // Export
  exportLitigationMatters,
  exportSingleMatter,

  // Additional Features
  getLitigationTimeline,
  addLitigationDocument,
  getLitigationDocuments,
  deleteLitigationDocument,
  getLitigationParties,
  addLitigationParty,
  updateLitigationParty,
  deleteLitigationParty,

  // Litigation Steps
  getLitigationSteps,
  addLitigationStep,
  updateLitigationStep,
  deleteLitigationStep,
  updateLitigationStepStatus,
  reorderLitigationSteps,
};

export default litigationService;
