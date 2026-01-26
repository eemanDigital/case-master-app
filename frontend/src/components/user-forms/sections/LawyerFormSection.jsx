// components/user-forms/sections/LawyerFormSection.jsx
import {
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Alert,
  Row,
  Col,
  Divider,
} from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { positionOptions, practiceAreasOptions } from "../../../data/options";

const { TextArea } = Input;

const LawyerFormSection = () => {
  return (
    <div className="space-y-6">
      <Alert
        message="Legal Credentials Required"
        description="All lawyer-specific fields are mandatory"
        type="warning"
        showIcon
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="barNumber"
            label="Bar Number"
            rules={[{ required: true, message: "Bar number is required" }]}>
            <Input
              placeholder="e.g., NBL-12345"
              prefix={<SafetyCertificateOutlined />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="barAssociation"
            label="Bar Association"
            rules={[
              { required: true, message: "Bar association is required" },
            ]}>
            <Input placeholder="e.g., Nigerian Bar Association" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="yearOfCall"
            label="Year of Call"
            rules={[{ required: true, message: "Year of call is required" }]}>
            <DatePicker
              picker="year"
              className="w-full"
              placeholder="Select year"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="position" label="Position" initialValue="Associate">
            <Select
              options={positionOptions.filter((p) =>
                [
                  "Principal",
                  "Managing Partner",
                  "Head of Chambers",
                  "Associate",
                  "Senior Associate",
                  "Junior Associate",
                  "Counsel",
                ].includes(p.value),
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="practiceAreas"
        label="Practice Areas"
        rules={[
          {
            required: true,
            message: "Please select at least one practice area",
          },
        ]}>
        <Select
          mode="multiple"
          options={practiceAreasOptions}
          placeholder="Select practice areas"
        />
      </Form.Item>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="hourlyRate" label="Hourly Rate (₦)">
            <Input type="number" min="0" step="50" placeholder="e.g., 350" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="specialization" label="Specialization">
            <Input placeholder="e.g., Corporate M&A, IP Law" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Education</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="universityAttended" label="University">
            <Input placeholder="University name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="universityGraduationYear" label="Grad Year">
            <Input placeholder="Year" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="universityDegree" label="Degree">
            <Input placeholder="e.g., LL.B" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="lawSchoolAttended" label="Law School">
            <Input placeholder="Law school name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="lawSchoolGraduationYear" label="Grad Year">
            <Input placeholder="Year" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="lawSchoolDegree" label="Degree">
            <Input placeholder="e.g., B.L" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="isPartner" valuePropName="checked">
        <Checkbox>Is Partner</Checkbox>
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prev, curr) => prev.isPartner !== curr.isPartner}>
        {({ getFieldValue }) =>
          getFieldValue("isPartner") && (
            <Form.Item
              name="partnershipPercentage"
              label="Partnership Percentage">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 15"
                addonAfter="%"
              />
            </Form.Item>
          )
        }
      </Form.Item>

      <Form.Item name="bio" label="Professional Bio">
        <TextArea
          rows={4}
          placeholder="Professional background and experience"
        />
      </Form.Item>
    </div>
  );
};

export default LawyerFormSection;
