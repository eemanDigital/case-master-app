import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import { useDataFetch } from "./useDataFetch";

/**
 * Custom hook for managing user list with filtering, pagination, and search
 */
export const useUserList = (filterRole = null) => {
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const dispatch = useDispatch();
  const { isError, users, message, loading } = useSelector(
    (state) => state.auth
  );
  const { dataFetcher } = useDataFetch();

  // Build query string for API calls
  const buildQueryString = (filters, pagination) => {
    const params = new URLSearchParams();
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

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

  // Fetch users with filters
  const fetchUsers = async (newFilters = filters, page = currentPage) => {
    try {
      const queryString = buildQueryString(newFilters, {
        current: page,
        limit: itemsPerPage,
      });
      const url = queryString ? `users?${queryString}` : "users";
      const result = await dataFetcher(url, "GET");

      if (result && !result.error) {
        setSearchResults(result.data || []);
        if (result.pagination) {
          setCurrentPage(result.pagination.current || 1);
          setItemsPerPage(result.pagination.limit || 10);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      dispatch(getUsers());
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search results from API
  useEffect(() => {
    if (users?.data && !filters.search) {
      setSearchResults(users.data);
    }
  }, [users?.data, filters.search]);

  // Handle filter changes
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    await fetchUsers(newFilters, 1);
  };

  // Reset all filters
  const resetFilters = async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchUsers({}, 1);
  };

  // Remove user with confirmation
  const removeUser = async (id) => {
    await dispatch(deleteUser(id));
    await fetchUsers();
  };

  // Handle pagination change
  const handlePageChange = async (page, pageSize) => {
    setCurrentPage(page);
    setItemsPerPage(pageSize);
    await fetchUsers(filters, page);
  };

  // Filter by role if specified
  const filteredList = filterRole
    ? searchResults.filter((user) =>
        filterRole === "staff"
          ? user.role !== "client"
          : user.role === filterRole
      )
    : searchResults;

  return {
    filteredList,
    filters,
    currentPage,
    itemsPerPage,
    isError,
    users,
    message,
    loading,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  };
};
