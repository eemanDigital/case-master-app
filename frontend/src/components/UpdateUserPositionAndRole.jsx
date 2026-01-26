// components/UpdateUserPositionAndRole.jsx - COMPLETE REFACTOR
import { useEffect, useState } from "react";
import { Modal, Button, Form, Select, Input, Checkbox, Alert, Space, Tag } from "antd";
import {
  UserOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";
import { getUsers } from "../redux/features/auth/authSlice";
import { positionOptions, roleOptions } from "../data/options";

const UpdateUserPositionAndRole = ({ userId, userData }) => {
  const [form] = Form.useForm();
  const { open, showModal, handleCancel } = useModal();
  const dispatch = useDispatch();
  const { loading, dataFetcher } = useDataFetch();
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Populate form when modal opens
  useEffect(() => {
    if (userData && open) {
      const effectiveRoles = [
        userData.role,
        ...(userData.additionalRoles || []),
      ].filter(Boolean);

      form.setFieldsValue({
        userType: userData.userType,
        role: userData.role,
        position: userData.position,
        isActive: userData.isActive,
        additionalRoles: userData.additionalRoles || [],
        hasLawyerPrivileges: userData.isLawyer || userData.userType === "lawyer",
        hasAdminPrivileges:
          userData.userType === "admin" || 
          (userData.additionalRoles && userData.additionalRoles.includes("admin")),
        hasHrPrivileges:
          userData.role === "hr" ||
          (userData.additionalRoles && userData.additionalRoles.includes("hr")),
      });

      setSelectedRoles(effectiveRoles);
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
        additionalRoles: values.additionalRoles || [],
      };

      const result = await dataFetcher(
        `users/upgradeUser/${userId}`,
        "patch",
        updateData
      );

      if (result && !result.error) {
        toast.success("User information updated successfully");
        dispatch(getUsers());
        handleCancel();
      } else {
        toast.error(result?.error || "Failed to update user");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An error occurred while updating");
    }
  };

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
                  <strong>Current Roles:</strong>{" "}
                  {selectedRoles.map((role) => (
                    <Tag key={role} color="blue" className="ml-1">
                      {role}
                    </Tag>
                  ))}
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
              options={[
                { value: "staff", label: "Staff" },
                { value: "lawyer", label: "Lawyer" },
                { value: "client", label: "Client" },
                { value: "admin", label: "Admin" },
              ]}
              disabled={userData?.userType === "super-admin"}
            />
          </Form.Item>

          {/* Position & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Position"
              name="position"
              rules={[{ required: true, message: "Please select position" }]}
            >
              <Select
                size="large"
                options={positionOptions}
                placeholder="Select position"
              />
            </Form.Item>

            <Form.Item
              label="Primary Role"
              name="role"
              rules={[{ required: true, message: "Please select role" }]}
            >
              <Select
                size="large"
                options={roleOptions}
                placeholder="Select role"
              />
            </Form.Item>
          </div>

          {/* Additional Privileges */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <CrownOutlined />
              Additional Privileges
            </h4>

            {/* Lawyer Privileges */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.userType !== curr.userType}
            >
              {({ getFieldValue }) =>
                getFieldValue("userType") !== "lawyer" && (
                  <Form.Item
                    name="hasLawyerPrivileges"
                    valuePropName="checked"
                    className="mb-3"
                  >
                    <Checkbox>
                      <Space>
                        <SafetyCertificateOutlined className="text-purple-600" />
                        <span className="font-medium">Grant Lawyer Privileges</span>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                )
              }
            </Form.Item>

            {/* Admin Privileges */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.userType !== curr.userType}
            >
              {({ getFieldValue }) =>
                getFieldValue("userType") !== "admin" &&
                getFieldValue("userType") !== "super-admin" && (
                  <Form.Item
                    name="hasAdminPrivileges"
                    valuePropName="checked"
                    className="mb-3"
                  >
                    <Checkbox>
                      <Space>
                        <CrownOutlined className="text-orange-600" />
                        <span className="font-medium">Grant Admin Privileges</span>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                )
              }
            </Form.Item>

            {/* HR Privileges */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.userType !== curr.userType}
            >
              {({ getFieldValue }) =>
                getFieldValue("userType") === "staff" && (
                  <Form.Item name="hasHrPrivileges" valuePropName="checked">
                    <Checkbox>
                      <Space>
                        <TeamOutlined className="text-blue-600" />
                        <span className="font-medium">Grant HR Privileges</span>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                )
              }
            </Form.Item>
          </div>

          {/* Active Status */}
          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>
              <span className="font-medium">Account Active</span>
              <p className="text-gray-500 text-sm ml-6">
                User can login and access the system
              </p>
            </Checkbox>
          </Form.Item>

          {/* Summary */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) =>
              prev.hasLawyerPrivileges !== curr.hasLawyerPrivileges ||
              prev.hasAdminPrivileges !== curr.hasAdminPrivileges ||
              prev.hasHrPrivileges !== curr.hasHrPrivileges ||
              prev.role !== curr.role
            }
          >
            {({ getFieldValue }) => {
              const privileges = [];
              if (getFieldValue("hasLawyerPrivileges")) privileges.push("Lawyer");
              if (getFieldValue("hasAdminPrivileges")) privileges.push("Admin");
              if (getFieldValue("hasHrPrivileges")) privileges.push("HR");

              return privileges.length > 0 ? (
                <Alert
                  message="Multi-Role User"
                  description={`This user will have ${getFieldValue("role")} as primary role with additional ${privileges.join(" & ")} privileges.`}
                  type="success"
                  showIcon
                  className="mb-4"
                />
              ) : null;
            }}
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
    position: PropTypes.string,
    isActive: PropTypes.bool,
    isLawyer: PropTypes.bool,
    additionalRoles: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default UpdateUserPositionAndRole;