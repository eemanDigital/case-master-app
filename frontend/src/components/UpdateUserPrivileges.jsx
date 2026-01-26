// components/UpdateUserPrivileges.jsx - NEW COMPONENT
import { useEffect } from "react";
import { Modal, Button, Form, Checkbox, Alert, Card, Space } from "antd";
import {
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

const UpdateUserPrivileges = ({ userId, userData }) => {
  const [form] = Form.useForm();
  const { open, showModal, handleCancel } = useModal();
  const dispatch = useDispatch();
  const { loading, dataFetcher } = useDataFetch();

  useEffect(() => {
    if (userData && open) {
      form.setFieldsValue({
        hasLawyerPrivileges: userData.isLawyer || false,
        hasAdminPrivileges:
          userData.additionalRoles?.includes("admin") || false,
        hasHrPrivileges: userData.additionalRoles?.includes("hr") || false,
        canManageUsers: userData.adminDetails?.canManageUsers || false,
        canManageCases: userData.adminDetails?.canManageCases || false,
        canManageBilling: userData.adminDetails?.canManageBilling || false,
        canViewReports: userData.adminDetails?.canViewReports || false,
      });
    }
  }, [userData, form, open]);

  const handleSubmit = async (values) => {
    try {
      const additionalRoles = [];
      if (values.hasLawyerPrivileges) additionalRoles.push("lawyer");
      if (values.hasAdminPrivileges) additionalRoles.push("admin");
      if (values.hasHrPrivileges) additionalRoles.push("hr");

      const updateData = {
        additionalRoles,
        isLawyer: values.hasLawyerPrivileges,
        adminDetails: values.hasAdminPrivileges
          ? {
              adminLevel: "firm",
              canManageUsers: values.canManageUsers,
              canManageCases: values.canManageCases,
              canManageBilling: values.canManageBilling,
              canViewReports: values.canViewReports,
              systemAccessLevel: "restricted",
            }
          : undefined,
      };

      const result = await dataFetcher(
        `users/upgradeUser/${userId}`,
        "patch",
        updateData
      );

      if (result && !result.error) {
        toast.success("User privileges updated successfully");
        dispatch(getUsers());
        handleCancel();
      } else {
        toast.error(result?.error || "Failed to update privileges");
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
        className="bg-purple-500 hover:bg-purple-600 text-white border-0"
        icon={<CrownOutlined />}
      >
        Manage Privileges
      </Button>

      <Modal
        title={
          <Space>
            <CrownOutlined />
            <span>Manage User Privileges</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Alert
            message="User Information"
            description={
              <div className="mt-2">
                <p>
                  <strong>Name:</strong> {userData?.firstName}{" "}
                  {userData?.lastName}
                </p>
                <p>
                  <strong>Primary Role:</strong> {userData?.userType}
                </p>
              </div>
            }
            type="info"
            showIcon
            className="mb-6"
          />

          {/* Lawyer Privileges */}
          {userData?.userType !== "lawyer" && (
            <Card className="mb-4 bg-purple-50 border-purple-200">
              <Form.Item name="hasLawyerPrivileges" valuePropName="checked">
                <Checkbox>
                  <Space>
                    <SafetyCertificateOutlined className="text-purple-600 text-lg" />
                    <div>
                      <span className="font-semibold text-base">
                        Grant Lawyer Privileges
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        User can handle cases, appear in court, and access
                        legal documents
                      </p>
                    </div>
                  </Space>
                </Checkbox>
              </Form.Item>
            </Card>
          )}

          {/* Admin Privileges */}
          {userData?.userType !== "admin" &&
            userData?.userType !== "super-admin" && (
              <Card className="mb-4 bg-orange-50 border-orange-200">
                <Form.Item name="hasAdminPrivileges" valuePropName="checked">
                  <Checkbox>
                    <Space>
                      <CrownOutlined className="text-orange-600 text-lg" />
                      <div>
                        <span className="font-semibold text-base">
                          Grant Administrative Privileges
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          User can manage users, access settings, and view
                          reports
                        </p>
                      </div>
                    </Space>
                  </Checkbox>
                </Form.Item>

                {/* Admin Permissions */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.hasAdminPrivileges !== curr.hasAdminPrivileges
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue("hasAdminPrivileges") && (
                      <div className="ml-8 mt-4 space-y-2 border-l-2 border-orange-300 pl-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Admin Permissions:
                        </p>
                        <Form.Item
                          name="canManageUsers"
                          valuePropName="checked"
                          className="mb-2"
                        >
                          <Checkbox>Can Manage Users</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="canManageCases"
                          valuePropName="checked"
                          className="mb-2"
                        >
                          <Checkbox>Can Manage Cases</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="canManageBilling"
                          valuePropName="checked"
                          className="mb-2"
                        >
                          <Checkbox>Can Manage Billing</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="canViewReports"
                          valuePropName="checked"
                        >
                          <Checkbox>Can View Reports</Checkbox>
                        </Form.Item>
                      </div>
                    )
                  }
                </Form.Item>
              </Card>
            )}

          {/* HR Privileges */}
          {userData?.userType === "staff" && (
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <Form.Item name="hasHrPrivileges" valuePropName="checked">
                <Checkbox>
                  <Space>
                    <TeamOutlined className="text-blue-600 text-lg" />
                    <div>
                      <span className="font-semibold text-base">
                        Grant HR Privileges
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        User can manage employee records and recruitment
                      </p>
                    </div>
                  </Space>
                </Checkbox>
              </Form.Item>
            </Card>
          )}

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
              {loading ? "Saving..." : "Update Privileges"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};

UpdateUserPrivileges.propTypes = {
  userId: PropTypes.string.isRequired,
  userData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    userType: PropTypes.string,
    role: PropTypes.string,
    isLawyer: PropTypes.bool,
    additionalRoles: PropTypes.arrayOf(PropTypes.string),
    adminDetails: PropTypes.object,
  }).isRequired,
};

export default UpdateUserPrivileges;