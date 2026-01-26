// components/user-forms/steps/PrivilegesStep.jsx
import { Form, Checkbox, Alert, Divider, Space, Card } from "antd";
import {
  CrownOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";

const PrivilegesStep = ({ selectedUserType }) => {
  return (
    <div className="space-y-6">
      <Alert
        message="User Privileges & Multiple Roles"
        description="Assign additional privileges to this user. A user can have multiple roles simultaneously."
        type="info"
        showIcon
        className="mb-6"
      />

      <Card title="Primary Role" size="small" className="mb-4">
        <p className="text-gray-600 text-sm">
          Primary User Type: <strong className="text-blue-600">{selectedUserType}</strong>
        </p>
        <p className="text-gray-500 text-xs mt-2">
          This is the main classification for this user account.
        </p>
      </Card>

      <Divider orientation="left">Additional Privileges</Divider>

      {/* Lawyer Privileges */}
      {selectedUserType !== "lawyer" && (
        <Card className="bg-purple-50 border-purple-200">
          <Space align="start">
            <SafetyCertificateOutlined className="text-2xl text-purple-600 mt-1" />
            <div className="flex-1">
              <Form.Item
                name="hasLawyerPrivileges"
                valuePropName="checked"
                className="mb-2"
              >
                <Checkbox className="font-semibold text-base">
                  Grant Lawyer Privileges
                </Checkbox>
              </Form.Item>
              <p className="text-sm text-gray-600 ml-6">
                This user can handle cases, appear in court, and access legal documents.
                Requires bar certification details.
              </p>
            </div>
          </Space>

          {/* Conditional Lawyer Fields */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.hasLawyerPrivileges !== curr.hasLawyerPrivileges}
          >
            {({ getFieldValue }) =>
              getFieldValue("hasLawyerPrivileges") && (
                <Alert
                  message="Lawyer Credentials Required"
                  description="You'll need to provide bar number, practice areas, and other legal credentials in the Professional step."
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )
            }
          </Form.Item>
        </Card>
      )}

      {/* Admin Privileges */}
      {selectedUserType !== "admin" && selectedUserType !== "super-admin" && (
        <Card className="bg-orange-50 border-orange-200">
          <Space align="start">
            <CrownOutlined className="text-2xl text-orange-600 mt-1" />
            <div className="flex-1">
              <Form.Item
                name="hasAdminPrivileges"
                valuePropName="checked"
                className="mb-2"
              >
                <Checkbox className="font-semibold text-base">
                  Grant Administrative Privileges
                </Checkbox>
              </Form.Item>
              <p className="text-sm text-gray-600 ml-6">
                This user can manage other users, access system settings, and view reports.
              </p>
            </div>
          </Space>

          {/* Admin Level Selection */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.hasAdminPrivileges !== curr.hasAdminPrivileges}
          >
            {({ getFieldValue }) =>
              getFieldValue("hasAdminPrivileges") && (
                <div className="ml-6 mt-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Admin Permissions:</p>
                  <Form.Item name="canManageUsers" valuePropName="checked" className="mb-2">
                    <Checkbox>Can Manage Users</Checkbox>
                  </Form.Item>
                  <Form.Item name="canManageCases" valuePropName="checked" className="mb-2">
                    <Checkbox>Can Manage Cases</Checkbox>
                  </Form.Item>
                  <Form.Item name="canManageBilling" valuePropName="checked" className="mb-2">
                    <Checkbox>Can Manage Billing</Checkbox>
                  </Form.Item>
                  <Form.Item name="canViewReports" valuePropName="checked" className="mb-2">
                    <Checkbox>Can View Reports</Checkbox>
                  </Form.Item>
                </div>
              )
            }
          </Form.Item>
        </Card>
      )}

      {/* HR Privileges */}
      {selectedUserType === "staff" && (
        <Card className="bg-blue-50 border-blue-200">
          <Space align="start">
            <TeamOutlined className="text-2xl text-blue-600 mt-1" />
            <div className="flex-1">
              <Form.Item
                name="hasHrPrivileges"
                valuePropName="checked"
                className="mb-2"
              >
                <Checkbox className="font-semibold text-base">
                  Grant HR Privileges
                </Checkbox>
              </Form.Item>
              <p className="text-sm text-gray-600 ml-6">
                This user can manage employee records, recruitment, and staff administration.
              </p>
            </div>
          </Space>
        </Card>
      )}

      <Divider />

      {/* Summary */}
      <Card className="bg-gray-50">
        <h4 className="font-semibold mb-3">Privilege Summary</h4>
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => 
            prev.hasLawyerPrivileges !== curr.hasLawyerPrivileges ||
            prev.hasAdminPrivileges !== curr.hasAdminPrivileges ||
            prev.hasHrPrivileges !== curr.hasHrPrivileges
          }
        >
          {({ getFieldValue }) => {
            const privileges = [];
            if (getFieldValue("hasLawyerPrivileges")) privileges.push("Lawyer");
            if (getFieldValue("hasAdminPrivileges")) privileges.push("Administrator");
            if (getFieldValue("hasHrPrivileges")) privileges.push("HR");

            return (
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Primary Role:</strong> {selectedUserType}
                </p>
                <p className="mt-2">
                  <strong>Additional Privileges:</strong>{" "}
                  {privileges.length > 0 ? privileges.join(", ") : "None"}
                </p>
                {privileges.length > 0 && (
                  <Alert
                    message="Multi-Role User"
                    description={`This user will have ${selectedUserType} as primary role with additional ${privileges.join(" and ")} privileges.`}
                    type="success"
                    showIcon
                    className="mt-4"
                  />
                )}
              </div>
            );
          }}
        </Form.Item>
      </Card>
    </div>
  );
};

PrivilegesStep.propTypes = {
  selectedUserType: PropTypes.oneOf(["client", "staff", "lawyer", "admin", "super-admin"]).isRequired,
};

export default PrivilegesStep;