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
    (state) => state.auth,
  );

  const [loginCode, setLoginCode] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { email } = useParams();

  console.log("LoginWithCode rendered with email:", email);

  const hasAutoSubmitted = useRef(false);
  const lastSubmittedCode = useRef("");
  const hasShownSuccessToast = useRef(false);
  const isNavigating = useRef(false);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Success → navigate ──────────────────────────────────────────────────
  useEffect(() => {
    if (
      isSuccess &&
      isLoggedIn &&
      !hasShownSuccessToast.current &&
      !isNavigating.current
    ) {
      hasShownSuccessToast.current = true;
      isNavigating.current = true;
      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/dashboard");
        dispatch(RESET());
      }, 100);
    }
  }, [isSuccess, isLoggedIn, navigate, dispatch]);

  // ── Resend code ─────────────────────────────────────────────────────────
  const reSendUserLoginCode = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    try {
      await dispatch(sendLoginCode(email)).unwrap();
      toast.success("Verification code sent successfully!");
      setCountdown(30);
    } catch {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setResendLoading(false);
      dispatch(RESET());
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const loginUserWithCode = async () => {
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

    // Prevent duplicate submissions for the same code
    if (lastSubmittedCode.current === loginCode) return;
    lastSubmittedCode.current = loginCode;

    try {
      // ✅ FIX: Pass loginCode as a plain string inside the expected object shape.
      //    The thunk signature is loginWithCode({ code, email }) and the backend
      //    controller reads req.body.loginCode.
      //    Previously: code = { loginCode: "123456" } → body was nested wrong.
      //    Now:        code = "123456" → body becomes { loginCode: "123456" }
      await dispatch(loginWithCode({ code: loginCode, email })).unwrap();
    } catch {
      // Reset flags so user can retry with the same or different code
      lastSubmittedCode.current = "";
      hasAutoSubmitted.current = false;
      hasShownSuccessToast.current = false;
    }
  };

  // ── Input change ────────────────────────────────────────────────────────
  const handleCodeChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "").slice(0, 6);
    setLoginCode(numericValue);

    // Reset submission guard when user edits the code
    if (numericValue !== lastSubmittedCode.current) {
      hasAutoSubmitted.current = false;
      lastSubmittedCode.current = "";
    }
  };

  // ── Auto-submit when all 6 digits entered ───────────────────────────────
  useEffect(() => {
    if (
      loginCode.length === 6 &&
      !isLoading &&
      !hasAutoSubmitted.current &&
      lastSubmittedCode.current !== loginCode &&
      !isNavigating.current
    ) {
      hasAutoSubmitted.current = true;
      loginUserWithCode();
    }
    // loginUserWithCode is stable (no deps change it), safe to omit from array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginCode, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
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

        {/* Error alert */}
        {isError && message && (
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

        {/* Form card */}
        <Card
          className="shadow-xl border-0 rounded-2xl"
          bodyStyle={{ padding: "32px" }}>
          <Form layout="vertical" onFinish={loginUserWithCode}>
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

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < loginCode.length ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

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

          <Space direction="vertical" size="middle" className="w-full">
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

        <Card size="small" className="border-0 bg-transparent shadow-none">
          <div className="text-center">
            <Text type="secondary" className="text-sm">
              <SafetyCertificateOutlined className="mr-1" />
              For your security, this code will expire in 60 minutes
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginWithCode;
