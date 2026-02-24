import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

const buildUrl = (endpoint, params = {}) => {
  const queryString = buildQueryString(params);
  return `${endpoint}${queryString}`;
};

export const getAllTasks = (params = {}) => {
  return apiService.get(buildUrl("/tasks", params));
};

export const getTask = (taskId) => {
  return apiService.get(`/tasks/${taskId}`);
};

export const createTask = (data) => {
  return apiService.post("/tasks", data);
};

export const updateTask = (taskId, data) => {
  return apiService.patch(`/tasks/${taskId}`, data);
};

export const deleteTask = (taskId) => {
  return apiService.delete(`/tasks/${taskId}`);
};

export const getMyTasks = (params = {}) => {
  return apiService.get(buildUrl("/tasks/my-tasks", params));
};

export const getOverdueTasks = (params = {}) => {
  return apiService.get(buildUrl("/tasks/overdue", params));
};

export const getTasksPendingReview = (params = {}) => {
  return apiService.get(buildUrl("/tasks/pending-review", params));
};

export const getTasksByAssignee = (userId, params = {}) => {
  return apiService.get(buildUrl(`/tasks/assignee/${userId}`, params));
};

export const addAssignee = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/assignees`, data);
};

export const removeAssignee = (taskId, userId) => {
  return apiService.delete(`/tasks/${taskId}/assignees/${userId}`);
};

export const submitTaskResponse = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/responses`, data);
};

export const deleteTaskResponse = (taskId, responseId) => {
  return apiService.delete(`/tasks/${taskId}/responses/${responseId}`);
};

export const reviewTaskResponse = (taskId, responseIndex, data) => {
  return apiService.post(
    `/tasks/${taskId}/responses/${responseIndex}/review`,
    data,
  );
};

export const submitTaskForReview = (taskId, data) => {
  return apiService.put(`/tasks/${taskId}/submit-review`, data);
};

export const reviewTask = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/review`, data);
};

export const forceCompleteTask = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/force-complete`, data);
};

export const getTaskDocuments = (taskId) => {
  return apiService.get(`/tasks/${taskId}/documents`);
};

export const uploadReferenceDocuments = (taskId, formData) => {
  return apiService.upload(`/tasks/${taskId}/reference-documents`, formData);
};

export const uploadResponseDocuments = (taskId, formData) => {
  return apiService.upload(`/tasks/${taskId}/response-documents`, formData);
};

export const refreshFileDownloadUrl = (fileId) => {
  return apiService.get(`/tasks/files/${fileId}/refresh-url`);
};

export const getTaskHistory = (taskId) => {
  return apiService.get(`/tasks/${taskId}/history`);
};

export const checkTaskAccess = (taskId) => {
  return apiService.get(`/tasks/${taskId}/access`);
};

export default {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
  getOverdueTasks,
  getTasksPendingReview,
  getTasksByAssignee,
  addAssignee,
  removeAssignee,
  submitTaskResponse,
  deleteTaskResponse,
  reviewTaskResponse,
  submitTaskForReview,
  reviewTask,
  forceCompleteTask,
  getTaskDocuments,
  uploadReferenceDocuments,
  uploadResponseDocuments,
  refreshFileDownloadUrl,
  getTaskHistory,
  checkTaskAccess,
};
