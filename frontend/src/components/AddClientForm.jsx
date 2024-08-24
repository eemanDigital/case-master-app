import { useState } from "react";
import { Modal, Button, Form, Input, Checkbox } from "antd";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  sendVerificationMail,
  register,
} from "../redux/features/auth/authSlice";

const AddClientForm = () => {
  const [open, setOpen] = useState(false);
  // Extracting necessary state values from the Redux store
  const { isLoading, isError, isSuccess } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Initializing the form instance from Ant Design
  const [form] = Form.useForm();

  // Function to show the modal
  const showModal = () => {
    setOpen(true);
  };

  // Function to handle the OK button click in the modal
  const handleOk = () => {
    form.submit();
  };

  // Function to handle the Cancel button click in the modal
  const handleCancel = () => {
    setOpen(false);
  };

  // Function to handle form submission
  const handleSubmit = async (values) => {
    try {
      // Dispatching the register action with form values
      await dispatch(register(values));

      // Dispatching the sendVerificationMail action
      if (!isError && isSuccess) {
        await dispatch(sendVerificationMail(values.email));
      }

      // Closing the modal
      setOpen(false);
      // Optionally reset the form fields
      // form.resetFields();
    } catch (err) {
      // Showing an error toast message
      toast.error("Failed to add client.");
      console.error(err);
    }
  };

  return (
    <section className="bg-gray-200">
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Add Client
      </Button>
      <Modal
        footer={null}
        width={580}
        title="Client Form"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}>
        <Form
          form={form}
          onFinish={handleSubmit}
          className="bg-white shadow-md rounded-md px-8 pt-6 pb-8 m-4"
          layout="vertical">
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[
              { required: true, message: "Please enter your first name" },
            ]}>
            <Input placeholder="First Name" />
          </Form.Item>

          <Form.Item label="Second Name" name="secondName">
            <Input placeholder="Second Name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Please enter a valid email",
              },
            ]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter your password" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
              },
            ]}>
            <Input.Password placeholder="*******" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="passwordConfirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
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
            <Input.Password placeholder="*******" />
          </Form.Item>
          <Form.Item
            label="Phone Contact"
            name="phone"
            rules={[
              { required: true, message: "Please enter your phone number" },
            ]}>
            <Input placeholder="Phone Contact" />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter your address" }]}>
            <Input placeholder="No.2, Maitama Close, Abuja" />
          </Form.Item>
          <Form.Item label="Role" name="role" initialValue="client">
            <Input disabled placeholder="Client" />
          </Form.Item>

          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Is client active</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="default" htmlType="submit">
              {isLoading ? "Loading..." : "Add Client"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};

export default AddClientForm;
