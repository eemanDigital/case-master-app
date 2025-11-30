// import { useDispatch, useSelector } from "react-redux";
// // import { useDataGetterHook } from "./useDataGetterHook";
// import { useEffect } from "react";
// import { getUsers } from "../redux/features/auth/authSlice";

// const useUserSelectOptions = () => {
//   const { users } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   // fetch users
//   useEffect(() => {
//     dispatch(getUsers());
//   }, [dispatch]);

//   // list of staff users
//   const userData = Array.isArray(users?.data)
//     ? users?.data
//         .filter((staff) => staff.role !== "client" && staff.isActive !== false) // Exclude clients and inactive users
//         .map((s) => {
//           return {
//             value: s?._id,
//             label: `${s.firstName} ${s.lastName}`,
//           };
//         })
//     : [];

//   // all users
//   const allUsers = Array.isArray(users?.data)
//     ? users?.data
//         .filter((staff) => staff)
//         .map((s) => {
//           return {
//             value: s?._id,
//             label: `${s.firstName} ${s.lastName || " "} (${
//               s.position || "Client"
//             })`,
//           };
//         })
//     : [];

//   // list of admins
//   const adminOptions = Array.isArray(users?.data)
//     ? users?.data
//         .filter(
//           (ad) =>
//             ad.role === "admin" || ad.role === "super-admin" || ad.role === "hr"
//         )
//         .map((ad) => {
//           const label = `${ad.firstName} ${ad.lastName}`;

//           return {
//             value: ad?.email,
//             label: label,
//           };
//         })
//     : [];
//   return { userData, allUsers, adminOptions };
// };

// export default useUserSelectOptions;
// hooks/useUserSelectOptions.js
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { getUsers } from "../redux/features/auth/authSlice";

const useUserSelectOptions = () => {
  const { users, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const hasFetched = useRef(false);

  // Fetch users only once
  useEffect(() => {
    if (!users?.data && !loading && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(getUsers());
    }
  }, [dispatch, users?.data, loading]);

  // Memoize all calculations
  const { userData, allUsers, adminOptions } = useMemo(() => {
    const userList = Array.isArray(users?.data) ? users.data : [];

    const userData = userList
      .filter((staff) => staff.role !== "client" && staff.isActive !== false)
      .map((s) => ({
        value: s?._id,
        label: `${s.firstName} ${s.lastName}`,
      }));

    const allUsers = userList.map((s) => ({
      value: s?._id,
      label: `${s.firstName} ${s.lastName || " "} (${s.position || "Client"})`,
    }));

    const adminOptions = userList
      .filter(
        (ad) =>
          ad.role === "admin" || ad.role === "super-admin" || ad.role === "hr"
      )
      .map((ad) => ({
        value: ad?.email,
        label: `${ad.firstName} ${ad.lastName}`,
      }));

    return { userData, allUsers, adminOptions };
  }, [users?.data]);

  return { userData, allUsers, adminOptions, loading };
};

export default useUserSelectOptions;
