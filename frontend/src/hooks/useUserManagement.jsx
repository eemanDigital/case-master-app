import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  softDeleteUser,
  restoreUser,
  deleteUser,
  getDeletedUsers,
  getUsers,
} from "../redux/features/auth/authSlice";
import { useDataFetch } from "./useDataFetch";

export const useUserManagement = (initialConfig = {}) => {
  const { initialUserType = "all", initialStatus = "active" } = initialConfig;

  const [userType, setUserTypeState] = useState(initialUserType);
  const [statusFilter, setStatusFilterState] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const { dataFetcher } = useDataFetch();

  // Track whether the component is still mounted to avoid state updates after unmount
  const isMounted = useRef(true);
  // Ref to hold latest values to avoid stale closures in fetchUsers
  const filtersRef = useRef({
    userType,
    statusFilter,
    searchQuery,
    itemsPerPage,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Keep filtersRef in sync
  useEffect(() => {
    filtersRef.current = { userType, statusFilter, searchQuery, itemsPerPage };
  }, [userType, statusFilter, searchQuery, itemsPerPage]);

  const getRoleParam = useCallback((type) => {
    switch (type) {
      case "staff":
        return "user,super-admin,admin,hr,secretary,lawyer";
      case "clients":
        return "client";
      default:
        return null;
    }
  }, []);

  const buildQueryString = useCallback((filters, pagination, role) => {
    const params = new URLSearchParams();
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    if (role) params.append("role", role);
    if (filters.status) {
      params.append("isActive", filters.status === "active" ? "true" : "false");
    }
    if (filters.search) params.append("search", filters.search);

    return params.toString();
  }, []);

  const fetchUsers = useCallback(
    async (page = 1) => {
      if (!isMounted.current) return;

      setLoading(true);
      setError(null);

      // Read from ref to always get latest values without stale closure issues
      const {
        userType: type,
        statusFilter: status,
        searchQuery: search,
        itemsPerPage: limit,
      } = filtersRef.current;

      try {
        const role = getRoleParam(type);
        const queryString = buildQueryString(
          { status, search },
          { current: page, limit },
          role,
        );

        const result = await dataFetcher(`users?${queryString}`, "GET");

        if (!isMounted.current) return;

        if (result && !result.error) {
          setUsers(result.data || []);
          if (result.pagination) {
            setPaginationData(result.pagination);
            setCurrentPage(result.pagination.currentPage || page);
            setItemsPerPage(result.pagination.limit || limit);
          }
          if (result.statistics) {
            setStatistics(result.statistics);
          }
        } else {
          setError(result?.message || "Failed to fetch users");
        }
      } catch (err) {
        if (!isMounted.current) return;
        setError(err.message);
        dispatch(getUsers());
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    // fetchUsers is stable — deps are read from ref, not closures
    [buildQueryString, dataFetcher, dispatch, getRoleParam],
  );

  const fetchDeletedUsers = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const result = await dispatch(getDeletedUsers()).unwrap();
      if (isMounted.current) {
        setDeletedUsers(result.data || []);
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [dispatch]);

  // Fetch on userType or statusFilter change (and on initial mount)
  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1);
  }, [userType, statusFilter, fetchUsers]);

  // Debounced search fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers]);

  const handleUserTypeChange = useCallback((type) => {
    setUserTypeState(type);
  }, []);

  const handleStatusChange = useCallback((status) => {
    setStatusFilterState(status);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  const handlePageChange = useCallback(
    async (page, pageSize) => {
      if (pageSize !== filtersRef.current.itemsPerPage) {
        setItemsPerPage(pageSize);
        setCurrentPage(1);
        // itemsPerPage update will be picked up via filtersRef before fetchUsers runs
        await fetchUsers(1);
      } else {
        setCurrentPage(page);
        await fetchUsers(page);
      }
    },
    [fetchUsers],
  );

  const handleDelete = useCallback(
    async (userId) => {
      try {
        await dispatch(softDeleteUser(userId)).unwrap();
        await fetchUsers(filtersRef.current.currentPage || 1);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [dispatch, fetchUsers],
  );

  const handleRestore = useCallback(
    async (userId) => {
      try {
        await dispatch(restoreUser(userId)).unwrap();
        await fetchDeletedUsers();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [dispatch, fetchDeletedUsers],
  );

  const handlePermanentDelete = useCallback(
    async (userId) => {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        await fetchDeletedUsers();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [dispatch, fetchDeletedUsers],
  );

  const refresh = useCallback(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const computedStatistics = useMemo(() => {
    if (!statistics) return null;

    const staff = statistics.staff || {};
    const clients = statistics.clients || {};
    const totalActive = (staff.active || 0) + (clients.active || 0);
    const totalInactive = (staff.inactive || 0) + (clients.inactive || 0);
    const grandTotal = (staff.total || 0) + (clients.total || 0);

    return {
      staff,
      clients,
      overall: {
        totalActive,
        totalInactive,
        grandTotal,
        overallActivePercentage:
          grandTotal > 0 ? Math.round((totalActive / grandTotal) * 100) : 0,
      },
    };
  }, [statistics]);

  return {
    users,
    deletedUsers,
    loading,
    error,
    currentPage,
    pagination: paginationData,
    statistics: computedStatistics,
    filters: {
      userType,
      status: statusFilter,
      search: searchQuery,
    },
    setUserType: handleUserTypeChange,
    setStatus: handleStatusChange,
    setSearch: handleSearch,
    handlePageChange,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    refresh,
    refetch: fetchUsers,
    fetchDeletedUsers,
  };
};

export default useUserManagement;
