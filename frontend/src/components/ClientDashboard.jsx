import { useAdminHook } from "../hooks/useAdminHook";
import ClientCaseInfo from "./ClientCaseInfo";
import ClientCaseDetails from "./ClientCaseDetails";
import { useSelector } from "react-redux";

const ClientDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { isClient } = useAdminHook();

  return (
    <div>
      {/* account officer for client */}
      {isClient && <ClientCaseInfo cases={user?.data?.clientCase} />}
      {/* case details */}
      <ClientCaseDetails />
    </div>
  );
};

export default ClientDashboard;
