// components/invoice/InvoiceExpenseFields.jsx
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
  Switch,
  Button,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const InvoiceExpenseFields = ({ form, readOnly = false }) => {
  return (
    <Form.List name="expenses">
      {(fields, { add, remove }) => (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card
              key={field.key}
              title={`Expense ${index + 1}`}
              size="default"
              extra={
                !readOnly && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                    size="small">
                    Remove
                  </Button>
                )
              }
              className="border-l-4 border-green-500">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    {...field}
                    label="Expense Description"
                    name={[field.name, "description"]}
                    rules={[
                      {
                        required: true,
                        message: "Expense description is required",
                      },
                    ]}>
                    <Input
                      placeholder="e.g., Court Filing Fees, Process Server Fee"
                      size="large"
                      disabled={readOnly}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    {...field}
                    label="Category"
                    name={[field.name, "category"]}
                    initialValue="other">
                    <Select size="large" disabled={readOnly}>
                      <Select.Option value="court_fees">
                        Court Fees
                      </Select.Option>
                      <Select.Option value="filing_fees">
                        Filing Fees
                      </Select.Option>
                      <Select.Option value="travel">Travel</Select.Option>
                      <Select.Option value="accommodation">
                        Accommodation
                      </Select.Option>
                      <Select.Option value="expert_witness">
                        Expert Witness
                      </Select.Option>
                      <Select.Option value="process_server">
                        Process Server
                      </Select.Option>
                      <Select.Option value="printing">Printing</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    {...field}
                    label="Amount (₦)"
                    name={[field.name, "amount"]}
                    rules={[{ required: true, message: "Amount is required" }]}
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

                <Col xs={24} md={12}>
                  <Form.Item
                    {...field}
                    label="Receipt Number (Optional)"
                    name={[field.name, "receiptNumber"]}>
                    <Input
                      placeholder="e.g., CT-2024-001"
                      size="large"
                      disabled={readOnly}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    {...field}
                    label="Date Incurred"
                    name={[field.name, "date"]}>
                    <DatePicker
                      className="w-full"
                      size="large"
                      disabled={readOnly}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    {...field}
                    label="Reimbursable?"
                    name={[field.name, "isReimbursable"]}
                    valuePropName="checked"
                    initialValue={true}>
                    <Switch
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                      disabled={readOnly}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}

          {!readOnly && (
            <Button
              type="dashed"
              onClick={() => add()}
              block
              size="large"
              icon={<PlusOutlined />}>
              Add Another Expense
            </Button>
          )}
        </div>
      )}
    </Form.List>
  );
};

export default InvoiceExpenseFields;
