// features/matter/matterService.js
import axios from "axios";

// Create axios instance with base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    // Try multiple sources for the token
    let token = null;

    // 1. Check localStorage for user object
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        token = user?.token;
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }

    // 2. Check localStorage for direct jwt
    if (!token) {
      token = localStorage.getItem("jwt");
    }

    // 3. Check sessionStorage for user object
    if (!token) {
      const sessionUserStr = sessionStorage.getItem("user");
      if (sessionUserStr) {
        try {
          const sessionUser = JSON.parse(sessionUserStr);
          token = sessionUser?.token;
        } catch (e) {
          console.error("Error parsing user from sessionStorage:", e);
        }
      }
    }

    // 4. Check sessionStorage for direct jwt
    if (!token) {
      token = sessionStorage.getItem("jwt");
    }

    // Add token to headers if found
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No authentication token found");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      console.error("Unauthorized access - redirecting to login");

      // Clear all auth data
      localStorage.removeItem("user");
      localStorage.removeItem("jwt");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("jwt");

      // Redirect to login page
      window.location.href = "/users/login";
    }

    return Promise.reject(error);
  },
);

const matterService = {
  // Create matter
  createMatter: async (matterData) => {
    const response = await API.post("/matters", matterData);
    return response.data;
  },

  // Get all matters with filters
  getAllMatters: async (filters = {}) => {
    const response = await API.get("/matters", { params: filters });
    return response.data;
  },

  // Get single matter with details
  getMatter: async (matterId) => {
    const response = await API.get(`/matters/${matterId}`);
    return response.data;
  },

  // Update matter
  updateMatter: async ({ matterId, matterData }) => {
    const response = await API.patch(`/matters/${matterId}`, matterData);
    return response.data;
  },

  // Delete matter (soft delete)
  deleteMatter: async (matterId) => {
    const response = await API.delete(`/matters/${matterId}`);
    return response.data;
  },

  // Get matter statistics
  getMatterStats: async () => {
    const response = await API.get("/matters/stats");
    return response.data;
  },

  // Search matters
  searchMatters: async (searchCriteria) => {
    const response = await API.post("/matters/search", searchCriteria);
    return response.data;
  },

  // Bulk operations
  bulkUpdate: async (matterIds, updates) => {
    const response = await API.patch("/matters/bulk-update", {
      matterIds,
      updates,
    });
    return response.data;
  },

  // Restore deleted matter
  restoreMatter: async (matterId) => {
    const response = await API.patch(`/matters/${matterId}/restore`);
    return response.data;
  },
};

export default matterService;
