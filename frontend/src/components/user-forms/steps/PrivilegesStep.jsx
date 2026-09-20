// components/user-forms/steps/PrivilegesStep.jsx - NEW USER MODEL
// Assigns the professional role and administrative level.
import { Form, Select, Alert, Divider, Space, Card, Tag } from "antd";
import {
  CrownOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { roleOptions, adminLevelOptions } from "../../../data/options";

const PrivilegesStep = ({ selectedUserType }) => {
  const isClient = selectedUserType === "client";

  return (
    <div className="space-y-6">
      <Alert
        message="Role & Administrative Privileges"
        description="Set the professional role and administrative authority for this user. Administration is granted through an admin level, not a role."
        type="info"
        showIcon
        className="mb-6"
      />

      <Card title="Primary Role" size="small" className="mb-4">
        <p className="text-gray-600 text-sm">
          User Type: <strong className="text-blue-600">{selectedUserType}</strong>
        </p>

        <Form.Item
          name="role"
          label="Professional Role"
          className="mt-4"
          rules={[{ required: true, message: "Please select a role" }]}
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
            suffixIcon={<SafetyCertificateOutlined />}
          />
        </Form.Item>

        <p className="text-gray-500 text-xs mt-2">
          {isClient
            ? "Client accounts automatically use the 'client' role."
            : "The role determines day-to-day functions such as case handling, documents, and billing access."}
        </p>
      </Card>

      <Divider orientation="left">Administrative Privileges</Divider>

      <Card className="bg-orange-50 border-orange-200">
        <Space align="start">
          <CrownOutlined className="text-2xl text-orange-600 mt-1" />
          <div className="flex-1 w-full">
            <Form.Item
              name="adminLevel"
              label="Admin Level"
              rules={[
                { required: true, message: "Please select an admin level" },
              ]}
            >
              <Select
                size="large"
                options={adminLevelOptions}
                placeholder="Select admin level"
                disabled={isClient}
              />
            </Form.Item>
            <p className="text-sm text-gray-600 ml-6">
              Administrators can manage users, settings, and reports. Super
              administrators can also manage firm-wide configuration.
            </p>
          </div>
        </Space>
      </Card>

      <Divider />

      {/* Summary */}
      <Card className="bg-gray-50">
        <h4 className="font-semibold mb-3">Privilege Summary</h4>
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>User Type:</strong>{" "}
                <Tag>{getFieldValue("userType") || selectedUserType}</Tag>
              </p>
              <p>
                <strong>Role:</strong>{" "}
                <Tag color="blue">{getFieldValue("role") || "lawyer"}</Tag>
              </p>
              <p>
                <strong>Admin Level:</strong>{" "}
                <Tag color="volcano">
                  {getFieldValue("adminLevel") || "none"}
                </Tag>
              </p>
            </div>
          )}
        </Form.Item>
      </Card>
    </div>
  );
};

PrivilegesStep.propTypes = {
  selectedUserType: PropTypes.oneOf(["client", "staff"]).isRequired,
};

export default PrivilegesStep;