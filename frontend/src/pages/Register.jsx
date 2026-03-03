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
  InputNumber,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

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
      const response = await axios.get(`/api/v1/invitations/validate/${token}`);
      setInvitationData(response.data.data);
      message.success("Invitation validated!");
    } catch (error) {
      message.error(error.response?.data?.message || "Invalid or expired invitation");
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
        ? `/api/v1/invitations/accept/${token}`
        : "/api/v1/users/register-firm";

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
      await form.validateFields();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-white">LawMaster</span>
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

        <Card className="bg-white/10 backdrop-blur-xl border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <Title level={2} className="!mb-2 !text-white">
              {token ? "Accept Invitation" : "Start Free Trial"}
            </Title>
            <Text className="text-gray-400">
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
          >
            {/* Step 1: Account Info */}
            {(currentStep === 0 || token) && (
              <div className={currentStep !== 0 && !token ? "hidden" : ""}>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="John"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Doe"
                      size="large"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: "Required" },
                    { type: "email", message: "Invalid email" },
                  ]}
                  initialValue={invitationData?.email}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="john@example.com"
                    size="large"
                    disabled={!!invitationData?.email}
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: "Required" },
                      { min: 8, message: "At least 8 characters" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Create password"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="passwordConfirm"
                    label="Confirm Password"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Required" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("Passwords don't match"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Confirm password"
                      size="large"
                    />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* Step 2: Firm Info (only for new registration) */}
            {((currentStep === 1 && !token) || (!token && currentStep === 0)) && (
              <div className={currentStep !== 1 && !token ? "hidden" : ""}>
                <Form.Item
                  name="firmName"
                  label="Firm Name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input
                    prefix={<BankOutlined className="text-gray-400" />}
                    placeholder="A.T Lukman & Co"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="subdomain"
                  label="Subdomain (optional)"
                  extra="Your firm URL will be: [subdomain].lawmaster.ng"
                  rules={[
                    { pattern: /^[a-z0-9-]+$/, message: "Lowercase letters, numbers, hyphens only" },
                  ]}
                >
                  <Input
                    prefix={<HomeOutlined className="text-gray-400" />}
                    placeholder="atlukman"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    placeholder="+2348012345678"
                    size="large"
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="state"
                    label="State"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select placeholder="Select state" size="large" showSearch>
                      {nigerianStates.map((state) => (
                        <Option key={state} value={state}>
                          {state}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input
                      prefix={<EnvironmentOutlined className="text-gray-400" />}
                      placeholder="Lagos"
                      size="large"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="address"
                  label="Address"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input.TextArea
                    placeholder="123 Macaulay Street, Surulere"
                    rows={2}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="plan"
                  label="Select Plan"
                  rules={[{ required: true }]}
                  hidden={!!invitationData}
                >
                  <Select size="large">
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
                  className="bg-white/10 border-white/20 text-white"
                >
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {!token && currentStep < 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={nextStep}
                  className="bg-blue-600 border-none"
                >
                  Continue <ArrowRightOutlined />
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 border-none"
                >
                  {token ? "Accept Invitation" : "Create Account"}
                </Button>
              )}
            </div>
          </Form>

          <Divider className="border-white/10">
            <Text className="text-gray-400 text-sm">Already have an account?</Text>
          </Divider>

          <div className="text-center">
            <Link to="/users/login">
              <Button type="link" className="text-blue-400">
                Sign In
              </Button>
            </Link>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <Text className="text-gray-500 text-sm">
            By registering, you agree to our{" "}
            <Link to="/terms-of-service" className="text-blue-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-blue-400">
              Privacy Policy
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Register;
