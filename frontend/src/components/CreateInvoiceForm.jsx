// pages/CreateInvoiceForm.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Form,
  Typography,
  Card,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Switch,
  Space,
  Steps,
  Alert,
  Tag,
  Divider,
  message,
} from "antd";
import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";

import GoBackButton from "../components/GoBackButton";
import InvoiceServiceFields from "../components/invoice/InvoiceServiceFields";
import InvoiceExpenseFields from "../components/invoice/InvoiceExpenseFields";
import InvoicePreviewModal from "../components/invoice/InvoicePreviewModal";

import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import useHandleSubmit from "../hooks/useHandleSubmit";

import {
  calculateInvoiceTotals,
  formatCurrency,
  prepareInvoiceDataForSubmit,
  validateInvoiceData,
} from "../utils/invoiceCalculations";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const CreateInvoiceForm = () => {
  const { fetchData } = useDataGetterHook();
  const [form] = Form.useForm();
  const [publishOnSave, setPublishOnSave] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const recalculationTimeout = useRef(null);

  // State for totals
  const [totals, setTotals] = useState({
    servicesWithAmounts: [],
    servicesTotal: 0,
    expensesTotal: 0,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0,
  });

  // State for current form values (for preview)
  const [currentFormValues, setCurrentFormValues] = useState({});

  const { casesOptions } = useCaseSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const navigate = useNavigate();

  const { onSubmit, loading, data } = useHandleSubmit("invoices", "post");

  // ========================================
  // ✅ FIX: DEBOUNCED RECALCULATION
  // ========================================
  const recalculateTotals = useCallback(() => {
    try {
      const formValues = form.getFieldsValue();
      setCurrentFormValues(formValues); // Update current values for preview

      const newTotals = calculateInvoiceTotals(formValues);
      setTotals(newTotals);

      // Validate form
      const validation = validateInvoiceData(formValues);
      setIsFormValid(validation.isValid);
    } catch (error) {
      console.error("Calculation error:", error);
      setTotals({
        servicesWithAmounts: [],
        servicesTotal: 0,
        expensesTotal: 0,
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: 0,
      });
    }
  }, [form]);

  // ========================================
  // ✅ FIX: FORM CHANGE HANDLER WITH DEBOUNCING
  // ========================================
  const handleFormValuesChange = useCallback(
    (changedValues, allValues) => {
      // Clear any existing timeout
      if (recalculationTimeout.current) {
        clearTimeout(recalculationTimeout.current);
      }

      // Debounce the recalculation to avoid excessive re-renders
      recalculationTimeout.current = setTimeout(() => {
        recalculateTotals();
      }, 300);
    },
    [recalculateTotals]
  );

  // ========================================
  // INITIALIZATION
  // ========================================
  useEffect(() => {
    // Set initial form values
    form.setFieldsValue({
      services: [
        {
          description: "",
          billingMethod: "hourly",
          hours: 0,
          rate: 0,
          category: "other",
        },
      ],
      expenses: [],
      discountType: "none",
      discount: 0,
      taxRate: 0,
      previousBalance: 0,
      paymentTerms: "Net 30 days",
    });

    // Initial calculation
    recalculateTotals();

    // Cleanup timeout on unmount
    return () => {
      if (recalculationTimeout.current) {
        clearTimeout(recalculationTimeout.current);
      }
    };
  }, [form, recalculateTotals]);

  // ========================================
  // NAVIGATION ON SUCCESS
  // ========================================
  useEffect(() => {
    if (data?.message === "success") {
      message.success("Invoice created successfully!");
      fetchData("invoices");
      navigate("/dashboard/billings/?type=invoice");
    }
  }, [data, navigate, fetchData]);

  // ========================================
  // FORM SUBMISSION
  // ========================================
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate invoice data
      const validation = validateInvoiceData(values);
      if (!validation.isValid) {
        message.error(validation.errors[0]);
        return;
      }

      // Prepare data for submission
      const preparedData = prepareInvoiceDataForSubmit(values, publishOnSave);

      await onSubmit(preparedData);
    } catch (error) {
      console.error("Form validation failed:", error);
      message.error("Please check all required fields");
    }
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const showPreviewModal = () => {
    // Validate and update before showing preview
    form
      .validateFields()
      .then(() => {
        recalculateTotals();
        setPreviewModalVisible(true);
      })
      .catch(() => {
        message.error("Please fix validation errors before preview");
      });
  };

  // ========================================
  // STEPS CONFIGURATION
  // ========================================
  const steps = [
    {
      title: "Basic Info",
      description: "Client & Case Details",
    },
    {
      title: "Services",
      description: "Add Services Rendered",
    },
    {
      title: "Expenses",
      description: "Add Related Expenses",
    },
    {
      title: "Financial",
      description: "Discounts, Tax & Terms",
    },
    {
      title: "Review",
      description: "Preview & Submit",
    },
  ];

  // ========================================
  // RENDER FUNCTIONS
  // ========================================

  // Render Services Summary
  const renderServicesSummary = () => {
    if (totals.servicesWithAmounts.length === 0) return null;

    return (
      <Card title="Services Summary" size="small" className="mt-6 bg-blue-50">
        <div className="space-y-2">
          {totals.servicesWithAmounts.map(
            (service, index) =>
              service &&
              service.description && (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-blue-100">
                  <div className="flex-1">
                    <Text strong>{service.description}</Text>
                    <div className="text-xs text-gray-500 capitalize">
                      {service.billingMethod?.replace("_", " ")} •{" "}
                      {service.category?.replace("_", " ")}
                    </div>
                  </div>
                  <Text strong className="text-blue-600">
                    {formatCurrency(service.amount)}
                  </Text>
                </div>
              )
          )}
          <div className="flex justify-between items-center pt-2 font-bold">
            <Text>Total Services:</Text>
            <Text className="text-blue-700 text-lg">
              {formatCurrency(totals.servicesTotal)}
            </Text>
          </div>
        </div>
      </Card>
    );
  };

  // Render Expenses Summary
  const renderExpensesSummary = () => {
    const expenses = currentFormValues.expenses || [];
    if (expenses.length === 0 || totals.expensesTotal === 0) return null;

    return (
      <Card title="Expenses Summary" size="small" className="mt-6 bg-green-50">
        <div className="space-y-2">
          {expenses.map(
            (expense, index) =>
              expense &&
              expense.description && (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-green-100">
                  <div className="flex-1">
                    <Text strong>{expense.description}</Text>
                    <div className="text-xs text-gray-500 capitalize">
                      {expense.category?.replace("_", " ")}
                      {expense.receiptNumber &&
                        ` • Receipt: ${expense.receiptNumber}`}
                    </div>
                  </div>
                  <Text strong className="text-green-600">
                    {formatCurrency(expense.amount)}
                  </Text>
                </div>
              )
          )}
          <div className="flex justify-between items-center pt-2 font-bold">
            <Text>Total Expenses:</Text>
            <Text className="text-green-700 text-lg">
              {formatCurrency(totals.expensesTotal)}
            </Text>
          </div>
        </div>
      </Card>
    );
  };

  // Render Financial Summary
  const renderFinancialSummary = () => (
    <Card title="Invoice Summary" size="small" className="bg-gray-50">
      <div className="space-y-3">
        {totals.servicesTotal > 0 && (
          <div className="flex justify-between">
            <span>Services Total:</span>
            <span className="font-semibold">
              {formatCurrency(totals.servicesTotal)}
            </span>
          </div>
        )}

        {totals.expensesTotal > 0 && (
          <div className="flex justify-between">
            <span>Expenses Total:</span>
            <span className="font-semibold">
              {formatCurrency(totals.expensesTotal)}
            </span>
          </div>
        )}

        {currentFormValues.previousBalance > 0 && (
          <div className="flex justify-between">
            <span>Previous Balance:</span>
            <span className="font-semibold">
              {formatCurrency(currentFormValues.previousBalance)}
            </span>
          </div>
        )}

        <Divider className="my-2" />

        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-semibold">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>

        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span className="font-semibold">
              -{formatCurrency(totals.discountAmount)}
            </span>
          </div>
        )}

        {totals.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({currentFormValues.taxRate || 0}%):</span>
            <span className="font-semibold">
              {formatCurrency(totals.taxAmount)}
            </span>
          </div>
        )}

        <Divider className="my-2" />

        <div className="flex justify-between text-lg font-bold">
          <span>Invoice Total:</span>
          <span className="text-blue-600">{formatCurrency(totals.total)}</span>
        </div>
      </div>
    </Card>
  );

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <>
      <GoBackButton />

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Title level={3} className="mb-2">
              Create New Invoice
            </Title>
            <Paragraph type="secondary">
              Fill in the details below to create a professional invoice. You
              can save as draft or publish immediately.
            </Paragraph>
          </div>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={showPreviewModal}
            disabled={!isFormValid}>
            Preview Invoice
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="mb-6">
        <Steps current={currentStep} onChange={setCurrentStep}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
            />
          ))}
        </Steps>
      </Card>

      <Form
        layout="vertical"
        form={form}
        name="invoice-form"
        onValuesChange={handleFormValuesChange}
        initialValues={{
          services: [
            {
              description: "",
              billingMethod: "hourly",
              hours: 0,
              rate: 0,
              category: "other",
            },
          ],
          expenses: [],
          discountType: "none",
          discount: 0,
          taxRate: 0,
          previousBalance: 0,
          paymentTerms: "Net 30 days",
        }}>
        {/* ======================================== */}
        {/* STEP 1: BASIC INFORMATION */}
        {/* ======================================== */}
        {currentStep === 0 && (
          <Card
            title="Basic Information"
            extra={<Text type="secondary">Step 1 of 5</Text>}
            className="mb-6">
            <Alert
              message="Start with the basic details"
              description="Select the client and case (if applicable) for this invoice."
              type="info"
              showIcon
              className="mb-4"
            />

            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="client"
                  label="Client"
                  rules={[{ required: true, message: "Client is required" }]}>
                  <Select
                    placeholder="Select client"
                    showSearch
                    filterOption={filterOption}
                    options={clientOptions}
                    allowClear
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="case" label="Related Case (Optional)">
                  <Select
                    placeholder="Select case (optional)"
                    showSearch
                    filterOption={filterOption}
                    options={casesOptions}
                    allowClear
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="title"
                  label="Invoice Title"
                  rules={[{ required: true, message: "Title is required" }]}>
                  <Input
                    placeholder="e.g., Legal Consultation & Court Representation for Q1 2024"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item name="description" label="Description (Optional)">
                  <TextArea
                    rows={3}
                    placeholder="Provide detailed description of the services rendered..."
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="dueDate"
                  label="Due Date"
                  rules={[{ required: true, message: "Due date is required" }]}>
                  <DatePicker
                    className="w-full"
                    size="large"
                    format="MMMM DD, YYYY"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="paymentTerms" label="Payment Terms">
                  <Select size="large">
                    <Select.Option value="Due upon receipt">
                      Due upon receipt
                    </Select.Option>
                    <Select.Option value="Net 7 days">Net 7 days</Select.Option>
                    <Select.Option value="Net 15 days">
                      Net 15 days
                    </Select.Option>
                    <Select.Option value="Net 30 days">
                      Net 30 days
                    </Select.Option>
                    <Select.Option value="Net 60 days">
                      Net 60 days
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="text-right mt-6">
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  form
                    .validateFields(["client", "title", "dueDate"])
                    .then(() => setCurrentStep(1))
                    .catch(() => message.error("Please fill required fields"));
                }}>
                Next: Add Services
              </Button>
            </div>
          </Card>
        )}

        {/* ======================================== */}
        {/* STEP 2: SERVICES */}
        {/* ======================================== */}
        {currentStep === 1 && (
          <Card
            title="Services Rendered"
            extra={
              <Space>
                <Text type="secondary">Step 2 of 5</Text>
                {totals.servicesTotal > 0 && (
                  <Tag color="blue">
                    Total: {formatCurrency(totals.servicesTotal)}
                  </Tag>
                )}
              </Space>
            }
            className="mb-6">
            <Alert
              message="Add legal services provided"
              description="Each service can have different billing methods (hourly, fixed fee, etc.)"
              type="info"
              showIcon
              className="mb-4"
            />

            <InvoiceServiceFields form={form} />

            {renderServicesSummary()}

            <div className="flex justify-between mt-6">
              <Button size="large" onClick={() => setCurrentStep(0)}>
                ← Back
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  // Check if at least one service has a description
                  const services = form.getFieldValue("services") || [];
                  const hasValidService = services.some(
                    (service) => service && service.description
                  );

                  if (hasValidService) {
                    setCurrentStep(2);
                  } else {
                    message.warning(
                      "Please add at least one service before proceeding"
                    );
                  }
                }}>
                Next: Add Expenses
              </Button>
            </div>
          </Card>
        )}

        {/* ======================================== */}
        {/* STEP 3: EXPENSES */}
        {/* ======================================== */}
        {currentStep === 2 && (
          <Card
            title="Related Expenses"
            extra={
              <Space>
                <Text type="secondary">Step 3 of 5</Text>
                {totals.expensesTotal > 0 && (
                  <Tag color="green">
                    Total: {formatCurrency(totals.expensesTotal)}
                  </Tag>
                )}
              </Space>
            }
            className="mb-6">
            <Alert
              message="Add reimbursable expenses (Optional)"
              description="Include court fees, filing fees, travel, and other expenses incurred"
              type="info"
              showIcon
              className="mb-4"
            />

            <InvoiceExpenseFields form={form} />

            {renderExpensesSummary()}

            <div className="flex justify-between mt-6">
              <Button size="large" onClick={() => setCurrentStep(1)}>
                ← Back to Services
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => setCurrentStep(3)}>
                Next: Financial Details
              </Button>
            </div>
          </Card>
        )}

        {/* ======================================== */}
        {/* STEP 4: FINANCIAL DETAILS */}
        {/* ======================================== */}
        {currentStep === 3 && (
          <Card
            title="Financial Details"
            extra={
              <Space>
                <Text type="secondary">Step 4 of 5</Text>
                <Tag color="purple">Total: {formatCurrency(totals.total)}</Tag>
              </Space>
            }
            className="mb-6">
            <Alert
              message="Adjust final amounts"
              description="Apply discounts, taxes, and previous balances as needed"
              type="info"
              showIcon
              className="mb-4"
            />

            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Card title="Previous Balance" size="small" className="mb-4">
                  <Form.Item
                    name="previousBalance"
                    label="Carry-forward Balance (₦)"
                    tooltip="Any outstanding amount from previous invoices">
                    <InputNumber
                      className="w-full"
                      min={0}
                      formatter={(value) =>
                        `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                      size="large"
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24}>
                <Card title="Discounts" size="small" className="mb-4">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Form.Item name="discountType" label="Discount Type">
                        <Select size="large">
                          <Select.Option value="none">
                            No Discount
                          </Select.Option>
                          <Select.Option value="percentage">
                            Percentage %
                          </Select.Option>
                          <Select.Option value="fixed">
                            Fixed Amount
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="discount" label="Discount Amount">
                        <InputNumber
                          className="w-full"
                          min={0}
                          formatter={(value) =>
                            `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="discountReason" label="Discount Reason">
                        <Input
                          placeholder="e.g., Professional courtesy"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24}>
                <Card title="Tax" size="small" className="mb-4">
                  <Form.Item
                    name="taxRate"
                    label="Tax Rate (%)"
                    tooltip="Value Added Tax (VAT) or other applicable taxes">
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={100}
                      size="large"
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24}>{renderFinancialSummary()}</Col>
            </Row>

            <div className="flex justify-between mt-6">
              <Button size="large" onClick={() => setCurrentStep(2)}>
                ← Back to Expenses
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => setCurrentStep(4)}>
                Next: Review & Submit
              </Button>
            </div>
          </Card>
        )}

        {/* ======================================== */}
        {/* STEP 5: REVIEW & SUBMIT */}
        {/* ======================================== */}
        {currentStep === 4 && (
          <Card
            title="Review & Submit"
            extra={<Text type="secondary">Step 5 of 5</Text>}
            className="mb-6">
            <Alert
              message="Review your invoice before submission"
              description="Check all details and choose whether to save as draft or publish immediately"
              type="warning"
              showIcon
              className="mb-6"
            />

            <Row gutter={[24, 24]}>
              {/* Summary Cards */}
              <Col xs={24} md={12}>
                <Card title="Invoice Summary" size="small">
                  <div className="space-y-3">
                    <div>
                      <Text strong>Client:</Text>
                      <div className="text-gray-600">
                        {clientOptions.find(
                          (c) => c.value === currentFormValues.client
                        )?.label || "Not selected"}
                      </div>
                    </div>
                    <div>
                      <Text strong>Case:</Text>
                      <div className="text-gray-600">
                        {currentFormValues.case
                          ? casesOptions.find(
                              (c) => c.value === currentFormValues.case
                            )?.label
                          : "Not linked to case"}
                      </div>
                    </div>
                    <div>
                      <Text strong>Title:</Text>
                      <div className="text-gray-600">
                        {currentFormValues.title || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <Text strong>Due Date:</Text>
                      <div className="text-gray-600">
                        {currentFormValues.dueDate?.format?.("MMMM DD, YYYY") ||
                          "Not set"}
                      </div>
                    </div>
                    <div>
                      <Text strong>Payment Terms:</Text>
                      <div className="text-gray-600">
                        {currentFormValues.paymentTerms || "Net 30 days"}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                {renderFinancialSummary()}
              </Col>

              {/* Publishing Options */}
              <Col xs={24}>
                <Card
                  title="Publishing Options"
                  size="small"
                  className="bg-blue-50 border-blue-200">
                  <Space direction="vertical" size="middle" className="w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text strong>Invoice Status</Text>
                        <div className="text-gray-600 text-sm">
                          {publishOnSave
                            ? "Invoice will be sent to client immediately"
                            : "Invoice will be saved as draft for later editing"}
                        </div>
                      </div>
                      <Switch
                        checked={publishOnSave}
                        onChange={setPublishOnSave}
                        checkedChildren="Publish Now"
                        unCheckedChildren="Save as Draft"
                        size="large"
                      />
                    </div>

                    {publishOnSave && (
                      <Alert
                        message="Publishing Invoice"
                        description="The invoice will be marked as 'sent' and the issue date will be set to today. You can still edit it later if needed."
                        type="success"
                        showIcon
                      />
                    )}
                  </Space>
                </Card>
              </Col>

              <Col xs={24}>
                <Form.Item name="notes" label="Additional Notes for Client">
                  <TextArea
                    rows={3}
                    placeholder="Add any additional notes or instructions for the client..."
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-between mt-6">
              <Button size="large" onClick={() => setCurrentStep(3)}>
                ← Back to Financial Details
              </Button>
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={showPreviewModal}
                  size="large">
                  Preview
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleFormSubmit}
                  loading={loading}
                  disabled={!isFormValid}
                  icon={<CheckCircleOutlined />}>
                  {publishOnSave ? "Publish Invoice" : "Save as Draft"}
                </Button>
              </Space>
            </div>
          </Card>
        )}
      </Form>

      {/* Preview Modal */}
      <InvoicePreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        formValues={currentFormValues} // ✅ Use currentFormValues instead of form.getFieldsValue()
        clientOptions={clientOptions}
        casesOptions={casesOptions}
      />

      {/* Bottom Navigation */}
      <Card className="sticky bottom-0 z-10 shadow-lg mt-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Text type="secondary">
                Step {currentStep + 1} of {steps.length}
              </Text>
              {totals.total > 0 && (
                <Tag color="blue" className="text-base px-3 py-1">
                  Total: {formatCurrency(totals.total)}
                </Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous Step
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(currentStep + 1)}>
                  Next Step
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default CreateInvoiceForm;
