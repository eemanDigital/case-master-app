import api from "../../../services/api";

// ─── Template Library ────────────────────────────────────────────────────────
// IMPORTANT: api.get/post/patch/delete already return res.data directly.
// Do NOT call .data on the result — it will be undefined.

export const getAllTemplates = async (params) => {
  return await api.get("/api/v1/templates", { params });
};

export const getFeaturedTemplates = async () => {
  return await api.get("/api/v1/templates/featured");
};

export const getTemplatesByPracticeArea = async (params) => {
  return await api.get("/api/v1/templates/by-practice-area", { params });
};

export const getTemplate = async (templateId) => {
  return await api.get(`/api/v1/templates/${templateId}`);
};

export const createTemplate = async (data) => {
  return await api.post("/api/v1/templates", data);
};

export const updateTemplate = async (id, data) => {
  return await api.patch(`/api/v1/templates/${id}`, data);
};

export const deleteTemplate = async (id) => {
  return await api.delete(`/api/v1/templates/${id}`);
};

export const duplicateTemplate = async (id) => {
  return await api.post(`/api/v1/templates/${id}/duplicate`);
};

// ─── Document Generation ─────────────────────────────────────────────────────

export const generateDocument = async (templateId, data) => {
  return await api.post(`/api/v1/templates/${templateId}/generate`, data);
};

export const getGeneratedDocuments = async (params) => {
  return await api.get("/api/v1/templates/documents", { params });
};

export const getGeneratedDocument = async (id) => {
  return await api.get(`/api/v1/templates/documents/${id}`);
};

export const updateGeneratedDocument = async (id, data) => {
  return await api.patch(`/api/v1/templates/documents/${id}`, data);
};

// ─── Export ──────────────────────────────────────────────────────────────────
// Uses api.downloadPost because:
// 1. Route is POST (not GET)
// 2. format goes in request body
// 3. Returns raw blob — do NOT call .data on it

export const exportDocument = async (id, format) => {
  return await api.downloadPost(`/api/v1/templates/documents/${id}/export`, {
    format,
  });
};

// ─── Default export ───────────────────────────────────────────────────────────

const templateService = {
  getAllTemplates,
  getFeaturedTemplates,
  getTemplatesByPracticeArea,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  generateDocument,
  getGeneratedDocuments,
  getGeneratedDocument,
  updateGeneratedDocument,
  exportDocument,
};

export default templateService;
