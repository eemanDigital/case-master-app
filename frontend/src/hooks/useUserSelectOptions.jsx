import { useDataGetterHook } from "./useDataGetterHook";

const useUserSelectOptions = () => {
  const { users } = useDataGetterHook();

  const userData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?._id,
          label: user?.fullName,
        };
      })
    : [];

  return { userData };
};

export default useUserSelectOptions;
