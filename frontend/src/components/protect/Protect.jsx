import { useSelector } from "react-redux";
import {
  selectIsLoggedIn,
  selectUser,
} from "../../redux/features/auth/authSlice";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

// for login
export const ShowOnLogin = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (isLoggedIn) {
    return <>{children}</>;
  }
  return null;
};

// for logout
export const ShowOnLogout = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (!isLoggedIn) {
    return <>{children}</>;
  }
  return null;
};

export const ShowAdmin = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole = useSelector(selectUser);

  if (
    (!isLoggedIn && userRole.role === "admin") ||
    userRole.role === "super-admin"
  ) {
    return <>{children}</>;
  }
  return null;
};

export const ShowOnLoginAndRedirect = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const navigate = useNavigate();
  const [checkedLogin, setCheckedLogin] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("You need to login to access your dashboard");
      navigate("/login"); // Redirect to login page (adjust the path if needed)
    } else {
      setCheckedLogin(true);
    }
  }, [isLoggedIn, navigate]);

  if (!checkedLogin) {
    return null; // Render nothing until login status is checked
  }

  // If logged in and checked, render the child routes
  return <Outlet />;
};
