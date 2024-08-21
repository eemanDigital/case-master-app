import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";

const ProtectedRoute = ({ isStaffRoute, children }) => {
  const { isClient } = useAdminHook();

  if (isClient && isStaffRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  isStaffRoute: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
