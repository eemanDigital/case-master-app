import apiService from "../../../services/api";
import { buildQueryString } from "../../../utils/formatters";

const buildUrl = (endpoint, params = {}) => {
  const queryString = buildQueryString(params);
  return `${endpoint}${queryString}`;
};

// ============================================================
// Core Task CRUD
// ============================================================
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

// ============================================================
// Filtered Task Lists
// ============================================================
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

// ============================================================
// Task Assignees
// ============================================================
export const addAssignee = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/assignees`, data);
};

export const removeAssignee = (taskId, userId) => {
  return apiService.delete(`/tasks/${taskId}/assignees/${userId}`);
};

// ============================================================
// Task Responses
// ============================================================
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

// ============================================================
// Task Review Workflow
// ============================================================
export const submitTaskForReview = (taskId, data) => {
  return apiService.put(`/tasks/${taskId}/submit-review`, data);
};

export const reviewTask = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/review`, data);
};

export const forceCompleteTask = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/force-complete`, data);
};

// ============================================================
// Task Documents
// ============================================================
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

// ============================================================
// Task History & Access
// ============================================================
export const getTaskHistory = (taskId) => {
  return apiService.get(`/tasks/${taskId}/history`);
};

export const checkTaskAccess = (taskId) => {
  return apiService.get(`/tasks/${taskId}/access`);
};

// ============================================================
// Reminders  ← previously missing
// ============================================================
export const getReminders = (taskId) => {
  return apiService.get(`/tasks/${taskId}/reminders`);
};

export const createReminder = (taskId, data) => {
  return apiService.post(`/tasks/${taskId}/reminders`, data);
};

export const deleteReminder = (taskId, reminderId) => {
  return apiService.delete(`/tasks/${taskId}/reminders/${reminderId}`);
};

export const updateReminder = (taskId, reminderId, data) => {
  return apiService.patch(`/tasks/${taskId}/reminders/${reminderId}`, data);
};

// ============================================================
// Dependencies  ← previously missing
// ============================================================
export const getDependencies = (taskId) => {
  return apiService.get(`/tasks/${taskId}/dependencies`);
};

export const addDependency = (taskId, dependentTaskId) => {
  return apiService.post(`/tasks/${taskId}/dependencies`, { dependentTaskId });
};

export const removeDependency = (taskId, dependencyId) => {
  return apiService.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
};

export const getAvailableDependencies = (taskId) => {
  return apiService.get(`/tasks/${taskId}/available-dependencies`);
};

// ============================================================
// Enhanced Update  ← previously missing
// ============================================================
export const updateTaskEnhanced = (taskId, data) => {
  return apiService.patch(`/tasks/${taskId}/enhanced-update`, data);
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
  getReminders,
  createReminder,
  deleteReminder,
  updateReminder,
  getDependencies,
  addDependency,
  removeDependency,
  getAvailableDependencies,
  updateTaskEnhanced,
};
