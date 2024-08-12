import { useDispatch, useSelector } from "react-redux";
// import { useDataGetterHook } from "./useDataGetterHook";
import { useEffect } from "react";
import { getUsers } from "../redux/features/auth/authSlice";

const useUserSelectOptions = () => {
  const { isSuccess, isError, isLoading, users } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  // fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // list of staff users
  const userData = Array.isArray(users?.data)
    ? users?.data
        .filter((staff) => staff.role !== "client")
        .map((s) => {
          return {
            value: s?._id,
            label: `${s.firstName} ${s.lastName}`,
          };
        })
    : [];

  // all users
  const allUsers = Array.isArray(users?.data)
    ? users?.data
        .filter((staff) => staff)
        .map((s) => {
          return {
            value: s?._id,
            label: `${s.firstName} ${s.lastName || " "} (${
              s.position || "Client"
            })`,
          };
        })
    : [];

  // list of admins
  const adminOptions = Array.isArray(users?.data)
    ? users?.data
        .filter(
          (ad) =>
            ad.role === "admin" || ad.role === "super-admin" || ad.role === "hr"
        )
        .map((ad) => {
          const label = `${ad.firstName} ${ad.lastName}`;

          return {
            value: ad?.email,
            label: label,
          };
        })
    : [];
  return { userData, allUsers, adminOptions };
};

export default useUserSelectOptions;
