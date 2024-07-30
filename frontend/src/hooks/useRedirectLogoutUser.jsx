import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../redux/features/auth/authService";
import { toast } from "react-toastify";

const useRedirectLogoutUser = (path) => {
  const navigate = useNavigate();

  useEffect(() => {
    let isLoggedIn;

    // get login status
    const redirectLoggedOutUser = async () => {
      try {
        isLoggedIn = await authService.getLoginStatus();
        console.log("RRED", isLoggedIn);
      } catch (error) {
        console.log(error.message);
      }

      // notify user if session expires and navigate to specified path
      if (!isLoggedIn) {
        toast.info("Login session expired. Please, log in again");
        navigate(path);
        return;
      }
    };
    redirectLoggedOutUser;
  }, [path, navigate]);
};

export default useRedirectLogoutUser;
