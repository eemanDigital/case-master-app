import React from "react";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const GoogleUserLogin = () => {
  const dispatch = useDispatch();
  // google login
  const loginUserWithGoogle = async (credentialResponse) => {
    await dispatch(
      loginWithGoogle({ userToken: credentialResponse.credential })
    );
  };

  return (
    <>
      <div>
        {/* <Button onClick={() => login()}>Sign in with Google 🚀</Button> */}
        <GoogleLogin
          onSuccess={loginUserWithGoogle}
          onError={() => {
            toast.error("Login Failed");
          }}
        />
      </div>
    </>
  );
};

export default GoogleUserLogin;
