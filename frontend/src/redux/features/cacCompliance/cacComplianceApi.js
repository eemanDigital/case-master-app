import axios from 'axios';

const API_URL = '/api/v1/cac-compliance';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const cacComplianceApi = {
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getCompanies: async (params = {}) => {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  getCompany: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  createCompany: async (data) => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  updateCompany: async (id, data) => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },

  runAudit: async (id) => {
    const response = await api.post(`/companies/${id}/audit`);
    return response.data;
  },

  getAtRisk: async () => {
    const response = await api.get('/at-risk');
    return response.data;
  },

  getDeadlines: async () => {
    const response = await api.get('/deadlines');
    return response.data;
  },

  resolveCheck: async (id) => {
    const response = await api.put(`/checks/${id}/resolve`);
    return response.data;
  },

  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getOverdueTasks: async () => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  getTasksByCompany: async (companyId) => {
    const response = await api.get(`/tasks/company/${companyId}`);
    return response.data;
  },

  getLetters: async (params = {}) => {
    const response = await api.get('/letters', { params });
    return response.data;
  },

  generateLetter: async (data) => {
    const response = await api.post('/letters/generate', data);
    return response.data;
  },

  updateLetter: async (id, data) => {
    const response = await api.put(`/letters/${id}`, data);
    return response.data;
  },

  markLetterSent: async (id, sentTo) => {
    const response = await api.post(`/letters/${id}/send`, { sentTo });
    return response.data;
  },

  deleteLetter: async (id) => {
    const response = await api.delete(`/letters/${id}`);
    return response.data;
  },

  getLettersByCompany: async (companyId) => {
    const response = await api.get(`/letters/company/${companyId}`);
    return response.data;
  },

  getAlerts: async () => {
    const response = await api.get('/alerts');
    return response.data;
  },

  getUnreadAlertCount: async () => {
    const response = await api.get('/alerts/unread-count');
    return response.data;
  },

  markAlertRead: async (id) => {
    const response = await api.put(`/alerts/${id}/read`);
    return response.data;
  },

  markAllAlertsRead: async () => {
    const response = await api.post('/alerts/read-all');
    return response.data;
  },

  getCompanyStats: async () => {
    const response = await api.get('/companies/stats');
    return response.data;
  },
};

export default cacComplianceApi;
