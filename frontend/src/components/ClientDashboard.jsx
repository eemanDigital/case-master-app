import { useAdminHook } from "../hooks/useAdminHook";
import ClientCaseInfo from "./ClientCaseInfo";
import ClientCaseDetails from "./ClientCaseDetails";
import { useSelector } from "react-redux";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useEffect, useState } from "react";

const ClientDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { cases, fetchData } = useDataGetterHook();
  const { isClient } = useAdminHook();
  const clientId = user?.data?._id;
  const [clientCases, setClientCases] = useState([]);

  // Fetch cases
  useEffect(() => {
    fetchData("cases", "cases");
  }, [fetchData]);

  // Filter cases for the client
  useEffect(() => {
    if (cases && clientId) {
      const filteredCases = cases?.data?.filter(
        (caseItem) => caseItem.client === clientId
      );
      setClientCases(filteredCases);
    }
  }, [cases, clientId]);

  return (
    <div>
      {/* account officer for client */}
      {isClient && <ClientCaseInfo cases={clientCases} />}
      {/* case details */}
      <ClientCaseDetails />
    </div>
  );
};

export default ClientDashboard;
