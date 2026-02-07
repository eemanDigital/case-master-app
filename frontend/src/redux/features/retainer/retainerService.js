import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

export const getAllRetainerMatters = (params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.get(`/retainers${queryString}`);
};

export const searchRetainerMatters = (searchCriteria, params = {}) => {
  const queryString = buildQueryString(params);
  return apiService.post(`/retainers/search${queryString}`, searchCriteria);
};

export const getRetainerStats = () => apiService.get("/retainers/stats");
export const getExpiringRetainers = (params = {}) =>
  apiService.get(`/retainers/expiring${buildQueryString(params)}`);
export const getPendingRequests = (params = {}) =>
  apiService.get(`/retainers/pending-requests${buildQueryString(params)}`);
export const getRetainerDetails = (matterId) =>
  apiService.get(`/retainers/${matterId}/details`);
export const createRetainerDetails = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/details`, data);
export const updateRetainerDetails = (matterId, data) =>
  apiService.patch(`/retainers/${matterId}/details`, data);
export const deleteRetainerDetails = (matterId) =>
  apiService.delete(`/retainers/${matterId}/details`);
export const restoreRetainerDetails = (matterId) =>
  apiService.patch(`/retainers/${matterId}/details/restore`);
export const addService = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/services`, data);
export const updateService = (matterId, serviceId, data) =>
  apiService.patch(`/retainers/${matterId}/services/${serviceId}`, data);
export const removeService = (matterId, serviceId) =>
  apiService.delete(`/retainers/${matterId}/services/${serviceId}`);
export const updateServiceUsage = (matterId, serviceId, data) =>
  apiService.patch(`/retainers/${matterId}/services/${serviceId}/usage`, data);
export const addDisbursement = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/disbursements`, data);
export const updateDisbursement = (matterId, disbursementId, data) =>
  apiService.patch(
    `/retainers/${matterId}/disbursements/${disbursementId}`,
    data,
  );
export const deleteDisbursement = (matterId, disbursementId) =>
  apiService.delete(`/retainers/${matterId}/disbursements/${disbursementId}`);
export const addCourtAppearance = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/court-appearances`, data);
export const logActivity = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/activities`, data);
export const addRequest = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/requests`, data);
export const updateRequest = (matterId, requestId, data) =>
  apiService.patch(`/retainers/${matterId}/requests/${requestId}`, data);
export const deleteRequest = (matterId, requestId) =>
  apiService.delete(`/retainers/${matterId}/requests/${requestId}`);
export const updateNBAStamp = (matterId, data) =>
  apiService.patch(`/retainers/${matterId}/nba-stamp`, data);
export const renewRetainer = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/renew`, data);
export const terminateRetainer = (matterId, data) =>
  apiService.post(`/retainers/${matterId}/terminate`, data);
export const getRetainerSummary = (matterId) =>
  apiService.get(`/retainers/${matterId}/summary`);
export const bulkUpdateRetainerMatters = (data) =>
  apiService.patch("/retainers/bulk-update", data);

const retainerService = {
  getAllRetainerMatters,
  searchRetainerMatters,
  getRetainerStats,
  getExpiringRetainers,
  getPendingRequests,
  getRetainerDetails,
  createRetainerDetails,
  updateRetainerDetails,
  deleteRetainerDetails,
  restoreRetainerDetails,
  addService,
  updateService,
  removeService,
  updateServiceUsage,
  addDisbursement,
  updateDisbursement,
  deleteDisbursement,
  addCourtAppearance,
  logActivity,
  addRequest,
  updateRequest,
  deleteRequest,
  updateNBAStamp,
  renewRetainer,
  terminateRetainer,
  getRetainerSummary,
  bulkUpdateRetainerMatters,
};

export default retainerService;
