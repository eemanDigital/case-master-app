// components/invoice/InvoiceServiceFields.jsx
import React from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  calculateServiceAmount,
  formatCurrency,
  formatBillingMethodDisplay,
} from "../../utils/invoiceCalculations";

const { Text } = Typography;

const InvoiceServiceFields = ({ form, readOnly = false }) => {
  // Render service amount preview
  const renderServiceAmountPreview = (fieldName) => {
    const service = form.getFieldValue(["services", fieldName]);
    if (!service) return null;

    const amount = calculateServiceAmount(service);

    if (amount === 0) return null;

    return (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Calculated Amount:</span>
          <span className="font-bold text-green-700">
            {formatCurrency(amount)}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatBillingMethodDisplay(service)}
        </div>
      </div>
    );
  };

  return (
    <Form.List name="services">
      {(fields, { add, remove }) => (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const currentBillingMethod =
              form.getFieldValue(["services", field.name, "billingMethod"]) ||
              "hourly";

            const service = form.getFieldValue(["services", field.name]);
            const serviceAmount = calculateServiceAmount(service);

            return (
              <Card
                key={field.key}
                title={`Service ${index + 1}`}
                size="default"
                extra={
                  <div className="flex items-center gap-2">
                    {serviceAmount > 0 && (
                      <Tag color="green">{formatCurrency(serviceAmount)}</Tag>
                    )}
                    {fields.length > 1 && !readOnly && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                        size="small">
                        Remove
                      </Button>
                    )}
                  </div>
                }
                className="border-l-4 border-blue-500">
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Form.Item
                      {...field}
                      label="Service Description"
                      name={[field.name, "description"]}
                      rules={[
                        {
                          required: true,
                          message: "Service description is required",
                        },
                      ]}>
                      <Input
                        placeholder="e.g., Court Appearance at Federal High Court"
                        size="large"
                        disabled={readOnly}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      {...field}
                      label="Billing Method"
                      name={[field.name, "billingMethod"]}
                      rules={[
                        {
                          required: true,
                          message: "Billing method is required",
                        },
                      ]}
                      initialValue="hourly">
                      <Select
                        size="large"
                        disabled={readOnly}
                        onChange={() => {
                          // Reset fields when method changes
                          form.setFieldValue(
                            ["services", field.name, "hours"],
                            0
                          );
                          form.setFieldValue(
                            ["services", field.name, "rate"],
                            0
                          );
                          form.setFieldValue(
                            ["services", field.name, "fixedAmount"],
                            0
                          );
                          form.setFieldValue(
                            ["services", field.name, "quantity"],
                            1
                          );
                          form.setFieldValue(
                            ["services", field.name, "unitPrice"],
                            0
                          );
                        }}>
                        <Select.Option value="hourly">
                          Hourly Rate
                        </Select.Option>
                        <Select.Option value="fixed_fee">
                          Fixed Fee
                        </Select.Option>
                        <Select.Option value="item">
                          Per Item/Service
                        </Select.Option>
                        <Select.Option value="contingency">
                          Contingency
                        </Select.Option>
                        <Select.Option value="retainer">Retainer</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      {...field}
                      label="Service Category"
                      name={[field.name, "category"]}
                      initialValue="other">
                      <Select size="large" disabled={readOnly}>
                        <Select.Option value="consultation">
                          Consultation
                        </Select.Option>
                        <Select.Option value="court_appearance">
                          Court Appearance
                        </Select.Option>
                        <Select.Option value="document_preparation">
                          Document Preparation
                        </Select.Option>
                        <Select.Option value="research">Research</Select.Option>
                        <Select.Option value="negotiation">
                          Negotiation
                        </Select.Option>
                        <Select.Option value="filing">Filing</Select.Option>
                        <Select.Option value="other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      {...field}
                      label="Date of Service"
                      name={[field.name, "date"]}>
                      <DatePicker
                        className="w-full"
                        size="large"
                        disabled={readOnly}
                      />
                    </Form.Item>
                  </Col>

                  {/* Dynamic fields based on billing method */}
                  {currentBillingMethod === "hourly" && (
                    <>
                      <Col xs={24} md={12}>
                        <Form.Item
                          {...field}
                          label="Hours Worked"
                          name={[field.name, "hours"]}
                          initialValue={0}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            step={0.25}
                            size="large"
                            placeholder="0.00"
                            disabled={readOnly}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          {...field}
                          label="Hourly Rate (₦)"
                          name={[field.name, "rate"]}
                          initialValue={0}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                            size="large"
                            placeholder="0.00"
                            disabled={readOnly}
                          />
                        </Form.Item>
                      </Col>
                    </>
                  )}

                  {currentBillingMethod === "fixed_fee" && (
                    <Col xs={24}>
                      <Form.Item
                        {...field}
                        label="Fixed Fee Amount (₦)"
                        name={[field.name, "fixedAmount"]}
                        initialValue={0}>
                        <InputNumber
                          className="w-full"
                          min={0}
                          formatter={(value) =>
                            `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          size="large"
                          placeholder="0.00"
                          disabled={readOnly}
                        />
                      </Form.Item>
                    </Col>
                  )}

                  {currentBillingMethod === "item" && (
                    <>
                      <Col xs={24} md={12}>
                        <Form.Item
                          {...field}
                          label="Quantity"
                          name={[field.name, "quantity"]}
                          initialValue={1}>
                          <InputNumber
                            className="w-full"
                            min={1}
                            size="large"
                            disabled={readOnly}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          {...field}
                          label="Unit Price (₦)"
                          name={[field.name, "unitPrice"]}
                          initialValue={0}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                            size="large"
                            placeholder="0.00"
                            disabled={readOnly}
                          />
                        </Form.Item>
                      </Col>
                    </>
                  )}

                  {(currentBillingMethod === "contingency" ||
                    currentBillingMethod === "retainer") && (
                    <Col xs={24}>
                      <Form.Item
                        {...field}
                        label="Amount (₦)"
                        name={[field.name, "fixedAmount"]}
                        initialValue={0}>
                        <InputNumber
                          className="w-full"
                          min={0}
                          formatter={(value) =>
                            `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          size="large"
                          placeholder="0.00"
                          disabled={readOnly}
                        />
                      </Form.Item>
                    </Col>
                  )}

                  {/* Service Amount Display */}
                  <Col xs={24}>{renderServiceAmountPreview(field.name)}</Col>
                </Row>
              </Card>
            );
          })}

          {!readOnly && (
            <Button
              type="dashed"
              onClick={() => add()}
              block
              size="large"
              icon={<PlusOutlined />}>
              Add Another Service
            </Button>
          )}
        </div>
      )}
    </Form.List>
  );
};

export default InvoiceServiceFields;
