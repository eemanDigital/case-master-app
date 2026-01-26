import React, { memo } from "react";
import { Form, Input, Button, Space, Card, Row, Col, Select } from "antd";
import { PlusOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";

const ContactPersonsSection = memo(({ initialValue = [] }) => {
  const roleOptions = [
    { value: "primary", label: "Primary Contact" },
    { value: "legal", label: "Legal Representative" },
    { value: "finance", label: "Finance Contact" },
    { value: "executive", label: "Executive" },
    { value: "other", label: "Other" },
  ];

  return (
    <Form.List name="contactPersons" initialValue={initialValue}>
      {(fields, { add, remove }) => (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                Contact Persons
              </h4>
              <p className="text-sm text-gray-500">
                Add key contacts related to this matter
              </p>
            </div>
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
              Add Contact
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card
                key={field.key}
                size="small"
                className="border-blue-100 bg-blue-50"
                title={
                  <Space>
                    <UserOutlined />
                    <span>Contact Person {index + 1}</span>
                  </Space>
                }
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                    size="small"
                  />
                }>
                <Row gutter={[16, 12]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "name"]}
                      label="Name"
                      rules={[{ required: true, message: "Name is required" }]}>
                      <Input placeholder="Full Name" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "role"]}
                      label="Role">
                      <Select
                        placeholder="Select role"
                        options={roleOptions}
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "email"]}
                      label="Email"
                      rules={[
                        { type: "email", message: "Invalid email address" },
                      ]}>
                      <Input placeholder="email@example.com" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "phone"]}
                      label="Phone">
                      <Input placeholder="Phone number" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Form.List>
  );
});

ContactPersonsSection.displayName = "ContactPersonsSection";

export default ContactPersonsSection;
