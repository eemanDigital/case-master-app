import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  Alert,
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
  Spin,
} from "antd";
import { invoiceOptions } from "../data/options";
import useMattersSelectOptions from "../hooks/useMattersSelectOptions";
import dayjs from "dayjs";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import useHandleSubmit from "../hooks/useHandleSubmit";
import GoBackButton from "../components/GoBackButton";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import {
  InvoiceSummary,
  ServiceBillingCard,
  ExpenseCard,
  nairaFormatter,
  nairaParser,
} from "../components/invoices/ui/invoiceBillingKit";

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

const NON_EDITABLE_STATUSES = ["paid", "cancelled", "void"];

const UpdateInvoice = () => {
  const { mattersOptions, loading: mattersLoading } = useMattersSelectOptions({
    status: "active",
    limit: 100,
  });
  const { clientOptions, loading: clientsLoading } = useClientSelectOptions();
  const { id } = useParams();
  const navigate = useNavigate();
  const { formData, loading: invoiceLoading } = useInitialDataFetcher("invoices", id);
  const { form, onSubmit, loading: loadingState, data } = useHandleSubmit(
    `invoices/${id}`,
    "patch",
  );

  const allDataLoaded =
    !invoiceLoading && !mattersLoading && !clientsLoading && formData;

  const linkType = Form.useWatch("linkType", form) || "matter";
  const discountType = Form.useWatch("discountType", form) || "none";

  useEffect(() => {
    if (data?.success) {
      navigate(`/dashboard/billings/invoices/${id}/details`);
    }
  }, [data, id, navigate]);

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    if (allDataLoaded) {
      const hasMatter = !!formData?.matter;
      const hasOtherActivity = !!formData?.otherActivity;

      const servicesWithDates =
        formData?.services?.map((service) => ({
          ...service,
          date:
            service.date && dayjs(service.date).isValid()
              ? dayjs(service.date)
              : null,
        })) || [];

      const expensesWithDates =
        formData?.expenses?.map((expense) => ({
          ...expense,
          date:
            expense.date && dayjs(expense.date).isValid()
              ? dayjs(expense.date)
              : null,
        })) || [];

      form.setFieldsValue({
        linkType: hasOtherActivity && !hasMatter ? "other" : "matter",
        matter: formData?.matter,
        otherActivity: formData?.otherActivity,
        client: formData?.client,
        title: formData?.title,
        description: formData?.description,
        billingPeriodStart:
          formData?.billingPeriodStart && dayjs(formData.billingPeriodStart).isValid()
            ? dayjs(formData.billingPeriodStart)
            : null,
        billingPeriodEnd:
          formData?.billingPeriodEnd && dayjs(formData.billingPeriodEnd).isValid()
            ? dayjs(formData.billingPeriodEnd)
            : null,
        services: servicesWithDates,
        expenses: expensesWithDates,
        discountType: formData?.discountType || "none",
        discount: formData?.discount,
        discountReason: formData?.discountReason,
        taxRate: formData?.taxRate,
        previousBalance: formData?.previousBalance,
        status: formData?.status,
        dueDate:
          formData?.dueDate && dayjs(formData.dueDate).isValid()
            ? dayjs(formData.dueDate)
            : null,
        paymentTerms: formData?.paymentTerms,
        issueDate:
          formData?.issueDate && dayjs(formData.issueDate).isValid()
            ? dayjs(formData.issueDate)
            : null,
        notes: formData?.notes,
      });
    }
  }, [allDataLoaded, formData, form]);

  if (invoiceLoading || mattersLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading invoice data..." />
      </div>
    );
  }

  const isLocked = NON_EDITABLE_STATUSES.includes(formData?.status);

  return (
    <>
      <GoBackButton />
      <Form className="h-[100%] pt-3" layout="vertical" form={form} name="Invoice Update Form">
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Update Invoice</Typography.Title>
        </Divider>

        {isLocked && (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={`This invoice is ${formData?.status?.replace("_", " ")} and can no longer be edited.`}
            description="Changes are blocked. Record payments or close it out from the invoice details page instead."
          />
        )}

        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="client"
                label="Client"
                rules={[{ required: true, message: "Please select a client" }]}>
                <Select
                  placeholder="Select client"
                  showSearch
                  filterOption={filterOption}
                  options={clientOptions}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="linkType"
                label="Link To"
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
                <Form.Item name="matter" label="Matter">
                  <Select
                    placeholder="Select matter"
                    showSearch
                    filterOption={filterOption}
                    options={mattersOptions}
                    allowClear
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col xs={24} md={12}>
                <Form.Item
                  name="otherActivity"
                  label="Other Activity"
                  rules={[
                    { required: true, message: "Please enter the activity or service name" },
                  ]}>
                  <Input placeholder="e.g., Contract Review, Legal Advisory" />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="Invoice Title"
                rules={[{ required: true, message: "Please enter an invoice title" }]}>
                <Input placeholder="e.g., Legal Consultation & Court Representation" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <TextArea rows={3} placeholder="Detailed description of services rendered..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Billing Period</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="billingPeriodStart" label="Billing Period Start">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="billingPeriodEnd" label="Billing Period End">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Services Rendered</Typography.Title>
        </Divider>
        <Typography.Paragraph type="secondary" className="mb-3">
          Choose how each service is billed.{" "}
          <Text strong>Fixed Fee</Text> uses a single flat price, while{" "}
          <Text strong>Hourly</Text> bills by time — each method shows only the
          fields it needs.
        </Typography.Paragraph>
        <Form.List name="services">
          {(fields, { add, remove }) => (
            <>
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
            </>
          )}
        </Form.List>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Expenses</Typography.Title>
        </Divider>
        <Typography.Paragraph type="secondary" className="mb-3">
          Out-of-pocket costs — mark an expense as{" "}
          <Text strong>Reimbursable</Text> to add it to the client&apos;s total.
        </Typography.Paragraph>
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

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Discount & Tax</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item name="discountType" label="Discount Type">
                <Select
                  options={[
                    { value: "none", label: "No Discount" },
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fixed", label: "Fixed Amount (₦)" },
                  ]}
                />
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
              <Form.Item name="discountReason" label="Discount Reason">
                <Input placeholder="e.g., Professional courtesy" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="taxRate" label="Tax Rate (%)">
                <InputNumber
                  className="w-full"
                  min={0}
                  max={100}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Previous Balance</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="previousBalance" label="Previous Balance (₦)">
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={nairaFormatter}
                  parser={nairaParser}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Payment Information</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Invoice Status">
                <Select
                  placeholder="Select invoice status"
                  showSearch
                  filterOption={filterOption}
                  options={invoiceOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: "Please select a due date" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="paymentTerms" label="Payment Terms">
                <Input placeholder="e.g., Net 30 days, Due upon receipt" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="issueDate" label="Issue Date">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item name="notes" label="Notes">
                <TextArea rows={3} placeholder="Additional notes for the client..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Invoice Summary</Typography.Title>
        </Divider>
        <InvoiceSummary form={form} />

        <Divider />
        <Form.Item>
          <Button
            loading={loadingState}
            onClick={onSubmit}
            className="blue-btn"
            htmlType="submit"
            size="large"
            type="primary"
            disabled={isLocked}>
            Update Invoice
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateInvoice;