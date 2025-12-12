// components/GoogleUserLogin.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle, RESET } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const GoogleUserLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isSuccess, isLoggedIn } = useSelector((state) => state.auth);

  // ✅ Handle successful Google login
  useEffect(() => {
    if (isSuccess && isLoggedIn) {
      // User data is already fetched in the loginWithGoogle thunk
      navigate("/dashboard");
      dispatch(RESET());
    }
  }, [isSuccess, isLoggedIn, navigate, dispatch]);

  // Google login handler
  const loginUserWithGoogle = async (credentialResponse) => {
    try {
      // ✅ The thunk will handle fetching fresh user data
      await dispatch(
        loginWithGoogle({ userToken: credentialResponse.credential })
      ).unwrap();
    } catch (error) {
      console.error("Google login error:", error);
      // Error toast is already shown in the slice
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={loginUserWithGoogle}
        onError={() => {
          toast.error("Login Failed");
        }}
        useOneTap
        theme="outline"
        size="large"
        width="100%"
      />
    </div>
  );
};

export default GoogleUserLogin;
