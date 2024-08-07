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
  return { userData, adminOptions };
};

export default useUserSelectOptions;
