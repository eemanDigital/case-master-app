// hooks/useUserSelectOptions.js
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDataFetch } from "./useDataFetch";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Normalizes a raw user object into a consistent Select option shape:
 * { value, label, role, userType, isLawyer, position, ... }
 */
const normalizeUser = (user) => {
  if (!user) return null;

  // Already normalized (has value + label)
  if (user.value !== undefined && user.label !== undefined) return user;

  return {
    ...user,
    value: user._id || user.value,
    label:
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "Unknown User",
  };
};

const normalizeUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(normalizeUser).filter(Boolean);
};

const useUserSelectOptions = (options = {}) => {
  const {
    type = "staff",
    role = null,
    includeInactive = false,
    includeInactiveWhenAll = false,
    autoFetch = true,
    fetchAll = false,
    lawyerOnly = false,
  } = options;

  const { dataFetcher, data, error, loading } = useDataFetch();

  // Use a ref for cache timestamp to avoid re-renders
  const lastFetchedRef = useRef(null);
  const [lastFetched, setLastFetched] = useState(null);

  // ─── Build endpoint + params ───────────────────────────────────────────────
  const { endpoint, params } = useMemo(() => {
    const ep = fetchAll ? "users/select-options/all" : "users/select-options";
    const p = new URLSearchParams();

    if (fetchAll) {
      p.append("includeInactive", includeInactiveWhenAll ? "true" : "false");
    } else if (type === "by-role" && role) {
      p.append("role", role);
    } else if (type === "lawyers" || lawyerOnly) {
      p.append("userType", "lawyer");
      if (lawyerOnly) p.append("isLawyer", "true");
    } else {
      p.append("type", type);
    }

    if (!fetchAll) {
      p.append("includeInactive", includeInactive.toString());
    }

    return { endpoint: ep, params: p };
  }, [
    fetchAll,
    type,
    role,
    lawyerOnly,
    includeInactive,
    includeInactiveWhenAll,
  ]);

  // ─── Core fetch ────────────────────────────────────────────────────────────
  const fetchOptions = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (
        !force &&
        lastFetchedRef.current &&
        now - lastFetchedRef.current < CACHE_DURATION &&
        data
      ) {
        return data;
      }

      try {
        const fullEndpoint = `${endpoint}?${params.toString()}`;
        const response = await dataFetcher(fullEndpoint, "GET");

        if (response?.data) {
          lastFetchedRef.current = now;
          setLastFetched(now);
          return response.data;
        }

        if (response?.error) {
          throw new Error(response.error);
        }
      } catch (err) {
        console.error("❌ useUserSelectOptions fetchOptions error:", err);
        throw err;
      }
    },
    [endpoint, params, data, dataFetcher],
  );

  // ─── Auto-fetch on mount / option change ───────────────────────────────────
  useEffect(() => {
    if (autoFetch) {
      fetchOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, endpoint, params.toString()]);

  // ─── Normalize raw API data into usable Select options ─────────────────────
  const normalizedData = useMemo(() => {
    if (!data?.data) {
      return fetchAll
        ? {
            staff: [],
            clients: [],
            lawyers: [],
            admins: [],
            hr: [],
            superAdmins: [],
            all: [],
          }
        : [];
    }

    const raw = data.data;

    if (fetchAll) {
      return {
        staff: normalizeUsers(raw.staff),
        clients: normalizeUsers(raw.clients),
        lawyers: normalizeUsers(raw.lawyers),
        admins: normalizeUsers(raw.admins),
        hr: normalizeUsers(raw.hr),
        superAdmins: normalizeUsers(raw.superAdmins),
        all: normalizeUsers(raw.all),
      };
    }

    // Single-type response — could be array or { data: [] } envelope
    const rawList = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : [];
    return normalizeUsers(rawList);
  }, [data, fetchAll]);

  // ─── Flat "all users" list regardless of fetchAll ──────────────────────────
  const allUsersList = useMemo(() => {
    if (fetchAll) return normalizedData.all || [];
    return Array.isArray(normalizedData) ? normalizedData : [];
  }, [normalizedData, fetchAll]);

  // ─── Helper: find user by id ───────────────────────────────────────────────
  const getUserById = useCallback(
    (id) => allUsersList.find((u) => u.value === id || u._id === id) ?? null,
    [allUsersList],
  );

  // ─── Filter helpers ────────────────────────────────────────────────────────
  const filterByRole = useCallback(
    (filterRole) => allUsersList.filter((u) => u.role === filterRole),
    [allUsersList],
  );

  const filterByUserType = useCallback(
    (userType) => allUsersList.filter((u) => u.userType === userType),
    [allUsersList],
  );

  const filterByPosition = useCallback(
    (position) => allUsersList.filter((u) => u.position === position),
    [allUsersList],
  );

  const filterLawyersByPracticeArea = useCallback(
    (practiceArea) =>
      allUsersList
        .filter((u) => u.userType === "lawyer" || u.isLawyer === true)
        .filter((u) => u.lawyerPracticeAreas?.includes(practiceArea)),
    [allUsersList],
  );

  // ─── Privilege helpers ─────────────────────────────────────────────────────
  const getEffectiveRolesForUser = useCallback(
    (userId) => {
      const user = getUserById(userId);
      if (!user) return [];
      return [...new Set([user.role, ...(user.additionalRoles || [])])];
    },
    [getUserById],
  );

  const userHasPrivilege = useCallback(
    (userId, privilege) => {
      const user = getUserById(userId);
      if (!user) return false;
      if (user.role === "super-admin" || user.userType === "super-admin")
        return true;
      if (user.role === privilege) return true;
      if (user.additionalRoles?.includes(privilege)) return true;
      if (privilege === "lawyer" && user.isLawyer === true) return true;
      return false;
    },
    [getUserById],
  );

  // ─── Derived metadata ──────────────────────────────────────────────────────
  const uniquePositions = useMemo(
    () => [
      ...new Set(allUsersList.filter((u) => u.position).map((u) => u.position)),
    ],
    [allUsersList],
  );

  const practiceAreas = useMemo(() => {
    const lawyers = allUsersList.filter(
      (u) => u.userType === "lawyer" || u.isLawyer,
    );
    const areas = lawyers.flatMap((l) => l.lawyerPracticeAreas || []);
    return [...new Set(areas)];
  }, [allUsersList]);

  const refresh = useCallback(() => fetchOptions(true), [fetchOptions]);

  // ─── Return ────────────────────────────────────────────────────────────────
  return {
    // ✅ PRIMARY: always an array of { value, label, ... } ready for <Select options={} />
    data: normalizedData,

    // Flat list for convenience (same as data when not fetchAll)
    allUsers: allUsersList,

    // Per-category lists (only populated when fetchAll: true)
    ...(fetchAll && {
      staff: normalizedData.staff,
      clients: normalizedData.clients,
      lawyers: normalizedData.lawyers,
      admins: normalizedData.admins,
      hr: normalizedData.hr,
      superAdmins: normalizedData.superAdmins,
    }),

    // State
    loading,
    error,
    lastFetched,
    isAllFetched: fetchAll,

    // Actions
    refresh,
    fetchOptions,

    // Lookups & filters
    getUserById,
    filterByRole,
    filterByUserType,
    filterByPosition,
    filterLawyersByPracticeArea,

    // Privilege
    getEffectiveRolesForUser,
    userHasPrivilege,

    // Metadata
    count: allUsersList.length,
    uniquePositions,
    practiceAreas,

    ...(fetchAll && {
      stats: {
        staff: normalizedData.staff?.length ?? 0,
        clients: normalizedData.clients?.length ?? 0,
        lawyers: normalizedData.lawyers?.length ?? 0,
        admins: normalizedData.admins?.length ?? 0,
        hr: normalizedData.hr?.length ?? 0,
        superAdmins: normalizedData.superAdmins?.length ?? 0,
        total: allUsersList.length,
      },
    }),
  };
};

export default useUserSelectOptions;
