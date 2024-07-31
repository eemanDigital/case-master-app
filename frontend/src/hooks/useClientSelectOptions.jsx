import { useDataGetterHook } from "./useDataGetterHook";

const useClientSelectOptions = () => {
  const { users: clients } = useDataGetterHook();

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
