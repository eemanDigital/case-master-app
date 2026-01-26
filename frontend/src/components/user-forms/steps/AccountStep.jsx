// components/user-forms/steps/AccountStep.jsx
import { Form, Input, Checkbox, Alert, Row, Col } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { validatePassword } from "../../../utils/validation";

const AccountStep = () => {
  return (
    <div className="space-y-6">
      <Alert
        message="Account Security"
        description="Create a strong password for the user account"
        type="info"
        showIcon
        className="mb-6"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Password is required" },
              { validator: validatePassword },
            ]}>
            <Input.Password
              placeholder="Create strong password"
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>
          <div className="password-rules text-sm text-gray-600">
            <strong>Password must contain:</strong>
            <ul className="ml-4 mt-1">
              <li>At least 8 characters</li>
              <li>Uppercase & lowercase letters</li>
              <li>At least one number</li>
              <li>At least one special character (@$!%*?&)</li>
            </ul>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="passwordConfirm"
            label="Confirm Password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}>
            <Input.Password
              placeholder="Confirm password"
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="isActive" valuePropName="checked" initialValue={true}>
        <Checkbox>Account Active (User can login immediately)</Checkbox>
      </Form.Item>
    </div>
  );
};

export default AccountStep;
