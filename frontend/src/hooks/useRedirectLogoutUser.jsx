import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import authService from "../redux/features/auth/authService";
// import { toast } from "react-toastify";

const useRedirectLogoutUser = (path) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Function to check login status and redirect if not logged in
    const redirectLoggedOutUser = async () => {
      try {
        const isLoggedIn = await authService.getLoginStatus();

        // Check if user is logged in but not verified
        const isVerified = user?.data?.isVerified;

        // Only redirect if:
        // 1. User is not logged in OR
        // 2. User is logged in but doesn't have user data (inconsistent state)
        if (!isLoggedIn || (isLoggedIn && !user)) {
          // toast.info("Login session expired. Please, log in again");
          navigate(path);
          return;
        }

        // If user is logged in but not verified, allow them to stay
        // They'll see the verification notice on the dashboard
        if (isLoggedIn && !isVerified) {
          // Don't redirect - let them see the verification notice
          return;
        }
      } catch (error) {
        console.log(error.message);
        // If there's an error checking login status, redirect to login
        navigate(path);
      }
    };

    redirectLoggedOutUser(); // Call the function to check login status
  }, [path, navigate, user]); // Add user to dependencies
};

export default useRedirectLogoutUser;
