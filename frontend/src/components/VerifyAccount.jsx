// import { Button, Card } from "antd";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useParams } from "react-router-dom";
// import { RESET, verifyUser } from "../redux/features/auth/authSlice";
// import { useEffect } from "react";

// const VerifyAccount = () => {
//   const dispatch = useDispatch();
//   const { token } = useParams();
//   const { isLoading } = useSelector((state) => state.auth);

//   // Reset success state on component mount
//   useEffect(() => {
//     dispatch(RESET());
//   }, [dispatch]);

//   // verify user handler
//   const verifyUserAccount = async () => {
//     await dispatch(verifyUser(token));
//   };

//   // Redirect to dashboard if verification is successful - this is not working as expected due to the way the success state is being handled, will fix this later
//   // useEffect(() => {
//   //   if (isSuccess) {
//   //     navigate("/dashboard");
//   //     dispatch(RESET()); // Reset the success state after navigation
//   //   }
//   // }, [isSuccess, navigate, dispatch]);

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <section className="w-full max-w-md p-4">
//         <Card className="shadow-lg">
//           <h1 className="text-2xl font-bold text-center mb-4">
//             Verify Your Account
//           </h1>
//           <p className="text-center mb-6">
//             Click the button below to verify your account.
//           </p>

//           <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
//             <Button
//               loading={isLoading}
//               onClick={verifyUserAccount}
//               className="bg-blue-500 text-white w-full sm:w-auto">
//               Verify Account
//             </Button>
//             <Button className="w-full sm:w-auto">
//               <Link to="/dashboard" className="text-blue-500">
//                 Go Back To Dashboard
//               </Link>
//             </Button>
//           </div>
//         </Card>
//       </section>
//     </div>
//   );
// };

// export default VerifyAccount;
// components/VerifyAccount.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getUser } from "../redux/features/auth/authSlice";
import { Result, Button, Spin } from "antd";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const VerifyAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        const response = await axios.patch(
          `${API_URL}/users/verify-account/${token}`
        );

        if (response.data.success) {
          setStatus("success");
          setMessage(response.data.message || "Account verified successfully!");

          // ✅ CRITICAL: Refresh user data to update verification status in Redux
          await dispatch(getUser()).unwrap();

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Verification failed. The link may be invalid or expired."
        );
      }
    };

    if (token) {
      verifyAccount();
    }
  }, [token, navigate, dispatch]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Verifying your account..." />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Result
          status="success"
          title="Account Verified Successfully!"
          subTitle={message}
          extra={[
            <Button
              type="primary"
              key="dashboard"
              onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Result
        status="error"
        title="Verification Failed"
        subTitle={message}
        extra={[
          <Button type="primary" key="home" onClick={() => navigate("/")}>
            Back Home
          </Button>,
        ]}
      />
    </div>
  );
};

export default VerifyAccount;
