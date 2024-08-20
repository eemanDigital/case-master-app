import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../redux/features/auth/authService";
import { toast } from "react-toastify";

const useRedirectLogoutUser = (path) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Function to check login status and redirect if not logged in
    const redirectLoggedOutUser = async () => {
      try {
        const isLoggedIn = await authService.getLoginStatus();
        // Notify user if session expires and navigate to specified path
        if (!isLoggedIn) {
          toast.info("Login session expired. Please, log in again");
          navigate(path);
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    redirectLoggedOutUser(); // Call the function to check login status
  }, [path, navigate]);
};

export default useRedirectLogoutUser;
