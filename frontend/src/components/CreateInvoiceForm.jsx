import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Form,
  Divider,
  Typography,
  Card,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Segmented,
  Space,
} from "antd";

import useMattersSelectOptions from "../hooks/useMattersSelectOptions";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import notify from "../utils/notify";
import GoBackButton from "./GoBackButton";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import {
  InvoiceSummary,
  ServiceBillingCard,
  ExpenseCard,
  filterMattersByClient,
  nairaFormatter,
  nairaParser,
} from "./invoices/ui/invoiceBillingKit";
import { useDataFetch } from "../hooks/useDataFetch";

const { TextArea } = Input;
const { Text } = Typography;

const newService = () => ({
  description: "",
  billingMethod: "hourly",
  hours: "",
  rate: null,
  fixedAmount: null,
  quantity: 1,
  unitPrice: null,
  date: null,
  category: "other",
});

const newExpense = () => ({
  description: "",
  amount: 0,
  date: null,
  category: "other",
  receiptNumber: "",
  isReimbursable: true,
});

const CreateInvoiceForm = () => {
  const { fetchData } = useDataGetterHook();
  const { mattersOptions, loading: mattersLoading } = useMattersSelectOptions({
    status: "active",
    limit: 100,
  });
  const { data: clientOptions, loading: clientsLoading } = useUserSelectOptions({
    type: "clients",
  });
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const { dataFetcher, loading: submitting } = useDataFetch();

  const linkType = Form.useWatch("linkType", form) || "matter";
  const selectedClient = Form.useWatch("client", form);
  const publishOnSave = Form.useWatch("publishOnSave", form) === "publish";
  const discountType = Form.useWatch("discountType", form) || "none";

  const filteredMatterOptions = useMemo(
    () => filterMattersByClient(mattersOptions, selectedClient),
    [mattersOptions, selectedClient],
  );

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      const finalValues = {
        ...values,
        matter: values.matter || undefined,
        otherActivity: values.otherActivity || undefined,
        status: publishOnSave ? "sent" : "draft",
        issueDate: publishOnSave ? new Date().toISOString() : undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        billingPeriodStart: values.billingPeriodStart
          ? values.billingPeriodStart.toISOString()
          : undefined,
        billingPeriodEnd: values.billingPeriodEnd
          ? values.billingPeriodEnd.toISOString()
          : undefined,
        services: values.services?.map((s) => ({
          ...s,
          hours: s.hours || 0,
          rate: s.rate || 0,
          fixedAmount: s.fixedAmount || 0,
          quantity: s.quantity || 1,
          unitPrice: s.unitPrice || 0,
          date: s.date ? s.date.toISOString() : undefined,
        })),
        expenses: values.expenses?.map((e) => ({
          ...e,
          date: e.date ? e.date.toISOString() : undefined,
        })),
      };

      const response = await dataFetcher("invoices", "post", finalValues);

      if (response?.error) {
        notify.error(response.error);
        return;
      }

      notify.success("Invoice created successfully");
      fetchData("invoices");
      form.resetFields();

      const createdId =
        response?.data?.data?._id ?? response?.data?._id ?? null;
      if (createdId) {
        navigate(`/dashboard/billings/invoices/${createdId}/details`);
      } else {
        navigate("/dashboard/billings/?type=invoice");
      }
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const discountSelectOptions = [
    { value: "none", label: "No Discount" },
    { value: "percentage", label: "Percentage (%)" },
    { value: "fixed", label: "Fixed Amount (₦)" },
  ];

  return (
    <>
      <GoBackButton />
      <Form
        layout="vertical"
        form={form}
        name="invoice form"
        initialValues={{
          linkType: "matter",
          services: [newService()],
          expenses: [newExpense()],
          discountType: "none",
          discount: 0,
          taxRate: 0,
          previousBalance: 0,
          paymentTerms: "Net 30 days",
          publishOnSave: "draft",
        }}>
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Create Invoice</Typography.Title>
        </Divider>

        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="client"
                label="Client"
                rules={[{ required: true, message: "Please select a client" }]}
                tooltip="This is who will be billed">
                <Select
                  placeholder="Select client"
                  showSearch
                  filterOption={filterOption}
                  options={clientOptions}
                  allowClear
                  loading={clientsLoading}
                  onChange={() => form.setFieldsValue({ matter: undefined })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Link To"
                name="linkType"
                tooltip="Link the invoice to a matter, or bill a standalone activity">
                <Select
                  onChange={(value) => {
                    if (value === "matter") {
                      form.setFieldsValue({ otherActivity: "" });
                    } else {
                      form.setFieldsValue({ matter: null });
                    }
                  }}>
                  <Select.Option value="matter">Matter</Select.Option>
                  <Select.Option value="other">Other Activity</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {linkType === "matter" ? (
              <Col xs={24} md={12}>
                <Form.Item
                  label="Select Matter"
                  name="matter"
                  tooltip="Optional — pick the matter this work belongs to">
                  <Select
                    placeholder={
                      selectedClient
                        ? "Select matter (optional)"
                        : "Select a client first"
                    }
                    showSearch
                    filterOption={filterOption}
                    options={filteredMatterOptions}
                    allowClear
                    loading={mattersLoading}
                    disabled={!selectedClient}
                    notFoundContent={
                      selectedClient ? "No active matters for this client" : undefined
                    }
                  />
                </Form.Item>
                {selectedClient && (
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {filteredMatterOptions.length > 0
                      ? `Showing ${filteredMatterOptions.length} active matter(s) for this client.`
                      : "This client has no active matters — save as Other Activity instead."}
                  </Text>
                )}
              </Col>
            ) : (
              <Col xs={24} md={12}>
                <Form.Item
                  label="Other Activity Name"
                  name="otherActivity"
                  rules={[
                    { required: true, message: "Please enter the activity or service name" },
                  ]}
                  tooltip="Name the standalone work being billed (e.g., Contract Review)">
                  <Input placeholder="e.g., Contract Review, Legal Advisory" />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={12}>
              <Form.Item
                label="Invoice Title"
                name="title"
                rules={[{ required: true, message: "Please enter an invoice title" }]}
                tooltip="A short label clients will recognise on this invoice">
                <Input placeholder="e.g., Legal Consultation & Court Representation" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Description"
                name="description"
                tooltip="Optional summary of the work covered by this invoice">
                <TextArea
                  rows={3}
                  placeholder="Detailed description of services rendered..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Billing Period Section */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Billing Period</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Billing Period Start"
                name="billingPeriodStart"
                tooltip="When this billing period begins">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Billing Period End"
                name="billingPeriodEnd"
                tooltip="When this billing period ends">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                The window of work this invoice covers — used for hourly and
                retainer billing.
              </Text>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Services Rendered</Typography.Title>
        </Divider>
        <Typography.Paragraph type="secondary" className="mb-3">
          Add each service on this invoice and choose how it is billed. Choose{" "}
          <Text strong>Fixed Fee</Text> for a single flat price, or{" "}
          <Text strong>Hourly</Text> to bill by time — each method only shows the
          fields it needs.
        </Typography.Paragraph>
        <div>
          <Form.List name="services">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <ServiceBillingCard
                    key={field.key}
                    form={form}
                    field={field}
                    title={`Service ${field.name + 1}`}
                    required
                    onRemove={() => remove(field.name)}
                  />
                ))}
                <Button
                  className="mt-3"
                  type="dashed"
                  onClick={() => add(newService())}>
                  + Add Service
                </Button>
              </div>
            )}
          </Form.List>
        </div>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Expenses</Typography.Title>
        </Divider>
        <Typography.Paragraph type="secondary" className="mb-3">
          Out-of-pocket costs — mark an expense as{" "}
          <Text strong>Reimbursable</Text> to add it to the client&apos;s total.
        </Typography.Paragraph>
        <div>
          <Form.List name="expenses">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <ExpenseCard
                    key={field.key}
                    field={field}
                    title={`Expense ${field.name + 1}`}
                    onRemove={() => remove(field.name)}
                  />
                ))}
                <Button
                  className="mt-3"
                  type="dashed"
                  onClick={() => add(newExpense())}>
                  + Add Expense
                </Button>
              </div>
            )}
          </Form.List>
        </div>

        {/* Discount and Tax Section */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Discount & Tax</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Discount Type"
                name="discountType"
                tooltip="Apply a discount as a rate or as a fixed amount">
                <Select options={discountSelectOptions} />
              </Form.Item>
            </Col>
            {discountType === "percentage" ? (
              <Col xs={24} md={8}>
                <Form.Item label="Discount Rate (%)" name="discount">
                  <InputNumber
                    className="w-full"
                    min={0}
                    max={100}
                    addonAfter="%"
                    placeholder="e.g., 10"
                  />
                </Form.Item>
              </Col>
            ) : discountType === "fixed" ? (
              <Col xs={24} md={8}>
                <Form.Item label="Discount Amount (₦)" name="discount">
                  <InputNumber
                    className="w-full"
                    min={0}
                    formatter={nairaFormatter}
                    parser={nairaParser}
                    placeholder="e.g., 50,000"
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col xs={24} md={8}>
                <Form.Item label="Discount Amount">
                  <InputNumber
                    className="w-full"
                    disabled
                    placeholder="Select a discount type first"
                  />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={8}>
              <Form.Item
                label="Discount Reason"
                name="discountReason"
                tooltip="Visible to the client — e.g., professional courtesy">
                <Input placeholder="e.g., Professional courtesy" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Tax Rate (%)" name="taxRate">
                <InputNumber
                  className="w-full"
                  min={0}
                  max={100}
                  addonAfter="%"
                  placeholder="e.g., 7.5"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Previous Balance Section */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Previous Balance</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Previous Balance (₦)"
                name="previousBalance"
                tooltip="Any outstanding balance carried over from earlier invoices">
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={nairaFormatter}
                  parser={nairaParser}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Payment Terms and Due Date */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Payment Information</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                rules={[{ required: true, message: "Please select a due date" }]}
                label="Due Date"
                name="dueDate"
                tooltip="When payment is expected from the client">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Payment Terms"
                name="paymentTerms"
                tooltip="How long the client has to pay, shown on the invoice">
                <Input placeholder="e.g., Net 30 days, Due upon receipt" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="notes"
                label="Notes"
                tooltip="Visible to the client at the bottom of the invoice">
                <TextArea
                  rows={3}
                  placeholder="Additional notes for the client..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Invoice Summary</Typography.Title>
        </Divider>
        <InvoiceSummary form={form} />
        <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: 8 }}>
          Totals update automatically as you type. If a service has no amount
          yet, it won&apos;t be counted.
        </Text>

        <Divider />

        {/* Publish Option */}
        <Card className="bg-blue-50 border-blue-200">
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text strong>Publishing</Text>
            <Form.Item name="publishOnSave" style={{ marginBottom: 0 }}>
              <Segmented
                options={[
                  { label: "Save as Draft", value: "draft" },
                  { label: "Save & Publish", value: "publish" },
                ]}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {publishOnSave
                ? "Invoice will be marked as 'sent' — ready to share with your client."
                : "Invoice is saved as a 'draft' — you can still edit it before publishing."}
            </Text>
          </Space>
        </Card>

        <Divider />
        <Form.Item style={{ marginBottom: 8 }}>
          <Button
            className="blue-btn"
            onClick={handleFormSubmit}
            loading={submitting}
            htmlType="submit"
            size="large">
            {publishOnSave ? "Save & Publish Invoice" : "Save as Draft"}
          </Button>
        </Form.Item>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          After saving, you&apos;ll be taken to the new invoice where you can
          review, download and edit it.
        </Text>
      </Form>
    </>
  );
};

export default CreateInvoiceForm;