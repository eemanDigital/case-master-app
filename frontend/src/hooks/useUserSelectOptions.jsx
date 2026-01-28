// hooks/useUserSelectOptions.js
import { useEffect, useState, useCallback, useMemo } from "react";
import { useDataFetch } from "./useDataFetch";

const useUserSelectOptions = (options = {}) => {
  const {
    type = "staff", // 'staff' | 'clients' | 'lawyers' | 'admins' | 'all' | 'by-role'
    role = null, // Optional role filter for 'by-role' type
    includeInactive = false,
    includeInactiveWhenAll = false,
    autoFetch = true,
    fetchAll = false,
    lawyerOnly = false, // Only fetch users with isLawyer = true
    includeAdditionalRoles = false, // Include additional roles in the response
  } = options;

  const { dataFetcher, data, error, loading } = useDataFetch();
  const [lastFetched, setLastFetched] = useState(null);

  // Memoize the fetch function
  const fetchOptions = useCallback(
    async (force = false) => {
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();

      // Check cache
      if (!force && lastFetched && now - lastFetched < CACHE_DURATION && data) {
        console.log("📦 Using cached select options");
        return data;
      }

      try {
        const endpoint = fetchAll
          ? "users/select-options/all"
          : "users/select-options";

        // Build query params
        const params = new URLSearchParams();

        if (fetchAll) {
          params.append(
            "includeInactive",
            includeInactiveWhenAll ? "true" : "false",
          );
        } else {
          // Handle special types
          if (type === "by-role" && role) {
            params.append("role", role);
          } else if (type === "lawyers" || lawyerOnly) {
            params.append("userType", "lawyer");
            if (lawyerOnly) {
              params.append("isLawyer", "true");
            }
          } else {
            params.append("type", type);
          }

          params.append("includeInactive", includeInactive.toString());
        }

        const fullEndpoint = `${endpoint}?${params.toString()}`;
        console.log("🔄 Fetching select options:", fullEndpoint);

        const response = await dataFetcher(fullEndpoint, "GET");

        if (response?.data) {
          setLastFetched(now);
          return response.data;
        }

        if (response?.error) {
          console.error("❌ Error fetching select options:", response.error);
          throw new Error(response.error);
        }
      } catch (err) {
        console.error("❌ Error in fetchOptions:", err);
        throw err;
      }
    },
    [
      type,
      role,
      includeInactive,
      includeInactiveWhenAll,
      fetchAll,
      lawyerOnly,
      lastFetched,
      data,
      dataFetcher,
    ],
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchOptions();
    }
  }, [autoFetch, fetchOptions]);

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchOptions(true);
  }, [fetchOptions]);

  // Helper functions
  const getUserById = useCallback(
    (id) => {
      if (!data?.data) return null;

      const userData = data.data;

      if (fetchAll) {
        // Search across all categories
        const allUsers = Object.values(userData).flat();
        return allUsers.find((u) => u.value === id);
      }

      return Array.isArray(userData)
        ? userData.find((u) => u.value === id)
        : null;
    },
    [data, fetchAll],
  );

  const filterByRole = useCallback(
    (role) => {
      if (!data?.data) return [];

      const userData = data.data;

      if (fetchAll) {
        return userData.all?.filter((u) => u.role === role) || [];
      }

      return Array.isArray(userData)
        ? userData.filter((u) => u.role === role)
        : [];
    },
    [data, fetchAll],
  );

  // ✅ NEW: Filter by userType
  const filterByUserType = useCallback(
    (userType) => {
      if (!data?.data) return [];

      const userData = data.data;

      if (fetchAll) {
        return userData.all?.filter((u) => u.userType === userType) || [];
      }

      return Array.isArray(userData)
        ? userData.filter((u) => u.userType === userType)
        : [];
    },
    [data, fetchAll],
  );

  // ✅ NEW: Filter by position
  const filterByPosition = useCallback(
    (position) => {
      if (!data?.data) return [];

      const userData = data.data;

      if (fetchAll) {
        return userData.all?.filter((u) => u.position === position) || [];
      }

      return Array.isArray(userData)
        ? userData.filter((u) => u.position === position)
        : [];
    },
    [data, fetchAll],
  );

  // ✅ NEW: Filter lawyers by practice area
  const filterLawyersByPracticeArea = useCallback(
    (practiceArea) => {
      if (!data?.data) return [];

      const userData = data.data;
      let lawyers = [];

      if (fetchAll) {
        lawyers =
          userData.all?.filter(
            (u) => u.userType === "lawyer" || u.isLawyer === true,
          ) || [];
      } else if (type === "lawyers" || lawyerOnly) {
        lawyers = Array.isArray(userData) ? userData : [];
      }

      return lawyers.filter(
        (lawyer) =>
          lawyer.lawyerPracticeAreas &&
          lawyer.lawyerPracticeAreas.includes(practiceArea),
      );
    },
    [data, fetchAll, type, lawyerOnly],
  );

  // ✅ NEW: Get all effective roles (including additional roles)
  const getEffectiveRolesForUser = useCallback(
    (userId) => {
      const user = getUserById(userId);
      if (!user) return [];

      const roles = [user.role];
      if (user.additionalRoles && user.additionalRoles.length > 0) {
        roles.push(...user.additionalRoles);
      }
      return [...new Set(roles)];
    },
    [getUserById],
  );

  // ✅ NEW: Check if user has privilege
  const userHasPrivilege = useCallback(
    (userId, privilege) => {
      const user = getUserById(userId);
      if (!user) return false;

      // Super admin has all privileges
      if (user.role === "super-admin" || user.userType === "super-admin")
        return true;

      // Check primary role
      if (user.role === privilege) return true;

      // Check additional roles
      if (user.additionalRoles && user.additionalRoles.includes(privilege)) {
        return true;
      }

      // Check if lawyer privilege
      if (privilege === "lawyer" && user.isLawyer === true) {
        return true;
      }

      return false;
    },
    [getUserById],
  );

  // Return appropriate data structure
  const returnData = useMemo(() => {
    if (!data?.data) {
      return fetchAll
        ? {
            staff: [],
            clients: [],
            lawyers: [],
            admins: [],
            hr: [],
            superAdmins: [],
            all: [],
          }
        : [];
    }

    const userData = data.data;

    if (fetchAll) {
      // Return all categories with enhanced data
      return {
        staff: userData?.staff || [],
        clients: userData?.clients || [],
        lawyers: userData?.lawyers || [],
        admins: userData?.admins || [],
        hr: userData?.hr || [],
        superAdmins: userData?.superAdmins || [],
        all: userData?.all || [],
      };
    }

    // Return single category
    return Array.isArray(userData) ? userData : [];
  }, [data, fetchAll]);

  // ✅ NEW: Get unique positions from user data
  const uniquePositions = useMemo(() => {
    if (!data?.data) return [];

    const userData = data.data;
    const users = fetchAll ? userData.all || [] : userData;

    const positions = users.filter((u) => u.position).map((u) => u.position);

    return [...new Set(positions)];
  }, [data, fetchAll]);

  // ✅ NEW: Get practice areas from lawyers
  const practiceAreas = useMemo(() => {
    if (!data?.data) return [];

    const userData = data.data;
    let lawyers = [];

    if (fetchAll) {
      lawyers =
        userData.all?.filter(
          (u) => u.userType === "lawyer" || u.isLawyer === true,
        ) || [];
    } else if (type === "lawyers" || lawyerOnly) {
      lawyers = Array.isArray(userData) ? userData : [];
    }

    const areas = lawyers.reduce((acc, lawyer) => {
      if (lawyer.lawyerPracticeAreas) {
        acc.push(...lawyer.lawyerPracticeAreas);
      }
      return acc;
    }, []);

    return [...new Set(areas)];
  }, [data, fetchAll, type, lawyerOnly]);

  // Enhanced return object
  return {
    // Main data
    data: returnData,

    // Specific arrays (when fetchAll is true)
    ...(fetchAll && {
      staff: data?.data?.staff || [],
      clients: data?.data?.clients || [],
      lawyers: data?.data?.lawyers || [],
      admins: data?.data?.admins || [],
      hr: data?.data?.hr || [],
      superAdmins: data?.data?.superAdmins || [],
      allUsers: data?.data?.all || [],
    }),

    // State
    loading,
    error,
    lastFetched,

    // Main functions
    refresh,
    fetchOptions,
    getUserById,

    // Filter functions
    filterByRole,
    filterByUserType,
    filterByPosition,
    filterLawyersByPracticeArea,

    // Privilege functions
    getEffectiveRolesForUser,
    userHasPrivilege,

    // Statistics and metadata
    count: fetchAll
      ? data?.data?.all?.length || 0
      : Array.isArray(data?.data)
        ? data.data.length
        : 0,
    uniquePositions,
    practiceAreas,

    // Type-specific stats
    ...(fetchAll && {
      stats: {
        staff: data?.data?.staff?.length || 0,
        clients: data?.data?.clients?.length || 0,
        lawyers: data?.data?.lawyers?.length || 0,
        admins: data?.data?.admins?.length || 0,
        hr: data?.data?.hr?.length || 0,
        superAdmins: data?.data?.superAdmins?.length || 0,
        total: data?.data?.all?.length || 0,
      },
    }),

    // Convenience properties
    allUsers: fetchAll ? data?.data?.all || [] : returnData,
    isAllFetched: fetchAll,
  };
};

export default useUserSelectOptions;
