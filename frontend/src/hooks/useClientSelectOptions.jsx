import { useEffect } from "react";
import { useDataGetterHook } from "./useDataGetterHook";
import { getUsers } from "../redux/features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";

const useClientSelectOptions = () => {
  const {
    isSuccess,
    isError,
    isLoading,
    users: clients,
  } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const clientOptions = Array.isArray(clients?.data)
    ? clients?.data
        .filter((client) => client.role === "client")
        .map((client) => {
          const label = client.secondName
            ? `${client.firstName} ${client.secondName}`
            : client.firstName;
          return {
            value: client?._id,
            label: label,
          };
        })
    : [];
  return { clientOptions };
};

export default useClientSelectOptions;
