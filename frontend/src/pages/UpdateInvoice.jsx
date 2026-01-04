// pages/UpdateInvoice.jsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Spin,
  Alert,
  Typography,
  Space,
  Divider,
  message,
  Tag,
} from "antd";
import { EyeOutlined, SaveOutlined } from "@ant-design/icons";
import moment from "moment";

import GoBackButton from "../components/GoBackButton";
import InvoiceServiceFields from "../components/invoice/InvoiceServiceFields";
import InvoiceExpenseFields from "../components/invoice/InvoiceExpenseFields";
import InvoicePreviewModal from "../components/invoice/InvoicePreviewModal";

import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import useHandleSubmit from "../hooks/useHandleSubmit";

import {
  prepareInvoiceDataForSubmit,
  calculateInvoiceTotals,
  formatCurrency,
} from "../utils/invoiceCalculations";

const { TextArea } = Input;
const { Title, Text } = Typography;

const UpdateInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);

  // ✅ FIX: State for totals
  const [totals, setTotals] = useState({
    servicesTotal: 0,
    expensesTotal: 0,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0,
  });

  // Fetch options
  const { casesOptions, loading: casesLoading } = useCaseSelectOptions();
  const { clientOptions, loading: clientsLoading } = useClientSelectOptions();

  // Fetch invoice data
  const { formData: invoiceData, loading: invoiceLoading } =
    useInitialDataFetcher("invoices", id);

  // Submit handler
  const { onSubmit, loading: submitting } = useHandleSubmit(
    `invoices/${id}`,
    "patch"
  );

  const allDataLoaded =
    !invoiceLoading && !casesLoading && !clientsLoading && invoiceData;

  // ✅ FIX: Recalculate function
  const recalculateTotals = () => {
    try {
      const formValues = form.getFieldsValue();
      const newTotals = calculateInvoiceTotals(formValues);
      setTotals(newTotals);
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  // ========================================
  // POPULATE FORM WITH INVOICE DATA
  // ========================================
  useEffect(() => {
    if (allDataLoaded && invoiceData) {
      console.log("📦 Loading invoice data:", invoiceData);

      // Helper to safely convert dates
      const safeDate = (dateValue) => {
        if (!dateValue) return null;
        const momentDate = moment(dateValue);
        return momentDate.isValid() ? momentDate : null;
      };

      // Prepare services with dates
      const services = (invoiceData.services || []).map((service) => ({
        ...service,
        date: safeDate(service.date),
        hours: service.hours || 0,
        rate: service.rate || 0,
        fixedAmount: service.fixedAmount || 0,
        quantity: service.quantity || 1,
        unitPrice: service.unitPrice || 0,
      }));

      // Prepare expenses with dates
      const expenses = (invoiceData.expenses || []).map((expense) => ({
        ...expense,
        date: safeDate(expense.date),
        amount: expense.amount || 0,
        isReimbursable: expense.isReimbursable !== false,
      }));

      // Set all form values
      const formValues = {
        client: invoiceData.client?._id || invoiceData.client,
        case: invoiceData.case?._id || invoiceData.case,
        title: invoiceData.title || "",
        description: invoiceData.description || "",
        billingPeriodStart: safeDate(invoiceData.billingPeriodStart),
        billingPeriodEnd: safeDate(invoiceData.billingPeriodEnd),
        services,
        expenses,
        issueDate: safeDate(invoiceData.issueDate),
        dueDate: safeDate(invoiceData.dueDate),
        discountType: invoiceData.discountType || "none",
        discount: invoiceData.discount || 0,
        discountReason: invoiceData.discountReason || "",
        taxRate: invoiceData.taxRate || 0,
        previousBalance: invoiceData.previousBalance || 0,
        status: invoiceData.status || "draft",
        paymentTerms: invoiceData.paymentTerms || "Net 30 days",
        notes: invoiceData.notes || "",
        internalNotes: invoiceData.internalNotes || "",
      };

      console.log("✅ Setting form values:", formValues);
      form.setFieldsValue(formValues);

      // ✅ FIX: Recalculate after setting values
      setTimeout(() => recalculateTotals(), 100);
    }
  }, [allDataLoaded, invoiceData, form]);

  // ========================================
  // FORM SUBMISSION
  // ========================================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log("📤 Submitting values:", values);

      const preparedData = prepareInvoiceDataForSubmit(values, false);
      await onSubmit(preparedData);

      message.success("Invoice updated successfully!");
      navigate("/dashboard/billings/?type=invoice");
    } catch (error) {
      console.error("❌ Form validation failed:", error);
      message.error("Please check all required fields");
    }
  };

  // ========================================
  // PREVIEW HANDLER
  // ========================================
  const handlePreview = () => {
    recalculateTotals();
    setPreviewVisible(true);
  };

  // ========================================
  // FILTER OPTIONS
  // ========================================
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // ========================================
  // LOADING STATE
  // ========================================
  if (invoiceLoading || casesLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading invoice data..." />
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (!invoiceData) {
    return (
      <div className="p-6">
        <Alert
          message="Invoice Not Found"
          description="The requested invoice could not be loaded."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // ========================================
  // RENDER FORM
  // ========================================
  return (
    <div className="p-4 md:p-6">
      <GoBackButton />

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Title level={3} className="mb-2">
              Update Invoice
            </Title>
            <Space>
              <Text type="secondary">Invoice #{invoiceData.invoiceNumber}</Text>
              <Tag
                color={
                  invoiceData.status === "paid"
                    ? "green"
                    : invoiceData.status === "overdue"
                    ? "red"
                    : invoiceData.status === "draft"
                    ? "default"
                    : "blue"
                }>
                {invoiceData.status?.toUpperCase()}
              </Tag>
              {totals.total > 0 && (
                <Tag color="purple">Total: {formatCurrency(totals.total)}</Tag>
              )}
            </Space>
          </div>
          <Space>
            <Button icon={<EyeOutlined />} onClick={handlePreview}>
              Preview
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={submitting}>
              Save Changes
            </Button>
          </Space>
        </div>
      </div>

      <Form
        layout="vertical"
        form={form}
        onValuesChange={recalculateTotals} // ✅ FIX: Recalculate on change
      >
        {/* Basic Information */}
        <Card title="Basic Information" className="mb-6">
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
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="case" label="Related Case (Optional)">
                <Select
                  placeholder="Select case"
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
                  placeholder="e.g., Legal Consultation & Court Representation"
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <TextArea
                  rows={3}
                  placeholder="Detailed description of services rendered..."
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
                  <Select.Option value="Net 15 days">Net 15 days</Select.Option>
                  <Select.Option value="Net 30 days">Net 30 days</Select.Option>
                  <Select.Option value="Net 60 days">Net 60 days</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Billing Period */}
        <Card title="Billing Period (Optional)" className="mb-6">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="billingPeriodStart" label="Period Start">
                <DatePicker className="w-full" size="large" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="billingPeriodEnd" label="Period End">
                <DatePicker className="w-full" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Services */}
        <Card
          title="Services Rendered"
          className="mb-6"
          extra={
            totals.servicesTotal > 0 && (
              <Tag color="blue">
                Total: {formatCurrency(totals.servicesTotal)}
              </Tag>
            )
          }>
          <InvoiceServiceFields form={form} />
        </Card>

        {/* Expenses */}
        <Card
          title="Expenses"
          className="mb-6"
          extra={
            totals.expensesTotal > 0 && (
              <Tag color="green">
                Total: {formatCurrency(totals.expensesTotal)}
              </Tag>
            )
          }>
          <InvoiceExpenseFields form={form} />
        </Card>

        {/* Financial Details */}
        <Card title="Financial Details" className="mb-6">
          <Row gutter={[24, 16]}>
            <Col xs={24}>
              <Card title="Previous Balance" size="small" className="mb-4">
                <Form.Item
                  name="previousBalance"
                  label="Carry-forward Balance (₦)"
                  tooltip="Outstanding amount from previous invoices">
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
              <Card title="Discount" size="small" className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Form.Item name="discountType" label="Discount Type">
                      <Select size="large">
                        <Select.Option value="none">No Discount</Select.Option>
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
                    <Form.Item name="discount" label="Discount Value">
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
                    <Form.Item name="discountReason" label="Reason (Optional)">
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
                  tooltip="VAT or other applicable taxes">
                  <InputNumber
                    className="w-full"
                    min={0}
                    max={100}
                    size="large"
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* Summary */}
            <Col xs={24}>
              <Card title="Invoice Summary" size="small" className="bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text>Services:</Text>
                    <Text strong>{formatCurrency(totals.servicesTotal)}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Expenses:</Text>
                    <Text strong>{formatCurrency(totals.expensesTotal)}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Previous Balance:</Text>
                    <Text strong>
                      {formatCurrency(
                        form.getFieldValue("previousBalance") || 0
                      )}
                    </Text>
                  </div>
                  <Divider className="my-2" />
                  <div className="flex justify-between">
                    <Text>Subtotal:</Text>
                    <Text strong>{formatCurrency(totals.subtotal)}</Text>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <Text>Discount:</Text>
                      <Text strong>
                        -{formatCurrency(totals.discountAmount)}
                      </Text>
                    </div>
                  )}
                  {totals.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <Text>Tax ({form.getFieldValue("taxRate")}%):</Text>
                      <Text strong>{formatCurrency(totals.taxAmount)}</Text>
                    </div>
                  )}
                  <Divider className="my-2" />
                  <div className="flex justify-between text-lg">
                    <Text strong>Total:</Text>
                    <Text strong className="text-blue-600">
                      {formatCurrency(totals.total)}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Status & Notes */}
        <Card title="Status & Notes" className="mb-6">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Invoice Status">
                <Select size="large">
                  <Select.Option value="draft">Draft</Select.Option>
                  <Select.Option value="sent">Sent</Select.Option>
                  <Select.Option value="paid">Paid</Select.Option>
                  <Select.Option value="partially_paid">
                    Partially Paid
                  </Select.Option>
                  <Select.Option value="overdue">Overdue</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                  <Select.Option value="void">Void</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="issueDate" label="Issue Date">
                <DatePicker className="w-full" size="large" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="notes" label="Notes for Client">
                <TextArea rows={3} placeholder="Additional notes..." />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="internalNotes" label="Internal Notes">
                <TextArea
                  rows={2}
                  placeholder="Internal notes (not visible to client)..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex justify-end gap-3">
            <Button size="large" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button icon={<EyeOutlined />} onClick={handlePreview} size="large">
              Preview
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              size="large">
              Update Invoice
            </Button>
          </div>
        </Card>
      </Form>

      {/* Preview Modal */}
      <InvoicePreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        formValues={form.getFieldsValue()}
        clientOptions={clientOptions}
        casesOptions={casesOptions}
      />
    </div>
  );
};

export default UpdateInvoice;
