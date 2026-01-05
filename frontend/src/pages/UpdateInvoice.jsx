import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { DeleteOutlined } from "@ant-design/icons";
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
  Spin,
} from "antd";
import { invoiceOptions } from "../data/options";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import moment from "moment";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import useHandleSubmit from "../hooks/useHandleSubmit";
import GoBackButton from "../components/GoBackButton";

const { TextArea } = Input;

const UpdateInvoice = () => {
  const { casesOptions, loading: casesLoading } = useCaseSelectOptions();
  const { clientOptions, loading: clientsLoading } = useClientSelectOptions();
  const { id } = useParams();

  // for navigation from page to page
  const navigate = useNavigate();
  // update the form
  const {
    formData,
    loading: invoiceLoading,
    data,
  } = useInitialDataFetcher("invoices", id);
  // custom hook to handle form submission
  const {
    form,
    onSubmit,
    loading: loadingState,
  } = useHandleSubmit(`invoices/${id}`, "patch");

  // Check if all data is loaded
  const allDataLoaded =
    !invoiceLoading && !casesLoading && !clientsLoading && formData;

  // filter options for the select field
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // ✅ SET FORM FIELDS AFTER ALL DATA LOADS
  useEffect(() => {
    if (allDataLoaded) {
      console.log("📦 Form Data loaded:", formData);
      console.log("🏷️ Case ID:", formData?.case);
      console.log("👤 Client ID:", formData?.client);

      // Prepare services data with proper date formatting
      const servicesWithDates =
        formData?.services?.map((service) => ({
          ...service,
          date:
            service.date && moment(service.date).isValid()
              ? moment(service.date)
              : null,
        })) || [];

      // Prepare expenses data with proper date formatting
      const expensesWithDates =
        formData?.expenses?.map((expense) => ({
          ...expense,
          date:
            expense.date && moment(expense.date).isValid()
              ? moment(expense.date)
              : null,
        })) || [];

      // Set all form fields
      form.setFieldsValue({
        // Basic Information
        case: formData?.case,
        client: formData?.client,
        title: formData?.title,
        description: formData?.description,

        // Billing Period
        billingPeriodStart:
          formData?.billingPeriodStart &&
          moment(formData.billingPeriodStart).isValid()
            ? moment(formData.billingPeriodStart)
            : null,
        billingPeriodEnd:
          formData?.billingPeriodEnd &&
          moment(formData.billingPeriodEnd).isValid()
            ? moment(formData.billingPeriodEnd)
            : null,

        // Services
        services: servicesWithDates,

        // Expenses
        expenses: expensesWithDates,

        // Discount & Tax
        discountType: formData?.discountType || "none",
        discount: formData?.discount,
        discountReason: formData?.discountReason,
        taxRate: formData?.taxRate,

        // Previous Balance
        previousBalance: formData?.previousBalance,

        // Payment Information
        status: formData?.status,
        dueDate:
          formData?.dueDate && moment(formData.dueDate).isValid()
            ? moment(formData.dueDate)
            : null,
        paymentTerms: formData?.paymentTerms,
        issueDate:
          formData?.issueDate && moment(formData.issueDate).isValid()
            ? moment(formData.issueDate)
            : null,
        notes: formData?.notes,
      });

      console.log("✅ Form fields set successfully");
    }
  }, [allDataLoaded, formData, form]);

  // Navigate if data is available (successful update)
  if (data) {
    return navigate("invoices");
  }

  // Loading state handler
  if (invoiceLoading || casesLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading invoice data..." />
      </div>
    );
  }

  return (
    <>
      <GoBackButton />

      <Form
        className="h-[100%] pt-3"
        layout="vertical"
        form={form}
        name="Invoice Update Form">
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Update Invoice</Typography.Title>
        </Divider>

        {/* Basic Information */}
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="case"
                label="Case"
                // rules={[{ required: true, message: "Please select a case" }]}
              >
                <Select
                  placeholder="Select case"
                  showSearch
                  filterOption={filterOption}
                  options={casesOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
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
            <Col xs={24}>
              <Form.Item
                name="title"
                label="Invoice Title"
                rules={[
                  { required: true, message: "Please enter invoice title" },
                ]}>
                <Input placeholder="e.g., Legal Consultation & Court Representation" />
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
          </Row>
        </Card>

        {/* Billing Period */}
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

        {/* Services Rendered */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Services Rendered</Typography.Title>
        </Divider>

        <div>
          <Form.List name="services">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card
                    size="small"
                    title={`Service ${field.name + 1}`}
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
                          label="Service Description"
                          name={[field.name, "description"]}
                          rules={[
                            {
                              required: true,
                              message: "Service description is required",
                            },
                          ]}>
                          <Input placeholder="e.g., Court Appearance, Document Preparation" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Billing Method"
                          name={[field.name, "billingMethod"]}
                          rules={[
                            {
                              required: true,
                              message: "Billing method is required",
                            },
                          ]}>
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
                      {/* Hourly Billing Fields */}
                      <Col xs={24} md={8}>
                        <Form.Item label="Hours" name={[field.name, "hours"]}>
                          <InputNumber className="w-full" min={0} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Rate (₦)" name={[field.name, "rate"]}>
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

                      {/* Fixed Amount Field */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Fixed Amount (₦)"
                          name={[field.name, "fixedAmount"]}>
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
                      {/* Item-based Billing Fields */}
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Quantity"
                          name={[field.name, "quantity"]}>
                          <InputNumber className="w-full" min={1} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Unit Price (₦)"
                          name={[field.name, "unitPrice"]}>
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
                          name={[field.name, "category"]}>
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
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date of Service"
                          name={[field.name, "date"]}>
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button className="m-3" onClick={() => add()} type="dashed">
                  + Add More Services
                </Button>
              </>
            )}
          </Form.List>
        </div>

        {/* Expenses */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Expenses</Typography.Title>
        </Divider>
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
                          rules={[
                            {
                              required: true,
                              message: "Expense description is required",
                            },
                          ]}>
                          <Input placeholder="e.g., Court Filing Fees, Process Server" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Amount (₦)"
                          name={[field.name, "amount"]}
                          rules={[
                            {
                              required: true,
                              message: "Expense amount is required",
                            },
                          ]}>
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
                          name={[field.name, "category"]}>
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
                          name={[field.name, "receiptNumber"]}>
                          <Input placeholder="e.g., CT-2024-001" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Reimbursable"
                          name={[field.name, "isReimbursable"]}
                          valuePropName="checked">
                          <Switch
                            checkedChildren="Yes"
                            unCheckedChildren="No"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item label="Date" name={[field.name, "date"]}>
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button className="m-3" onClick={() => add()} type="dashed">
                  + Add Expenses
                </Button>
              </div>
            )}
          </Form.List>
        </div>

        {/* Discount & Tax */}
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
                    { value: "percentage", label: "Percentage" },
                    { value: "fixed", label: "Fixed Amount" },
                  ]}
                />
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
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="discountReason" label="Discount Reason">
                <Input placeholder="e.g., Professional courtesy" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="taxRate" label="Tax Rate (%)">
                <InputNumber className="w-full" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Previous Balance */}
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
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Payment Information */}
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
                rules={[{ required: true, message: "Due date is required" }]}>
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
                <TextArea
                  rows={3}
                  placeholder="Additional notes for the client..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />
        <Form.Item>
          <Button
            loading={loadingState}
            onClick={onSubmit}
            className="blue-btn"
            htmlType="submit"
            size="large"
            type="primary">
            Update Invoice
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateInvoice;
