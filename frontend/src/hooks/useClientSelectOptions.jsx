import { useDataGetterHook } from "./useDataGetterHook";

const useClientSelectOptions = () => {
  const { clients } = useDataGetterHook();

  const clientOptions = Array.isArray(clients?.data)
    ? clients?.data.map((client) => {
        return {
          value: client?._id,
          label: client?.fullName,
        };
      })
    : [];
  return { clientOptions };
};

export default useClientSelectOptions;
