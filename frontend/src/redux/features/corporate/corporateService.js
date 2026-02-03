import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

// ============================================
// CORPORATE MATTERS LISTING & SEARCH
// ============================================

export const getAllCorporateMatters = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/corporate${queryString}`);
};

export const searchCorporateMatters = (searchCriteria, params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.post(`/corporate/search${queryString}`, searchCriteria);
};

// ============================================
// CORPORATE DETAILS
// ============================================

export const getCorporateDetails = (matterId) => {
  return apiService.get(`/corporate/${matterId}/details`);
};

export const createCorporateDetails = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/details`, data);
};

export const updateCorporateDetails = (matterId, data) => {
  return apiService.patch(`/corporate/${matterId}/details`, data);
};

// ============================================
// PARTIES MANAGEMENT
// ============================================

export const getParties = (matterId) => {
  return apiService.get(`/corporate/${matterId}/parties`);
};

export const addParty = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/parties`, data);
};

export const updateParty = (matterId, partyId, data) => {
  return apiService.patch(`/corporate/${matterId}/parties/${partyId}`, data);
};

export const removeParty = (matterId, partyId) => {
  return apiService.delete(`/corporate/${matterId}/parties/${partyId}`);
};

// ============================================
// SHAREHOLDERS MANAGEMENT
// ============================================

export const getShareholders = (matterId) => {
  return apiService.get(`/corporate/${matterId}/shareholders`);
};

export const addShareholder = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/shareholders`, data);
};

export const updateShareholder = (matterId, shareholderId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/shareholders/${shareholderId}`,
    data,
  );
};

export const removeShareholder = (matterId, shareholderId) => {
  return apiService.delete(
    `/corporate/${matterId}/shareholders/${shareholderId}`,
  );
};

// ============================================
// DIRECTORS MANAGEMENT
// ============================================

export const getDirectors = (matterId) => {
  return apiService.get(`/corporate/${matterId}/directors`);
};

export const addDirector = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/directors`, data);
};

export const updateDirector = (matterId, directorId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/directors/${directorId}`,
    data,
  );
};

export const removeDirector = (matterId, directorId) => {
  return apiService.delete(`/corporate/${matterId}/directors/${directorId}`);
};

// ============================================
// MILESTONES MANAGEMENT
// ============================================

export const getMilestones = (matterId) => {
  return apiService.get(`/corporate/${matterId}/milestones`);
};

export const addMilestone = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/milestones`, data);
};

export const updateMilestone = (matterId, milestoneId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/milestones/${milestoneId}`,
    data,
  );
};

export const completeMilestone = (matterId, milestoneId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/milestones/${milestoneId}/complete`,
    data,
  );
};

export const removeMilestone = (matterId, milestoneId) => {
  return apiService.delete(`/corporate/${matterId}/milestones/${milestoneId}`);
};

// ============================================
// DUE DILIGENCE MANAGEMENT
// ============================================

export const getDueDiligence = (matterId) => {
  return apiService.get(`/corporate/${matterId}/due-diligence`);
};

export const updateDueDiligence = (matterId, data) => {
  return apiService.patch(`/corporate/${matterId}/due-diligence`, data);
};

// ============================================
// REGULATORY APPROVALS MANAGEMENT
// ============================================

export const getRegulatoryApprovals = (matterId) => {
  return apiService.get(`/corporate/${matterId}/regulatory-approvals`);
};

export const addRegulatoryApproval = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/regulatory-approvals`, data);
};

export const updateRegulatoryApproval = (matterId, approvalId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/regulatory-approvals/${approvalId}`,
    data,
  );
};

export const updateApprovalStatus = (matterId, approvalId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/regulatory-approvals/${approvalId}/status`,
    data,
  );
};

export const removeRegulatoryApproval = (matterId, approvalId) => {
  return apiService.delete(
    `/corporate/${matterId}/regulatory-approvals/${approvalId}`,
  );
};

// ============================================
// KEY AGREEMENTS MANAGEMENT
// ============================================

export const getKeyAgreements = (matterId) => {
  return apiService.get(`/corporate/${matterId}/agreements`);
};

export const addKeyAgreement = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/agreements`, data);
};

export const updateKeyAgreement = (matterId, agreementId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/agreements/${agreementId}`,
    data,
  );
};

export const removeKeyAgreement = (matterId, agreementId) => {
  return apiService.delete(`/corporate/${matterId}/agreements/${agreementId}`);
};

// ============================================
// COMPLIANCE REQUIREMENTS MANAGEMENT
// ============================================

export const getComplianceRequirements = (matterId) => {
  return apiService.get(`/corporate/${matterId}/compliance`);
};

export const addComplianceRequirement = (matterId, data) => {
  return apiService.post(`/corporate/${matterId}/compliance`, data);
};

export const updateComplianceRequirement = (matterId, requirementId, data) => {
  return apiService.patch(
    `/corporate/${matterId}/compliance/${requirementId}`,
    data,
  );
};

export const removeComplianceRequirement = (matterId, requirementId) => {
  return apiService.delete(
    `/corporate/${matterId}/compliance/${requirementId}`,
  );
};

// ============================================
// TRANSACTION CLOSING
// ============================================

export const recordClosing = (matterId, data) => {
  return apiService.patch(`/corporate/${matterId}/closing`, data);
};

// ============================================
// STATISTICS & REPORTS
// ============================================

export const getCorporateStats = () => {
  return apiService.get("/corporate/stats");
};

export const getPendingApprovals = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/corporate/pending-approvals${queryString}`);
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkUpdateCorporateMatters = (data) => {
  return apiService.patch("/corporate/bulk-update", data);
};

// ============================================
// EXPORT
// ============================================

const corporateService = {
  getAllCorporateMatters,
  searchCorporateMatters,
  getCorporateDetails,
  createCorporateDetails,
  updateCorporateDetails,
  getParties,
  addParty,
  updateParty,
  removeParty,
  getShareholders,
  addShareholder,
  updateShareholder,
  removeShareholder,
  getDirectors,
  addDirector,
  updateDirector,
  removeDirector,
  getMilestones,
  addMilestone,
  updateMilestone,
  completeMilestone,
  removeMilestone,
  getDueDiligence,
  updateDueDiligence,
  getRegulatoryApprovals,
  addRegulatoryApproval,
  updateRegulatoryApproval,
  updateApprovalStatus,
  removeRegulatoryApproval,
  getKeyAgreements,
  addKeyAgreement,
  updateKeyAgreement,
  removeKeyAgreement,
  getComplianceRequirements,
  addComplianceRequirement,
  updateComplianceRequirement,
  removeComplianceRequirement,
  recordClosing,
  getCorporateStats,
  getPendingApprovals,
  bulkUpdateCorporateMatters,
};

export default corporateService;
