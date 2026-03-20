import apiService from "../../../services/api";

const buildUrl = (endpoint, params = {}) => {
  if (!params || Object.keys(params).length === 0) return endpoint;
  const queryString = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${endpoint}${queryString ? `?${queryString}` : ""}`;
};

export const getAllDeadlines = (params = {}) => {
  return apiService.get(buildUrl("/deadlines", params));
};

export const getDeadline = (id) => {
  return apiService.get(`/deadlines/${id}`);
};

export const createDeadline = (data) => {
  return apiService.post("/deadlines", data);
};

export const updateDeadline = (id, data) => {
  return apiService.patch(`/deadlines/${id}`, data);
};

export const deleteDeadline = (id) => {
  return apiService.delete(`/deadlines/${id}`);
};

export const completeDeadline = (id, data) => {
  return apiService.patch(`/deadlines/${id}/complete`, data || {});
};

export const extendDeadline = (id, data) => {
  return apiService.patch(`/deadlines/${id}/extend`, data);
};

export const getDeadlineStats = () => {
  return apiService.get("/deadlines/stats");
};

export const getPerformanceReport = (params = {}) => {
  return apiService.get(buildUrl("/deadlines/performance-report", params));
};

export const exportPerformanceReport = (data = {}) => {
  return apiService.downloadPost("/deadlines/performance-report/export", data);
};
