import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
//function to protect routes
export default function ProtectedRoute({ element }) {
  const location = useLocation;
  const { user } = useAuthContext();

  return user ? element : <Navigate to="/login" state={{ from: location }} />;
}
