import notify from "../utils/notify";
// components/UpdateUserPositionAndRole.jsx - NEW USER MODEL
import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Select,
  Checkbox,
  Alert,
  Space,
  Tag,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";
import { getUsers } from "../redux/features/auth/authSlice";
import { positionOptions, roleOptions, adminLevelOptions } from "../data/options";

const UpdateUserPositionAndRole = ({ userId, userData }) => {
  const [form] = Form.useForm();
  const { open, showModal, handleCancel } = useModal();
  const dispatch = useDispatch();
  const { loading, dataFetcher } = useDataFetch();
  const [userType, setUserType] = useState(userData?.userType);

  // Populate form when modal opens
  useEffect(() => {
    if (userData && open) {
      setUserType(userData.userType);
      form.setFieldsValue({
        userType: userData.userType,
        role: userData.role || (userData.userType === "client" ? "client" : "lawyer"),
        adminLevel: userData.adminLevel || "none",
        position: userData.position,
        isActive: userData.isActive,
      });
    }
  }, [userData, form, open]);

  const handleSubmit = async (values) => {
    try {
      // Prepare update data
      const updateData = {
        userType: values.userType,
        role: values.role,
        position: values.position,
        isActive: values.isActive,
        adminLevel: values.adminLevel,
      };

      const result = await dataFetcher(
        `users/upgradeUser/${userId}`,
        "patch",
        updateData
      );

      if (result && !result.error) {
        notify.success("User information updated successfully");
        dispatch(getUsers());
        handleCancel();
      } else {
        notify.error(result?.error || "Failed to update user");
      }
    } catch (err) {
      console.error("Update error:", err);
      notify.error("An error occurred while updating");
    }
  };

  const isClient = userType === "client";

  return (
    <section>
      <Button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600 text-white border-0"
        icon={<UserOutlined />}
      >
        Update User Status
      </Button>

      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Update User Role & Position</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={true}
        >
          {/* Current User Info */}
          <Alert
            message="Current User Information"
            description={
              <div className="space-y-1 mt-2">
                <p>
                  <strong>Name:</strong> {userData?.firstName} {userData?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {userData?.email}
                </p>
                <p>
                  <strong>User Type:</strong> {userData?.userType}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  <Tag color="blue" className="ml-1">
                    {userData?.role || userData?.userType}
                  </Tag>
                  {userData?.adminLevel && userData?.adminLevel !== "none" && (
                    <Tag color="volcano" className="ml-1">
                      {userData?.adminLevel}
                    </Tag>
                  )}
                </p>
              </div>
            }
            type="info"
            showIcon
            className="mb-6"
          />

          {/* User Type */}
          <Form.Item
            label="User Type"
            name="userType"
            rules={[{ required: true, message: "Please select user type" }]}
          >
            <Select
              size="large"
              onChange={setUserType}
              options={[
                { value: "staff", label: "Staff" },
                { value: "client", label: "Client" },
              ]}
            />
          </Form.Item>

          {/* Position & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Position"
              name="position"
              rules={[
                { required: !isClient, message: "Please select position" },
              ]}
            >
              <Select
                size="large"
                options={positionOptions}
                placeholder="Select position"
                disabled={isClient}
              />
            </Form.Item>

            <Form.Item
              label="Primary Role"
              name="role"
              rules={[{ required: true, message: "Please select role" }]}
            >
              <Select
                size="large"
                options={
                  isClient
                    ? [{ value: "client", label: "Client" }]
                    : roleOptions.filter((r) => r.value !== "client")
                }
                placeholder="Select role"
                disabled={isClient}
              />
            </Form.Item>
          </div>

          {/* Admin Level */}
          <Form.Item
            label="Administrative Level"
            name="adminLevel"
            rules={[
              { required: true, message: "Please select an admin level" },
            ]}
          >
            <Select
              size="large"
              options={adminLevelOptions}
              placeholder="Select admin level"
            />
          </Form.Item>

          {/* Active Status */}
          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>
              <span className="font-medium">Account Active</span>
              <p className="text-gray-500 text-sm ml-6">
                User can login and access the system
              </p>
            </Checkbox>
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCancel} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="bg-blue-600"
            >
              {loading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};

UpdateUserPositionAndRole.propTypes = {
  userId: PropTypes.string.isRequired,
  userData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    userType: PropTypes.string,
    role: PropTypes.string,
    adminLevel: PropTypes.string,
    position: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
};

export default UpdateUserPositionAndRole;