import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";
import ClientCaseInfo from "./ClientCaseInfo";
import ClientCaseDetails from "./ClientCaseDetails";

const ClientDashboard = () => {
  const { user } = useAuthContext();
  const { isClient } = useAdminHook();

  return (
    <div>
      {/* account officer for client */}
      {isClient && <ClientCaseInfo cases={user?.data?.user?.case} />}
      {/* case details */}
      <ClientCaseDetails />
    </div>
  );
};

export default ClientDashboard;
