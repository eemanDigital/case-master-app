import { useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  TRANSACTION_TYPES,
  COMPANY_TYPES,
  PAYMENT_STRUCTURES,
  CURRENCIES,
  NIGERIAN_STATES,
  DATE_FORMAT,
} from "../../utils/corporateConstants";

const { Option } = Select;
const { TextArea } = Input;

const CorporateForm = ({
  initialValues,
  onSubmit,
  loading = false,
  mode = "create",
}) => {
  const [form] = Form.useForm();
  const [showOtherTransactionType, setShowOtherTransactionType] = useState(
    initialValues?.transactionType === "other",
  );

  // Format initial values for form
  const formattedInitialValues = initialValues
    ? {
        ...initialValues,
        registrationDate: initialValues.registrationDate
          ? dayjs(initialValues.registrationDate)
          : null,
        expectedClosingDate: initialValues.expectedClosingDate
          ? dayjs(initialValues.expectedClosingDate)
          : null,
        actualClosingDate: initialValues.actualClosingDate
          ? dayjs(initialValues.actualClosingDate)
          : null,
        // Due diligence dates
        dueDiligenceStartDate: initialValues.dueDiligence?.startDate
          ? dayjs(initialValues.dueDiligence.startDate)
          : null,
        dueDiligenceCompletionDate: initialValues.dueDiligence?.completionDate
          ? dayjs(initialValues.dueDiligence.completionDate)
          : null,
        // Separate amount and currency
        dealValueAmount: initialValues.dealValue?.amount,
        dealValueCurrency: initialValues.dealValue?.currency || "NGN",
        authorizedShareCapitalAmount:
          initialValues.authorizedShareCapital?.amount,
        authorizedShareCapitalCurrency:
          initialValues.authorizedShareCapital?.currency || "NGN",
        paidUpCapitalAmount: initialValues.paidUpCapital?.amount,
        paidUpCapitalCurrency: initialValues.paidUpCapital?.currency || "NGN",
      }
    : {
        dealValueCurrency: "NGN",
        authorizedShareCapitalCurrency: "NGN",
        paidUpCapitalCurrency: "NGN",
      };

  const handleSubmit = (values) => {
    // Restructure data to match backend schema
    const formattedValues = {
      transactionType: values.transactionType,
      otherTransactionType: values.otherTransactionType,
      companyName: values.companyName,
      registrationNumber: values.registrationNumber,
      companyType: values.companyType,
      registrationDate: values.registrationDate
        ? values.registrationDate.toISOString()
        : null,
      incorporationJurisdiction: values.incorporationJurisdiction,

      // Financial data with currency
      dealValue: {
        amount: values.dealValueAmount || 0,
        currency: values.dealValueCurrency || "NGN",
      },
      authorizedShareCapital: {
        amount: values.authorizedShareCapitalAmount || 0,
        currency: values.authorizedShareCapitalCurrency || "NGN",
      },
      paidUpCapital: {
        amount: values.paidUpCapitalAmount || 0,
        currency: values.paidUpCapitalCurrency || "NGN",
      },

      paymentStructure: values.paymentStructure,
      paymentTerms: values.paymentTerms,
      expectedClosingDate: values.expectedClosingDate
        ? values.expectedClosingDate.toISOString()
        : null,
      actualClosingDate: values.actualClosingDate
        ? values.actualClosingDate.toISOString()
        : null,

      // Due diligence
      dueDiligence: {
        isRequired: values.dueDiligenceRequired !== false,
        startDate: values.dueDiligenceStartDate
          ? values.dueDiligenceStartDate.toISOString()
          : null,
        completionDate: values.dueDiligenceCompletionDate
          ? values.dueDiligenceCompletionDate.toISOString()
          : null,
        status: values.dueDiligenceStatus || "not-started",
        scope: values.dueDiligenceScope,
      },

      // Governance
      governanceStructure: {
        boardSize: values.boardSize,
        boardMeetingFrequency: values.boardMeetingFrequency,
        votingStructure: values.votingStructure,
        specialRights: values.specialRights,
      },
    };

    onSubmit(formattedValues);
  };

  const handleTransactionTypeChange = (value) => {
    setShowOtherTransactionType(value === "other");
    if (value !== "other") {
      form.setFieldValue("otherTransactionType", null);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={formattedInitialValues}
      scrollToFirstError
      className="corporate-form">
      {/* TRANSACTION INFORMATION */}
      <Card title="Transaction Information" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="transactionType"
              label="Transaction Type"
              rules={[
                { required: true, message: "Transaction type is required" },
              ]}>
              <Select
                placeholder="Select transaction type"
                showSearch
                optionFilterProp="children"
                onChange={handleTransactionTypeChange}
                size="large">
                {TRANSACTION_TYPES.map((type) => (
                  <Option key={type.value} value={type.value}>
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {showOtherTransactionType && (
            <Col xs={24} md={12}>
              <Form.Item
                name="otherTransactionType"
                label="Specify Other Transaction Type"
                rules={[
                  {
                    required: true,
                    message: "Please specify the transaction type",
                  },
                ]}>
                <Input placeholder="Enter transaction type" size="large" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Card>

      {/* COMPANY INFORMATION */}
      <Card title="Company Information" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: "Company name is required" }]}>
              <Input placeholder="Enter company name" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="registrationNumber"
              label="CAC Registration Number">
              <Input placeholder="e.g., RC123456" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="companyType" label="Company Type">
              <Select
                placeholder="Select company type"
                showSearch
                optionFilterProp="children"
                size="large">
                {COMPANY_TYPES.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="registrationDate" label="Registration Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select registration date"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="incorporationJurisdiction"
              label="Incorporation Jurisdiction">
              <Select
                placeholder="Select jurisdiction"
                showSearch
                optionFilterProp="children"
                size="large">
                <Option value="Nigeria">Nigeria</Option>
                {NIGERIAN_STATES.map((state) => (
                  <Option key={state.value} value={state.label}>
                    {state.label}
                  </Option>
                ))}
                <Option value="Foreign">Foreign</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* FINANCIAL INFORMATION */}
      <Card title="Financial Information" className="mb-6">
        <Divider orientation="left" plain>
          Deal Value
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="dealValueAmount" label="Amount">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/,/g, "")}
                placeholder="0.00"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="dealValueCurrency" label="Currency">
              <Select size="large">
                {CURRENCIES.map((curr) => (
                  <Option key={curr.value} value={curr.value}>
                    {curr.symbol} {curr.value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Authorized Share Capital
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="authorizedShareCapitalAmount" label="Amount">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/,/g, "")}
                placeholder="0.00"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="authorizedShareCapitalCurrency" label="Currency">
              <Select size="large">
                {CURRENCIES.map((curr) => (
                  <Option key={curr.value} value={curr.value}>
                    {curr.symbol} {curr.value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Paid-Up Capital
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="paidUpCapitalAmount" label="Amount">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/,/g, "")}
                placeholder="0.00"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="paidUpCapitalCurrency" label="Currency">
              <Select size="large">
                {CURRENCIES.map((curr) => (
                  <Option key={curr.value} value={curr.value}>
                    {curr.symbol} {curr.value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Payment Details
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="paymentStructure" label="Payment Structure">
              <Select placeholder="Select payment structure" size="large">
                {PAYMENT_STRUCTURES.map((structure) => (
                  <Option key={structure.value} value={structure.value}>
                    <span className="mr-2">{structure.icon}</span>
                    {structure.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item name="paymentTerms" label="Payment Terms">
              <TextArea
                rows={3}
                placeholder="Describe payment terms and conditions..."
                maxLength={2000}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* TIMELINE */}
      <Card title="Transaction Timeline" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="expectedClosingDate" label="Expected Closing Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select expected closing date"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="actualClosingDate" label="Actual Closing Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select actual closing date"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* DUE DILIGENCE (Optional) */}
      <Card title="Due Diligence (Optional)" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="dueDiligenceRequired"
              label="Due Diligence Required"
              valuePropName="checked">
              <Select size="large" defaultValue={true}>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="dueDiligenceStartDate" label="Start Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="dueDiligenceCompletionDate"
              label="Completion Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="dueDiligenceScope" label="Due Diligence Scope">
              <TextArea
                rows={3}
                placeholder="Describe the scope of due diligence..."
                maxLength={2000}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* GOVERNANCE (Optional) */}
      <Card title="Governance Structure (Optional)" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="boardSize" label="Board Size">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Number of board members"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="boardMeetingFrequency"
              label="Board Meeting Frequency">
              <Input placeholder="e.g., Quarterly, Monthly" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="votingStructure" label="Voting Structure">
              <Input
                placeholder="e.g., Simple Majority, 2/3 Majority"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="specialRights" label="Special Rights">
              <TextArea
                rows={3}
                placeholder="Describe any special voting rights or provisions..."
                maxLength={2000}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* FORM ACTIONS */}
      <div className="flex justify-end gap-4 mt-6">
        <Button size="large" onClick={() => form.resetFields()}>
          Reset
        </Button>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={loading}
          icon={<SaveOutlined />}>
          {mode === "create"
            ? "Create Corporate Details"
            : "Update Corporate Details"}
        </Button>
      </div>
    </Form>
  );
};

export default CorporateForm;
