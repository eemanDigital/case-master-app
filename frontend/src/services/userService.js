import api from "./api";

/**
 * =========================
 * Normalizers
 * =========================
 */
const normalizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`,
  email: user.email,
  role: user.role,
  photo: user.photo,
  phone: user.phone,
});

/**
 * =========================
 * User Service
 * =========================
 */
const userService = {
  // Get users with filters
  getUsers: async (params = {}) => {
    try {
      // Build query params
      const queryParams = new URLSearchParams();

      // Pagination
      queryParams.append("page", params.page || 1);
      queryParams.append("limit", params.limit || 50);
      queryParams.append(
        "select",
        params.select || "firstName lastName email photo role phone",
      );

      // Filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (key === "role" && Array.isArray(value?.$in)) {
            value.$in.forEach((val, index) => {
              queryParams.append(`role[$in][${index}]`, val);
            });
          } else if (Array.isArray(value)) {
            value.forEach((val, index) => {
              queryParams.append(`${key}[${index}]`, val);
            });
          } else {
            queryParams.append(key, value);
          }
        });
      }

      const url = `users?${queryParams.toString()}`;
      console.log("Fetching users from:", url);

      const response = await api.get(url);

      const users =
        response.data?.data || response.data?.users || response.data || [];

      return {
        ...response.data,
        data: users.map(normalizeUser),
      };
    } catch (error) {
      console.error("Error fetching users:", error);

      // Fallback to mock data
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.warn("API unavailable, using mock users");

        const mockUsers = getMockUsers(params.filters).map(normalizeUser);

        return {
          status: "success",
          data: mockUsers,
          pagination: {
            page: 1,
            limit: 20,
            totalPages: 1,
            totalItems: mockUsers.length,
          },
        };
      }

      throw error;
    }
  },

  // Get single user
  getUser: async (userId) => {
    try {
      const response = await api.get(`users/${userId}`);
      return {
        ...response.data,
        data: normalizeUser(response.data?.data || response.data),
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (searchTerm) => {
    try {
      const response = await api.get(
        `users/search?q=${encodeURIComponent(searchTerm)}`,
      );

      const users =
        response.data?.data || response.data?.users || response.data || [];

      return {
        ...response.data,
        data: users.map(normalizeUser),
      };
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      const response = await api.post("users", userData);
      return {
        ...response.data,
        data: normalizeUser(response.data?.data || response.data),
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.patch(`users/${userId}`, userData);
      return {
        ...response.data,
        data: normalizeUser(response.data?.data || response.data),
      };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};

/**
 * =========================
 * Mock Users (DEV / FALLBACK)
 * =========================
 */
const getMockUsers = (filters = {}) => {
  const allUsers = [
    {
      _id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      photo: null,
      role: "lawyer",
      phone: "+2348012345678",
    },
    {
      _id: "2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      photo: null,
      role: "admin",
      phone: "+2348098765432",
    },
    {
      _id: "3",
      firstName: "Robert",
      lastName: "Johnson",
      email: "robert.j@example.com",
      photo: null,
      role: "paralegal",
      phone: "+2348055512345",
    },
    {
      _id: "4",
      firstName: "Sarah",
      lastName: "Williams",
      email: "sarah.w@example.com",
      photo: null,
      role: "hr",
      phone: "+2348033322111",
    },
    {
      _id: "5",
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.b@example.com",
      photo: null,
      role: "client",
      phone: "+2348077788899",
    },
    {
      _id: "6",
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.d@example.com",
      photo: null,
      role: "client",
      phone: "+2348044455566",
    },
    {
      _id: "7",
      firstName: "David",
      lastName: "Wilson",
      email: "david.w@example.com",
      photo: null,
      role: "lawyer",
      phone: "+2348066677788",
    },
    {
      _id: "8",
      firstName: "Lisa",
      lastName: "Taylor",
      email: "lisa.t@example.com",
      photo: null,
      role: "admin",
      phone: "+2348022233344",
    },
  ];

  let filteredUsers = allUsers;

  if (filters.role) {
    if (Array.isArray(filters.role?.$in)) {
      filteredUsers = filteredUsers.filter((user) =>
        filters.role.$in.includes(user.role),
      );
    } else {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === filters.role,
      );
    }
  }

  return filteredUsers;
};

export default userService;
