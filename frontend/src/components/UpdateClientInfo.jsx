// components/UpdateClientInfo.jsx - ENHANCED VERSION
import { useEffect } from "react";
import { Modal, Button, Form, Input, Alert } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useModal from "../hooks/useModal";
import useHandleSubmit from "../hooks/useHandleSubmit";
import { useDispatch } from "react-redux";
import { getUsers } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const UpdateClientInfo = ({ clientData }) => {
  const { open, showModal, handleCancel } = useModal();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    form,
    data,
    onSubmit,
    loading: submitLoading,
  } = useHandleSubmit(`users/updateUser`, "patch");

  // Populate form when modal opens
  useEffect(() => {
    if (clientData && open) {
      form.setFieldsValue({
        firstName: clientData.firstName,
        lastName: clientData.lastName || clientData.secondName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
      });
    }
  }, [clientData, form, open]);

  // Handle successful update
  useEffect(() => {
    if (data) {
      toast.success("Client information updated successfully");
      dispatch(getUsers());
      handleCancel();
      form.resetFields();
    }
  }, [data, dispatch, handleCancel, navigate, form]);

  return (
    <section>
      <Button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600 text-white border-0"
        icon={<UserOutlined />}
      >
        Update Information
      </Button>

      <Modal
        width={600}
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <span>Update Client Information</span>
          </div>
        }
        open={open}
        footer={null}
        onCancel={handleCancel}
      >
        <Alert
          message="Personal Information"
          description="Update your personal contact details"
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          preserve={true}
          scrollToFirstError
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[
                { required: true, message: "Please enter first name" },
                { min: 2, message: "Minimum 2 characters" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="First Name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ min: 2, message: "Minimum 2 characters" }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Last Name"
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Please enter a valid email",
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              { required: true, message: "Please enter phone number" },
              {
                pattern: /^[+]?[\d\s\-()]+$/,
                message: "Invalid phone number",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Phone Contact"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[
              { required: true, message: "Please enter address" },
              { min: 10, message: "Please provide complete address" },
            ]}
          >
            <Input.TextArea
              prefix={<HomeOutlined />}
              placeholder="No.2, Maitama Close, Abuja"
              rows={3}
              size="large"
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCancel} size="large">
              Cancel
            </Button>
            <Button
              loading={submitLoading}
              onClick={onSubmit}
              type="primary"
              htmlType="submit"
              size="large"
              className="bg-blue-600"
            >
              {submitLoading ? "Updating..." : "Update Information"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};

UpdateClientInfo.propTypes = {
  clientData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    secondName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
};

export default UpdateClientInfo;