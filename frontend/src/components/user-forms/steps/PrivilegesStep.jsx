// components/user-forms/steps/PrivilegesStep.jsx - NEW USER MODEL
// Assigns the professional role and administrative level for staff. Clients
// have neither, so they get a read-only review of what will be created.
import { Form, Select, Alert, Divider, Space, Card, Tag, Descriptions } from "antd";
import {
  CrownOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { roleOptions, adminLevelOptions } from "../../../data/options";

const CATEGORY_LABELS = {
  individual: "Individual",
  corporate: "Corporate",
  government: "Government",
  ngo: "NGO / Non-Profit",
};

const PrivilegesStep = ({ selectedUserType }) => {
  const isClient = selectedUserType === "client";

  if (isClient) {
    return (
      <div className="space-y-6">
        <Alert
          message="Review Client Account"
          description="Client accounts carry no firm role and no administrative privileges. Confirm the details below before creating the account."
          type="success"
          showIcon
        />

        <Card title="What will be created" size="small">
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const category = getFieldValue("clientCategory");
              const company = getFieldValue("company");
              const [firstName, lastName] = [
                getFieldValue("firstName"),
                getFieldValue("lastName"),
              ];
              const label =
                company ||
                [firstName, lastName].filter(Boolean).join(" ") ||
                "New client";

              return (
                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  size="small"
                  items={[
                    {
                      key: "name",
                      label: "Client",
                      children: label,
                    },
                    {
                      key: "type",
                      label: "Client Type",
                      children: (
                        <Tag color="blue">
                          {CATEGORY_LABELS[category] || "Individual"}
                        </Tag>
                      ),
                    },
                    {
                      key: "email",
                      label: "Email",
                      children: getFieldValue("email") || "—",
                    },
                    {
                      key: "phone",
                      label: "Phone",
                      children: getFieldValue("phone") || "—",
                    },
                    {
                      key: "role",
                      label: "Role",
                      children: <Tag>client</Tag>,
                    },
                    {
                      key: "admin",
                      label: "Admin Level",
                      children: <Tag color="default">none</Tag>,
                    },
                    ...(getFieldValue("industry")
                      ? [
                          {
                            key: "industry",
                            label: "Industry",
                            children: getFieldValue("industry"),
                          },
                        ]
                      : []),
                    ...(getFieldValue("taxId")
                      ? [
                          {
                            key: "tax",
                            label: "Tax ID",
                            children: getFieldValue("taxId"),
                          },
                        ]
                      : []),
                  ]}
                />
              );
            }}
          </Form.Item>
        </Card>
      </div>
    );
  }

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
            options={roleOptions.filter((r) => r.value !== "client")}
            placeholder="Select role"
            suffixIcon={<SafetyCertificateOutlined />}
          />
        </Form.Item>

        <p className="text-gray-500 text-xs mt-2">
          The role determines day-to-day functions such as case handling,
          documents, and billing access.
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
              {!getFieldValue("adminLevel") ||
              getFieldValue("adminLevel") === "none" ? (
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircleOutlined className="text-green-500" />
                  This account will have no access to firm administration.
                </p>
              ) : null}
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
