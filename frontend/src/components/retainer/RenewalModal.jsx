import React, { useEffect, useState } from "react";
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
  Radio,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
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

  const periodOptions = [
    { value: "1", label: "1 Month" },
    { value: "3", label: "3 Months" },
    { value: "6", label: "6 Months" },
    { value: "12", label: "1 Year" },
    { value: "24", label: "2 Years" },
    { value: "36", label: "3 Years" },
  ];

  useEffect(() => {
    if (currentEndDate && visible) {
      const endDate = dayjs(currentEndDate);
      const oneYearLater = endDate.add(12, "month");
      form.setFieldsValue({
        newEndDate: oneYearLater,
        renewalPeriod: "12",
        retainerFee: currentRetainerFee?.retainerFee || 0,
        currency: currentRetainerFee?.currency || "NGN",
        frequency: currentRetainerFee?.frequency || "monthly",
        vatRate: currentRetainerFee?.vatRate || 7.5,
        whtRate: currentRetainerFee?.whtRate || 5,
        applyVAT: currentRetainerFee?.applyVAT !== false,
        applyWHT: currentRetainerFee?.applyWHT !== false,
      });
      setNewEndDate(oneYearLater);
    }
  }, [currentEndDate, currentRetainerFee, form, visible]);

  const handlePeriodChange = (period) => {
    setRenewalPeriod(period);
    if (currentEndDate) {
      const newDate = dayjs(currentEndDate).add(Number(period), "month");
      form.setFieldsValue({ newEndDate: newDate });
      setNewEndDate(newDate);
    }
  };

  const calculateDays = () => {
    if (!currentEndDate || !newEndDate) return 0;
    return newEndDate.diff(dayjs(currentEndDate), "day");
  };

  const calculateMonths = () => {
    if (!currentEndDate || !newEndDate) return 0;
    return newEndDate.diff(dayjs(currentEndDate), "month");
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onOk({
        newEndDate: values.newEndDate.toISOString(),
        billing: {
          retainerFee: values.retainerFee,
          currency: values.currency,
          frequency: values.frequency,
          vatRate: values.vatRate,
          applyVAT: values.applyVAT,
          applyWHT: values.applyWHT,
          whtRate: values.whtRate,
        },
        renewalNotes: values.renewalNotes,
        servicesIncluded: values.servicesIncluded,
        autoRenewal: values.autoRenewal || false,
      });
    });
  };

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined className="text-blue-500" />
          <span>Renew Retainer Agreement</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText="Renew Retainer"
      cancelText="Cancel"
      okButtonProps={{ className: "bg-blue-600 hover:bg-blue-700" }}>
      <Alert
        message="Retainer Renewal Process"
        description="Creating a new retainer agreement will archive the current one and start a fresh term with updated conditions."
        type="info"
        showIcon
        className="mb-6"
      />
      <Form form={form} layout="vertical">
        <Card
          title="Current Agreement"
          size="small"
          className="mb-4 bg-gray-50">
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
                    ? Math.max(dayjs(currentEndDate).diff(dayjs(), "day"), 0)
                    : 0
                }
                suffix="days"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Card title="Renewal Period" size="small" className="mb-4">
          <div className="mb-4">
            <Text strong className="block mb-2">
              Quick Select Period:
            </Text>
            <Space wrap>
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
          </div>
          <Divider className="my-4" />
          <Form.Item
            name="newEndDate"
            label="New End Date"
            rules={[{ required: true, message: "Please select end date" }]}>
            <DatePicker
              className="w-full"
              format="DD MMMM YYYY"
              size="large"
              onChange={(date) => setNewEndDate(date)}
              disabledDate={(current) =>
                current && current < dayjs(currentEndDate)
              }
            />
          </Form.Item>
          {newEndDate && currentEndDate && (
            <Alert
              message={
                <Space>
                  <Text strong>New Agreement Duration:</Text>
                  <Tag color="blue">{calculateMonths()} months</Tag>
                  <Text type="secondary">({calculateDays()} days)</Text>
                </Space>
              }
              type="success"
              showIcon
              className="mt-2"
            />
          )}
        </Card>

        <Card title="Retainer Fee" size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="retainerFee"
                label="Monthly Retainer Fee"
                rules={[{ required: true, message: "Please enter amount" }]}>
                <InputNumber
                  className="w-full"
                  min={0}
                  prefix={<DollarOutlined />}
                  placeholder="0.00"
                  size="large"
                  addonBefore="₦"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="frequency"
                label="Billing Frequency"
                rules={[
                  { required: true, message: "Please select frequency" },
                ]}>
                <Select size="large">
                  <Option value="monthly">Monthly</Option>
                  <Option value="quarterly">Quarterly</Option>
                  <Option value="annually">Annually</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

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
              size="large"
            />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default RenewalModal;
