import axios from "axios";

// Get base URL from environment or use relative path
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions
});

// Get token from storage
const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure withCredentials is true for all requests
    config.withCredentials = true;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];

          // Only redirect if not already on login page
          if (
            window.location.pathname !== "users/login" &&
            window.location.pathname !== "/register"
          ) {
            window.location.href =
              "/login?redirect=" + encodeURIComponent(window.location.pathname);
          }
          break;

        case 403:
          console.error("Access forbidden:", data.message);
          break;

        case 404:
          console.error("Resource not found:", data.message);
          break;

        case 422:
          console.error("Validation error:", data.errors);
          break;

        case 500:
          console.error("Server error:", data.message);
          break;

        default:
          console.error(`Error ${status}:`, data.message);
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    return Promise.reject(error);
  },
);

// API methods
const apiService = {
  // Generic GET request
  get: async (url, config = {}) => {
    const response = await api.get(url, {
      ...config,
      withCredentials: true,
    });
    return response.data;
  },

  // Generic POST request
  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, {
      ...config,
      withCredentials: true,
    });
    return response.data;
  },

  // Generic PUT request
  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, {
      ...config,
      withCredentials: true,
    });
    return response.data;
  },

  // Generic PATCH request
  patch: async (url, data = {}, config = {}) => {
    const response = await api.patch(url, data, {
      ...config,
      withCredentials: true,
    });
    return response.data;
  },

  // Generic DELETE request
  delete: async (url, config = {}) => {
    const response = await api.delete(url, {
      ...config,
      withCredentials: true,
    });
    return response.data;
  },

  // File upload with progress
  upload: async (url, formData, onUploadProgress) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
      withCredentials: true,
    };

    const response = await api.post(url, formData, config);
    return response.data;
  },

  // Download file
  download: async (url, config = {}) => {
    const response = await api.get(url, {
      ...config,
      responseType: "blob",
      withCredentials: true,
    });
    return response.data;
  },

  // Multiple concurrent requests
  all: async (requests) => {
    const responses = await Promise.all(requests);
    return responses;
  },

  // Set authorization token
  setToken: (token) => {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  },

  // Remove authorization token
  removeToken: () => {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  },

  // Get current token
  getToken: getToken,

  // Get current base URL
  getBaseURL: () => {
    return BASE_URL;
  },
};

export default apiService;
