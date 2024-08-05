import { useEffect } from "react";
import { useDataGetterHook } from "./useDataGetterHook";

const useCaseSelectOptions = () => {
  const { cases, fetchData } = useDataGetterHook();

  // fetch users
  useEffect(() => {
    fetchData("cases", "cases");
  }, []);

  const casesOptions = Array.isArray(cases?.data)
    ? cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;

        return {
          value: singleCase?._id,
          label: `${firstName || ""} vs ${secondName || ""}`,
        };
      })
    : [];
  // console.log("OP1", casesOptions);
  return { casesOptions };
};

export default useCaseSelectOptions;
