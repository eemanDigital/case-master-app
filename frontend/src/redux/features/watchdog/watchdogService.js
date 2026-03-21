import apiService from "../../../services/api";

const buildUrl = (endpoint, params = {}) => {
  if (!params || Object.keys(params).length === 0) return endpoint;
  const queryString = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${endpoint}${queryString ? `?${queryString}` : ""}`;
};

export const getMonitoredEntities = (params = {}) => {
  return apiService.get(buildUrl("/watchdog/monitored", params));
};

export const getWatchdogAlerts = (params = {}) => {
  return apiService.get(buildUrl("/watchdog/alerts", params));
};

export const getWatchdogDashboard = () => {
  return apiService.get("/watchdog/dashboard");
};

export const addMonitoredEntity = (data) => {
  return apiService.post("/watchdog/monitored", data);
};

export const removeMonitoredEntity = (id) => {
  return apiService.delete(`/watchdog/monitored/${id}`);
};

export const checkEntityStatus = (id) => {
  return apiService.post(`/watchdog/check/${id}`);
};

export const dismissAlert = (id) => {
  return apiService.post(`/watchdog/alerts/${id}/dismiss`);
};

export const dismissAllAlerts = () => {
  return apiService.post("/watchdog/alerts/dismiss-all");
};

export const getWatchdogStats = () => {
  return apiService.get("/watchdog/stats");
};
