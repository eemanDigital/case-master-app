// hooks/useRedirectLogoutUser.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const useRedirectLogoutUser = (path) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(path);
    }
  }, [isLoggedIn, navigate, path]);
};

export default useRedirectLogoutUser;
