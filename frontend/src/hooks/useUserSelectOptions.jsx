import { useDataGetterHook } from "./useDataGetterHook";

const useUserSelectOptions = () => {
  const { users } = useDataGetterHook();

  const userData = Array.isArray(users?.data)
    ? users?.data
        .filter((staff) => staff.role !== "client")
        .map((s) => {
          return {
            value: s?.id,
            label: `${s.firstName} ${s.lastName}`,
          };
        })
    : [];

  return { userData };
};

export default useUserSelectOptions;
