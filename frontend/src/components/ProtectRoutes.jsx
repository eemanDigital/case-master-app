import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
//function to protect routes
export default function ProtectedRoute({ element }) {
  const location = useLocation;
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);

  return user ? element : <Navigate to="/login" state={{ from: location }} />;
}
