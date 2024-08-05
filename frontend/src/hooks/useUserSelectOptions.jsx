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

  return { userData };
};

export default useUserSelectOptions;
