// pages/AddClientForm.jsx
import { useEffect } from "react";
import { Button, Form, Input, Card, Row, Col, Alert, Divider } from "antd";
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(RESET());
  }, [dispatch]);

  const handleSubmit = async (values) => {
    try {
      const clientData = {
        ...values,
        userType: "client",
        role: "client",
      };

      const result = await dispatch(register(clientData));

      if (result.error) {
        toast.error("Failed to add client.");
        // ✅ Don't reset form - data is preserved
        return;
      }

      if (result.payload) {
        await dispatch(sendVerificationMail(values.email));
        toast.success("Client added successfully! Verification email sent.");
        
        // ✅ Only reset on success
        form.resetFields();
        setTimeout(() => navigate("/dashboard/clients"), 2000);
      }
    } catch (err) {
      toast.error("Failed to add client.");
      console.error(err);
      // ✅ Form data preserved on error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Add New Client
          </h1>
          <p className="text-gray-600">
            Fill in the client details below to create a new client account.
          </p>
        </div>

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

        <Card className="shadow-lg">
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            // ✅ CRITICAL: Preserve field values
            preserve={true}
            scrollToFirstError
          >
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">
              Personal Information
            </h2>

            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[
                    { required: true, message: "Please enter first name" },
                    { min: 2, message: "Minimum 2 characters" },
                  ]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ min: 2, message: "Minimum 2 characters" }]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { required: true, message: "Please enter email" },
                    { type: "email", message: "Invalid email format" },
                  ]}
                >
                  <Input placeholder="client@example.com" />
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
                      message: "Invalid phone number",
                    },
                  ]}
                >
                  <Input placeholder="+234 800 000 0000" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Address"
              name="address"
              rules={[
                { required: true, message: "Please enter address" },
                { min: 10, message: "Address should be detailed" },
              ]}
            >
              <Input.TextArea
                placeholder="No. 2, Maitama Close, Abuja, Nigeria"
                rows={3}
              />
            </Form.Item>

            <Divider />

            <h2 className="text-xl font-semibold mb-6 border-b pb-2">
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
                        "Password must be 8+ characters with uppercase, lowercase, number, and special character",
                    },
                  ]}
                >
                  <Input.Password placeholder="Enter secure password" />
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
                          new Error("Passwords do not match!")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm your password" />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex gap-4 justify-end pt-6 border-t">
              <Button
                size="large"
                onClick={() => navigate("/dashboard/clients")}
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isLoading}
              >
                {isLoading ? "Adding Client..." : "Add Client"}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default AddClientForm;