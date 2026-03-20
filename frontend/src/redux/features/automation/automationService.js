import apiService from "../../../services/api";

const buildUrl = (endpoint, params = {}) => {
  if (!params || Object.keys(params).length === 0) return endpoint;
  const queryString = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${endpoint}${queryString ? `?${queryString}` : ""}`;
};

export const getAutomations = (params = {}) => {
  return apiService.get(buildUrl("/automations", params));
};

export const getRecipes = (params = {}) => {
  return apiService.get(buildUrl("/automations/recipes", params));
};

export const getAutomation = (id) => {
  return apiService.get(`/automations/${id}`);
};

export const createAutomation = (data) => {
  return apiService.post("/automations", data);
};

export const updateAutomation = (id, data) => {
  return apiService.patch(`/automations/${id}`, data);
};

export const deleteAutomation = (id) => {
  return apiService.delete(`/automations/${id}`);
};

export const toggleAutomation = (id) => {
  return apiService.post(`/automations/${id}/toggle`);
};

export const executeAutomation = (id, data = {}) => {
  return apiService.post(`/automations/${id}/execute`, data);
};

export const getAutomationLogs = (id, params = {}) => {
  return apiService.get(buildUrl(`/automations/${id}/logs`, params));
};

export const getAutomationStats = () => {
  return apiService.get("/automations/stats");
};

export const applyRecipe = (recipeId, data = {}) => {
  return apiService.post(`/automations/recipes/${recipeId}/apply`, data);
};
