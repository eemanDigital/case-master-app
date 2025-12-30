import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import { useDataFetch } from "./useDataFetch";

/**
 * ✅ FIXED: Custom hook for managing user list with proper role-based filtering
 *
 * @param {string|null} filterRole - Role to filter by: 'staff', 'client', or null for all
 */
export const useUserList = (filterRole = null) => {
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);
  const [statistics, setStatistics] = useState(null); // ✅ NEW: Separate statistics state

  const dispatch = useDispatch();
  const { isError, message, loading } = useSelector((state) => state.auth);

  const { dataFetcher } = useDataFetch();

  /**
   * ✅ FIXED: Build query string with role filtering
   */
  const buildQueryString = useCallback((filters, pagination, role) => {
    const params = new URLSearchParams();
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    // ✅ ADD ROLE FILTERING
    if (role) {
      if (role === "staff") {
        // Staff means all non-client users
        params.append("role", "user,super-admin,admin,hr,secretary,lawyer");
      } else {
        // Specific role (e.g., 'client')
        params.append("role", role);
      }
    }

    // Add other filters
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, item));
        } else {
          params.append(key, value);
        }
      }
    });

    return params.toString();
  }, []);

  /**
   * ✅ FIXED: Fetch users with proper role filtering
   */
  const fetchUsers = useCallback(
    async (newFilters = filters, page = currentPage) => {
      try {
        const queryString = buildQueryString(
          newFilters,
          {
            current: page,
            limit: itemsPerPage,
          },
          filterRole // ✅ Pass role to query builder
        );

        console.log("🔍 Fetching users with query:", queryString);

        const result = await dataFetcher(`users?${queryString}`, "GET");

        console.log("📦 API Response:", {
          dataCount: result?.data?.length || 0,
          statistics: result?.statistics,
          pagination: result?.pagination,
        });

        if (result && !result.error) {
          // ✅ Set data directly (no client-side filtering needed)
          setSearchResults(result.data || []);

          // ✅ Store pagination info
          if (result.pagination) {
            setPaginationData(result.pagination);
            setCurrentPage(result.pagination.currentPage || page);
            setItemsPerPage(result.pagination.limit || itemsPerPage);
          }

          // ✅ Store statistics separately
          if (result.statistics) {
            setStatistics(result.statistics);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        // Fallback to Redux action
        dispatch(getUsers());
      }
    },
    [
      buildQueryString,
      filterRole,
      itemsPerPage,
      filters,
      currentPage,
      dataFetcher,
      dispatch,
    ]
  );

  // Initial load
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * ✅ Handle filter changes
   */
  const handleFiltersChange = useCallback(
    async (newFilters) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page
      await fetchUsers(newFilters, 1);
    },
    [fetchUsers]
  );

  /**
   * ✅ Reset all filters
   */
  const resetFilters = useCallback(async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchUsers({}, 1);
  }, [fetchUsers]);

  /**
   * ✅ Remove user with confirmation
   */
  const removeUser = useCallback(
    async (id) => {
      await dispatch(deleteUser(id));
      // Refresh current page after deletion
      await fetchUsers(filters, currentPage);
    },
    [dispatch, fetchUsers, filters, currentPage]
  );

  /**
   * ✅ Handle pagination change
   */
  const handlePageChange = useCallback(
    async (page, pageSize) => {
      console.log("📄 Page change:", {
        page,
        pageSize,
        currentPage,
        itemsPerPage,
      });

      // If page size changed, reset to page 1
      if (pageSize !== itemsPerPage) {
        setItemsPerPage(pageSize);
        setCurrentPage(1);
        await fetchUsers(filters, 1);
      } else {
        setCurrentPage(page);
        await fetchUsers(filters, page);
      }
    },
    [fetchUsers, filters, itemsPerPage]
  );

  // Calculate derived values from BACKEND pagination
  const totalRecords = paginationData?.totalRecords || 0;
  const totalPages = paginationData?.totalPages || 0;

  console.log("📊 Hook State:", {
    searchResultsLength: searchResults.length,
    totalRecords,
    totalPages,
    currentPage,
    itemsPerPage,
    statistics,
    filterRole,
  });

  return {
    filteredList: searchResults, // ✅ Return backend-filtered results
    filters,
    currentPage,
    itemsPerPage,
    totalRecords,
    totalPages,
    isError,
    statistics, // ✅ Return statistics separately
    message,
    loading,
    paginationData,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
    refetch: fetchUsers,
  };
};
