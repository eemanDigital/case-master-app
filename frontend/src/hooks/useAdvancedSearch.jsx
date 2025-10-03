// hooks/useAdvancedSearch.js
import { useState, useEffect, useCallback } from "react";
import { useDataFetch } from "./useDataFetch";

export const useAdvancedSearch = (endpoint, initialFilters = {}) => {
  const { dataFetcher, loading, error } = useDataFetch();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    totalRecords: 0,
  });
  const [filters, setFilters] = useState(initialFilters);

  // Build query string from filters and pagination
  const buildQueryString = useCallback((filters, pagination) => {
    const params = new URLSearchParams();

    // Add pagination
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    // Add filters
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

  // Fetch data with current filters and pagination
  const search = useCallback(
    async (newFilters = null, newPagination = null) => {
      const currentFilters = newFilters || filters;
      const currentPagination = newPagination || pagination;

      const queryString = buildQueryString(currentFilters, currentPagination);
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const result = await dataFetcher(url, "GET");

      if (result && !result.error) {
        // Handle both response formats for backward compatibility
        if (result.success !== undefined) {
          // New format: { success, data, pagination }
          setData(result.data || []);
          if (result.pagination) {
            setPagination((prev) => ({
              ...prev,
              ...result.pagination,
            }));
          }
        } else if (result.data !== undefined) {
          // Old format: { data, results, etc. }
          setData(result.data || result);
          if (result.results) {
            setPagination((prev) => ({
              ...prev,
              totalRecords: result.results,
            }));
          }
        } else {
          // Fallback: assume result is the data array
          setData(Array.isArray(result) ? result : [result]);
        }
      }
    },
    [dataFetcher, buildQueryString, filters, pagination]
  );

  // Update filters and search
  const updateFilters = useCallback(
    async (newFilters) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      await search(updatedFilters, { ...pagination, current: 1 }); // Reset to page 1
    },
    [filters, pagination, search]
  );

  // Update pagination and search
  const updatePagination = useCallback(
    async (newPagination) => {
      const updatedPagination = { ...pagination, ...newPagination };
      setPagination(updatedPagination);
      await search(filters, updatedPagination);
    },
    [pagination, filters, search]
  );

  // Reset to initial state
  const resetSearch = useCallback(async () => {
    setFilters(initialFilters);
    setPagination({
      current: 1,
      limit: 10,
      total: 0,
      totalRecords: 0,
    });
    await search(initialFilters, {
      current: 1,
      limit: 10,
      total: 0,
      totalRecords: 0,
    });
  }, [initialFilters, search]);

  // Initialize search on mount
  useEffect(() => {
    search();
  }, []);

  return {
    data,
    pagination,
    filters,
    loading,
    error,
    search: () => search(),
    updateFilters,
    updatePagination,
    resetSearch,
    setFilters,
    setPagination,
  };
};
