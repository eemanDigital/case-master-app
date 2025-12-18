import { useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Checkbox,
  Card,
  Row,
  Col,
  Alert,
  Divider,
} from "antd";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  sendVerificationMail,
  register,
  RESET,
} from "../redux/features/auth/authSlice";

const AddClientForm = () => {
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  console.log("Auth State:", { isLoading, isError, isSuccess, message });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Reset auth state when component mounts
  useEffect(() => {
    dispatch(RESET());
  }, [dispatch]);
  // Function to handle form submission
  const handleSubmit = async (values) => {
    try {
      const result = await dispatch(register(values));

      if (result.error) {
        toast.error("Failed to add client.");
        return;
      }

      // If registration successful, send verification email
      if (result.payload) {
        await dispatch(sendVerificationMail(values.email));
        toast.success("Client added successfully! Verification email sent.");
        form.resetFields();

        // Optionally navigate back to clients list after a delay
        setTimeout(() => {
          navigate("/dashboard/clients");
        }, 2000);
      }
    } catch (err) {
      toast.error("Failed to add client.");
      console.error(err);
    }
  };

  // Reset form when component unmounts or on success
  useEffect(() => {
    return () => {
      form.resetFields();
    };
  }, [form]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Add New Client
          </h1>
          <p className="text-gray-600">
            Fill in the client details below to create a new client account.
          </p>
        </div>

        {/* Success Alert */}
        {isSuccess && (
          <Alert
            message="Client added successfully!"
            description="The client has been registered and a verification email has been sent."
            type="success"
            showIcon
            closable
            className="mb-6"
          />
        )}

        {/* Error Alert */}
        {isError && (
          <Alert
            message="Registration Failed"
            description={message || "Please check the form and try again."}
            type="error"
            showIcon
            closable
            className="mb-6"
          />
        )}

        <Card className="shadow-lg border-0" bodyStyle={{ padding: "32px" }}>
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large">
            {/* Personal Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
                Personal Information
              </h2>

              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[
                      {
                        required: true,
                        message: "Please enter client's first name",
                      },
                      {
                        min: 2,
                        message: "First name must be at least 2 characters",
                      },
                    ]}>
                    <Input
                      placeholder="Enter first name"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Second Name"
                    name="secondName"
                    rules={[
                      {
                        min: 2,
                        message: "Second name must be at least 2 characters",
                      },
                    ]}>
                    <Input
                      placeholder="Enter second name"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: "Please enter email address" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}>
                    <Input
                      placeholder="client@example.com"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phone Number"
                    name="phone"
                    rules={[
                      { required: true, message: "Please enter phone number" },
                      {
                        pattern: /^[0-9+\-\s()]+$/,
                        message: "Please enter a valid phone number",
                      },
                    ]}>
                    <Input
                      placeholder="+234 800 000 0000"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Address"
                name="address"
                rules={[
                  { required: true, message: "Please enter client's address" },
                  { min: 10, message: "Address should be detailed enough" },
                ]}>
                <Input.TextArea
                  placeholder="No. 2, Maitama Close, Abuja, Nigeria"
                  rows={3}
                  className="rounded-lg"
                />
              </Form.Item>
            </div>

            <Divider />

            {/* Account Security Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
                Account Security
              </h2>

              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                      { required: true, message: "Please enter password" },
                      {
                        pattern:
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message:
                          "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
                      },
                    ]}>
                    <Input.Password
                      placeholder="Enter secure password"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Confirm Password"
                    name="passwordConfirm"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Please confirm password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("The two passwords do not match!")
                          );
                        },
                      }),
                    ]}>
                    <Input.Password
                      placeholder="Confirm your password"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-blue-800 font-semibold mb-2">
                  Password Requirements:
                </h4>
                <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One number (0-9)</li>
                  <li>One special character (!@#$%^&*)</li>
                </ul>
              </div>
            </div>

            <Divider />

            {/* Account Settings Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
                Account Settings
              </h2>

              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Role" name="role" initialValue="client">
                    <Input disabled className="rounded-lg bg-gray-100" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="active"
                    valuePropName="checked"
                    className="mb-0">
                    <Checkbox className="text-gray-700">
                      <span className="font-medium">
                        Activate client account immediately
                      </span>
                    </Checkbox>
                    <div className="text-gray-500 text-sm mt-1">
                      Client will be able to login if checked
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t">
              <Button
                size="large"
                onClick={() => navigate("/clients")}
                disabled={isLoading}
                className="min-w-32">
                Cancel
              </Button>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isLoading}
                className="min-w-32 bg-blue-600 hover:bg-blue-700 border-0">
                {isLoading ? "Adding Client..." : "Add Client"}
              </Button>
            </div>
          </Form>
        </Card>

        {/* Additional Information */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            The client will receive a verification email to activate their
            account. They can reset their password after verification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddClientForm;
