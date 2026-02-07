import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Typography,
  Alert,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Card,
  Statistic,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  //   ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RenewalModal = ({
  visible,
  onCancel,
  onOk,
  loading,
  currentEndDate,
  currentRetainerFee,
}) => {
  const [form] = Form.useForm();
  const [newEndDate, setNewEndDate] = useState(null);
  const [renewalPeriod, setRenewalPeriod] = useState("12");

  // Calculate default dates
  useEffect(() => {
    if (currentEndDate) {
      const endDate = dayjs(currentEndDate);
      const oneYearLater = endDate.add(12, "month");
      form.setFieldsValue({
        newEndDate: oneYearLater,
        renewalPeriod: "12",
      });
      setNewEndDate(oneYearLater);
    }
  }, [currentEndDate, form]);

  // Handle period change
  const handlePeriodChange = (period) => {
    setRenewalPeriod(period);
    if (currentEndDate) {
      const newDate = dayjs(currentEndDate).add(Number(period), "month");
      form.setFieldsValue({ newEndDate: newDate });
      setNewEndDate(newDate);
    }
  };

  // Calculate days difference
  const calculateDays = () => {
    if (!currentEndDate || !newEndDate) return 0;
    return newEndDate.diff(dayjs(currentEndDate), "day");
  };

  // Handle form submit
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onOk({
        newEndDate: values.newEndDate.toISOString(),
        retainerFee: values.retainerFee,
        renewalNotes: values.renewalNotes,
        servicesIncluded: values.servicesIncluded,
      });
    });
  };

  // Quick period options
  const periodOptions = [
    { value: "1", label: "1 Month" },
    { value: "3", label: "3 Months" },
    { value: "6", label: "6 Months" },
    { value: "12", label: "1 Year" },
    { value: "24", label: "2 Years" },
    { value: "36", label: "3 Years" },
  ];

  return (
    <Modal
      title="Renew Retainer Agreement"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="Renew Retainer"
      cancelText="Cancel">
      <Alert
        message="Retainer Renewal"
        description="Create a new retainer agreement for the next period. This will archive the current agreement and start a new one."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          renewalPeriod: "12",
          retainerFee: currentRetainerFee || {
            amount: 0,
            frequency: "monthly",
          },
        }}>
        {/* Current Agreement Summary */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Current End Date"
                value={
                  currentEndDate
                    ? dayjs(currentEndDate).format("DD MMM YYYY")
                    : "N/A"
                }
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Days Remaining"
                value={
                  currentEndDate
                    ? dayjs(currentEndDate).diff(dayjs(), "day")
                    : 0
                }
                suffix="days"
              />
            </Col>
          </Row>
        </Card>

        {/* Renewal Period Selection */}
        <Card title="Renewal Period" size="small" style={{ marginBottom: 16 }}>
          <Space wrap style={{ width: "100%", justifyContent: "center" }}>
            {periodOptions.map((option) => (
              <Tag
                key={option.value}
                color={renewalPeriod === option.value ? "blue" : "default"}
                style={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  fontSize: "14px",
                }}
                onClick={() => handlePeriodChange(option.value)}>
                {option.label}
              </Tag>
            ))}
          </Space>

          <Divider style={{ margin: "16px 0" }} />

          <Form.Item
            name="newEndDate"
            label="New End Date"
            rules={[{ required: true, message: "Please select end date" }]}>
            <DatePicker
              style={{ width: "100%" }}
              format="DD MMMM YYYY"
              onChange={(date) => setNewEndDate(date)}
            />
          </Form.Item>

          {newEndDate && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                New agreement will be for {calculateDays()} days
              </Text>
            </div>
          )}
        </Card>

        {/* Retainer Fee */}
        <Card title="Retainer Fee" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name={["retainerFee", "amount"]}
                label="Monthly Retainer Fee"
                rules={[{ required: true, message: "Please enter amount" }]}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  prefix={<DollarOutlined />}
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={["retainerFee", "frequency"]}
                label="Billing Frequency"
                rules={[
                  { required: true, message: "Please select frequency" },
                ]}>
                <Select>
                  <Option value="monthly">Monthly</Option>
                  <Option value="quarterly">Quarterly</Option>
                  <Option value="annually">Annually</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Services Review */}
        <Card title="Services Review" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="servicesIncluded"
            label="Services to Include"
            extra="Leave empty to copy all services from current agreement">
            <Select
              mode="multiple"
              placeholder="Select services to include in new agreement"
              allowClear
              style={{ width: "100%" }}>
              <Option value="Legal Consultation">Legal Consultation</Option>
              <Option value="Contract Review">Contract Review</Option>
              <Option value="Document Drafting">Document Drafting</Option>
              <Option value="Compliance Review">Compliance Review</Option>
              <Option value="Legal Research">Legal Research</Option>
              <Option value="Meeting Attendance">Meeting Attendance</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* Renewal Notes */}
        <Card title="Renewal Details" size="small">
          <Form.Item
            name="renewalNotes"
            label="Renewal Notes"
            rules={[{ required: true, message: "Please enter renewal notes" }]}>
            <TextArea
              rows={4}
              placeholder="Enter details about this renewal, changes to terms, or special conditions..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default RenewalModal;
