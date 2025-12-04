import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { getUsers } from "../redux/features/auth/authSlice";

const useUserSelectOptions = () => {
  const { users, usersLoading, usersLastFetched } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const CACHE_DURATION = 5 * 60 * 1000;
    const now = Date.now();
    const isStale =
      !usersLastFetched || now - usersLastFetched > CACHE_DURATION;

    // Only fetch if needed
    const shouldFetch =
      !users?.data?.length &&
      !usersLoading &&
      !hasFetchedRef.current &&
      isStale;

    if (shouldFetch) {
      console.log("🔄 useUserSelectOptions: Fetching users (cache miss)");
      hasFetchedRef.current = true;
      dispatch(getUsers());
    } else if (users?.data?.length) {
      console.log("✅ useUserSelectOptions: Using cached users");
    }
  }, [dispatch, users?.data?.length, usersLoading, usersLastFetched]);

  // Memoize calculations
  const { userData, allUsers, adminOptions, lawyersOptions } = useMemo(() => {
    const userList = Array.isArray(users?.data) ? users.data : [];

    const userData = userList
      .filter((staff) => staff.role !== "client" && staff.isActive !== false)
      .map((s) => ({
        value: s._id,
        label: `${s.firstName} ${s.lastName}`,
      }));

    const allUsers = userList.map((s) => ({
      value: s._id,
      label: `${s.firstName} ${s.lastName || ""} (${s.position || "Client"})`,
    }));

    const adminOptions = userList
      .filter((ad) => ["admin", "super-admin", "hr"].includes(ad.role))
      .map((ad) => ({
        value: ad.email,
        label: `${ad.firstName} ${ad.lastName}`,
      }));

    const lawyersOptions = userList
      .filter((lawyer) => lawyer.isLawyer === true)
      .map((l) => ({
        value: l._id,
        label: `${l.firstName} ${l.lastName}`,
      }));

    return { userData, allUsers, adminOptions, lawyersOptions };
  }, [users?.data]);

  return {
    userData,
    allUsers,
    adminOptions,
    lawyersOptions,
    loading: usersLoading,
  };
};

export default useUserSelectOptions;
