import { useEffect } from "react";
import { useDataGetterHook } from "./useDataGetterHook";
import { getUsers } from "../redux/features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";

const useClientSelectOptions = () => {
  const { users: clients } = useSelector((state) => state.auth);
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

  const clientEmailsOption = Array.isArray(clients?.data)
    ? clients?.data
        .filter((client) => client.role === "client")
        .map((client) => {
          const label = client.firstName;

          return {
            value: client?.email,
            label: label,
          };
        })
    : [];
  return { clientOptions, clientEmailsOption };
};

export default useClientSelectOptions;
