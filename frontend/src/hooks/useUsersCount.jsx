import { useMemo } from "react";

/**
 * Custom hook to get the number of users who are lawyers and the number of users who are clients.
 * @param {Array|Object} users - The users data from Redux store (array) or DataContext (object with data property).
 * @returns {Object} An object containing the counts of lawyers, clients, and staff.
 */
const useUsersCount = (users) => {
  // Normalize users data to handle both Redux array and DataContext object formats
  const normalizedUsers = useMemo(() => {
    // If users is an array (from Redux store), use it directly
    if (Array.isArray(users)) {
      return users;
    }
    // If users is an object with data property (from DataContext), use users.data
    if (users && Array.isArray(users.data)) {
      return users.data;
    }
    // If users is an object with nested data structure
    if (users && users.success && Array.isArray(users.data)) {
      return users.data;
    }
    // Default to empty array
    return [];
  }, [users]);

  // Memoize the count of lawyers to avoid unnecessary recalculations
  const lawyerCount = useMemo(() => {
    return normalizedUsers.filter(
      (user) =>
        user.isActive === true &&
        (user.isLawyer === true ||
          user.role === "super-admin" ||
          user.role === "admin")
    ).length;
  }, [normalizedUsers]);

  // Memoize the count of clients to avoid unnecessary recalculations
  const clientCount = useMemo(() => {
    return normalizedUsers.filter(
      (user) => user.role === "client" && user.isActive === true
    ).length;
  }, [normalizedUsers]);

  // Memoize the count of staff (all active non-client users)
  const staff = useMemo(() => {
    return normalizedUsers.filter(
      (user) => user.role !== "client" && user.isActive === true
    ).length;
  }, [normalizedUsers]);

  // Enhanced: Count by role for more detailed breakdown
  const roleBreakdown = useMemo(() => {
    return normalizedUsers.reduce((acc, user) => {
      if (user.isActive === true) {
        acc[user.role] = (acc[user.role] || 0) + 1;
      }
      return acc;
    }, {});
  }, [normalizedUsers]);

  // Enhanced: Count verified users
  const verifiedUsersCount = useMemo(() => {
    return normalizedUsers.filter((user) => user.isVerified === true).length;
  }, [normalizedUsers]);

  // Enhanced: Total active users
  const totalActiveUsers = useMemo(() => {
    return normalizedUsers.filter((user) => user.isActive === true).length;
  }, [normalizedUsers]);

  // Enhanced: Inactive users count
  const inactiveUsersCount = useMemo(() => {
    return normalizedUsers.filter((user) => user.isActive === false).length;
  }, [normalizedUsers]);

  // Return the counts of lawyers, clients, staff and enhanced metrics
  return {
    lawyerCount,
    clientCount,
    staff,
    roleBreakdown,
    verifiedUsersCount,
    totalActiveUsers,
    inactiveUsersCount,
    totalUsers: normalizedUsers.length,
  };
};

export default useUsersCount;
