import { useMemo } from "react";

/**
 * ✅ FIXED: Custom hook to get user counts
 * Ensures all return values are numbers, not objects
 */
const useUsersCount = (data) => {
  // 1. EXTRACT RAW DATA
  const { statistics, users } = useMemo(() => {
    let stats = null;
    let userList = [];

    if (data) {
      // Find Statistics Object
      if (data?.statistics) {
        stats = data.statistics;
      } else if (data?.data?.statistics) {
        stats = data.data.statistics;
      } else if (data.clients !== undefined && data.staff !== undefined) {
        stats = data; // Data IS the statistics object
      }

      // Find Users Array
      if (Array.isArray(data.users)) {
        userList = data.users;
      } else if (Array.isArray(data.data)) {
        userList = data.data;
      } else if (data.success && Array.isArray(data.data)) {
        userList = data.data;
      } else if (Array.isArray(data)) {
        userList = data;
      }
    }

    return { statistics: stats, users: userList };
  }, [data]);

  // 2. PROCESS AND NORMALIZE RESULTS - FIXED TO RETURN NUMBERS ONLY
  const result = useMemo(() => {
    // Helper function to safely extract numeric values
    const safeNumber = (value, defaultValue = 0) => {
      if (value === null || value === undefined) return defaultValue;
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = parseInt(value, 10);
        return isNaN(num) ? defaultValue : num;
      }
      if (typeof value === "object") {
        // Handle {active: X, inactive: Y} objects
        if (value.active !== undefined)
          return safeNumber(value.active, defaultValue);
        if (value.total !== undefined)
          return safeNumber(value.total, defaultValue);
        if (value.count !== undefined)
          return safeNumber(value.count, defaultValue);
        return defaultValue;
      }
      return defaultValue;
    };

    // --- SCENARIO A: DATA COMES FROM API STATISTICS OBJECT ---
    if (statistics) {
      const roles = statistics.roles || statistics.breakdown || {};

      // Calculate staff by subtracting clients from total, or summing known staff roles
      const calculatedStaff = safeNumber(
        statistics.staff ||
          safeNumber(statistics.total) -
            safeNumber(statistics.clients || roles.client) ||
          safeNumber(roles.admin) +
            safeNumber(roles["super-admin"]) +
            safeNumber(roles.lawyer) +
            safeNumber(roles.hr) +
            safeNumber(roles.secretary)
      );

      // Handle active/inactive objects like {active: 5, inactive: 2}
      const activeStats = statistics.active;
      const inactiveStats = statistics.inactive;

      let totalActiveUsers = 0;
      let totalInactiveUsers = 0;

      if (typeof activeStats === "object" && activeStats !== null) {
        totalActiveUsers =
          safeNumber(activeStats.active) || safeNumber(activeStats.total) || 0;
      } else {
        totalActiveUsers = safeNumber(activeStats);
      }

      if (typeof inactiveStats === "object" && inactiveStats !== null) {
        totalInactiveUsers =
          safeNumber(inactiveStats.inactive) ||
          safeNumber(inactiveStats.total) ||
          0;
      } else {
        totalInactiveUsers = safeNumber(inactiveStats);
      }

      const resultObj = {
        totalUsers: safeNumber(statistics.total),
        clientCount: safeNumber(statistics.clients || roles.client),
        staff: calculatedStaff,
        lawyerCount: safeNumber(statistics.lawyers || roles.lawyer),
        adminsCount: safeNumber(
          statistics.admins ||
            safeNumber(roles.admin) + safeNumber(roles["super-admin"])
        ),
        totalActiveUsers: totalActiveUsers,
        inactiveUsersCount: totalInactiveUsers,
        verifiedUsersCount: safeNumber(statistics.verified),
        deletedCount: safeNumber(statistics.deleted),
        // Specific Role Access (ensured to be numbers)
        superAdmin: safeNumber(roles["super-admin"]),
        hr: safeNumber(roles.hr),
        secretary: safeNumber(roles.secretary),
        // Store breakdown separately (not for rendering)
        _roleBreakdown: roles,
        fromAPI: true,
      };

      // console.log("✅ useUsersCount - Processed API stats:", {
      //   inputStats: statistics,
      //   output: resultObj,
      //   activeType: typeof activeStats,
      //   inactiveType: typeof inactiveStats,
      // });

      return resultObj;
    }

    // --- SCENARIO B: MANUAL CALCULATION FROM USERS ARRAY ---
    const totalUsers = users.length;
    const clients = users.filter((u) => u.role === "client");
    const staffMembers = users.filter((u) => u.role !== "client");

    // Role specific counts
    const lawyers = users.filter((u) => u.isLawyer === true);
    const admins = users.filter(
      (u) => u.role === "admin" || u.role === "super-admin"
    );

    const roleBreakdown = users.reduce((acc, user) => {
      const r = user.role || "unknown";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const resultObj = {
      totalUsers: totalUsers,
      clientCount: clients.length,
      staff: staffMembers.length,
      lawyerCount: lawyers.length,
      adminsCount: admins.length,
      totalActiveUsers: users.filter((u) => u.isActive).length,
      inactiveUsersCount: users.filter((u) => !u.isActive).length,
      verifiedUsersCount: users.filter((u) => u.isVerified).length,
      superAdmin: roleBreakdown["super-admin"] || 0,
      hr: roleBreakdown.hr || 0,
      secretary: roleBreakdown.secretary || 0,
      deletedCount: 0,
      // Store breakdown separately (not for rendering)
      _roleBreakdown: roleBreakdown,
      fromAPI: false,
    };

    console.log("✅ useUsersCount - Manual calculation:", resultObj);

    return resultObj;
  }, [statistics, users]);

  // Return only numeric values (no objects)
  return useMemo(() => {
    const { _roleBreakdown, ...numericValues } = result;

    // Double-check all values are numbers
    const safeResult = {};
    Object.keys(numericValues).forEach((key) => {
      const value = numericValues[key];
      if (typeof value === "number") {
        safeResult[key] = value;
      } else if (typeof value === "object") {
        console.warn(
          `⚠️ useUsersCount: ${key} is an object, converting to 0:`,
          value
        );
        safeResult[key] = 0;
      } else {
        safeResult[key] = Number(value) || 0;
      }
    });

    return safeResult;
  }, [result]);
};

export default useUsersCount;
