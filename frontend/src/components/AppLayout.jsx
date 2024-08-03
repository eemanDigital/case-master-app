import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

const AppLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Save the current path to local storage whenever it changes
    localStorage.setItem("currentPath", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    // On component mount, check if there is a saved path in local storage
    const savedPath = localStorage.getItem("currentPath");
    const isLoginPage = location.pathname.startsWith("/login");

    // Navigate to saved path only if it is not the current path and not a login page
    if (savedPath && !isLoginPage && savedPath !== location.pathname) {
      navigate(savedPath);
    }
  }, [navigate, location.pathname]);

  return (
    <>
      <Outlet />
    </>
  );
};

export default AppLayout;
