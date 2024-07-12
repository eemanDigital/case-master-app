import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";
import AccountOfficerDetails from "./AccountOfficer";
import ClientCaseDetails from "./ClientCaseDetails";

const ClientDashboard = () => {
  const { user } = useAuthContext();
  const { isClient } = useAdminHook();
  return (
    <div>
      {/* account officer for client */}
      {isClient && <AccountOfficerDetails cases={user?.data?.user?.case} />}
      {/* case details */}
      <ClientCaseDetails />
    </div>
  );
};

export default ClientDashboard;
