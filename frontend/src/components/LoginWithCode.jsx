// components/LoginWithCode.jsx
import { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  Alert,
  Space,
  Divider,
} from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  KeyOutlined,
  MailOutlined,
  ReloadOutlined,
  LoginOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  loginWithCode,
  RESET,
  sendLoginCode,
} from "../redux/features/auth/authSlice";

const { Title, Text, Paragraph } = Typography;

const LoginWithCode = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSuccess, isLoggedIn, isLoading, message, isError } = useSelector(
    (state) => state.auth
  );

  const [userLoginCode, setUserLoginCode] = useState({ loginCode: "" });
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { email } = useParams();

  // ✅ Prevent auto-submit infinite loop
  const hasAutoSubmitted = useRef(false);
  const lastSubmittedCode = useRef("");

  // ✅ NEW: Prevent repeated success toast
  const hasShownSuccessToast = useRef(false);
  const isNavigating = useRef(false);

  const { loginCode } = userLoginCode;

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Function to resend user login code
  const reSendUserLoginCode = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      await dispatch(sendLoginCode(email)).unwrap();
      toast.success("Verification code sent successfully!");
      setCountdown(30); // 30 seconds countdown
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setResendLoading(false);
      dispatch(RESET());
    }
  };

  // Function to login user with code
  const loginUserWithCode = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!loginCode || loginCode.trim() === "") {
      toast.error("Please enter your verification code");
      return;
    }

    if (loginCode.length !== 6) {
      toast.error("Verification code must be exactly 6 digits");
      return;
    }

    if (!/^\d+$/.test(loginCode)) {
      toast.error("Verification code must contain only numbers");
      return;
    }

    // ✅ Prevent duplicate submissions
    if (lastSubmittedCode.current === loginCode) {
      console.log("Code already submitted, skipping...");
      return;
    }

    const code = { loginCode };
    lastSubmittedCode.current = loginCode;

    try {
      await dispatch(loginWithCode({ code, email })).unwrap();
    } catch (error) {
      // Reset on error so user can retry
      lastSubmittedCode.current = "";
      hasAutoSubmitted.current = false;
      hasShownSuccessToast.current = false; // ✅ Reset success flag on error
    }
  };

  // ✅ FIXED: Redirect user to dashboard if login is successful (ONLY ONCE)
  useEffect(() => {
    if (
      isSuccess &&
      isLoggedIn &&
      !hasShownSuccessToast.current &&
      !isNavigating.current
    ) {
      // Mark that we're showing the toast and navigating
      hasShownSuccessToast.current = true;
      isNavigating.current = true;

      toast.success("Login successful!");

      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        navigate("/dashboard");
        dispatch(RESET());
      }, 100);
    }
  }, [isSuccess, isLoggedIn, navigate, dispatch]);

  // Auto-focus first input and format code input
  const handleCodeChange = (e) => {
    const { value } = e.target;
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setUserLoginCode({ loginCode: numericValue });

    // ✅ Reset submission flags when user changes code
    if (numericValue.length < 6) {
      hasAutoSubmitted.current = false;
      lastSubmittedCode.current = "";
    }
  };

  // ✅ Auto-submit when 6 digits are entered (only once)
  useEffect(() => {
    if (
      loginCode.length === 6 &&
      !isLoading &&
      !hasAutoSubmitted.current &&
      lastSubmittedCode.current !== loginCode &&
      !isNavigating.current // ✅ Don't auto-submit if already navigating
    ) {
      console.log("Auto-submitting code:", loginCode);
      hasAutoSubmitted.current = true;
      loginUserWithCode();
    }
  }, [loginCode, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <SafetyCertificateOutlined className="text-2xl text-white" />
            </div>
          </div>
          <Title level={2} className="!mb-2 text-gray-800">
            Two-Factor Authentication
          </Title>
          <Paragraph className="text-gray-600 text-base">
            Enter the 6-digit verification code sent to your email
          </Paragraph>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-flex items-center gap-2">
            <MailOutlined className="text-blue-500" />
            <Text strong className="text-blue-700">
              {email}
            </Text>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert
            message="Verification Failed"
            description={
              message || "Invalid verification code. Please try again."
            }
            type="error"
            showIcon
            closable
          />
        )}

        {/* Main Form Card */}
        <Card
          className="shadow-xl border-0 rounded-2xl"
          bodyStyle={{ padding: "32px" }}>
          <Form layout="vertical" onFinish={loginUserWithCode}>
            {/* Code Input */}
            <Form.Item
              label={
                <Text strong className="text-gray-700">
                  <KeyOutlined className="mr-2" />
                  Verification Code
                </Text>
              }
              validateStatus={loginCode.length === 6 ? "success" : ""}
              help={
                loginCode.length === 6
                  ? "✓ Ready to verify"
                  : "Enter 6-digit code"
              }>
              <Input
                size="large"
                type="text"
                placeholder="000000"
                value={loginCode}
                onChange={handleCodeChange}
                maxLength={6}
                pattern="\d*"
                inputMode="numeric"
                className="text-center text-2xl font-bold tracking-widest h-14"
                autoFocus
                autoComplete="one-time-code"
                disabled={isLoading || isNavigating.current}
              />
            </Form.Item>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index < loginCode.length ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Submit Button */}
            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={
                  loginCode.length !== 6 || isLoading || isNavigating.current
                }
                size="large"
                block
                icon={<LoginOutlined />}
                className="h-12 text-base font-semibold">
                {isLoading ? "Verifying..." : "Verify & Login"}
              </Button>
            </Form.Item>
          </Form>

          <Divider className="my-6" />

          {/* Action Links */}
          <Space direction="vertical" size="middle" className="w-full">
            {/* Resend Code */}
            <div className="flex justify-between items-center">
              <Button
                type="link"
                onClick={reSendUserLoginCode}
                loading={resendLoading}
                disabled={countdown > 0 || isLoading || isNavigating.current}
                icon={<ReloadOutlined />}
                className="p-0 h-auto">
                Resend Verification Code
                {countdown > 0 && (
                  <Text type="secondary" className="ml-2">
                    ({countdown}s)
                  </Text>
                )}
              </Button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link to="/users/login">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  disabled={isLoading || isNavigating.current}>
                  Back to Login
                </Button>
              </Link>
            </div>
          </Space>
        </Card>

        {/* Security Notice */}
        <Card size="small" className="border-0 bg-transparent shadow-none">
          <div className="text-center">
            <Text type="secondary" className="text-sm">
              <SafetyCertificateOutlined className="mr-1" />
              For your security, this code will expire in 10 minutes
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginWithCode;
