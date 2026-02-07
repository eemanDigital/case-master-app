import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Row,
  Col,
  Card,
  Typography,
  Steps,
  Button,
  Space,
  Divider,
  message,
  Alert,
  Tag,
  Switch,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalculatorOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import { createRetainerDetails } from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

// Service Form Component
const ServiceForm = ({ onAdd, onRemove, services }) => {
  const [serviceForm] = Form.useForm();

  const serviceTypes = [
    "company-secretarial",
    "litigation-advocacy",
    "perfection-of-title",
    "regulatory-compliance",
    "legal-opinion",
    "drafting-review",
    "cac-registration",
    "notarial-services",
    "arbitration-mediation",
    "other",
  ];

  const serviceUnits = [
    { value: "matters", label: "Matters" },
    { value: "filings", label: "Filings" },
    { value: "documents", label: "Documents" },
    { value: "meetings", label: "Meetings" },
    { value: "court_appearances", label: "Court Appearances" },
    { value: "hours", label: "Hours" },
  ];

  const lproScales = [
    { value: "Scale 1", label: "Scale 1 (Simplest)" },
    { value: "Scale 2", label: "Scale 2" },
    { value: "Scale 3", label: "Scale 3" },
    { value: "Scale 4", label: "Scale 4" },
    { value: "Scale 5", label: "Scale 5 (Most Complex)" },
    { value: "N/A", label: "Not Applicable" },
  ];

  const billingModels = [
    { value: "within-retainer", label: "Within Retainer" },
    { value: "fixed-fee", label: "Fixed Fee" },
    { value: "lpro-scale", label: "LPRO Scale" },
    { value: "per-item", label: "Per Item" },
  ];

  const handleAddService = async () => {
    try {
      const values = await serviceForm.validateFields();
      onAdd(values);
      serviceForm.resetFields();
      message.success("Service added successfully");
    } catch (error) {
      console.error("Service validation failed:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Add Service" size="small" className="shadow-sm">
        <Form form={serviceForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[{ required: true, message: "Required" }]}>
                <Select placeholder="Select type" size="large">
                  {serviceTypes.map((type) => (
                    <Option key={type} value={type}>
                      {type.replace(/-/g, " ").toUpperCase()}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="serviceLimit"
                label="Units Allocated"
                rules={[
                  { required: true, message: "Required" },
                  { type: "number", min: 1, message: "Must be at least 1" },
                ]}>
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="Units"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="unitDescription"
                label="Unit Type"
                rules={[{ required: true, message: "Required" }]}>
                <Select placeholder="Select unit" size="large">
                  {serviceUnits.map((unit) => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="billingModel"
                label="Billing Model"
                rules={[{ required: true, message: "Required" }]}>
                <Select placeholder="Select billing model" size="large">
                  {billingModels.map((model) => (
                    <Option key={model.value} value={model.value}>
                      {model.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="lproScale"
                label="LPRO Scale"
                rules={[{ required: true, message: "Required" }]}>
                <Select placeholder="Select LPRO scale" size="large">
                  {lproScales.map((scale) => (
                    <Option key={scale.value} value={scale.value}>
                      {scale.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Required" }]}>
            <TextArea
              rows={2}
              placeholder="Describe the service in detail..."
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            onClick={handleAddService}
            className="w-full"
            icon={<PlusOutlined />}>
            Add Service
          </Button>
        </Form>
      </Card>

      {/* Services List */}
      {services.length > 0 && (
        <Card
          title={`Added Services (${services.length})`}
          size="small"
          className="shadow-sm">
          <div className="space-y-3">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Text strong>
                      {service.serviceType.replace(/-/g, " ").toUpperCase()}
                    </Text>
                    <Tag color="blue">{service.billingModel}</Tag>
                    <Tag color="green">{service.lproScale}</Tag>
                  </div>
                  <div className="text-sm text-gray-600">
                    <Text>
                      {service.serviceLimit} {service.unitDescription}
                    </Text>
                    {service.description && (
                      <div className="mt-1">
                        <Text type="secondary">{service.description}</Text>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => onRemove(index)}
                  className="ml-2"
                  icon={<DeleteOutlined />}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Tax Calculator Component
const TaxCalculator = ({ form }) => {
  const feeAmount = Form.useWatch("retainerFeeAmount", form) || 0;
  const vatRate = Form.useWatch("vatRate", form) || 7.5;
  const whtRate = Form.useWatch("whtRate", form) || 5;
  const applyVAT = Form.useWatch("applyVAT", form) !== false;
  const applyWHT = Form.useWatch("applyWHT", form) !== false;

  const vatAmount = applyVAT ? feeAmount * (vatRate / 100) : 0;
  const whtAmount = applyWHT ? feeAmount * (whtRate / 100) : 0;
  const totalWithTax = feeAmount + vatAmount;
  const netAmount = totalWithTax - whtAmount;

  if (feeAmount <= 0) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <Title level={5} className="!mb-3 flex items-center gap-2">
        <CalculatorOutlined /> Tax Calculation Preview
      </Title>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <Text type="secondary">Retainer Fee:</Text>
        </Col>
        <Col span={12} className="text-right">
          <Text strong>₦ {feeAmount.toLocaleString()}</Text>
        </Col>

        {applyVAT && (
          <>
            <Col span={12}>
              <Text type="secondary">VAT ({vatRate}%):</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text className="text-green-600">
                + ₦ {vatAmount.toLocaleString()}
              </Text>
            </Col>
          </>
        )}

        {applyWHT && (
          <>
            <Col span={12}>
              <Text type="secondary">WHT ({whtRate}%):</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text className="text-red-600">
                - ₦ {whtAmount.toLocaleString()}
              </Text>
            </Col>
          </>
        )}

        <Col span={24}>
          <Divider className="my-2" />
        </Col>

        <Col span={12}>
          <Text strong>Total with Tax:</Text>
        </Col>
        <Col span={12} className="text-right">
          <Text strong className="text-green-600 text-base">
            ₦ {totalWithTax.toLocaleString()}
          </Text>
        </Col>

        <Col span={12}>
          <Text strong>Net Amount:</Text>
        </Col>
        <Col span={12} className="text-right">
          <Text strong className="text-blue-600 text-base">
            ₦ {netAmount.toLocaleString()}
          </Text>
        </Col>
      </Row>
    </div>
  );
};

// Main Component
const CreateRetainer = ({ visible, onCancel, onSuccess, matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [services, setServices] = useState([]);
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

  const steps = [
    { title: "Basic Info", icon: <UserOutlined /> },
    { title: "Services", icon: <FileTextOutlined /> },
    { title: "Pricing & Terms", icon: <DollarOutlined /> },
    { title: "Review", icon: <CalculatorOutlined /> },
  ];

  // FIXED: Separate submit handler that gets ALL form values
  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Get ALL form values
      const values = form.getFieldsValue(true);

      console.log("All form values:", values);
      console.log("Services:", services);

      // Validate required fields
      if (!values.retainerType) {
        throw new Error("Retainer type is required");
      }
      if (!values.billingFrequency) {
        throw new Error("Billing frequency is required");
      }
      if (!values.scopeDescription) {
        throw new Error("Scope description is required");
      }
      if (!values.retainerFeeAmount) {
        throw new Error("Retainer fee amount is required");
      }

      // Create data structure matching schema exactly
      const formData = {
        retainerType: values.retainerType,

        // Safe date conversion
        agreementStartDate: values.agreementStartDate?.isValid()
          ? values.agreementStartDate.toISOString()
          : new Date().toISOString(),

        agreementEndDate: values.agreementEndDate?.isValid()
          ? values.agreementEndDate.toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),

        autoRenewal: values.autoRenewal || false,
        scopeDescription: values.scopeDescription || "Retainer services",

        exclusions: values.exclusions || [],
        renewalTerms: values.renewalTerms || "",

        // Services included with proper structure
        servicesIncluded: services.map((service) => ({
          serviceType: service.serviceType,
          description: service.description || "",
          billingModel: service.billingModel || "within-retainer",
          unitDescription: service.unitDescription || "matters",
          serviceLimit: service.serviceLimit || 0,
          usageCount: 0,
          lproScale: service.lproScale || "N/A",
          lproReference: "",
        })),

        // Billing structure matching schema EXACTLY
        billing: {
          retainerFee: values.retainerFeeAmount || 0,
          currency: values.currency || "NGN",
          frequency: values.billingFrequency || "monthly",
          vatRate: values.vatRate || 7.5,
          applyVAT: values.applyVAT !== false,
          applyWHT: values.applyWHT !== false,
          whtRate: values.whtRate || 5,
          additionalFees: {
            isApplicable: false,
            description: "",
          },
          billingCap: {
            isApplicable: !!values.billingCap,
            amount: values.billingCap || 0,
            period: "monthly",
          },
        },

        // Disbursements array (empty initially)
        disbursements: [],
        totalDisbursements: 0,

        // Response times with proper structure
        responseTimes: {
          routine: {
            value: values.routineResponseTime || 24,
            unit: values.routineResponseUnit || "hours",
          },
          urgent: {
            value: values.urgentResponseTime || 4,
            unit: values.urgentResponseUnit || "hours",
          },
        },

        // Meeting schedule
        meetingSchedule: {
          frequency: values.meetingFrequency || "monthly",
          description: values.meetingDescription || "",
        },

        // Reporting requirements
        reportingRequirements: {
          frequency: values.reportingFrequency || "monthly",
          format: values.reportingFormat || "PDF Report",
        },

        // Activity log (empty initially)
        activityLog: [],

        // Requests (empty initially)
        requests: [],
        totalRequestsHandled: 0,

        // Court appearances (empty initially)
        courtAppearances: [],

        // NBA Stamp details
        requiresNBAStamp: values.requiresNBAStamp || false,
        nbaStampDetails: values.requiresNBAStamp
          ? {
              stampNumber: values.stampNumber || "",
              stampDate: new Date().toISOString(),
              stampValue: values.stampValue || 0,
            }
          : undefined,

        // Termination clause
        terminationClause: {
          noticePeriod: {
            value: values.noticePeriodValue || 30,
            unit: values.noticePeriodUnit || "days",
          },
          conditions: values.terminationConditions || "",
        },
      };

      console.log(
        "Submitting retainer data:",
        JSON.stringify(formData, null, 2),
      );

      await dispatch(
        createRetainerDetails({ matterId, data: formData }),
      ).unwrap();

      message.success("Retainer created successfully!");
      form.resetFields();
      setServices([]);
      setCurrentStep(0);
      if (onSuccess) onSuccess(matterId);
    } catch (error) {
      console.error("Create retainer error:", error.response?.data || error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create retainer",
      );
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Next button handler - doesn't submit form
  const nextStep = async () => {
    try {
      if (currentStep === 1 && services.length === 0) {
        message.warning("Please add at least one service");
        return;
      }

      const fieldsToValidate = getFieldsForStep(currentStep);
      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step) => {
    switch (step) {
      case 0:
        return [
          "retainerType",
          "billingFrequency",
          "agreementStartDate",
          "agreementEndDate",
          "scopeDescription",
        ];
      case 1:
        return []; // Services validated separately
      case 2:
        return ["retainerFeeAmount"];
      default:
        return [];
    }
  };

  const renderReviewContent = () => {
    const values = form.getFieldsValue(true); // Get ALL values

    return (
      <div className="space-y-4">
        <Alert
          message="Review Retainer Details"
          description="Please review all details before creating the retainer agreement"
          type="info"
          showIcon
        />

        <Card title="Retainer Summary" className="shadow-sm">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Retainer Type">
              {retainerTypes.find((t) => t.value === values.retainerType)
                ?.label || values.retainerType}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {values.agreementStartDate && values.agreementEndDate && (
                <>
                  {dayjs(values.agreementStartDate).format("DD MMM YYYY")} to{" "}
                  {dayjs(values.agreementEndDate).format("DD MMM YYYY")}
                </>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Billing Frequency">
              {billingFrequencies.find(
                (f) => f.value === values.billingFrequency,
              )?.label || values.billingFrequency}
            </Descriptions.Item>
            <Descriptions.Item label="Auto Renewal">
              <Tag color={values.autoRenewal ? "green" : "default"}>
                {values.autoRenewal ? "Yes" : "No"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Services Included">
              <Tag color="blue">{services.length} service(s)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Scope Description">
              <Text className="text-sm">
                {values.scopeDescription?.substring(0, 100)}
                {values.scopeDescription?.length > 100 ? "..." : ""}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Financial Summary" className="shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text strong>Retainer Fee:</Text>
              <Text strong>
                ₦ {(values.retainerFeeAmount || 0).toLocaleString()}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text>Billing Frequency:</Text>
              <Text>
                {billingFrequencies.find(
                  (f) => f.value === values.billingFrequency,
                )?.label || values.billingFrequency}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text>Apply VAT:</Text>
              <Text>{values.applyVAT !== false ? "Yes" : "No"}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Apply WHT:</Text>
              <Text>{values.applyWHT !== false ? "Yes" : "No"}</Text>
            </div>
          </div>

          <TaxCalculator form={form} />

          {values.billingCap && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
              <Text strong className="text-yellow-700">
                Billing Cap: ₦ {values.billingCap.toLocaleString()}
              </Text>
            </div>
          )}
        </Card>

        {services.length > 0 && (
          <Card title="Services" className="shadow-sm">
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="p-3 border rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Text strong>
                      {service.serviceType.replace(/-/g, " ").toUpperCase()}
                    </Text>
                    <Space>
                      <Tag color="blue">
                        {service.serviceLimit} {service.unitDescription}
                      </Tag>
                      <Tag color="green">{service.billingModel}</Tag>
                    </Space>
                  </div>
                  {service.description && (
                    <Text type="secondary" className="block mt-2">
                      {service.description}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Basic Info
        return (
          <div className="space-y-4">
            <Alert
              message="Nigerian Legal Practice Retainer"
              description="Create a retainer agreement compliant with Nigerian legal billing practices"
              type="info"
              showIcon
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="retainerType"
                  label="Retainer Type"
                  rules={[
                    { required: true, message: "Retainer type is required" },
                  ]}>
                  <Select placeholder="Select type" size="large">
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
                  name="billingFrequency"
                  label="Billing Frequency"
                  rules={[
                    {
                      required: true,
                      message: "Billing frequency is required",
                    },
                  ]}>
                  <Select placeholder="Select frequency" size="large">
                    {billingFrequencies.map((freq) => (
                      <Option key={freq.value} value={freq.value}>
                        {freq.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="agreementStartDate"
                  label="Start Date"
                  rules={[
                    { required: true, message: "Start date is required" },
                  ]}>
                  <DatePicker
                    className="w-full"
                    size="large"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="agreementEndDate"
                  label="End Date"
                  rules={[{ required: true, message: "End date is required" }]}>
                  <DatePicker
                    className="w-full"
                    size="large"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="scopeDescription"
              label="Scope Description"
              rules={[
                { required: true, message: "Scope description is required" },
              ]}>
              <TextArea
                rows={4}
                placeholder="Describe the scope of services to be provided under this retainer..."
                size="large"
              />
            </Form.Item>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="autoRenewal"
                  label="Auto Renewal"
                  valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="requiresNBAStamp"
                  label="Requires NBA Stamp"
                  valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) =>
                getFieldValue("requiresNBAStamp") && (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="stampNumber"
                        label="NBA Stamp Number"
                        rules={[
                          {
                            required: true,
                            message: "Stamp number is required",
                          },
                        ]}>
                        <Input
                          placeholder="Enter NBA stamp number"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="stampValue"
                        label="Stamp Value"
                        rules={[
                          {
                            required: true,
                            message: "Stamp value is required",
                          },
                          {
                            type: "number",
                            min: 0,
                            message: "Must be positive",
                          },
                        ]}>
                        <InputNumber
                          min={0}
                          className="w-full"
                          prefix="₦"
                          size="large"
                          placeholder="Enter stamp value"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                )
              }
            </Form.Item>
          </div>
        );

      case 1: // Services
        return (
          <div className="space-y-4">
            <Alert
              message="Add Services"
              description="Add the services included in this retainer agreement"
              type="info"
              showIcon
            />

            <ServiceForm
              services={services}
              onAdd={(service) => setServices([...services, service])}
              onRemove={(index) => {
                const newServices = [...services];
                newServices.splice(index, 1);
                setServices(newServices);
              }}
            />

            {services.length === 0 && (
              <Alert
                message="No Services Added"
                description="Please add at least one service to continue"
                type="warning"
                showIcon
              />
            )}
          </div>
        );

      case 2: // Pricing & Terms
        return (
          <div className="space-y-4">
            <Card title="Retainer Fee" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="retainerFeeAmount"
                    label="Fee Amount"
                    rules={[
                      { required: true, message: "Fee amount is required" },
                      { type: "number", min: 0, message: "Must be positive" },
                    ]}>
                    <InputNumber
                      min={0}
                      className="w-full"
                      prefix="₦"
                      size="large"
                      placeholder="0.00"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="currency"
                    label="Currency"
                    initialValue="NGN">
                    <Select size="large">
                      <Option value="NGN">NGN</Option>
                      <Option value="USD">USD</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="billingCap" label="Billing Cap (Optional)">
                <InputNumber
                  min={0}
                  className="w-full"
                  prefix="₦"
                  size="large"
                  placeholder="Enter billing cap amount"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Card>

            <Card title="Tax Settings" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="applyVAT"
                    label="Apply VAT"
                    valuePropName="checked"
                    initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) =>
                      getFieldValue("applyVAT") !== false && (
                        <Form.Item
                          name="vatRate"
                          label="VAT Rate (%)"
                          initialValue={7.5}
                          rules={[
                            { required: true, message: "VAT rate is required" },
                            {
                              type: "number",
                              min: 0,
                              max: 100,
                              message: "Between 0-100",
                            },
                          ]}>
                          <InputNumber
                            min={0}
                            max={100}
                            className="w-full"
                            suffix="%"
                            size="large"
                          />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="applyWHT"
                    label="Apply WHT"
                    valuePropName="checked"
                    initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) =>
                      getFieldValue("applyWHT") !== false && (
                        <Form.Item
                          name="whtRate"
                          label="WHT Rate (%)"
                          initialValue={5}
                          rules={[
                            { required: true, message: "WHT rate is required" },
                            {
                              type: "number",
                              min: 0,
                              max: 100,
                              message: "Between 0-100",
                            },
                          ]}>
                          <InputNumber
                            min={0}
                            max={100}
                            className="w-full"
                            suffix="%"
                            size="large"
                          />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </Col>
              </Row>

              <TaxCalculator form={form} />
            </Card>

            <Card title="Response Times" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="routineResponseTime"
                    label="Routine (hours)"
                    initialValue={24}
                    rules={[{ required: true, message: "Required" }]}>
                    <InputNumber
                      min={1}
                      className="w-full"
                      placeholder="24"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="urgentResponseTime"
                    label="Urgent (hours)"
                    initialValue={4}
                    rules={[{ required: true, message: "Required" }]}>
                    <InputNumber
                      min={1}
                      className="w-full"
                      placeholder="4"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="routineResponseUnit"
                    label="Time Unit"
                    initialValue="hours">
                    <Select size="large">
                      <Option value="hours">Hours</Option>
                      <Option value="days">Days</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Meeting Schedule" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="meetingFrequency"
                    label="Frequency"
                    initialValue="monthly">
                    <Select size="large">
                      <Option value="weekly">Weekly</Option>
                      <Option value="bi-weekly">Bi-weekly</Option>
                      <Option value="monthly">Monthly</Option>
                      <Option value="quarterly">Quarterly</Option>
                      <Option value="as-needed">As Needed</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="meetingDescription" label="Description">
                    <Input
                      placeholder="e.g., Status update meetings..."
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Reporting" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="reportingFrequency"
                    label="Frequency"
                    initialValue="monthly">
                    <Select size="large">
                      <Option value="monthly">Monthly</Option>
                      <Option value="quarterly">Quarterly</Option>
                      <Option value="annually">Annually</Option>
                      <Option value="as-needed">As Needed</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="reportingFormat"
                    label="Format"
                    initialValue="PDF Report">
                    <Input
                      placeholder="e.g., PDF report, Excel spreadsheet..."
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Termination" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="noticePeriodValue"
                    label="Notice Period"
                    initialValue={30}
                    rules={[{ required: true, message: "Required" }]}>
                    <InputNumber
                      min={1}
                      className="w-full"
                      placeholder="30"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="noticePeriodUnit"
                    label="Unit"
                    initialValue="days">
                    <Select size="large">
                      <Option value="days">Days</Option>
                      <Option value="weeks">Weeks</Option>
                      <Option value="months">Months</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="terminationConditions"
                label="Conditions (Optional)">
                <TextArea
                  rows={2}
                  placeholder="Additional conditions for termination..."
                  size="large"
                />
              </Form.Item>
            </Card>
          </div>
        );

      case 3: // Review
        return renderReviewContent();

      default:
        return null;
    }
  };

  return (
    <Modal
      title="Create New Retainer"
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
        setServices([]);
        setCurrentStep(0);
      }}
      footer={null}
      width={900}
      className="retainer-create-modal">
      <div className="p-6">
        <Steps current={currentStep} className="mb-8" responsive={false}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        {/* FIXED: Remove onFinish from Form - handle submission manually */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            retainerType: "general-legal",
            billingFrequency: "monthly",
            scopeDescription: "",
            autoRenewal: false,
            applyVAT: true,
            vatRate: 7.5,
            applyWHT: true,
            whtRate: 5,
            requiresNBAStamp: false,
            currency: "NGN",
            routineResponseTime: 24,
            urgentResponseTime: 4,
            routineResponseUnit: "hours",
            meetingFrequency: "monthly",
            reportingFrequency: "monthly",
            reportingFormat: "PDF Report",
            noticePeriodValue: 30,
            noticePeriodUnit: "days",
          }}>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {renderStepContent(currentStep)}
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <Space>
              {currentStep > 0 && (
                <Button onClick={prevStep} icon={<ArrowLeftOutlined />}>
                  Previous
                </Button>
              )}
              <Button
                onClick={() => {
                  onCancel();
                  form.resetFields();
                  setServices([]);
                  setCurrentStep(0);
                }}
                icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Space>

            <Space>
              {/* FIXED: Final step calls handleFinalSubmit directly */}
              {currentStep === steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={handleFinalSubmit}
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large">
                  Create Retainer
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={nextStep}
                  icon={<ArrowRightOutlined />}
                  size="large">
                  Next
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateRetainer;
