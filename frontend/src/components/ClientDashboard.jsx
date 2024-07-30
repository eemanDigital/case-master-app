import { useAdminHook } from "../hooks/useAdminHook";
import ClientCaseInfo from "./ClientCaseInfo";
import ClientCaseDetails from "./ClientCaseDetails";
import { useSelector } from "react-redux";

const ClientDashboard = () => {
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
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
