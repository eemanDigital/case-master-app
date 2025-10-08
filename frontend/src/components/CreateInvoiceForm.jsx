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
        status: publishOnSave ? "unpaid" : "draft",
        issuedDate: publishOnSave ? new Date() : null,
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
                label="Work Title"
                name="workTitle"
                rules={requiredRule}
                initialValue={formData?.workTitle}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" orientationMargin="0">
          {/* Services Rendered fields */}
          <Typography.Title level={4}>Services Rendered</Typography.Title>
        </Divider>
        <div>
          <Form.List name="services" rules={requiredRule}>
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
                      {/* Service Descriptions */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Service Descriptions"
                          rules={requiredRule}
                          name={[field.name, "serviceDescriptions"]}
                          initialValue={formData.services.serviceDescriptions}>
                          <Input />
                        </Form.Item>
                      </Col>

                      {/* Hours of Work */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Hours of Work"
                          name={[field.name, "hours"]}
                          initialValue={formData.services.hours}>
                          <InputNumber className="w-full" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      {/* Fee Rate Per Hour */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Fee Rate Per Hour"
                          name={[field.name, "feeRatePerHour"]}
                          dependencies={[[field.name, "hours"]]}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const hours = getFieldValue([
                                  field.name,
                                  "hours",
                                ]);
                                if (hours && !value) {
                                  return Promise.reject(
                                    new Error(
                                      "Please enter a fee rate per hour"
                                    )
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                          initialValue={formData.services.feeRatePerHour}>
                          <InputNumber
                            className="w-full"
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>

                      {/* Amount Charged */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Amount Charged"
                          name={[field.name, "amount"]}
                          dependencies={[
                            [field.name, "hours"],
                            [field.name, "feeRatePerHour"],
                          ]}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const hours = getFieldValue([
                                  field.name,
                                  "hours",
                                ]);
                                const feeRatePerHour = getFieldValue([
                                  field.name,
                                  "feeRatePerHour",
                                ]);

                                if (hours && feeRatePerHour && value) {
                                  return Promise.reject(
                                    new Error(
                                      "You can only fill in two of the three fields."
                                    )
                                  );
                                }

                                if ((!hours || !feeRatePerHour) && !value) {
                                  return Promise.reject(
                                    new Error("Please enter the amount charged")
                                  );
                                }

                                return Promise.resolve();
                              },
                            }),
                          ]}
                          initialValue={formData.services.amount}>
                          <InputNumber
                            className="w-full"
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      {/* Date of Work */}
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date of Work"
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
                    title={`Item ${field.name + 1}`}
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
                          label="Expenses Descriptions"
                          name={[field.name, "description"]}
                          dependencies={[
                            [field.name, "amount"],
                            [field.name, "date"],
                          ]}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const amount = getFieldValue([
                                  field.name,
                                  "amount",
                                ]);
                                const date = getFieldValue([
                                  field.name,
                                  "date",
                                ]);
                                if ((amount || date) && !value) {
                                  return Promise.reject(
                                    new Error(
                                      "Please enter an expense description"
                                    )
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                          initialValue={formData.expenses.description}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Amount"
                          name={[field.name, "amount"]}
                          dependencies={[
                            [field.name, "description"],
                            [field.name, "date"],
                          ]}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const description = getFieldValue([
                                  field.name,
                                  "description",
                                ]);
                                const date = getFieldValue([
                                  field.name,
                                  "date",
                                ]);
                                if ((description || date) && !value) {
                                  return Promise.reject(
                                    new Error("Please enter the amount")
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                          initialValue={formData.expenses.amount}>
                          <InputNumber
                            className="w-full"
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date"
                          name={[field.name, "date"]}
                          dependencies={[
                            [field.name, "description"],
                            [field.name, "amount"],
                          ]}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const description = getFieldValue([
                                  field.name,
                                  "description",
                                ]);
                                const amount = getFieldValue([
                                  field.name,
                                  "amount",
                                ]);
                                if ((description || amount) && !value) {
                                  return Promise.reject(
                                    new Error("Please select a date")
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                          initialValue={formData.expenses.date}>
                          <DatePicker />
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

        {/* Tax fields */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Tax Charges on Invoice</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tax Type"
                name="taxType"
                initialValue={formData.taxType}>
                <Input placeholder="e.g., VAT, Sales Tax" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tax Rate (%)"
                name="taxRate"
                initialValue={formData?.taxRate}>
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
                label="Previous Balance Unpaid"
                name="previousBalance"
                initialValue={formData?.previousBalance}
                tooltip="Enter any outstanding balance from previous invoices">
                <InputNumber
                  className="w-full"
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Previous Balance Includes Tax"
                name="previousBalanceIncludesTax"
                valuePropName="checked"
                initialValue={true}
                tooltip="Check if the previous balance already includes tax (prevents double taxation)">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Account Details fields */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Account Details</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                rules={requiredRule}
                label="Account Name"
                name={["accountDetails", "accountName"]}
                initialValue={formData?.accountDetails?.accountName}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                rules={requiredRule}
                label="Account Number"
                name={["accountDetails", "accountNumber"]}
                initialValue={formData?.accountDetails?.accountNumber}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                rules={requiredRule}
                label="Bank"
                name={["accountDetails", "bank"]}
                initialValue={formData?.accountDetails?.bank}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Reference"
                name={["accountDetails", "reference"]}
                initialValue={formData?.accountDetails?.reference}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />
        <Card>
          {/* Due Date */}
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
          </Row>
        </Card>

        <Divider />
        {/* terms and condition field */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              name="paymentInstructionTAndC"
              label="Payment Instruction/Terms and Conditions"
              initialValue={formData?.paymentInstructionTAndC}>
              <TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>

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
                    ? "Invoice will be marked as 'unpaid' and ready to send to client"
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
