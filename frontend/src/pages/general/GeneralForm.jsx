import React, { useEffect } from "react";
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
  Space,
  Button,
  message,
  Divider,
} from "antd";
import { SaveOutlined, CloseOutlined, UndoOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import { updateGeneralDetails } from "../../redux/features/general/generalSlice";
import {
  NIGERIAN_GENERAL_SERVICE_TYPES,
  BILLING_TYPES,
  LPRO_SCALES,
  NIGERIAN_STATES,
} from "../../redux/features/general/generalConstants";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const GeneralForm = ({ generalDetails, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    if (generalDetails) {
      form.setFieldsValue({
        serviceType: generalDetails.serviceType,
        otherServiceType: generalDetails.otherServiceType,
        serviceDescription: generalDetails.serviceDescription,

        // Billing
        billingType: generalDetails.billing?.billingType,
        fixedFeeAmount: generalDetails.billing?.fixedFee?.amount,
        currency: generalDetails.billing?.fixedFee?.currency || "NGN",
        lproScale: generalDetails.billing?.lproScale?.scale,
        lproReference: generalDetails.billing?.lproScale?.reference,
        percentageRate: generalDetails.billing?.percentage?.rate,
        percentageBaseAmount: generalDetails.billing?.percentage?.baseAmount,
        vatRate: generalDetails.billing?.vatRate || 7.5,
        applyVAT: generalDetails.billing?.applyVAT !== false,
        applyWHT: generalDetails.billing?.applyWHT !== false,
        whtRate: generalDetails.billing?.whtRate || 5,

        // Timeline
        requestDate: generalDetails.requestDate
          ? dayjs(generalDetails.requestDate)
          : null,
        expectedCompletionDate: generalDetails.expectedCompletionDate
          ? dayjs(generalDetails.expectedCompletionDate)
          : null,

        // Jurisdiction
        state: generalDetails.jurisdiction?.state,
        lga: generalDetails.jurisdiction?.lga,
        court: generalDetails.jurisdiction?.court,

        // NBA Stamp
        requiresNBAStamp: generalDetails.requiresNBAStamp,
        stampNumber: generalDetails.nbaStampDetails?.stampNumber,
        stampValue: generalDetails.nbaStampDetails?.stampValue,

        // Notes
        procedureNotes: generalDetails.procedureNotes,
      });
    }
  }, [generalDetails, form]);

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
                  currency: values.currency,
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
          vatRate: values.vatRate,
          applyVAT: values.applyVAT,
          applyWHT: values.applyWHT,
          whtRate: values.whtRate,
        },

        requestDate: values.requestDate?.toISOString(),
        expectedCompletionDate: values.expectedCompletionDate?.toISOString(),

        jurisdiction: {
          state: values.state,
          lga: values.lga,
          court: values.court,
        },

        requiresNBAStamp: values.requiresNBAStamp,
        nbaStampDetails: values.requiresNBAStamp
          ? {
              stampNumber: values.stampNumber,
              stampValue: values.stampValue,
            }
          : undefined,

        procedureNotes: values.procedureNotes,
      };

      await dispatch(
        updateGeneralDetails({
          matterId: generalDetails.matterId,
          data: formData,
        }),
      ).unwrap();
      message.success("General matter updated successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error || "Failed to update");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}>
        <Title level={4} style={{ margin: 0 }}>
          Edit General Matter
        </Title>
        <Space>
          <Button onClick={() => form.resetFields()} icon={<UndoOutlined />}>
            Reset
          </Button>
          <Button onClick={onCancel} icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Save Changes
          </Button>
        </Space>
      </div>

      <Card title="Service Information" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="otherServiceType"
              label="Other Service Type (if applicable)">
              <Input placeholder="Specify other service type" />
            </Form.Item>
          </Col>
        </Row>

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

      <Card title="Billing (Nigerian Model)" style={{ marginBottom: 24 }}>
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

        {form.getFieldValue("billingType") === "fixed-fee" && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fixedFeeAmount"
                label="Fixed Fee Amount"
                rules={[{ required: true }]}>
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
            <Col span={12}>
              <Form.Item name="currency" label="Currency">
                <Select>
                  <Option value="NGN">NGN</Option>
                  <Option value="USD">USD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {form.getFieldValue("billingType") === "lpro-scale" && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lproScale"
                label="LPRO Scale"
                rules={[{ required: true }]}>
                <Select placeholder="Select LPRO scale">
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

        {form.getFieldValue("billingType") === "percentage" && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="percentageRate"
                label="Percentage Rate (%)"
                rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="percentageBaseAmount"
                label="Base Amount"
                rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} prefix="₦" />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Divider>Nigerian Tax Compliance</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="vatRate" label="VAT Rate %">
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="applyVAT"
              label="Apply VAT"
              valuePropName="checked">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="whtRate" label="WHT Rate">
              <Select>
                <Option value={5}>5% (Individual)</Option>
                <Option value={10}>10% (Corporate)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="applyWHT"
              label="Apply WHT"
              valuePropName="checked">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Timeline & Jurisdiction" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="requestDate" label="Request Date">
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

        <Divider>Jurisdiction (Nigerian Context)</Divider>
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
            <Form.Item name="lga" label="LGA (Local Government)">
              <Input placeholder="e.g., Ikeja" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="court" label="Court (if litigation)">
              <Input placeholder="e.g., Lagos High Court" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="NBA Stamp & Notes" style={{ marginBottom: 24 }}>
        <Form.Item
          name="requiresNBAStamp"
          label="Requires NBA Stamp"
          valuePropName="checked">
          <Select>
            <Option value={true}>Yes</Option>
            <Option value={false}>No</Option>
          </Select>
        </Form.Item>

        {form.getFieldValue("requiresNBAStamp") && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stampNumber" label="Stamp Number">
                <Input placeholder="NBA stamp number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stampValue" label="Stamp Value">
                <InputNumber min={0} style={{ width: "100%" }} prefix="₦" />
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

      <div style={{ textAlign: "right", padding: "24px 0" }}>
        <Space>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<SaveOutlined />}>
            Save Changes
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default GeneralForm;
