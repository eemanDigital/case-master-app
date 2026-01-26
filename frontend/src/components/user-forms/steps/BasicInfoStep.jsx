// components/user-forms/steps/BasicInfoStep.jsx
import { Form, Input, Select, DatePicker, Row, Col } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { genderOptions } from "../../../data/options";

const BasicInfoStep = () => {
  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: "First name is required" },
              { min: 2, message: "Minimum 2 characters" },
            ]}>
            <Input placeholder="John" prefix={<UserOutlined />} size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: "Last name is required" },
              { min: 2, message: "Minimum 2 characters" },
            ]}>
            <Input placeholder="Doe" prefix={<UserOutlined />} size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="middleName" label="Middle Name">
            <Input
              placeholder="Middle (Optional)"
              prefix={<UserOutlined />}
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
            ]}>
            <Input
              placeholder="john.doe@example.com"
              prefix={<MailOutlined />}
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: "Phone number is required" },
              {
                pattern: /^[+]?[\d\s\-()]+$/,
                message: "Enter valid phone number",
              },
            ]}>
            <Input
              placeholder="+234 801 234 5678"
              prefix={<PhoneOutlined />}
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address"
        label="Address"
        rules={[
          { required: true, message: "Address is required" },
          { min: 10, message: "Please provide complete address" },
        ]}>
        <Input.TextArea
          placeholder="No. 2, Maitama Close, Abuja"
          prefix={<HomeOutlined />}
          rows={3}
          size="large"
        />
      </Form.Item>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: "Please select gender" }]}>
            <Select
              options={genderOptions}
              placeholder="Select gender"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="dateOfBirth" label="Date of Birth">
            <DatePicker
              className="w-full"
              placeholder="Select birth date"
              size="large"
              disabledDate={(current) => current && current > new Date()}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInfoStep;
