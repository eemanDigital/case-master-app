// import { useDispatch } from "react-redux";
// import { GoogleLogin } from "@react-oauth/google";
// import { loginWithGoogle } from "../redux/features/auth/authSlice";
// import { toast } from "react-toastify";

// const GoogleUserLogin = () => {
//   const dispatch = useDispatch();
//   // google login
//   const loginUserWithGoogle = async (credentialResponse) => {
//     await dispatch(
//       loginWithGoogle({ userToken: credentialResponse.credential })
//     );
//   };

//   return (
//     <>
//       <div>
//         {/* <Button onClick={() => login()}>Sign in with Google 🚀</Button> */}
//         <GoogleLogin
//           onSuccess={loginUserWithGoogle}
//           onError={() => {
//             toast.error("Login Failed");
//           }}
//         />
//       </div>
//     </>
//   );
// };

// export default GoogleUserLogin;
// components/GoogleUserLogin.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle, RESET } from "../redux/features/auth/authSlice";

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

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      // ✅ The thunk will handle fetching fresh user data
      await dispatch(loginWithGoogle(credentialResponse.credential));
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => {
          console.error("Google Login Failed");
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
