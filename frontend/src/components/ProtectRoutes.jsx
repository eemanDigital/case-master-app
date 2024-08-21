import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Function to protect routes
export default function ProtectedRoute({ element }) {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Redirect to login page if user is not logged in
  return user ? element : <Navigate to="/login" state={{ from: location }} />;
}

ProtectedRoute.propTypes = {
  element: PropTypes.element.isRequired,
};
