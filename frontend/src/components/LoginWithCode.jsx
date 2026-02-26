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

  // ✅ Decode email in case it was URI-encoded (e.g. user+tag@domain.com)
  const { email: rawEmail } = useParams();
  const email = decodeURIComponent(rawEmail || "");

  const isSubmitting = useRef(false);
  const hasNavigated = useRef(false);

  // ── Countdown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Navigate on success ────────────────────────────────────────────────
  useEffect(() => {
    if (isSuccess && isLoggedIn && !hasNavigated.current) {
      hasNavigated.current = true;
      toast.success("Login successful!");
      setTimeout(() => {
        dispatch(RESET());
        navigate("/dashboard");
      }, 100);
    }
  }, [isSuccess, isLoggedIn, navigate, dispatch]);

  // ── Submit handler ─────────────────────────────────────────────────────
  const submitCode = async (codeToSubmit) => {
    const code = String(codeToSubmit || loginCode).trim();

    if (!/^\d{6}$/.test(code)) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    if (isSubmitting.current || hasNavigated.current) return;
    isSubmitting.current = true;

    try {
      // ✅ `code` is always a plain string "123456"
      // authService.loginWithCode(code, email) must send: { loginCode: "123456" }
      await dispatch(loginWithCode({ code, email })).unwrap();
    } catch {
      isSubmitting.current = false;
    }
  };

  // ── Resend (user-initiated only — never auto-fires on mount) ───────────
  const reSendCode = async () => {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    setLoginCode("");
    isSubmitting.current = false;

    try {
      await dispatch(sendLoginCode(email)).unwrap();
      toast.success("New verification code sent!");
      setCountdown(60);
    } catch {
      toast.error("Failed to send code. Please try again.");
    } finally {
      setResendLoading(false);
      dispatch(RESET());
    }
  };

  // ── Input change ───────────────────────────────────────────────────────
  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setLoginCode(val);
    if (val.length < 6) isSubmitting.current = false;
  };

  // ── Auto-submit on 6 digits ────────────────────────────────────────────
  useEffect(() => {
    if (
      loginCode.length === 6 &&
      !isLoading &&
      !isSubmitting.current &&
      !hasNavigated.current
    ) {
      submitCode(loginCode);
    }
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
            description={message}
            type="error"
            showIcon
            closable
            onClose={() => dispatch(RESET())}
          />
        )}

        {/* Form */}
        <Card
          className="shadow-xl border-0 rounded-2xl"
          bodyStyle={{ padding: "32px" }}>
          <Form layout="vertical" onFinish={() => submitCode(loginCode)}>
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
                inputMode="numeric"
                pattern="\d*"
                placeholder="000000"
                value={loginCode}
                onChange={handleCodeChange}
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                className="text-center text-2xl font-bold tracking-widest h-14"
                disabled={isLoading || hasNavigated.current}
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
                  loginCode.length !== 6 || isLoading || hasNavigated.current
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
            <Button
              type="link"
              onClick={reSendCode}
              loading={resendLoading}
              disabled={countdown > 0 || isLoading || hasNavigated.current}
              icon={<ReloadOutlined />}
              className="p-0 h-auto">
              Resend Verification Code
              {countdown > 0 && (
                <Text type="secondary" className="ml-2">
                  ({countdown}s)
                </Text>
              )}
            </Button>

            <div className="text-center">
              <Link to="/users/login">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  disabled={isLoading}>
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
              For your security, this code expires in 60 minutes
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginWithCode;
