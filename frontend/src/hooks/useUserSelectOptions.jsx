import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getUsers } from "../redux/features/auth/authSlice";

const useUserSelectOptions = (options = {}) => {
  const {
    includeInactive = false, // Include inactive users
    includeClients = false, // Include client users
    filterRole = null, // Filter by specific role (e.g., 'staff', 'lawyer')
    forceRefresh = false, // Force refresh data
  } = options;

  const { users, usersLoading, usersLastFetched } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);
  const [lastRefresh, setLastRefresh] = useState(0);

  // Function to fetch users
  const fetchUsers = useCallback(
    (force = false) => {
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();

      // Check if we should fetch
      const shouldFetch =
        force ||
        (!users?.data?.length && !usersLoading && !hasFetchedRef.current) ||
        (usersLastFetched && now - usersLastFetched > CACHE_DURATION);

      if (shouldFetch) {
        console.log(
          "🔄 useUserSelectOptions: Fetching users",
          force ? "(forced)" : "(cache miss)"
        );
        hasFetchedRef.current = true;
        setLastRefresh(now);
        dispatch(getUsers());
        return true;
      }

      return false;
    },
    [dispatch, users?.data?.length, usersLoading, usersLastFetched]
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers(forceRefresh);
  }, [fetchUsers, forceRefresh]);

  // Memoize calculations with proper filtering
  const { userData, allUsers, adminOptions, lawyersOptions, filteredUsers } =
    useMemo(() => {
      const userList = Array.isArray(users?.data) ? users.data : [];

      // Apply filters
      let filteredList = userList;

      // Filter by role if specified
      if (filterRole === "staff") {
        filteredList = userList.filter((user) => user.role !== "client");
      } else if (filterRole === "client") {
        filteredList = userList.filter((user) => user.role === "client");
      } else if (filterRole) {
        filteredList = userList.filter((user) => user.role === filterRole);
      }

      // Filter inactive users unless explicitly included
      if (!includeInactive) {
        filteredList = filteredList.filter((user) => user.isActive !== false);
      }

      // Filter clients unless explicitly included
      if (!includeClients) {
        filteredList = filteredList.filter((user) => user.role !== "client");
      }

      // Create userData for Select components
      const userData = filteredList.map((user) => {
        // Build display name
        let displayName = user.firstName || "";
        if (user.lastName) displayName += ` ${user.lastName}`;
        if (!user.isActive) displayName += " (Inactive)";
        if (user.role === "client") displayName += " (Client)";

        return {
          value: user._id,
          label: displayName,
          data: {
            // Include additional data for filtering in the UI
            role: user.role,
            isActive: user.isActive,
            isLawyer: user.isLawyer,
            position: user.position,
            email: user.email,
          },
        };
      });

      // All users (including clients and inactive if specified)
      const allUsers = (
        includeClients && includeInactive ? userList : filteredList
      ).map((user) => ({
        value: user._id,
        label: `${user.firstName} ${user.lastName || ""} (${
          user.position || user.role
        })`,
        data: {
          role: user.role,
          isActive: user.isActive,
          isLawyer: user.isLawyer,
        },
      }));

      // Admin options (super-admin, admin, hr)
      const adminOptions = userList
        .filter((user) => ["super-admin", "admin", "hr"].includes(user.role))
        .map((user) => ({
          value: user.email,
          label: `${user.firstName} ${user.lastName} (${user.role})`,
        }));

      // Lawyers options
      const lawyersOptions = userList
        .filter((user) => user.isLawyer === true)
        .map((user) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName} ${
            user.practiceArea ? `(${user.practiceArea})` : ""
          }`,
        }));

      console.log("📊 useUserSelectOptions - Filtered results:", {
        totalUsers: userList.length,
        filteredCount: filteredList.length,
        userDataCount: userData.length,
        includeInactive,
        includeClients,
        filterRole,
      });

      return {
        userData,
        allUsers,
        adminOptions,
        lawyersOptions,
        filteredUsers: filteredList,
        rawUsers: userList,
      };
    }, [users?.data, includeInactive, includeClients, filterRole]);

  // Function to manually refresh data
  const refreshUsers = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // Function to get user by ID
  const getUserById = useCallback(
    (id) => {
      const userList = Array.isArray(users?.data) ? users.data : [];
      return userList.find((user) => user._id === id);
    },
    [users?.data]
  );

  // Function to get users by role
  const getUsersByRole = useCallback(
    (role, includeInactive = false) => {
      const userList = Array.isArray(users?.data) ? users.data : [];
      return userList.filter((user) => {
        const roleMatch = role ? user.role === role : true;
        const activeMatch = includeInactive ? true : user.isActive !== false;
        return roleMatch && activeMatch;
      });
    },
    [users?.data]
  );

  return {
    // Main data arrays for Select components
    userData, // Filtered users for general selection
    allUsers, // All users (with more info)
    adminOptions, // Admin users for email selection
    lawyersOptions, // Lawyer users

    // Raw data
    filteredUsers, // Filtered user objects
    rawUsers: users?.data || [], // All raw user data

    // Metadata
    loading: usersLoading,
    lastFetched: usersLastFetched,
    lastRefresh,
    totalCount: users?.data?.length || 0,
    filteredCount: filteredUsers?.length || 0,

    // Functions
    refreshUsers,
    getUserById,
    getUsersByRole,

    // Stats
    stats: useMemo(() => {
      const userList = Array.isArray(users?.data) ? users.data : [];
      return {
        total: userList.length,
        active: userList.filter((u) => u.isActive !== false).length,
        inactive: userList.filter((u) => u.isActive === false).length,
        staff: userList.filter((u) => u.role !== "client").length,
        clients: userList.filter((u) => u.role === "client").length,
        lawyers: userList.filter((u) => u.isLawyer === true).length,
        admins: userList.filter((u) =>
          ["admin", "super-admin"].includes(u.role)
        ).length,
        hr: userList.filter((u) => u.role === "hr").length,
      };
    }, [users?.data]),
  };
};

export default useUserSelectOptions;
