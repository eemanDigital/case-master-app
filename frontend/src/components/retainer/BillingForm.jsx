import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Table,
  Divider,
  Switch,
  message,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BillingForm = ({ retainerDetails, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize with retainer fee
  React.useEffect(() => {
    if (retainerDetails?.retainerFee) {
      form.setFieldsValue({
        amount: retainerDetails.retainerFee.amount,
        frequency: retainerDetails.retainerFee.frequency,
        currency: retainerDetails.retainerFee.currency,
        billingDate: dayjs(),
        dueDate: dayjs().add(30, "days"),
      });
    }
  }, [retainerDetails, form]);

  // Add new invoice item
  const addItem = () => {
    const newItem = {
      key: Date.now(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove invoice item
  const removeItem = (key) => {
    setItems(items.filter((item) => item.key !== key));
  };

  // Update item field
  const updateItem = (key, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate amount if quantity or rate changed
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const totals = calculateTotals();

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const billingData = {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        billingDate: values.billingDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        currency: values.currency,
        notes: values.notes,
        sendNotification: values.sendNotification,
      };

      await onSave(billingData);
      message.success("Invoice created successfully");
    } catch (error) {
      message.error(error.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  // Invoice items table columns
  const itemColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) =>
            updateItem(record.key, "description", e.target.value)
          }
          placeholder="Item description"
        />
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      render: (text, record) => (
        <InputNumber
          value={text}
          min={1}
          onChange={(value) => updateItem(record.key, "quantity", value)}
          style={{ width: "80%" }}
        />
      ),
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          min={0}
          formatter={(value) =>
            `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          onChange={(value) => updateItem(record.key, "rate", value)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (text) => <Text strong>₦ {text?.toLocaleString() || "0"}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
        />
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}>
        <Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Create Invoice
        </Title>
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}>
            Save & Send Invoice
          </Button>
        </Space>
      </div>

      {/* Basic Information */}
      <Card title="Invoice Details" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="billingDate"
              label="Invoice Date"
              rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="currency"
              label="Currency"
              rules={[{ required: true }]}>
              <Select>
                <Option value="NGN">NGN (₦)</Option>
                <Option value="USD">USD ($)</Option>
                <Option value="EUR">EUR (€)</Option>
                <Option value="GBP">GBP (£)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Invoice Items */}
      <Card
        title={
          <Space>
            <span>Invoice Items</span>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              Add Item
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}>
        <Table
          columns={itemColumns}
          dataSource={items}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No items added. Click "Add Item" to start.' }}
        />
      </Card>

      {/* Summary */}
      <Card title="Invoice Summary" style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ padding: "16px 0" }}>
              <Title level={5}>Notes</Title>
              <Form.Item name="notes">
                <TextArea
                  rows={4}
                  placeholder="Add any notes or terms for this invoice..."
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: "16px 0" }}>
              <Title level={5}>Totals</Title>
              <div style={{ marginBottom: 16 }}>
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text>Subtotal:</Text>
                  <Text strong>₦ {totals.subtotal.toLocaleString()}</Text>
                </Row>
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text>Tax (7.5%):</Text>
                  <Text>₦ {totals.tax.toLocaleString()}</Text>
                </Row>
                <Divider style={{ margin: "12px 0" }} />
                <Row justify="space-between">
                  <Text strong>Total:</Text>
                  <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                    ₦ {totals.total.toLocaleString()}
                  </Title>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Notification Settings */}
      <Card title="Notification Settings" style={{ marginBottom: 24 }}>
        <Form.Item
          name="sendNotification"
          label="Send Email Notification"
          valuePropName="checked"
          initialValue={true}>
          <Switch />
        </Form.Item>

        <Text type="secondary">
          When enabled, an email notification will be sent to the client with
          the invoice attached.
        </Text>
      </Card>
    </Form>
  );
};

export default BillingForm;
