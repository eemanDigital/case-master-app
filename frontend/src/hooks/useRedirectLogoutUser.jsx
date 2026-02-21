// hooks/useRedirectLogoutUser.js
import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const useRedirectLogoutUser = (path) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isLoading: authLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Don't redirect while auth is being verified
    if (authLoading) {
      return;
    }

    // If not logged in, redirect to login but save current location
    if (!isLoggedIn) {
      // Don't redirect from login/register pages
      const currentPath = location.pathname;
      if (currentPath.includes('/users/login') || currentPath.includes('/forgotpassword') || currentPath.includes('/resetPassword')) {
        return;
      }
      
      // Save the intended location to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      navigate(path, { replace: true });
    } else {
      // User is logged in - check if there's a stored redirect
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath && redirectPath !== path) {
        // Clear the stored redirect
        sessionStorage.removeItem('redirectAfterLogin');
        // Navigate to the original path (but replace to avoid going back to login)
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isLoggedIn, authLoading, navigate, path, location.pathname]);
};

export default useRedirectLogoutUser;
