import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Card,
  Typography,
  Switch,
  Divider,
  Space,
  Button,
  message,
  Alert,
  Tabs,
} from "antd";
import { SaveOutlined, CloseOutlined, UndoOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import { updateRetainerDetails } from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Tax Calculator Component
const TaxCalculator = ({ form }) => {
  const retainerFee = Form.useWatch(["billing", "retainerFee"], form) || 0;
  const vatRate = Form.useWatch(["billing", "vatRate"], form) || 7.5;
  const whtRate = Form.useWatch(["billing", "whtRate"], form) || 5;
  const applyVAT = Form.useWatch(["billing", "applyVAT"], form) !== false;
  const applyWHT = Form.useWatch(["billing", "applyWHT"], form) !== false;

  const vatAmount = applyVAT ? retainerFee * (vatRate / 100) : 0;
  const whtAmount = applyWHT ? retainerFee * (whtRate / 100) : 0;
  const totalWithTax = retainerFee + vatAmount;
  const netAmount = totalWithTax - whtAmount;

  if (!retainerFee) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <Text strong className="block mb-3">
        Tax Calculation Preview
      </Text>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <Text className="text-gray-600">Retainer Fee:</Text>
          <Text strong className="text-gray-900">
            ₦ {retainerFee.toLocaleString()}
          </Text>
        </div>
        {applyVAT && (
          <div className="flex justify-between items-center">
            <Text className="text-gray-600">VAT ({vatRate}%):</Text>
            <Text className="text-green-600">
              + ₦ {vatAmount.toLocaleString()}
            </Text>
          </div>
        )}
        {applyWHT && (
          <div className="flex justify-between items-center">
            <Text className="text-gray-600">WHT ({whtRate}%):</Text>
            <Text className="text-red-600">
              - ₦ {whtAmount.toLocaleString()}
            </Text>
          </div>
        )}
        <Divider className="my-2" />
        <div className="flex justify-between items-center">
          <Text strong className="text-gray-700">
            Total with Tax:
          </Text>
          <Text strong className="text-green-600 text-base">
            ₦ {totalWithTax.toLocaleString()}
          </Text>
        </div>
        <div className="flex justify-between items-center">
          <Text strong className="text-gray-700">
            Net Amount:
          </Text>
          <Text strong className="text-blue-600 text-base">
            ₦ {netAmount.toLocaleString()}
          </Text>
        </div>
      </div>
    </div>
  );
};

// Main Component
const RetainerForm = ({ retainerDetails, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const retainerTypes = [
    { value: "general-legal", label: "General Legal Advisory" },
    { value: "company-secretarial", label: "Company Secretarial" },
    { value: "retainer-deposit", label: "Retainer Deposit" },
    { value: "specialized", label: "Specialized Services" },
    { value: "other", label: "Other" },
  ];

  const billingFrequencies = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
    { value: "one-off", label: "One-Off" },
  ];

  // Proper data population
  useEffect(() => {
    if (retainerDetails) {
      const detail = retainerDetails.retainerDetail || retainerDetails;

      console.log("Loading retainer details:", detail);

      // Safe date conversion
      const startDate = detail.agreementStartDate
        ? dayjs(detail.agreementStartDate)
        : null;
      const endDate = detail.agreementEndDate
        ? dayjs(detail.agreementEndDate)
        : null;

      const formData = {
        retainerType: detail.retainerType,
        agreementStartDate: startDate,
        agreementEndDate: endDate,
        autoRenewal: detail.autoRenewal || false,
        scopeDescription: detail.scopeDescription,
        exclusions: detail.exclusions || [],
        renewalTerms: detail.renewalTerms || "",
        requiresNBAStamp: detail.requiresNBAStamp || false,
        nbaStampDetails: detail.nbaStampDetails || {},
        billing: {
          retainerFee: detail.billing?.retainerFee || 0,
          currency: detail.billing?.currency || "NGN",
          frequency: detail.billing?.frequency || "monthly",
          vatRate: detail.billing?.vatRate || 7.5,
          applyVAT: detail.billing?.applyVAT !== false,
          applyWHT: detail.billing?.applyWHT !== false,
          whtRate: detail.billing?.whtRate || 5,
          billingCap: detail.billing?.billingCap || {},
        },
        responseTimes: detail.responseTimes || {
          routine: { value: 24, unit: "hours" },
          urgent: { value: 4, unit: "hours" },
        },
        meetingSchedule: detail.meetingSchedule || {
          frequency: "monthly",
          description: "",
        },
        reportingRequirements: detail.reportingRequirements || {
          frequency: "monthly",
          format: "PDF Report",
        },
        terminationClause: detail.terminationClause || {
          noticePeriod: { value: 30, unit: "days" },
          conditions: "",
        },
      };

      form.setFieldsValue(formData);
    }
  }, [retainerDetails, form]);

  // Proper data submission with safe date conversion
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log("Form values:", values);

      const formData = {
        retainerType: values.retainerType,
        // Safe date conversion
        agreementStartDate: values.agreementStartDate?.isValid()
          ? values.agreementStartDate.toISOString()
          : retainerDetails?.agreementStartDate || new Date().toISOString(),
        agreementEndDate: values.agreementEndDate?.isValid()
          ? values.agreementEndDate.toISOString()
          : retainerDetails?.agreementEndDate ||
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenewal: values.autoRenewal || false,
        scopeDescription: values.scopeDescription,
        exclusions: values.exclusions || [],
        renewalTerms: values.renewalTerms,
        requiresNBAStamp: values.requiresNBAStamp || false,
        nbaStampDetails: values.requiresNBAStamp
          ? values.nbaStampDetails
          : undefined,
        billing: {
          retainerFee: values.billing?.retainerFee || 0,
          currency: values.billing?.currency || "NGN",
          frequency: values.billing?.frequency,
          vatRate: values.billing?.vatRate || 7.5,
          applyVAT: values.billing?.applyVAT !== false,
          applyWHT: values.billing?.applyWHT !== false,
          whtRate: values.billing?.whtRate || 5,
          billingCap: values.billing?.billingCap,
        },
        responseTimes: values.responseTimes,
        meetingSchedule: values.meetingSchedule,
        reportingRequirements: values.reportingRequirements,
        terminationClause: values.terminationClause,
      };

      const matterId = retainerDetails?.matterId._id;

      console.log("MATTERID", matterId);

      if (!matterId) {
        throw new Error("Matter ID not found");
      }

      await dispatch(
        updateRetainerDetails({
          matterId,
          data: formData,
        }),
      ).unwrap();

      message.success("Retainer updated successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update retainer",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <Title level={3} className="!mb-2">
                Edit Retainer Details
              </Title>
              <Text type="secondary">
                Update retainer agreement information
              </Text>
            </div>
            <Space className="mt-4 md:mt-0">
              <Button
                onClick={handleReset}
                icon={<UndoOutlined />}
                className="hidden md:inline-flex">
                Reset
              </Button>
              <Button onClick={onCancel} icon={<CloseOutlined />}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
                icon={<SaveOutlined />}
                size="large">
                Save Changes
              </Button>
            </Space>
          </div>

          <Alert
            message="Nigerian Billing Model"
            description="This form uses the Nigerian legal billing model with VAT (7.5%) and WHT (5%) considerations"
            type="info"
            showIcon
            className="mb-6"
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6">
          <Tabs
            defaultActiveKey="1"
            size="large"
            className="bg-white rounded-lg shadow-md">
            {/* Basic Information */}
            <TabPane tab="Basic Information" key="1" className="p-6">
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="retainerType"
                    label="Retainer Type"
                    rules={[
                      {
                        required: true,
                        message: "Please select retainer type",
                      },
                    ]}>
                    <Select
                      placeholder="Select retainer type"
                      size="large"
                      className="w-full">
                      {retainerTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={["billing", "frequency"]}
                    label="Billing Frequency"
                    rules={[
                      { required: true, message: "Please select frequency" },
                    ]}>
                    <Select
                      placeholder="Select billing frequency"
                      size="large"
                      className="w-full">
                      {billingFrequencies.map((freq) => (
                        <Option key={freq.value} value={freq.value}>
                          {freq.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="agreementStartDate"
                    label="Start Date"
                    rules={[
                      { required: true, message: "Please select start date" },
                    ]}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="agreementEndDate"
                    label="End Date"
                    rules={[
                      { required: true, message: "Please select end date" },
                    ]}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="autoRenewal"
                    label="Auto Renewal"
                    valuePropName="checked">
                    <Switch size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="requiresNBAStamp"
                    label="Requires NBA Stamp"
                    valuePropName="checked">
                    <Switch size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) =>
                      getFieldValue("requiresNBAStamp") && (
                        <Form.Item
                          name={["nbaStampDetails", "stampValue"]}
                          label="NBA Stamp Value">
                          <InputNumber
                            min={0}
                            prefix="₦"
                            className="w-full"
                            size="large"
                          />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="scopeDescription"
                label="Scope Description"
                rules={[
                  { required: true, message: "Please enter scope description" },
                ]}>
                <TextArea
                  rows={4}
                  placeholder="Describe the scope of services covered by this retainer..."
                  maxLength={2000}
                  showCount
                  size="large"
                />
              </Form.Item>

              <Form.Item name="exclusions" label="Exclusions (Optional)">
                <Select
                  mode="tags"
                  placeholder="Add services not included in retainer"
                  size="large"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item name="renewalTerms" label="Renewal Terms (Optional)">
                <TextArea
                  rows={3}
                  placeholder="Terms and conditions for renewal..."
                  size="large"
                />
              </Form.Item>
            </TabPane>

            {/* Billing & Fees */}
            <TabPane tab="Billing & Fees" key="2" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Retainer Fee */}
                <Card title="Retainer Fee" className="shadow-sm">
                  <Form.Item
                    name={["billing", "retainerFee"]}
                    label="Fee Amount"
                    rules={[
                      { required: true, message: "Please enter fee amount" },
                    ]}>
                    <InputNumber
                      min={0}
                      className="w-full"
                      size="large"
                      prefix="₦"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>

                  <Form.Item name={["billing", "currency"]} label="Currency">
                    <Select size="large" defaultValue="NGN">
                      <Option value="NGN">NGN</Option>
                      <Option value="USD">USD</Option>
                    </Select>
                  </Form.Item>
                </Card>

                {/* Tax Settings */}
                <Card title="Tax Settings" className="shadow-sm">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name={["billing", "applyVAT"]}
                        label="Apply VAT"
                        valuePropName="checked">
                        <Switch size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) =>
                          getFieldValue(["billing", "applyVAT"]) && (
                            <Form.Item
                              name={["billing", "vatRate"]}
                              label="VAT Rate (%)">
                              <InputNumber
                                min={0}
                                max={100}
                                className="w-full"
                                size="large"
                                suffix="%"
                              />
                            </Form.Item>
                          )
                        }
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name={["billing", "applyWHT"]}
                        label="Apply WHT"
                        valuePropName="checked">
                        <Switch size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) =>
                          getFieldValue(["billing", "applyWHT"]) && (
                            <Form.Item
                              name={["billing", "whtRate"]}
                              label="WHT Rate (%)">
                              <InputNumber
                                min={0}
                                max={100}
                                className="w-full"
                                size="large"
                                suffix="%"
                              />
                            </Form.Item>
                          )
                        }
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item noStyle shouldUpdate>
                    {() => <TaxCalculator form={form} />}
                  </Form.Item>
                </Card>
              </div>

              {/* Billing Cap */}
              <Card title="Billing Cap" className="shadow-sm mt-6">
                <Form.Item
                  name={["billing", "billingCap", "amount"]}
                  label="Billing Cap Amount (Optional)"
                  help="Maximum amount that can be billed in the specified period">
                  <InputNumber
                    min={0}
                    className="w-full"
                    size="large"
                    prefix="₦"
                    placeholder="Enter billing cap amount"
                  />
                </Form.Item>
              </Card>
            </TabPane>

            {/* Service Terms */}
            <TabPane tab="Service Terms" key="3" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Times */}
                <Card title="Response Times" className="shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <Text strong className="block mb-2">
                        Routine Matters
                      </Text>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={["responseTimes", "routine", "value"]}
                            rules={[{ required: true, message: "Required" }]}>
                            <InputNumber
                              min={1}
                              className="w-full"
                              placeholder="24"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={["responseTimes", "routine", "unit"]}
                            rules={[{ required: true, message: "Required" }]}>
                            <Select size="large">
                              <Option value="hours">Hours</Option>
                              <Option value="days">Days</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <div>
                      <Text strong className="block mb-2">
                        Urgent Matters
                      </Text>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={["responseTimes", "urgent", "value"]}
                            rules={[{ required: true, message: "Required" }]}>
                            <InputNumber
                              min={1}
                              className="w-full"
                              placeholder="4"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={["responseTimes", "urgent", "unit"]}
                            rules={[{ required: true, message: "Required" }]}>
                            <Select size="large">
                              <Option value="hours">Hours</Option>
                              <Option value="days">Days</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Card>

                {/* Meeting Schedule */}
                <Card title="Meeting Schedule" className="shadow-sm">
                  <Form.Item
                    name={["meetingSchedule", "frequency"]}
                    label="Meeting Frequency">
                    <Select size="large">
                      <Option value="weekly">Weekly</Option>
                      <Option value="bi-weekly">Bi-weekly</Option>
                      <Option value="monthly">Monthly</Option>
                      <Option value="quarterly">Quarterly</Option>
                      <Option value="as-needed">As Needed</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name={["meetingSchedule", "description"]}
                    label="Meeting Description">
                    <Input
                      placeholder="e.g., Status update meetings..."
                      size="large"
                    />
                  </Form.Item>
                </Card>

                {/* Reporting Requirements */}
                <Card title="Reporting" className="shadow-sm">
                  <Form.Item
                    name={["reportingRequirements", "frequency"]}
                    label="Reporting Frequency">
                    <Select size="large">
                      <Option value="monthly">Monthly</Option>
                      <Option value="quarterly">Quarterly</Option>
                      <Option value="annually">Annually</Option>
                      <Option value="as-needed">As Needed</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name={["reportingRequirements", "format"]}
                    label="Reporting Format">
                    <Input
                      placeholder="e.g., PDF report, Excel spreadsheet..."
                      size="large"
                    />
                  </Form.Item>
                </Card>

                {/* Termination Clause */}
                <Card title="Termination" className="shadow-sm">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={["terminationClause", "noticePeriod", "value"]}
                        label="Notice Period"
                        rules={[{ required: true, message: "Required" }]}>
                        <InputNumber
                          min={1}
                          className="w-full"
                          placeholder="30"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={["terminationClause", "noticePeriod", "unit"]}
                        label="Unit"
                        rules={[{ required: true, message: "Required" }]}>
                        <Select size="large">
                          <Option value="days">Days</Option>
                          <Option value="weeks">Weeks</Option>
                          <Option value="months">Months</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name={["terminationClause", "conditions"]}
                    label="Termination Conditions">
                    <TextArea
                      rows={3}
                      placeholder="Additional conditions for termination..."
                      size="large"
                    />
                  </Form.Item>
                </Card>
              </div>
            </TabPane>
          </Tabs>

          {/* Footer Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <Text type="secondary" className="text-sm">
                Review all information before saving changes
              </Text>
              <Space size="large">
                <Button onClick={onCancel} size="large">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  loading={loading}
                  size="large"
                  icon={<SaveOutlined />}>
                  Save Changes
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RetainerForm;
