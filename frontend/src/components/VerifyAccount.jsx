import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getUser } from "../redux/features/auth/authSlice";
import { Result, Button, Spin } from "antd";
import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

const VerifyAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const verifyAccount = async () => {
      try {
        const response = await axios.patch(
          `${API_URL}/users/verifyUser/${token}`,
        );

        // ✅ FIX: Backend returns { message, user } — no "success" boolean.
        //    A 2xx status code IS the success signal.
        setStatus("success");
        setMessage(response.data.message || "Account verified successfully!");

        // Refresh Redux user so isVerified is up-to-date across the app
        try {
          await dispatch(getUser()).unwrap();
        } catch {
          // Not fatal — user data will refresh on next protected route visit
        }

        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Verification failed. The link may be invalid or expired.",
        );
      }
    };

    verifyAccount();
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
