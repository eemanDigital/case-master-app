import { useEffect, useState, useCallback, useMemo } from "react";
import { useDataFetch } from "./useDataFetch";

const useUserSelectOptions = (options = {}) => {
  const {
    type = "staff", // 'staff' | 'clients' | 'lawyers' | 'admins' | 'all'
    includeInactive = false,
    autoFetch = true, // Auto-fetch on mount
    fetchAll = false, // Fetch all categories at once
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
          params.append("includeInactive", includeInactive.toString());
        } else {
          params.append("type", type);
          params.append("includeInactive", includeInactive.toString());
        }

        const fullEndpoint = `${endpoint}?${params.toString()}`;

        console.log("🔄 Fetching select options:", fullEndpoint);

        // Use dataFetcher from useDataFetch hook
        const response = await dataFetcher(fullEndpoint, "GET");

        if (response?.data) {
          console.log("✅ Select options fetched:", response);
          setLastFetched(now);
          return response.data;
        }

        // Handle error case
        if (response?.error) {
          console.error("❌ Error fetching select options:", response.error);
          throw new Error(response.error);
        }
      } catch (err) {
        console.error("❌ Error in fetchOptions:", err);
        throw err;
      }
    },
    [type, includeInactive, fetchAll, lastFetched, data, dataFetcher]
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
    [data, fetchAll]
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
    [data, fetchAll]
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
            all: [],
          }
        : [];
    }

    const userData = data.data;

    if (fetchAll) {
      // Return all categories
      return {
        staff: userData?.staff || [],
        clients: userData?.clients || [],
        lawyers: userData?.lawyers || [],
        admins: userData?.admins || [],
        hr: userData?.hr || [],
        all: userData?.all || [],
      };
    }

    // Return single category
    return Array.isArray(userData) ? userData : [];
  }, [data, fetchAll]);

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
      allUsers: data?.data?.all || [],
    }),

    // State
    loading,
    error,
    lastFetched,

    // Functions
    refresh,
    fetchOptions,
    getUserById,
    filterByRole,

    // Stats
    count: fetchAll
      ? data?.data?.all?.length || 0
      : Array.isArray(data?.data)
      ? data.data.length
      : 0,
  };
};

export default useUserSelectOptions;
