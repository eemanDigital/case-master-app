import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Steps,
  Typography,
  Divider,
  message,
  Alert,
  Spin,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  BankOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [invitationData, setInvitationData] = useState(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [token] = useState(searchParams.get("token"));

  useEffect(() => {
    if (token) {
      validateInvitation(token);
    } else {
      setValidatingToken(false);
    }
  }, [token]);

  const validateInvitation = async (token) => {
    try {
      const response = await axios.get(
        `${baseURL}/invitations/validate/${token}`,
      );
      setInvitationData(response.data.data);
      message.success("Invitation validated!");
    } catch (error) {
      message.error(
        error.response?.data?.message || "Invalid or expired invitation",
      );
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        ...(invitationData && { firmId: invitationData.firmId }),
      };

      const endpoint = token
        ? `${baseURL}/invitations/accept/${token}`
        : `${baseURL}/users/register-firm`;

      await axios.post(endpoint, data);

      message.success("Registration successful! Please login.");
      navigate("/users/login");
    } catch (error) {
      message.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    try {
      const fieldsToValidate =
        currentStep === 0
          ? ["firstName", "lastName", "email", "password", "passwordConfirm"]
          : ["firmName", "phone", "state", "city", "address"];

      await form.validateFields(fieldsToValidate);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const steps = [
    { title: "Account", icon: <UserOutlined /> },
    { title: "Firm", icon: <BankOutlined /> },
    { title: "Complete", icon: <CheckCircleOutlined /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">LawMaster</span>
          </Link>
        </div>

        {/* Invitation Alert */}
        {invitationData && (
          <Alert
            message={`You've been invited to join with ${invitationData.plan} plan`}
            description={`You're registering as ${invitationData.role} with access for up to ${invitationData.maxUsers} users.`}
            type="info"
            showIcon
            className="mb-6"
          />
        )}

        <Card className="bg-white border border-slate-200 shadow-xl rounded-2xl">
          <div className="text-center mb-6">
            <Title level={2} className="!mb-2 !text-slate-800">
              {token ? "Accept Invitation" : "Start Free Trial"}
            </Title>
            <Text className="text-slate-500">
              {token
                ? "Complete your registration to join the firm"
                : "Create your firm account in just a few steps"}
            </Text>
          </div>

          {/* Steps */}
          {!token && (
            <Steps
              current={currentStep}
              items={steps}
              className="mb-8"
              size="small"
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              plan: invitationData?.plan || "FREE",
              state: "Lagos",
            }}
            requiredMark={false}
            className="register-form">
            {/* Step 1: Account Info */}
            <div
              style={{
                display: currentStep === 0 || token ? "block" : "none",
              }}>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="firstName"
                  label={<span style={{ color: "#334155" }}>First Name</span>}
                  rules={[{ required: true, message: "Required" }]}>
                  <Input
                    prefix={<UserOutlined style={{ color: "#64748b" }} />}
                    placeholder="John"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>

                <Form.Item
                  name="lastName"
                  label={<span style={{ color: "#334155" }}>Last Name</span>}
                  rules={[{ required: true, message: "Required" }]}>
                  <Input
                    prefix={<UserOutlined style={{ color: "#64748b" }} />}
                    placeholder="Doe"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="email"
                label={<span style={{ color: "#334155" }}>Email Address</span>}
                rules={[
                  { required: true, message: "Required" },
                  { type: "email", message: "Invalid email" },
                ]}
                initialValue={invitationData?.email}>
                <Input
                  prefix={<MailOutlined style={{ color: "#64748b" }} />}
                  placeholder="john@example.com"
                  size="large"
                  disabled={!!invitationData?.email}
                  className="bg-white"
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="password"
                  label={<span style={{ color: "#334155" }}>Password</span>}
                  rules={[
                    { required: true, message: "Required" },
                    { min: 8, message: "At least 8 characters" },
                  ]}>
                  <Input.Password
                    prefix={<LockOutlined style={{ color: "#64748b" }} />}
                    placeholder="Create password"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>

                <Form.Item
                  name="passwordConfirm"
                  label={
                    <span style={{ color: "#334155" }}>Confirm Password</span>
                  }
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Required" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords don't match"),
                        );
                      },
                    }),
                  ]}>
                  <Input.Password
                    prefix={<LockOutlined style={{ color: "#64748b" }} />}
                    placeholder="Confirm password"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>
              </div>

              {/* Gender field - required for staff/lawyer */}
              {(!token || invitationData?.role !== "client") && (
                <Form.Item
                  name="gender"
                  label={<span style={{ color: "#334155" }}>Gender</span>}
                  rules={[{ required: true, message: "Please select your gender" }]}>
                  <Select
                    placeholder="Select gender"
                    size="large"
                    className="w-full bg-white">
                    <Option value="male">Male</Option>
                    <Option value="female">Female</Option>
                    <Option value="other">Other</Option>
                    <Option value="prefer-not-to-say">Prefer not to say</Option>
                  </Select>
                </Form.Item>
              )}

              {/* Phone - always required */}
              <Form.Item
                name="phone"
                label={<span style={{ color: "#334155" }}>Phone Number</span>}
                rules={[{ required: true, message: "Required" }]}>
                <Input
                  prefix={<PhoneOutlined style={{ color: "#64748b" }} />}
                  placeholder="+2348012345678"
                  size="large"
                  className="bg-white"
                />
              </Form.Item>

              {/* Address - required for staff/lawyer */}
              {(!token || invitationData?.role !== "client") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      name="state"
                      label={<span style={{ color: "#334155" }}>State</span>}
                      rules={[{ required: true, message: "Required" }]}>
                      <Select
                        placeholder="Select state"
                        size="large"
                        showSearch
                        className="w-full bg-white">
                        {nigerianStates.map((state) => (
                          <Option key={state} value={state}>
                            {state}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="city"
                      label={<span style={{ color: "#334155" }}>City</span>}
                      rules={[{ required: true, message: "Required" }]}>
                      <Input
                        prefix={
                          <EnvironmentOutlined style={{ color: "#64748b" }} />
                        }
                        placeholder="Lagos"
                        size="large"
                        className="bg-white"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="address"
                    label={<span style={{ color: "#334155" }}>Residential Address</span>}
                    rules={[{ required: true, message: "Please provide your residential address" }]}>
                    <Input.TextArea
                      placeholder="123 Macaulay Street, Surulere"
                      rows={2}
                      size="large"
                      className="bg-white"
                    />
                  </Form.Item>
                </>
              )}
            </div>

            {/* Step 2: Firm Info (only for new registration) */}
            {!token && (
              <div style={{ display: currentStep === 1 ? "block" : "none" }}>
                <Form.Item
                  name="firmName"
                  label={<span style={{ color: "#334155" }}>Firm Name</span>}
                  rules={[{ required: true, message: "Required" }]}>
                  <Input
                    prefix={<BankOutlined style={{ color: "#64748b" }} />}
                    placeholder="A.T Lukman & Co"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>

                <Form.Item
                  name="subdomain"
                  label={
                    <span style={{ color: "#334155" }}>Subdomain (optional)</span>
                  }
                  extra={
                    <span style={{ color: "#64748b" }}>
                      Your firm URL will be: [subdomain].lawmaster.ng
                    </span>
                  }
                  rules={[
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: "Lowercase letters, numbers, hyphens only",
                    },
                  ]}>
                  <Input
                    prefix={<HomeOutlined style={{ color: "#64748b" }} />}
                    placeholder="atlukman"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={<span style={{ color: "#334155" }}>Phone Number</span>}
                  rules={[{ required: true, message: "Required" }]}>
                  <Input
                    prefix={<PhoneOutlined style={{ color: "#64748b" }} />}
                    placeholder="+2348012345678"
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="state"
                    label={<span style={{ color: "#334155" }}>State</span>}
                    rules={[{ required: true, message: "Required" }]}>
                    <Select
                      placeholder="Select state"
                      size="large"
                      showSearch
                      className="w-full bg-white">
                      {nigerianStates.map((state) => (
                        <Option key={state} value={state}>
                          {state}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="city"
                    label={<span style={{ color: "#334155" }}>City</span>}
                    rules={[{ required: true, message: "Required" }]}>
                    <Input
                      prefix={
                        <EnvironmentOutlined style={{ color: "#64748b" }} />
                      }
                      placeholder="Lagos"
                      size="large"
                      className="bg-white"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="address"
                  label={<span style={{ color: "#334155" }}>Address</span>}
                  rules={[{ required: true, message: "Required" }]}>
                  <Input.TextArea
                    placeholder="123 Macaulay Street, Surulere"
                    rows={2}
                    size="large"
                    className="bg-white"
                  />
                </Form.Item>

                <Form.Item
                  name="plan"
                  label={<span style={{ color: "#334155" }}>Select Plan</span>}
                  rules={[{ required: true }]}
                  hidden={!!invitationData}>
                  <Select
                    size="large"
                    className="w-full bg-white">
                    <Option value="FREE">Free Trial (14 days)</Option>
                    <Option value="STARTER">Starter - ₦49/month</Option>
                    <Option value="PROFESSIONAL">Professional - ₦149/month</Option>
                    <Option value="ENTERPRISE">Enterprise - Custom</Option>
                  </Select>
                </Form.Item>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 0 && !token && (
                <Button
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={prevStep}
                  className="bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200">
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {!token && currentStep < 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={nextStep}
                  className="bg-blue-600 border-none">
                  Continue <ArrowRightOutlined />
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  className="bg-blue-600 border-none">
                  {token ? "Accept Invitation" : "Create Account"}
                </Button>
              )}
            </div>
          </Form>

          <Divider className="border-slate-200">
            <Text className="text-slate-500 text-sm">
              Already have an account?
            </Text>
          </Divider>

          <div className="text-center">
            <Link to="/users/login">
              <Button type="link" className="text-blue-600">
                Sign In
              </Button>
            </Link>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <Text className="text-slate-500 text-sm">
            By registering, you agree to our{" "}
            <Link to="/terms-of-service" className="text-blue-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-blue-600">
              Privacy Policy
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Register;
