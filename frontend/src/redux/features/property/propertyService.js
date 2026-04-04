import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

// ============================================
// PROPERTY MATTERS LISTING & SEARCH
// ============================================

export const getAllPropertyMatters = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/property${queryString}`);
};

export const searchPropertyMatters = (searchCriteria, params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.post(`/property/search${queryString}`, searchCriteria);
};

// ============================================
// PROPERTY DETAILS
// ============================================

export const getPropertyDetails = (matterId) => {
  return apiService.get(`/property/${matterId}/details`);
};

export const createPropertyDetails = (matterId, data) => {
  return apiService.post(`/property/${matterId}/details`, data);
};

export const updatePropertyDetails = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/details`, data);
};

export const deletePropertyDetails = (matterId) => {
  return apiService.delete(`/property/${matterId}/details`);
};

export const restorePropertyDetails = (matterId) => {
  return apiService.patch(`/property/${matterId}/details/restore`);
};

// ============================================
// PROPERTIES MANAGEMENT
// ============================================

export const addProperty = (matterId, data) => {
  return apiService.post(`/property/${matterId}/properties`, data);
};

export const updateProperty = (matterId, propertyId, data) => {
  return apiService.patch(
    `/property/${matterId}/properties/${propertyId}`,
    data,
  );
};

export const removeProperty = (matterId, propertyId) => {
  return apiService.delete(`/property/${matterId}/properties/${propertyId}`);
};

// ============================================
// PAYMENT SCHEDULE MANAGEMENT
// ============================================

export const addPayment = (matterId, data) => {
  return apiService.post(`/property/${matterId}/payments`, data);
};

export const updatePayment = (matterId, installmentId, data) => {
  return apiService.patch(
    `/property/${matterId}/payments/${installmentId}`,
    data,
  );
};

export const removePayment = (matterId, installmentId) => {
  return apiService.delete(`/property/${matterId}/payments/${installmentId}`);
};

// ============================================
// LEGAL PROCESSES MANAGEMENT
// ============================================

export const updateTitleSearch = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/title-search`, data);
};

export const updateGovernorsConsent = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/governors-consent`, data);
};

export const updateContractOfSale = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/contract-of-sale`, data);
};

export const updateLeaseAgreement = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/lease-agreement`, data);
};

export const recordPhysicalInspection = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/physical-inspection`, data);
};

// ============================================
// CONDITIONS MANAGEMENT
// ============================================

export const addCondition = (matterId, data) => {
  return apiService.post(`/property/${matterId}/conditions`, data);
};

export const updateCondition = (matterId, conditionId, data) => {
  return apiService.patch(
    `/property/${matterId}/conditions/${conditionId}`,
    data,
  );
};

export const removeCondition = (matterId, conditionId) => {
  return apiService.delete(`/property/${matterId}/conditions/${conditionId}`);
};

// ============================================
// TRANSACTION COMPLETION
// ============================================

export const recordCompletion = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/completion`, data);
};

// ============================================
// STATISTICS & REPORTS
// ============================================

export const getPropertyStats = () => {
  return apiService.get("/property/stats");
};

export const getPendingConsents = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/property/pending-consents${queryString}`);
};

// ============================================
// LEASE TRACKING & EXPIRATION MANAGEMENT
// ============================================

export const getExpiringLeases = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/property/leases/expiring${queryString}`);
};

export const getLeaseStats = () => {
  return apiService.get("/property/leases/stats");
};

export const updateLeaseAlertSettings = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/lease-alerts`, data);
};

export const addLeaseMilestone = (matterId, data) => {
  return apiService.post(`/property/${matterId}/lease-milestones`, data);
};

export const updateLeaseMilestone = (matterId, milestoneId, data) => {
  return apiService.patch(
    `/property/${matterId}/lease-milestones/${milestoneId}`,
    data,
  );
};

export const deleteLeaseMilestone = (matterId, milestoneId) => {
  return apiService.delete(`/property/${matterId}/lease-milestones/${milestoneId}`);
};

export const initiateRenewal = (matterId, data) => {
  return apiService.post(`/property/${matterId}/renewal/initiate`, data);
};

export const updateRenewalTracking = (matterId, data) => {
  return apiService.patch(`/property/${matterId}/renewal`, data);
};

export const addNegotiation = (matterId, data) => {
  return apiService.post(`/property/${matterId}/renewal/negotiation`, data);
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkUpdatePropertyMatters = (data) => {
  return apiService.patch("/property/bulk-update", data);
};

// ============================================
// EXPORT
// ============================================

const propertyService = {
  getAllPropertyMatters,
  searchPropertyMatters,
  getPropertyDetails,
  createPropertyDetails,
  updatePropertyDetails,
  deletePropertyDetails,
  restorePropertyDetails,
  addProperty,
  updateProperty,
  removeProperty,
  addPayment,
  updatePayment,
  removePayment,
  updateTitleSearch,
  updateGovernorsConsent,
  updateContractOfSale,
  updateLeaseAgreement,
  recordPhysicalInspection,
  addCondition,
  updateCondition,
  removeCondition,
  recordCompletion,
  getPropertyStats,
  getPendingConsents,
  bulkUpdatePropertyMatters,
  getExpiringLeases,
  getLeaseStats,
  updateLeaseAlertSettings,
  addLeaseMilestone,
  updateLeaseMilestone,
  deleteLeaseMilestone,
  initiateRenewal,
  updateRenewalTracking,
  addNegotiation,
};

export default propertyService;
