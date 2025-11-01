import { useState, useEffect } from "react";
import { DeleteOutlined } from "@ant-design/icons";
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
  Switch,
  Space,
} from "antd";

import { invoiceOptions } from "../data/options";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import { invoiceInitialValue } from "../utils/initialValues";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import useHandleSubmit from "../hooks/useHandleSubmit";
import GoBackButton from "./GoBackButton";
const { TextArea } = Input;

const CreateInvoiceForm = () => {
  const { fetchData } = useDataGetterHook();
  const [formData, setFormData] = useState(invoiceInitialValue);
  const [publishOnSave, setPublishOnSave] = useState(false);
  const { casesOptions } = useCaseSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const navigate = useNavigate();

  const { form, onSubmit, loading, data } = useHandleSubmit("invoices", "post");

  // Filter options in select fields (case options and client options)
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // Navigate to invoices dashboard on success
  useEffect(() => {
    if (data?.message === "success") {
      fetchData("invoices");
      navigate("/dashboard/billings/?type=invoice");
    }
  }, [data, navigate, fetchData]);

  // Handle form submission with publish option
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Set status based on publish option
      const finalValues = {
        ...values,
        status: publishOnSave ? "sent" : "draft", // Changed from "unpaid" to "sent"
        issueDate: publishOnSave ? new Date() : null, // Changed from "issuedDate" to "issueDate"
      };

      await onSubmit(finalValues);
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  // Validation rules
  const requiredRule = [{ required: true, message: "This field is required" }];

  return (
    <>
      <GoBackButton />
      <Form layout="vertical" form={form} name="invoice form">
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Invoice Form</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              {/* Case */}
              <Form.Item name="case" label="Case" initialValue={formData?.case}>
                <Select
                  placeholder="Select case"
                  showSearch
                  filterOption={filterOption}
                  options={casesOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            {/* client field */}
            <Col xs={24} md={12}>
              <Form.Item
                name="client"
                label="Client"
                initialValue={formData?.client}
                rules={requiredRule}>
                <Select
                  placeholder="Select client"
                  showSearch
                  filterOption={filterOption}
                  options={clientOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Invoice Title"
                name="title" // Changed from "workTitle" to "title"
                rules={requiredRule}
                initialValue={formData?.title}>
                <Input placeholder="e.g., Legal Consultation & Court Representation" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Description"
                name="description" // Added description field
                initialValue={formData?.description}>
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
                tooltip="Start date for retainer or hourly billing period">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Billing Period End"
                name="billingPeriodEnd"
                tooltip="End date for retainer or hourly billing period">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Services Rendered</Typography.Title>
        </Divider>
        <div>
          <Form.List name="services">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Card
                    size="small"
                    title={`Service ${field.name + 1}`}
                    key={field.key}
                    extra={
                      <DeleteOutlined
                        className="text-red-700"
                        onClick={() => remove(field.name)}
                      />
                    }>
                    <Row gutter={[16, 16]}>
                      {/* Service Description */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Service Description"
                          rules={requiredRule}
                          name={[field.name, "description"]} // Changed from "serviceDescriptions"
                          initialValue={formData.services.description}>
                          <Input placeholder="e.g., Court Appearance, Document Preparation" />
                        </Form.Item>
                      </Col>

                      {/* Billing Method */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Billing Method"
                          name={[field.name, "billingMethod"]}
                          rules={requiredRule}
                          initialValue="hourly">
                          <Select
                            options={[
                              { value: "hourly", label: "Hourly" },
                              { value: "fixed_fee", label: "Fixed Fee" },
                              { value: "contingency", label: "Contingency" },
                              { value: "retainer", label: "Retainer" },
                              { value: "item", label: "Item-based" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      {/* Hours of Work (for hourly billing) */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Hours"
                          name={[field.name, "hours"]}
                          dependencies={[
                            ["services", field.name, "billingMethod"],
                          ]}
                          initialValue={formData.services.hours}>
                          <InputNumber className="w-full" min={0} />
                        </Form.Item>
                      </Col>

                      {/* Rate (for hourly billing) */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Rate (₦)"
                          name={[field.name, "rate"]}
                          dependencies={[
                            ["services", field.name, "billingMethod"],
                          ]}
                          initialValue={formData.services.rate}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>

                      {/* Fixed Amount (for fixed_fee/retainer billing) */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Fixed Amount (₦)"
                          name={[field.name, "fixedAmount"]}
                          dependencies={[
                            ["services", field.name, "billingMethod"],
                          ]}
                          initialValue={formData.services.fixedAmount}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      {/* Quantity (for item-based billing) */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Quantity"
                          name={[field.name, "quantity"]}
                          dependencies={[
                            ["services", field.name, "billingMethod"],
                          ]}
                          initialValue={1}>
                          <InputNumber className="w-full" min={1} />
                        </Form.Item>
                      </Col>

                      {/* Unit Price (for item-based billing) */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Unit Price (₦)"
                          name={[field.name, "unitPrice"]}
                          dependencies={[
                            ["services", field.name, "billingMethod"],
                          ]}
                          initialValue={formData.services.unitPrice}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>

                      {/* Category */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Category"
                          name={[field.name, "category"]}
                          initialValue="other">
                          <Select
                            options={[
                              { value: "consultation", label: "Consultation" },
                              {
                                value: "court_appearance",
                                label: "Court Appearance",
                              },
                              {
                                value: "document_preparation",
                                label: "Document Preparation",
                              },
                              { value: "research", label: "Research" },
                              { value: "negotiation", label: "Negotiation" },
                              { value: "filing", label: "Filing" },
                              { value: "other", label: "Other" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      {/* Date of Service */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date of Service"
                          name={[field.name, "date"]}
                          initialValue={formData.services.date}>
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button className="m-3" onClick={() => add()}>
                  + Add More Services
                </Button>
              </div>
            )}
          </Form.List>
        </div>

        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Expenses</Typography.Title>
        </Divider>

        {/* Expenses field */}
        <div>
          <Form.List name="expenses">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Card
                    size="small"
                    title={`Expense ${field.name + 1}`}
                    key={field.key}
                    extra={
                      <DeleteOutlined
                        className="text-red-700"
                        onClick={() => {
                          remove(field.name);
                        }}
                      />
                    }>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Expense Description"
                          name={[field.name, "description"]}
                          rules={requiredRule}
                          initialValue={formData.expenses.description}>
                          <Input placeholder="e.g., Court Filing Fees, Process Server" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Amount (₦)"
                          name={[field.name, "amount"]}
                          rules={requiredRule}
                          initialValue={formData.expenses.amount}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Category"
                          name={[field.name, "category"]}
                          initialValue="other">
                          <Select
                            options={[
                              { value: "court_fees", label: "Court Fees" },
                              { value: "filing_fees", label: "Filing Fees" },
                              { value: "travel", label: "Travel" },
                              {
                                value: "accommodation",
                                label: "Accommodation",
                              },
                              {
                                value: "expert_witness",
                                label: "Expert Witness",
                              },
                              {
                                value: "process_server",
                                label: "Process Server",
                              },
                              { value: "printing", label: "Printing" },
                              { value: "other", label: "Other" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Receipt Number"
                          name={[field.name, "receiptNumber"]}
                          initialValue={formData.expenses.receiptNumber}>
                          <Input placeholder="e.g., CT-2024-001" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Reimbursable"
                          name={[field.name, "isReimbursable"]}
                          valuePropName="checked"
                          initialValue={true}>
                          <Switch
                            checkedChildren="Yes"
                            unCheckedChildren="No"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date"
                          name={[field.name, "date"]}
                          initialValue={formData.expenses.date}>
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button className="m-3" onClick={() => add()}>
                  + Add Expenses
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
                initialValue="none">
                <Select
                  options={[
                    { value: "none", label: "No Discount" },
                    { value: "percentage", label: "Percentage" },
                    { value: "fixed", label: "Fixed Amount" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Discount Amount"
                name="discount"
                dependencies={["discountType"]}
                initialValue={0}>
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Discount Reason"
                name="discountReason"
                initialValue={formData?.discountReason}>
                <Input placeholder="e.g., Professional courtesy" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Tax Rate (%)" name="taxRate" initialValue={0}>
                <InputNumber className="w-full" min={0} max={100} />
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
                initialValue={0}
                tooltip="Any outstanding balance from previous invoices">
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
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
                rules={requiredRule}
                label="Due Date"
                name="dueDate"
                initialValue={formData?.dueDate}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Payment Terms"
                name="paymentTerms"
                initialValue="Net 30 days">
                <Input placeholder="e.g., Net 30 days, Due upon receipt" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="notes"
                label="Notes"
                initialValue={formData?.notes}>
                <TextArea
                  rows={3}
                  placeholder="Additional notes for the client..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* Publish Option */}
        <Card className="bg-blue-50 border-blue-200">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Space direction="vertical" size="small">
                <Typography.Text strong>Invoice Publishing</Typography.Text>
                <Form.Item
                  name="publishOnSave"
                  valuePropName="checked"
                  initialValue={false}
                  style={{ marginBottom: 0 }}>
                  <Switch
                    checked={publishOnSave}
                    onChange={setPublishOnSave}
                    checkedChildren="Publish Now"
                    unCheckedChildren="Save as Draft"
                  />
                </Form.Item>
                <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                  {publishOnSave
                    ? "Invoice will be marked as 'sent' and ready to send to client"
                    : "Invoice will be saved as 'draft' and can be edited later"}
                </Typography.Text>
              </Space>
            </Col>
          </Row>
        </Card>

        <Divider />
        <Form.Item>
          <Button
            className="blue-btn"
            onClick={handleFormSubmit}
            loading={loading}
            htmlType="submit"
            size="large">
            {publishOnSave ? "Save & Publish Invoice" : "Save as Draft"}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CreateInvoiceForm;
