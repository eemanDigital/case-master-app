import { useMemo } from "react";

/**
 * Custom hook to get the number of users who are lawyers and the number of users who are clients.
 * @param {Object} users - The users data object.
 * @returns {Object} An object containing the counts of lawyers and clients.
 */
const useUsersCount = (users) => {
  // Memoize the count of lawyers to avoid unnecessary recalculations
  const lawyerCount = useMemo(() => {
    return Array.isArray(users?.data)
      ? users.data.filter((user) => user.isLawyer === true).length
      : 0;
  }, [users]);

  // Memoize the count of clients to avoid unnecessary recalculations
  const clientCount = useMemo(() => {
    return Array.isArray(users?.data)
      ? users.data.filter((user) => user.role === "client").length
      : 0;
  }, [users]);

  const staff = useMemo(() => {
    return Array.isArray(users?.data)
      ? users.data.filter((user) => user.role !== "client").length
      : 0;
  }, [users]);
  // Return the counts of lawyers and clients
  return { lawyerCount, clientCount, staff };
};

export default useUsersCount;
