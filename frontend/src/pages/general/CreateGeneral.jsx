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
  message,
  Alert,
  Switch,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
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

const CreateGeneral = ({ visible, onCancel, onSuccess, matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Service Info" },
    { title: "Billing" },
    { title: "Timeline & Jurisdiction" },
    { title: "Review" },
  ];

  const handleSubmit = async (values) => {
    try {
      const formData = {
        serviceType: values.serviceType,
        otherServiceType: values.otherServiceType,
        serviceDescription: values.serviceDescription,

        billing: {
          billingType: values.billingType,
          fixedFee:
            values.billingType === "fixed-fee"
              ? {
                  amount: values.fixedFeeAmount,
                  currency: values.currency || "NGN",
                }
              : undefined,
          lproScale:
            values.billingType === "lpro-scale"
              ? {
                  scale: values.lproScale,
                  reference: values.lproReference,
                }
              : undefined,
          percentage:
            values.billingType === "percentage"
              ? {
                  rate: values.percentageRate,
                  baseAmount: values.percentageBaseAmount,
                  calculatedFee:
                    (values.percentageRate / 100) * values.percentageBaseAmount,
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
          state: values.state,
          lga: values.lga,
          court: values.court,
        },

        requiresNBAStamp: values.requiresNBAStamp || false,
        nbaStampDetails: values.requiresNBAStamp
          ? {
              stampNumber: values.stampNumber,
              stampValue: values.stampValue,
            }
          : undefined,

        procedureNotes: values.procedureNotes,
      };

      await dispatch(
        createGeneralDetails({ matterId, data: formData }),
      ).unwrap();
      message.success("General matter created successfully!");
      onSuccess();
    } catch (error) {
      message.error(error || "Failed to create general matter");
    }
  };

  const renderStepContent = (step) => {
    const values = form.getFieldsValue();

    switch (step) {
      case 0:
        return (
          <Card>
            <Form.Item
              name="serviceType"
              label="Service Type"
              rules={[{ required: true }]}>
              <Select placeholder="Select service type">
                {NIGERIAN_GENERAL_SERVICE_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {values.serviceType === "other" && (
              <Form.Item
                name="otherServiceType"
                label="Specify Other Service Type">
                <Input placeholder="Enter service type" />
              </Form.Item>
            )}

            <Form.Item
              name="serviceDescription"
              label="Service Description"
              rules={[{ required: true }]}>
              <TextArea
                rows={4}
                placeholder="Describe the service..."
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
              rules={[{ required: true }]}>
              <Select placeholder="Select billing type">
                {BILLING_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {values.billingType === "fixed-fee" && (
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="fixedFeeAmount"
                    label="Fixed Fee Amount"
                    rules={[{ required: true, type: "number", min: 0 }]}>
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      prefix="₦"
                      formatter={(v) =>
                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="currency"
                    label="Currency"
                    initialValue="NGN">
                    <Select>
                      <Option value="NGN">NGN</Option>
                      <Option value="USD">USD</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}

            {values.billingType === "lpro-scale" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="lproScale"
                    label="LPRO Scale"
                    rules={[{ required: true }]}>
                    <Select placeholder="Select scale">
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
                    <Input placeholder="e.g., Item 12(a)" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {values.billingType === "percentage" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="percentageRate"
                    label="Percentage Rate (%)"
                    rules={[
                      { required: true, type: "number", min: 0, max: 100 },
                    ]}>
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="percentageBaseAmount"
                    label="Base Amount"
                    rules={[{ required: true, type: "number", min: 0 }]}>
                    <InputNumber min={0} style={{ width: "100%" }} prefix="₦" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Alert
              message="Nigerian Tax Compliance"
              description="VAT and WHT will be applied automatically"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="vatRate" label="VAT Rate %">
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="applyVAT"
                  label="Apply VAT"
                  valuePropName="checked">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="whtRate" label="WHT Rate">
                  <Select>
                    <Option value={5}>5% (Individual)</Option>
                    <Option value={10}>10% (Corporate)</Option>
                  </Select>
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
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="expectedCompletionDate"
                    label="Expected Completion">
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <Title level={5}>Jurisdiction (Nigerian Context)</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="state" label="State">
                    <Select placeholder="Select state" showSearch>
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
                    <Input placeholder="e.g., Ikeja" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="court" label="Court (if applicable)">
                    <Input placeholder="e.g., Lagos High Court" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card>
              <Title level={5}>NBA Stamp</Title>
              <Form.Item
                name="requiresNBAStamp"
                label="Requires NBA Stamp"
                valuePropName="checked">
                <Switch />
              </Form.Item>
              {values.requiresNBAStamp && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="stampNumber" label="Stamp Number">
                      <Input placeholder="NBA stamp number" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="stampValue" label="Stamp Value">
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        prefix="₦"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Card>
          </div>
        );

      case 3:
        return (
          <Card>
            <Alert
              message="Review Before Creating"
              description="Verify all details before submitting"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Text strong>Service Type:</Text>{" "}
            {
              NIGERIAN_GENERAL_SERVICE_TYPES.find(
                (t) => t.value === values.serviceType,
              )?.label
            }
            <br />
            <Text strong>Billing Type:</Text>{" "}
            {BILLING_TYPES.find((t) => t.value === values.billingType)?.label}
            <br />
            {values.billingType === "fixed-fee" && (
              <>
                <Text strong>Fee:</Text> ₦
                {values.fixedFeeAmount?.toLocaleString()} ({values.currency})
                <br />
              </>
            )}
            <Text strong>VAT:</Text>{" "}
            {values.applyVAT ? `${values.vatRate}%` : "No"} |{" "}
            <Text strong>WHT:</Text>{" "}
            {values.applyWHT ? `${values.whtRate}%` : "No"}
            <br />
            {values.state && (
              <>
                <Text strong>Jurisdiction:</Text> {values.state}
                {values.lga ? `, ${values.lga}` : ""}
                <br />
              </>
            )}
            {values.expectedCompletionDate && (
              <>
                <Text strong>Expected Completion:</Text>{" "}
                {dayjs(values.expectedCompletionDate).format("DD MMM YYYY")}
                <br />
              </>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title="Create General Matter"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose>
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map((s, i) => (
          <Step key={i} title={s.title} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={() =>
          currentStep === 3
            ? handleSubmit(form.getFieldsValue())
            : setCurrentStep(currentStep + 1)
        }
        initialValues={{
          billingType: "fixed-fee",
          vatRate: 7.5,
          applyVAT: true,
          applyWHT: true,
          whtRate: 5,
          currency: "NGN",
          requestDate: dayjs(),
        }}>
        {renderStepContent(currentStep)}

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
                icon={<ArrowLeftOutlined />}>
                Previous
              </Button>
            )}
            <Button onClick={onCancel} icon={<CloseOutlined />}>
              Cancel
            </Button>
          </Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={
              currentStep === 3 ? <SaveOutlined /> : <ArrowRightOutlined />
            }>
            {currentStep === 3 ? "Create" : "Next"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateGeneral;
