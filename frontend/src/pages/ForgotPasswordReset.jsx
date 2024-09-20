import { Form, Input, Button, Typography, Card } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RESET, resetPassword } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const ForgotPasswordReset = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      await dispatch(
        resetPassword({ resetToken: token, userData: values })
      ).unwrap();
      await dispatch(RESET());
      toast.success("Password reset successfully!");
      navigate("/users/login");
    } catch (error) {
      toast.error("Failed to reset password. Please try again.");
    }
  };

  const validatePassword = (_, value) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!value) {
      return Promise.reject("Please input your password!");
    }
    if (value.length < 8) {
      return Promise.reject("Password must be at least 8 characters long!");
    }
    if (!regex.test(value)) {
      return Promise.reject(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
      );
    }
    return Promise.resolve();
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 min-h-screen p-6">
      <Card className="w-full max-w-lg">
        <Title level={2} className="text-center mb-4">
          Reset Your Password
        </Title>
        <Paragraph className="text-center text-gray-500 mb-6">
          Enter your new password below to reset your account password.
        </Paragraph>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: "Please input your new password!" },
              { validator: validatePassword },
            ]}>
            <Input.Password
              placeholder="Enter new password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="passwordConfirm"
            label="Confirm New Password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your new password!" },
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
              placeholder="Confirm your new password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPasswordReset;
