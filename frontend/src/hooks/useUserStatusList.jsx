// hooks/useUserStatusList.js
import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
import { useDataFetch } from "./useDataFetch";

/**
 * Professional hook for status-based user filtering
 */
export const useUserStatusList = (userType = "staff", status = "active") => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({});
  const [statistics, setStatistics] = useState(null);

  const { dataFetcher } = useDataFetch();

  /**
   * Build query string with filters
   */
  const buildQueryString = (page = 1, limit = 10, extraFilters = {}) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);

    // Add search filter if present
    if (filters.search) {
      params.append("search", filters.search);
    }

    // Add other filters
    Object.keys(extraFilters).forEach((key) => {
      if (
        extraFilters[key] !== null &&
        extraFilters[key] !== undefined &&
        extraFilters[key] !== ""
      ) {
        params.append(key, extraFilters[key]);
      }
    });

    return params.toString();
  };

  /**
   * Fetch users by status
   */
  const fetchUsers = async (
    page = pagination.currentPage,
    newFilters = filters
  ) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        userType === "staff"
          ? `users/staff/status/${status}`
          : userType === "clients"
          ? `users/clients/status/${status}`
          : `users/all/status/${status}`;

      const queryString = buildQueryString(page, pagination.limit, newFilters);

      const result = await dataFetcher(`${endpoint}?${queryString}`, "GET");

      if (result && !result.error) {
        setUsers(result.data || []);

        if (result.pagination) {
          setPagination({
            currentPage: result.pagination.currentPage || page,
            totalPages: result.pagination.totalPages || 0,
            totalRecords: result.pagination.totalRecords || 0,
            limit: result.pagination.limit || pagination.limit,
            hasNextPage: result.pagination.hasNextPage || false,
            hasPrevPage: result.pagination.hasPrevPage || false,
          });
        }

        if (result.statistics) {
          setStatistics(result.statistics);
        }

        if (result.statusSummary) {
          console.log(
            `✅ Loaded ${result.statusSummary.count} ${status} ${userType}`
          );
        }
      }
    } catch (err) {
      console.error(`❌ Error fetching ${status} ${userType}:`, err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    await fetchUsers(1, newFilters);
  };

  /**
   * Handle page change
   */
  const handlePageChange = async (page, pageSize) => {
    const newPagination = {
      ...pagination,
      currentPage: page,
      limit: pageSize,
    };
    setPagination(newPagination);
    await fetchUsers(page);
  };

  /**
   * Refresh current page
   */
  const refresh = async () => {
    await fetchUsers(pagination.currentPage);
  };

  /**
   * Change status filter
   */
  const changeStatus = async (newStatus) => {
    if (!["active", "inactive"].includes(newStatus)) {
      throw new Error("Status must be 'active' or 'inactive'");
    }
    // Update status and refetch
    const originalStatus = status;
    status = newStatus;
    await fetchUsers(1);
  };

  /**
   * Change user type filter
   */
  const changeUserType = async (newUserType) => {
    if (!["staff", "clients", "all"].includes(newUserType)) {
      throw new Error("User type must be 'staff', 'clients', or 'all'");
    }
    userType = newUserType;
    await fetchUsers(1);
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    statistics,
    status,
    userType,
    handleFilterChange,
    handlePageChange,
    refresh,
    changeStatus,
    changeUserType,
    totalRecords: pagination.totalRecords,
    currentPage: pagination.currentPage,
    pageSize: pagination.limit,
  };
};
