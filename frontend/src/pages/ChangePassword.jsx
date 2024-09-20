import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form, Input, Typography } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {
  changePassword,
  logout,
  RESET,
} from "../redux/features/auth/authSlice";
import { sendAutomatedEmail } from "../redux/features/emails/emailSlice";

const { Title } = Typography;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, user } = useSelector((state) => state.auth);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  //
  const handleSubmit = async (values) => {
    const emailData = {
      subject: "Password Changed - CaseMaster",
      send_to: user?.data?.email,
      reply_to: "noreply@gmail.com",
      template: "changePassword",
      url: "/dashboard/profile",
    };

    try {
      await dispatch(changePassword(values)).unwrap();
      await dispatch(sendAutomatedEmail(emailData));
      await dispatch(logout()).unwrap();
      await dispatch(RESET());
      toast.success("Password changed successfully! Please log in again.");
      navigate("/users/login");
    } catch (error) {
      toast.error("Failed to change password. Please try again.");
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
    <>
      <Button onClick={showModal} type="primary" className="mb-6">
        Change Password
      </Button>
      <Modal
        title={<Title level={3}>Change Password</Title>}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="passwordCurrent"
            label="Current Password"
            rules={[
              {
                required: true,
                message: "Please input your current password!",
              },
            ]}>
            <Input.Password
              placeholder="Current Password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: "Please input your new password!" },
              { validator: validatePassword },
            ]}>
            <Input.Password
              placeholder="New Password"
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
              placeholder="Confirm New Password"
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
      </Modal>
    </>
  );
};

export default ChangePassword;
