import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

// ============================================
// GENERAL MATTERS LISTING & SEARCH
// ============================================
export const getAllGeneralMatters = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/general${queryString}`);
};

export const searchGeneralMatters = (searchCriteria, params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.post(`/general/search${queryString}`, searchCriteria);
};

// ============================================
// STATISTICS & DASHBOARD
// ============================================
export const getGeneralStats = () => apiService.get("/general/stats");

// ============================================
// GENERAL DETAILS CRUD
// ============================================
export const getGeneralDetails = (matterId) =>
  apiService.get(`/general/${matterId}/details`);

export const createGeneralDetails = (matterId, data) =>
  apiService.post(`/general/${matterId}/details`, data);

export const updateGeneralDetails = (matterId, data) =>
  apiService.patch(`/general/${matterId}/details`, data);

export const deleteGeneralDetails = (matterId) =>
  apiService.delete(`/general/${matterId}/details`);

export const restoreGeneralDetails = (matterId) =>
  apiService.patch(`/general/${matterId}/details/restore`);

// ============================================
// REQUIREMENTS MANAGEMENT
// ============================================
export const addRequirement = (matterId, data) =>
  apiService.post(`/general/${matterId}/requirements`, data);

export const updateRequirement = (matterId, requirementId, data) =>
  apiService.patch(`/general/${matterId}/requirements/${requirementId}`, data);

export const deleteRequirement = (matterId, requirementId) =>
  apiService.delete(`/general/${matterId}/requirements/${requirementId}`);

// ============================================
// PARTIES MANAGEMENT
// ============================================
export const addParty = (matterId, data) =>
  apiService.post(`/general/${matterId}/parties`, data);

export const updateParty = (matterId, partyId, data) =>
  apiService.patch(`/general/${matterId}/parties/${partyId}`, data);

export const deleteParty = (matterId, partyId) =>
  apiService.delete(`/general/${matterId}/parties/${partyId}`);

// ============================================
// DELIVERABLES MANAGEMENT
// ============================================
export const addDeliverable = (matterId, data) =>
  apiService.post(`/general/${matterId}/deliverables`, data);

export const updateDeliverable = (matterId, deliverableId, data) =>
  apiService.patch(`/general/${matterId}/deliverables/${deliverableId}`, data);

export const deleteDeliverable = (matterId, deliverableId) =>
  apiService.delete(`/general/${matterId}/deliverables/${deliverableId}`);

// ============================================
// DOCUMENTS MANAGEMENT
// ============================================
export const addDocument = (matterId, data) =>
  apiService.post(`/general/${matterId}/documents`, data);

export const updateDocumentStatus = (matterId, documentId, data) =>
  apiService.patch(`/general/${matterId}/documents/${documentId}`, data);

export const deleteDocument = (matterId, documentId) =>
  apiService.delete(`/general/${matterId}/documents/${documentId}`);

// ============================================
// PROJECT STAGES (Nigerian Billing Pattern)
// ============================================
export const addProjectStage = (matterId, data) =>
  apiService.post(`/general/${matterId}/stages`, data);

export const updateProjectStage = (matterId, stageId, data) =>
  apiService.patch(`/general/${matterId}/stages/${stageId}`, data);

export const completeProjectStage = (matterId, stageId, data) =>
  apiService.patch(`/general/${matterId}/stages/${stageId}/complete`, data);

// ============================================
// DISBURSEMENTS MANAGEMENT
// ============================================
export const addDisbursement = (matterId, data) =>
  apiService.post(`/general/${matterId}/disbursements`, data);

export const updateDisbursement = (matterId, disbursementId, data) =>
  apiService.patch(
    `/general/${matterId}/disbursements/${disbursementId}`,
    data,
  );

export const deleteDisbursement = (matterId, disbursementId) =>
  apiService.delete(`/general/${matterId}/disbursements/${disbursementId}`);

// ============================================
// NBA STAMP MANAGEMENT
// ============================================
export const updateNBAStamp = (matterId, data) =>
  apiService.patch(`/general/${matterId}/nba-stamp`, data);

// ============================================
// SERVICE COMPLETION
// ============================================
export const completeGeneralService = (matterId, data) =>
  apiService.post(`/general/${matterId}/complete`, data);

// ============================================
// BULK OPERATIONS
// ============================================
export const bulkUpdateGeneralMatters = (data) =>
  apiService.patch("/general/bulk-update", data);

const generalService = {
  getAllGeneralMatters,
  searchGeneralMatters,
  getGeneralStats,
  getGeneralDetails,
  createGeneralDetails,
  updateGeneralDetails,
  deleteGeneralDetails,
  restoreGeneralDetails,
  addRequirement,
  updateRequirement,
  deleteRequirement,
  addParty,
  updateParty,
  deleteParty,
  addDeliverable,
  updateDeliverable,
  deleteDeliverable,
  addDocument,
  updateDocumentStatus,
  deleteDocument,
  addProjectStage,
  updateProjectStage,
  completeProjectStage,
  addDisbursement,
  updateDisbursement,
  deleteDisbursement,
  updateNBAStamp,
  completeGeneralService,
  bulkUpdateGeneralMatters,
};

export default generalService;
