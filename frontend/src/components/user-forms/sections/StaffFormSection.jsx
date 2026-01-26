// components/user-forms/sections/StaffFormSection.jsx
import { Form, Input, Select, Row, Col } from "antd";
import {
  positionOptions,
  staffDepartmentOptions,
  employmentTypeOptions,
  workScheduleOptions,
} from "../../../data/options";

const StaffFormSection = () => {
  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="position"
            label="Position"
            rules={[{ required: true, message: "Please select position" }]}>
            <Select
              options={positionOptions}
              placeholder="Select position"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select role" }]}>
            <Select
              options={[
                { value: "staff", label: "Staff" },
                { value: "hr", label: "HR" },
                { value: "secretary", label: "Secretary" },
              ]}
              placeholder="Select role"
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="department" label="Department">
            <Select
              options={staffDepartmentOptions}
              placeholder="Select department"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="designation" label="Designation">
            <Input placeholder="Job designation/title" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="employmentType"
            label="Employment Type"
            initialValue="full-time">
            <Select options={employmentTypeOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="workSchedule"
            label="Work Schedule"
            initialValue="9-5">
            <Select options={workScheduleOptions} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="skills" label="Skills (comma separated)">
        <Input placeholder="e.g., Microsoft Office, Communication, Project Management" />
      </Form.Item>
    </div>
  );
};

export default StaffFormSection;
