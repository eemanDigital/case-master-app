import axios from "axios";

// Constants
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
const JWT_KEY = "jwt"; // Unified storage key

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Configured once for all requests
});

// Helper: Get token from storage
const getToken = () => {
  return localStorage.getItem(JWT_KEY) || sessionStorage.getItem(JWT_KEY);
};

// Request interceptor: Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // Modern best practice: Check if headers object exists
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401: {
          // Logic wrapped in {} to avoid "Lexical declaration" error
          apiService.removeToken();

          const currentPath = window.location.pathname;
          const isAuthPage =
            currentPath === "/login" ||
            currentPath === "/users/login" ||
            currentPath === "/register";

          if (!isAuthPage) {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
          break;
        }

        case 403:
          console.error("Forbidden: You do not have permission.");
          break;

        case 422:
          console.error("Validation Error:", data.errors || data.message);
          break;

        case 500:
          console.error("Internal Server Error:", data.message);
          break;

        default:
          console.error(`Error ${status}:`, data.message || "Unknown error");
      }
    } else if (error.request) {
      console.error("Network Error: No response received from server.");
    } else {
      console.error("Request Configuration Error:", error.message);
    }

    return Promise.reject(error);
  },
);

// API Service Methods
const apiService = {
  get: (url, config = {}) => api.get(url, config).then((res) => res.data),

  post: (url, data = {}, config = {}) =>
    api.post(url, data, config).then((res) => res.data),

  put: (url, data = {}, config = {}) =>
    api.put(url, data, config).then((res) => res.data),

  patch: (url, data = {}, config = {}) =>
    api.patch(url, data, config).then((res) => res.data),

  delete: (url, config = {}) => api.delete(url, config).then((res) => res.data),

  /**
   * Performance Tip: Browser automatically sets Boundary for FormData.
   * Do not manually set Content-Type to 'multipart/form-data' if you can avoid it,
   * but it's kept here for your specific requirement.
   */
  upload: (url, formData, onUploadProgress) => {
    return api
      .post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      })
      .then((res) => res.data);
  },

  download: (url, config = {}) => {
    return api
      .get(url, {
        ...config,
        responseType: "blob",
      })
      .then((res) => res.data);
  },

  // Auth Management
  setToken: (token, persist = true) => {
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem(JWT_KEY, token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },

  removeToken: () => {
    localStorage.removeItem(JWT_KEY);
    sessionStorage.removeItem(JWT_KEY);
    delete api.defaults.headers.common["Authorization"];
  },

  isAuthenticated: () => !!getToken(),

  getToken,

  getBaseURL: () => BASE_URL,
};

export default apiService;
