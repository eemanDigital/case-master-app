import apiService from "../../../services/api";

const buildUrl = (endpoint, params = {}) => {
  if (!params || Object.keys(params).length === 0) return endpoint;
  const queryString = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${endpoint}${queryString ? `?${queryString}` : ""}`;
};

export const getAllEntities = (params = {}) => {
  return apiService.get(buildUrl("/compliance/tracker", params));
};

export const getEntity = (id) => {
  return apiService.get(`/compliance/tracker/${id}`);
};

export const createEntity = (data) => {
  return apiService.post("/compliance/tracker", data);
};

export const updateEntity = (id, data) => {
  return apiService.patch(`/compliance/tracker/${id}`, data);
};

export const deleteEntity = (id) => {
  return apiService.delete(`/compliance/tracker/${id}`);
};

export const getComplianceStats = () => {
  return apiService.get("/compliance/tracker/stats");
};

export const getDashboard = () => {
  return apiService.get("/compliance/tracker/dashboard");
};

export const getEntityPenalty = (id) => {
  return apiService.get(`/compliance/tracker/${id}/penalty`);
};

export const markCompliancePaid = (id, data) => {
  return apiService.post(`/compliance/tracker/${id}/mark-paid`, data);
};
