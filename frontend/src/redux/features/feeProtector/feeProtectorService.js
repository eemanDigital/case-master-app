import apiService from "../../../services/api";

export const getProtectedDocuments = (params = {}) => {
  const queryString = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const endpoint = `/fee-protector${queryString ? `?${queryString}` : ""}`;
  return apiService.get(endpoint);
};

export const getProtectedDocument = (id) => {
  return apiService.get(`/fee-protector/${id}`);
};

export const uploadProtectedDocument = (data) => {
  return apiService.upload("/fee-protector", data);
};

export const updateProtectedDocument = (id, data) => {
  return apiService.patch(`/fee-protector/${id}`, data);
};

export const deleteProtectedDocument = (id) => {
  return apiService.delete(`/fee-protector/${id}`);
};

export const confirmPayment = (id, data) => {
  return apiService.post(`/fee-protector/${id}/confirm-payment`, data);
};

export const verifyPayment = (id, data) => {
  return apiService.post(`/fee-protector/${id}/verify-payment`, data);
};

export const getProtectedDocumentPreview = (id) => {
  return apiService.get(`/fee-protector/${id}/preview`);
};

export const downloadWatermarkedDocument = (id) => {
  return apiService.download(`/fee-protector/${id}/download`);
};

export const getFeeProtectorStats = () => {
  return apiService.get("/fee-protector/stats");
};
