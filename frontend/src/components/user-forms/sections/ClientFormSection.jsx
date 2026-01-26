// components/user-forms/sections/ClientFormSection.jsx
import { Form, Input, Select, Row, Col } from "antd";
import {
  clientCategoryOptions,
  contactMethodOptions,
} from "../../../data/options";

const ClientFormSection = () => {
  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="company" label="Company">
            <Input placeholder="Company name" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="industry" label="Industry">
            <Input placeholder="Industry sector" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="clientCategory"
            label="Client Category"
            initialValue="individual">
            <Select options={clientCategoryOptions} size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="preferredContactMethod"
            label="Preferred Contact"
            initialValue="email">
            <Select options={contactMethodOptions} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="billingAddress" label="Billing Address">
        <Input.TextArea placeholder="Billing address (if different)" rows={2} />
      </Form.Item>

      <Form.Item name="referralSource" label="Referral Source">
        <Input placeholder="How did they hear about us?" />
      </Form.Item>
    </div>
  );
};

export default ClientFormSection;
