import React, { useState } from "react";
import {
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
  message,
  Alert,
  Switch,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { createGeneralDetails } from "../../redux/features/general/generalSlice";
import {
  NIGERIAN_GENERAL_SERVICE_TYPES,
  BILLING_TYPES,
  LPRO_SCALES,
  NIGERIAN_STATES,
} from "../../utils/generalConstants";

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const CreateGeneral = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { matterId } = useParams();

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: "Service Info" },
    { title: "Billing" },
    { title: "Timeline & Jurisdiction" },
    { title: "Review" },
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // ✅ FIX: Validate critical fields before submission
      if (!values.serviceType) {
        message.error("Please select a service type");
        setCurrentStep(0); // Go back to first step
        setLoading(false);
        return;
      }

      if (!values.serviceDescription) {
        message.error("Please provide a service description");
        setCurrentStep(0);
        setLoading(false);
        return;
      }

      if (!values.billingType) {
        message.error("Please select a billing type");
        setCurrentStep(1);
        setLoading(false);
        return;
      }

      const formData = {
        serviceType: values.serviceType,
        otherServiceType: values.otherServiceType || "",
        serviceDescription: values.serviceDescription,

        billing: {
          billingType: values.billingType,
          fixedFee:
            values.billingType === "fixed-fee"
              ? {
                  amount: values.fixedFeeAmount || 0,
                  currency: values.currency || "NGN",
                }
              : undefined,
          lproScale:
            values.billingType === "lpro-scale"
              ? {
                  scale: values.lproScale || "Scale 1",
                  reference: values.lproReference || "",
                }
              : undefined,
          percentage:
            values.billingType === "percentage"
              ? {
                  rate: values.percentageRate || 0,
                  baseAmount: values.percentageBaseAmount || 0,
                  calculatedFee:
                    ((values.percentageRate || 0) / 100) *
                    (values.percentageBaseAmount || 0),
                }
              : undefined,
          vatRate: values.vatRate || 7.5,
          applyVAT: values.applyVAT !== false,
          applyWHT: values.applyWHT !== false,
          whtRate: values.whtRate || 5,
        },

        requestDate:
          values.requestDate?.toISOString() || new Date().toISOString(),
        expectedCompletionDate: values.expectedCompletionDate?.toISOString(),

        jurisdiction: {
          state: values.state || "",
          lga: values.lga || "",
          court: values.court || "",
        },

        requiresNBAStamp: values.requiresNBAStamp || false,
        nbaStampDetails: values.requiresNBAStamp
          ? {
              stampNumber: values.stampNumber || "",
              stampValue: values.stampValue || 0,
            }
          : undefined,

        procedureNotes: values.procedureNotes || "",
      };

      await dispatch(
        createGeneralDetails({ matterId, data: formData }),
      ).unwrap();
      message.success("General matter created successfully!");
      navigate(`/dashboard/matters/general/${matterId}/details`);
    } catch (error) {
      console.error("Submission error:", error);
      message.error(
        error?.message || error || "Failed to create general matter",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/matters/general");
  };

  const handleNext = async () => {
    // ✅ FIX: Validate current step fields before moving to next
    let fieldsToValidate = [];

    // ✅ Get current form values to determine conditional validation
    const currentValues = form.getFieldsValue(true);

    switch (currentStep) {
      case 0:
        fieldsToValidate = ["serviceType", "serviceDescription"];
        if (currentValues.serviceType === "other") {
          fieldsToValidate.push("otherServiceType");
        }
        break;
      case 1:
        fieldsToValidate = ["billingType"];
        if (currentValues.billingType === "fixed-fee") {
          fieldsToValidate.push("fixedFeeAmount");
        } else if (currentValues.billingType === "lpro-scale") {
          fieldsToValidate.push("lproScale");
        } else if (currentValues.billingType === "percentage") {
          fieldsToValidate.push("percentageRate", "percentageBaseAmount");
        }
        break;
      case 2:
        // No required fields in step 2
        break;
    }

    try {
      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Please fill in all required fields");
    }
  };

  // ✅ FIX: Watch all form values reactively for preview
  const serviceType = Form.useWatch("serviceType", form);
  const billingType = Form.useWatch("billingType", form);
  const requiresNBAStamp = Form.useWatch("requiresNBAStamp", form);

  const renderStepContent = (step) => {
    // ✅ FIX: Get fresh values each time
    const values = form.getFieldsValue(true);

    switch (step) {
      case 0:
        return (
          <Card>
            <Form.Item
              name="serviceType"
              label="Service Type"
              rules={[
                { required: true, message: "Please select a service type" },
              ]}>
              <Select placeholder="Select service type" size="large">
                {NIGERIAN_GENERAL_SERVICE_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {serviceType === "other" && (
              <Form.Item
                name="otherServiceType"
                label="Specify Other Service Type"
                rules={[
                  {
                    required: true,
                    message: "Please specify the service type",
                  },
                ]}>
                <Input placeholder="Enter service type" size="large" />
              </Form.Item>
            )}

            <Form.Item
              name="serviceDescription"
              label="Service Description"
              rules={[
                {
                  required: true,
                  message: "Please provide a service description",
                },
                {
                  min: 10,
                  message: "Description must be at least 10 characters",
                },
              ]}>
              <TextArea
                rows={4}
                placeholder="Describe the service in detail..."
                maxLength={5000}
                showCount
              />
            </Form.Item>
          </Card>
        );

      case 1:
        return (
          <Card>
            <Form.Item
              name="billingType"
              label="Billing Type"
              rules={[
                { required: true, message: "Please select a billing type" },
              ]}>
              <Select placeholder="Select billing type" size="large">
                {BILLING_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {billingType === "fixed-fee" && (
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="fixedFeeAmount"
                    label="Fixed Fee Amount"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the fee amount",
                      },
                      { type: "number", min: 0, message: "Must be positive" },
                    ]}>
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      prefix="₦"
                      size="large"
                      formatter={(v) =>
                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(v) => v.replace(/₦\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
            )}

            {billingType === "lpro-scale" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="lproScale"
                    label="LPRO Scale"
                    rules={[
                      { required: true, message: "Please select LPRO scale" },
                    ]}>
                    <Select placeholder="Select scale" size="large">
                      {LPRO_SCALES.map((s) => (
                        <Option key={s.value} value={s.value}>
                          {s.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="lproReference" label="LPRO Reference">
                    <Input placeholder="e.g., Item 12(a)" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {billingType === "percentage" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="percentageRate"
                    label="Percentage Rate (%)"
                    rules={[
                      {
                        required: true,
                        message: "Please enter percentage rate",
                      },
                      { type: "number", min: 0, max: 100 },
                    ]}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: "100%" }}
                      size="large"
                      suffix="%"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="percentageBaseAmount"
                    label="Base Amount"
                    rules={[
                      { required: true, message: "Please enter base amount" },
                      { type: "number", min: 0 },
                    ]}>
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      prefix="₦"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Alert
              message="Nigerian Tax Compliance"
              description="VAT and WHT will be applied automatically"
              type="info"
              showIcon
              style={{ marginBottom: 16, marginTop: 16 }}
            />

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="vatRate" label="VAT Rate %" initialValue={7.5}>
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: "100%" }}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="applyVAT"
                  label="Apply VAT"
                  valuePropName="checked"
                  initialValue={true}>
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="whtRate" label="WHT Rate" initialValue={5}>
                  <Select size="large">
                    <Option value={5}>5% (Individual)</Option>
                    <Option value={10}>10% (Corporate)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="applyWHT"
                  label="Apply WHT"
                  valuePropName="checked"
                  initialValue={true}>
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );

      case 2:
        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Title level={5}>Timeline</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="requestDate"
                    label="Request Date"
                    initialValue={dayjs()}>
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="expectedCompletionDate"
                    label="Expected Completion">
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <Title level={5}>Jurisdiction (Nigerian Context)</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="state" label="State">
                    <Select placeholder="Select state" showSearch size="large">
                      {NIGERIAN_STATES.map((s) => (
                        <Option key={s} value={s}>
                          {s}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="lga" label="LGA">
                    <Input placeholder="e.g., Ikeja" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="court" label="Court (if applicable)">
                    <Input placeholder="e.g., Lagos High Court" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card>
              <Title level={5}>NBA Stamp & Notes</Title>
              <Form.Item
                name="requiresNBAStamp"
                label="Requires NBA Stamp"
                valuePropName="checked">
                <Switch />
              </Form.Item>
              {requiresNBAStamp && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="stampNumber" label="Stamp Number">
                      <Input placeholder="NBA stamp number" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="stampValue" label="Stamp Value">
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        prefix="₦"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
              <Form.Item name="procedureNotes" label="Procedure Notes">
                <TextArea
                  rows={4}
                  placeholder="Add notes about procedures, special requirements..."
                  maxLength={5000}
                  showCount
                />
              </Form.Item>
            </Card>
          </div>
        );

      case 3:
        // ✅ FIX: Complete preview with all form values
        return (
          <Card>
            <Alert
              message="Review Before Creating"
              description="Verify all details before submitting"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {/* Service Information */}
            <Card
              type="inner"
              title="Service Information"
              style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Service Type">
                  <Text strong>
                    {NIGERIAN_GENERAL_SERVICE_TYPES.find(
                      (t) => t.value === values.serviceType,
                    )?.label || "Not selected"}
                  </Text>
                </Descriptions.Item>
                {values.serviceType === "other" && values.otherServiceType && (
                  <Descriptions.Item label="Other Service Type">
                    {values.otherServiceType}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Description">
                  {values.serviceDescription || "No description"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Billing Information */}
            <Card
              type="inner"
              title="Billing Information"
              style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Billing Type" span={2}>
                  <Text strong>
                    {BILLING_TYPES.find((t) => t.value === values.billingType)
                      ?.label || "Not selected"}
                  </Text>
                </Descriptions.Item>

                {values.billingType === "fixed-fee" && (
                  <>
                    <Descriptions.Item label="Fee Amount">
                      ₦{values.fixedFeeAmount?.toLocaleString() || "0"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Currency">
                      {values.currency || "NGN"}
                    </Descriptions.Item>
                  </>
                )}

                {values.billingType === "lpro-scale" && (
                  <>
                    <Descriptions.Item label="LPRO Scale">
                      {values.lproScale || "Not selected"}
                    </Descriptions.Item>
                    {values.lproReference && (
                      <Descriptions.Item label="LPRO Reference">
                        {values.lproReference}
                      </Descriptions.Item>
                    )}
                  </>
                )}

                {values.billingType === "percentage" && (
                  <>
                    <Descriptions.Item label="Percentage Rate">
                      {values.percentageRate || 0}%
                    </Descriptions.Item>
                    <Descriptions.Item label="Base Amount">
                      ₦{values.percentageBaseAmount?.toLocaleString() || "0"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Calculated Fee" span={2}>
                      ₦
                      {(
                        ((values.percentageRate || 0) *
                          (values.percentageBaseAmount || 0)) /
                        100
                      ).toLocaleString()}
                    </Descriptions.Item>
                  </>
                )}

                <Descriptions.Item label="VAT">
                  {values.applyVAT
                    ? `${values.vatRate || 7.5}%`
                    : "Not applicable"}
                </Descriptions.Item>
                <Descriptions.Item label="WHT">
                  {values.applyWHT
                    ? `${values.whtRate || 5}%`
                    : "Not applicable"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Timeline & Jurisdiction */}
            <Card
              type="inner"
              title="Timeline & Jurisdiction"
              style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Request Date">
                  {values.requestDate
                    ? dayjs(values.requestDate).format("DD MMM YYYY")
                    : "Not set"}
                </Descriptions.Item>
                {values.expectedCompletionDate && (
                  <Descriptions.Item label="Expected Completion">
                    {dayjs(values.expectedCompletionDate).format("DD MMM YYYY")}
                  </Descriptions.Item>
                )}
                {values.state && (
                  <Descriptions.Item label="State">
                    {values.state}
                  </Descriptions.Item>
                )}
                {values.lga && (
                  <Descriptions.Item label="LGA">
                    {values.lga}
                  </Descriptions.Item>
                )}
                {values.court && (
                  <Descriptions.Item label="Court">
                    {values.court}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* NBA Stamp */}
            {values.requiresNBAStamp && (
              <Card type="inner" title="NBA Stamp Details">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Stamp Number">
                    {values.stampNumber || "Not provided"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Stamp Value">
                    ₦{values.stampValue?.toLocaleString() || "0"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Notes */}
            {values.procedureNotes && (
              <Card type="inner" title="Notes" style={{ marginTop: 16 }}>
                <Text>{values.procedureNotes}</Text>
              </Card>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Button
        type="link"
        onClick={handleCancel}
        style={{ paddingLeft: 0, marginBottom: 16 }}>
        ← Back to General Matters
      </Button>

      <Card>
        <Title level={3}>Create General Matter Details</Title>
        <Text type="secondary">Matter ID: {matterId}</Text>

        <Steps
          current={currentStep}
          style={{ marginTop: 32, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <Step key={i} title={s.title} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={true}
          initialValues={{
            billingType: "fixed-fee",
            vatRate: 7.5,
            applyVAT: true,
            applyWHT: true,
            whtRate: 5,
            currency: "NGN",
            requestDate: dayjs(),
          }}>
          {/* ✅ FIX: Keep all steps mounted but hide inactive ones to preserve values */}
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            {renderStepContent(0)}
          </div>
          <div style={{ display: currentStep === 1 ? "block" : "none" }}>
            {renderStepContent(1)}
          </div>
          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            {renderStepContent(2)}
          </div>
          <div style={{ display: currentStep === 3 ? "block" : "none" }}>
            {renderStepContent(3)}
          </div>

          <div
            style={{
              marginTop: 32,
              display: "flex",
              justifyContent: "space-between",
            }}>
            <Space>
              {currentStep > 0 && (
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  icon={<ArrowLeftOutlined />}
                  size="large">
                  Previous
                </Button>
              )}
              <Button
                onClick={handleCancel}
                icon={<CloseOutlined />}
                size="large">
                Cancel
              </Button>
            </Space>
            <Button
              type="primary"
              onClick={currentStep === 3 ? () => form.submit() : handleNext}
              loading={loading}
              size="large"
              icon={
                currentStep === 3 ? <SaveOutlined /> : <ArrowRightOutlined />
              }>
              {currentStep === 3 ? "Create" : "Next"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateGeneral;
