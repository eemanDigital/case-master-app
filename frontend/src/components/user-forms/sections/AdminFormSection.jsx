// components/user-forms/sections/AdminFormSection.jsx
import { Form, Input, Select, Checkbox, Alert, Row, Col, Divider } from "antd";

const AdminFormSection = () => {
  return (
    <div className="space-y-6">
      <Alert
        message="Administrator Privileges"
        description="Assign appropriate system access permissions"
        type="info"
        showIcon
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="position" label="Administrator Position">
            <Input placeholder="e.g., System Administrator, IT Manager" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="role" label="Role" initialValue="admin">
            <Select
              options={[
                { value: "admin", label: "Administrator" },
                { value: "super-admin", label: "Super Administrator" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Permissions</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="canManageUsers" valuePropName="checked">
            <Checkbox>Can Manage Users</Checkbox>
          </Form.Item>
          <Form.Item name="canManageCases" valuePropName="checked">
            <Checkbox>Can Manage Cases</Checkbox>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="canManageBilling" valuePropName="checked">
            <Checkbox>Can Manage Billing</Checkbox>
          </Form.Item>
          <Form.Item name="canViewReports" valuePropName="checked">
            <Checkbox>Can View Reports</Checkbox>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="systemAccessLevel"
        label="System Access Level"
        initialValue="restricted">
        <Select
          options={[
            { value: "full", label: "Full Access" },
            { value: "restricted", label: "Restricted Access" },
            { value: "view-only", label: "View Only" },
          ]}
        />
      </Form.Item>
    </div>
  );
};

export default AdminFormSection;
