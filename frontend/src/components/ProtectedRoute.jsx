import { Navigate } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";

const ProtectedRoute = ({ isStaffRoute, children }) => {
  const { isClient, isAdmin } = useAdminHook();

  if (isClient && isStaffRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
