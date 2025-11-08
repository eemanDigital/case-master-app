// import { useEffect, useState } from "react";
// import Input from "./Inputs";
// import { Button, Card } from "antd";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   loginWithCode,
//   RESET,
//   sendLoginCode,
// } from "../redux/features/auth/authSlice";

// const LoginWithCode = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { isSuccess, isLoggedIn, isLoading } = useSelector(
//     (state) => state.auth
//   );

//   const [userLoginCode, setUserLoginCode] = useState({ loginCode: "" });
//   const { email } = useParams();

//   // Destructure loginCode from userLoginCode
//   const { loginCode } = userLoginCode;

//   // Function to resend user login code
//   const reSendUserLoginCode = async () => {
//     await dispatch(sendLoginCode(email));
//     await dispatch(RESET());
//   };

//   // Function to login user with code
//   const loginUserWithCode = async (e) => {
//     e.preventDefault();
//     if (!loginCode || loginCode === "") {
//       toast.error("Enter your access code");
//       return;
//     }
//     if (loginCode.length !== 6) {
//       toast.error("Access code must be 6 digits");
//       return;
//     }

//     const code = { loginCode };
//     await dispatch(loginWithCode({ code, email }));
//     await dispatch(RESET());
//   };

//   // Redirect user to dashboard if login is successful
//   useEffect(() => {
//     if (isSuccess && isLoggedIn) {
//       navigate("/dashboard");
//     }
//   }, [isSuccess, isLoggedIn, navigate]);

//   // Function to handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setUserLoginCode((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   };

//   let inputStyle =
//     "appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500";

//   return (
//     <section className="flex flex-col items-center justify-center min-h-screen bg-gray-300 shadow-md p-4">
//       <h1 className="text-3xl font-bold text-center text-gray-800 p-5">
//         Enter Your Access Code
//       </h1>

//       <form
//         onSubmit={loginUserWithCode}
//         className="flex flex-col justify-center items-center bg-white rounded-md px-8 pt-6  w-full max-w-md">
//         <div className="flex flex-col items-center mb-6 gap-4 w-full">
//           <Input
//             inputStyle={inputStyle}
//             type="text"
//             label="Access Code"
//             placeholder="Access Code"
//             htmlFor="loginCode"
//             value={loginCode}
//             name="loginCode"
//             onChange={handleChange}
//           />

//           <Button loading={isLoading} type="primary" htmlType="submit">
//             Proceed To Login
//           </Button>
//           <small className="text-center mb-6 text-gray-800">
//             We&apos;ve sent a verification code to your email. Enter the code
//             below to confirm your account.
//           </small>
//         </div>
//       </form>
//       <Card className="w-full max-w-md p-4">
//         <div className="flex justify-between gap-4">
//           <Link to="/users/login" className="font-bold text-blue-500">
//             Login here
//           </Link>
//           <button
//             onClick={reSendUserLoginCode}
//             className="text-gray-700 font-bold">
//             Resend Code
//           </button>
//         </div>
//       </Card>
//     </section>
//   );
// };

// export default LoginWithCode;
import { useEffect, useState } from "react";
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
    e.preventDefault();

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

    const code = { loginCode };
    try {
      await dispatch(loginWithCode({ code, email })).unwrap();
    } catch (error) {
      // Error handling is done in the slice
    }
  };

  // Redirect user to dashboard if login is successful
  useEffect(() => {
    if (isSuccess && isLoggedIn) {
      toast.success("Login successful!");
      navigate("/dashboard");
    }
  }, [isSuccess, isLoggedIn, navigate]);

  // Auto-focus first input and format code input
  const handleCodeChange = (e) => {
    const { value } = e.target;
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setUserLoginCode({ loginCode: numericValue });
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (loginCode.length === 6) {
      const code = { loginCode };
      dispatch(loginWithCode({ code, email }));
    }
  }, [loginCode, dispatch, email]);

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
              />
            </Form.Item>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
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
                disabled={loginCode.length !== 6}
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
                disabled={countdown > 0}
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
                <Button type="text" icon={<ArrowLeftOutlined />}>
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
