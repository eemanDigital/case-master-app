import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAdminHook } from "../hooks/useAdminHook";
import { RESET, sendVerificationMail } from "../redux/features/auth/authSlice";
import LoadingSpinner from "./LoadingSpinner";
import {
  Alert,
  Card,
  Typography,
  Button,
  Space,
  Result,
  Row,
  Col,
  Tag,
  Divider,
  notification,
} from "antd";
import {
  MailOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Title, Text, Paragraph } = Typography;

const VerifyAccountNotice = () => {
  useRedirectLogoutUser("/users/login");
  const dispatch = useDispatch();
  const { isError, isLoading, message, user } = useSelector(
    (state) => state.auth,
  );
  const { isStaff } = useAdminHook();

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // User details
  const username = user?.data?.firstName || "User";
  const userRole = user?.data?.role;
  const userEmail = user?.data?.email;
  const userPosition = user?.data?.position;
  const isVerified = user?.data?.isVerified;

  // Cooldown timer for resend email
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Send verification email handler
  const sendVeriEmail = async () => {
    if (cooldown > 0) return;

    setSendingEmail(true);
    try {
      await dispatch(sendVerificationMail(userEmail));
      setEmailSent(true);
      setCooldown(60); // 60 seconds cooldown

      notification.success({
        message: "Verification Email Sent",
        description:
          "Check your inbox (and spam folder) for the verification link.",
        placement: "topRight",
      });
    } catch (error) {
      notification.error({
        message: "Failed to Send Email",
        description: "Please try again later.",
        placement: "topRight",
      });
    } finally {
      setSendingEmail(false);
      dispatch(RESET());
    }
  };

  // Get role/title display
  const getRoleDisplay = () => {
    if (userRole === "client") {
      return (
        <Tag color="blue" className="px-3 py-1 rounded-full">
          Client
        </Tag>
      );
    }
    return (
      <Tag color="green" className="px-3 py-1 rounded-full">
        {userPosition || "Staff Member"}
      </Tag>
    );
  };

  // Show loading state
  if (isLoading) return <LoadingSpinner />;

  // If user is already verified, show nothing or a success message
  if (isVerified) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <Card className="rounded-2xl shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <Result
            status="success"
            icon={<CheckCircleOutlined className="text-5xl text-green-500" />}
            title={
              <span className="text-2xl font-bold text-gray-800">
                Account Verified!
              </span>
            }
            subTitle={
              <span className="text-gray-600">
                Your account has been successfully verified. You now have full
                access to the system.
              </span>
            }
            extra={[
              <Button
                type="primary"
                key="dashboard"
                href="/dashboard"
                className="h-12 px-6 rounded-lg font-semibold">
                Go to Dashboard
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Icon Section */}
            <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 flex flex-col items-center justify-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border-4 border-white/20 shadow-2xl">
                <SafetyCertificateOutlined className="text-6xl md:text-7xl text-white" />
              </div>

              <div className="mt-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Account Security
                </h3>
                <p className="text-blue-100">
                  Verify your email to secure your account and access all
                  features
                </p>
              </div>

              <div className="mt-8 w-full">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <UserOutlined className="text-lg text-blue-200" />
                    <span className="text-blue-100 font-medium">
                      Account Status
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Verification</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-medium">
                      <WarningOutlined /> Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Section */}
            <div className="lg:col-span-8 p-8 md:p-12">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <InfoCircleOutlined className="text-2xl text-blue-600" />
                  <Title level={2} className="!mb-0 !text-gray-800">
                    Account Verification Required
                  </Title>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-lg text-gray-700">
                    Welcome,{" "}
                    <span className="font-bold text-blue-600 text-xl">
                      {username}
                    </span>
                    ! You've been {isStaff ? "appointed" : "registered"} at{" "}
                    <span className="font-bold text-blue-600">
                      A.T. Lukman & Co
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserOutlined className="text-lg text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Role</h4>
                      <div className="mt-2">{getRoleDisplay()}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MailOutlined className="text-lg text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">
                        Email Address
                      </h4>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <Text
                            copyable
                            className="font-mono bg-gray-100 px-3 py-2 rounded-lg text-gray-700">
                            {userEmail}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Message */}
              <Alert
                message={
                  <div className="flex items-center gap-3">
                    <WarningOutlined className="text-lg" />
                    <span className="font-semibold">Important Notice</span>
                  </div>
                }
                description={
                  <p className="mt-2 text-gray-700">
                    To activate your account and access all system features,
                    please verify your email address. This helps us ensure the
                    security of your account and personal information.
                  </p>
                }
                type="warning"
                showIcon={false}
                className="rounded-xl border border-yellow-200 bg-yellow-50 mb-8"
              />

              <Divider />

              {/* Email Verification Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <MailOutlined className="text-2xl text-blue-600" />
                  <Title level={3} className="!mb-0 !text-gray-800">
                    Email Verification
                  </Title>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 mb-6">
                  <p className="text-gray-700 mb-6">
                    We've sent a verification link to your email address. Please
                    click the link in the email to complete your account setup.
                    The link will expire in 24 hours.
                  </p>

                  <div className="space-y-4">
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      onClick={sendVeriEmail}
                      loading={sendingEmail}
                      disabled={cooldown > 0}
                      size="large"
                      className={`w-full md:w-auto h-14 px-8 rounded-xl font-semibold text-lg transition-all duration-300 ${
                        emailSent
                          ? "bg-green-500 hover:bg-green-600 border-green-500"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      }`}>
                      {sendingEmail ? (
                        <span>Sending...</span>
                      ) : emailSent ? (
                        <span className="flex items-center gap-2">
                          <CheckOutlined /> Email Sent Successfully!
                        </span>
                      ) : (
                        <span>Send Verification Email</span>
                      )}
                    </Button>

                    {cooldown > 0 && (
                      <div className="flex items-center gap-3 bg-blue-100/50 rounded-lg p-4 border border-blue-200">
                        <ClockCircleOutlined className="text-blue-600" />
                        <span className="text-blue-700 font-medium">
                          Resend available in{" "}
                          <span className="text-xl font-bold mx-1">
                            {cooldown}
                          </span>
                          seconds
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CheckCircleOutlined className="text-green-500" />
                      Check Spam Folder
                    </h4>
                    <p className="text-gray-600">
                      If you don't see our email, please check your spam or junk
                      folder. Mark it as "Not Spam" to receive future emails.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <ReloadOutlined className="text-blue-500" />
                      Need Another Email?
                    </h4>
                    <p className="text-gray-600">
                      Didn't receive the email? Try resending it or contact
                      support if you continue to have issues.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Links */}
              <div className="border-t pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-gray-600">
                      Need help with verification? Our support team is here to
                      assist you.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={sendVeriEmail}
                      disabled={cooldown > 0}
                      className={`rounded-lg ${cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
                      {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend Email"}
                    </Button>
                    <Button
                      type="link"
                      href="/support/verification"
                      className="text-blue-600 font-semibold">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Tips */}
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl shadow-lg p-6 md:p-8 border border-emerald-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <SafetyCertificateOutlined className="text-emerald-600" />
            Verification Tips & Best Practices
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ClockCircleOutlined className="text-lg" />,
                title: "Act Quickly",
                desc: "Click the verification link within 24 hours of receiving the email.",
              },
              {
                icon: <CheckOutlined className="text-lg" />,
                title: "Check Details",
                desc: "Ensure your email address is entered correctly in your account settings.",
              },
              {
                icon: <UserOutlined className="text-lg" />,
                title: "Admin Support",
                desc: "Contact your system administrator if you encounter any issues.",
              },
              {
                icon: <SafetyCertificateOutlined className="text-lg" />,
                title: "Security First",
                desc: "Verification ensures your account remains secure and protected.",
              },
            ].map((tip, index) => (
              <div
                key={index}
                className="bg-white/70 rounded-xl p-5 border border-emerald-100 hover:border-emerald-200 transition-colors duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <div className="text-emerald-600">{tip.icon}</div>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  {tip.title}
                </h4>
                <p className="text-gray-600 text-sm">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {isError && (
          <div className="mt-6">
            <Alert
              message="Verification Error"
              description={
                message || "An error occurred while processing your request."
              }
              type="error"
              showIcon
              closable
              className="rounded-xl"
            />
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            By verifying your account, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountNotice;
