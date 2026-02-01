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
// HEARINGS MANAGEMENT
// ============================================

export const getUpcomingHearings = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/litigation/upcoming-hearings${queryString}`);
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
  // Expecting { party, processData } structure
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

const litigationService = {
  getAllLitigationMatters,
  searchLitigationMatters,
  getLitigationDetails,
  createLitigationDetails,
  updateLitigationDetails,
  deleteLitigationDetails,
  restoreLitigationDetails,
  getUpcomingHearings,
  addHearing,
  updateHearing,
  deleteHearing,
  addCourtOrder,
  updateCourtOrder,
  deleteCourtOrder,
  addProcessFiled,
  updateProcessFiled,
  recordJudgment,
  recordSettlement,
  fileAppeal,
  getLitigationStats,
  getLitigationDashboard,
  exportLitigationMatters,
  exportSingleMatter,
};

export default litigationService;
