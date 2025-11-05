import { useEffect } from "react";
import { useDataGetterHook } from "./useDataGetterHook";

const useCaseSelectOptions = () => {
  const { cases, fetchData } = useDataGetterHook();

  // fetch cases
  useEffect(() => {
    fetchData("cases", "cases");
  }, [fetchData]);

  const casesOptions = Array.isArray(cases?.data)
    ? cases?.data.map((singleCase) => {
        const { firstParty, secondParty, client } = singleCase;
        const firstName = firstParty?.name[0]?.name || "Unknown";
        const secondName = secondParty?.name[0]?.name || "Unknown";

        return {
          value: singleCase?._id,
          label: `${firstName} vs ${secondName}`,
          caseNumber: singleCase?.caseNumber,
          client: client, // Include client data for auto-population
        };
      })
    : [];

  // Return both the options for Select and the full cases data for lookup
  return {
    casesOptions,
    casesData: cases?.data || [], // Return full cases data for client lookup
  };
};

export default useCaseSelectOptions;
