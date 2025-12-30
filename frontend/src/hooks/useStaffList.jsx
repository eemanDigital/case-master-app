// hooks/useStaffList.js
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser } from "../redux/features/auth/authSlice";
import { useDataFetch } from "./useDataFetch";

/**
 * ✅ Specialized hook for Staff list management
 * Handles all non-client users: staff, admin, hr, secretary, etc.
 */
export const useStaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const { dataFetcher } = useDataFetch();

  /**
   * Build query string with staff roles
   */
  const buildQueryString = (filters, pagination) => {
    const params = new URLSearchParams();
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    // ✅ Filter for staff roles (all non-client users)
    params.append("role", "staff,super-admin,admin,hr,secretary,lawyer");

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
  };

  /**
   * Fetch staff members
   */
  const fetchStaff = async (newFilters = filters, page = currentPage) => {
    try {
      setLoading(true);

      const queryString = buildQueryString(newFilters, {
        current: page,
        limit: itemsPerPage,
      });

      console.log("🔍 [useStaffList] Fetching:", queryString);

      const result = await dataFetcher(`users?${queryString}`, "GET");

      if (result && !result.error) {
        setStaffList(result.data || []);

        if (result.pagination) {
          setPaginationData(result.pagination);
          setCurrentPage(result.pagination.currentPage || page);
          setItemsPerPage(result.pagination.limit || itemsPerPage);
        }

        if (result.statistics) {
          setStatistics(result.statistics);
        }
      }
    } catch (error) {
      console.error("❌ [useStaffList] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    await fetchStaff(newFilters, 1);
  };

  /**
   * Reset filters
   */
  const resetFilters = async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchStaff({}, 1);
  };

  /**
   * Remove staff member
   */
  const removeStaff = async (id) => {
    await dispatch(deleteUser(id));
    await fetchStaff(filters, currentPage);
  };

  /**
   * Handle pagination
   */
  const handlePageChange = async (page, pageSize) => {
    if (pageSize !== itemsPerPage) {
      setItemsPerPage(pageSize);
      setCurrentPage(1);
      await fetchStaff(filters, 1);
    } else {
      setCurrentPage(page);
      await fetchStaff(filters, page);
    }
  };

  return {
    staffList,
    filters,
    currentPage,
    itemsPerPage,
    totalRecords: paginationData?.totalRecords || 0,
    totalPages: paginationData?.totalPages || 0,
    loading,
    statistics,
    paginationData,
    handleFiltersChange,
    resetFilters,
    removeStaff,
    handlePageChange,
    refetch: fetchStaff,
  };
};

// hooks/useClientList.js
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { deleteUser } from "../redux/features/auth/authSlice";
import { useDataFetch } from "./useDataFetch";

/**
 * ✅ Specialized hook for Client list management
 * Handles only client users
 */
export const useClientList = () => {
  const [clientList, setClientList] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const { dataFetcher } = useDataFetch();

  /**
   * Build query string for clients
   */
  const buildQueryString = (filters, pagination) => {
    const params = new URLSearchParams();
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    // ✅ Filter for clients only
    params.append("role", "client");

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
  };

  /**
   * Fetch clients
   */
  const fetchClients = async (newFilters = filters, page = currentPage) => {
    try {
      setLoading(true);

      const queryString = buildQueryString(newFilters, {
        current: page,
        limit: itemsPerPage,
      });

      console.log("🔍 [useClientList] Fetching:", queryString);

      const result = await dataFetcher(`users?${queryString}`, "GET");

      if (result && !result.error) {
        setClientList(result.data || []);

        if (result.pagination) {
          setPaginationData(result.pagination);
          setCurrentPage(result.pagination.currentPage || page);
          setItemsPerPage(result.pagination.limit || itemsPerPage);
        }

        if (result.statistics) {
          setStatistics(result.statistics);
        }
      }
    } catch (error) {
      console.error("❌ [useClientList] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    await fetchClients(newFilters, 1);
  };

  /**
   * Reset filters
   */
  const resetFilters = async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchClients({}, 1);
  };

  /**
   * Remove client
   */
  const removeClient = async (id) => {
    await dispatch(deleteUser(id));
    await fetchClients(filters, currentPage);
  };

  /**
   * Handle pagination
   */
  const handlePageChange = async (page, pageSize) => {
    if (pageSize !== itemsPerPage) {
      setItemsPerPage(pageSize);
      setCurrentPage(1);
      await fetchClients(filters, 1);
    } else {
      setCurrentPage(page);
      await fetchClients(filters, page);
    }
  };

  return {
    clientList,
    filters,
    currentPage,
    itemsPerPage,
    totalRecords: paginationData?.totalRecords || 0,
    totalPages: paginationData?.totalPages || 0,
    loading,
    statistics,
    paginationData,
    handleFiltersChange,
    resetFilters,
    removeClient,
    handlePageChange,
    refetch: fetchClients,
  };
};
