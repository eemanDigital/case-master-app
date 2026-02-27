import React, { useState, useEffect } from "react";
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
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useMattersSelectOptions from "../hooks/useMattersSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BillingForm = ({ retainerDetails, onSave, onCancel, initialValues }) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(null);
  
  const { mattersOptions, loading: mattersLoading } = useMattersSelectOptions({
    status: "active",
    limit: 100,
  });
  const { clientOptions, loading: clientsLoading } = useClientSelectOptions({
    type: "clients",
  });

  useEffect(() => {
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

  useEffect(() => {
    if (initialValues?.services?.length > 0) {
      const formattedItems = initialValues.services.map((s, idx) => ({
        key: Date.now() + idx,
        description: s.description || "",
        quantity: s.quantity || 1,
        rate: s.unitPrice || s.rate || 0,
        amount: s.amount || 0,
        billingMethod: s.billingMethod || "fixed_fee",
      }));
      setItems(formattedItems);
    }
  }, [initialValues]);

  const addItem = () => {
    const newItem = {
      key: Date.now(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
      billingMethod: "fixed_fee",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (key) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const updateItem = (key, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = subtotal * 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const totals = calculateTotals();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const billingData = {
        title: values.title || "Legal Services Invoice",
        client: values.client,
        matter: values.matter,
        case: values.case,
        billingDate: values.billingDate?.toISOString(),
        dueDate: values.dueDate?.toISOString(),
        services: items.map((item) => ({
          description: item.description,
          billingMethod: item.billingMethod || "fixed_fee",
          quantity: item.quantity,
          unitPrice: item.rate,
          fixedAmount: item.amount,
          amount: item.amount,
        })),
        expenses: [],
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        total: totals.total,
        currency: values.currency || "NGN",
        notes: values.notes,
        sendNotification: values.sendNotification,
        status: values.sendNotification ? "sent" : "draft",
        dueDate: values.dueDate?.toISOString(),
      };

      await onSave(billingData);
      message.success("Invoice created successfully");
    } catch (error) {
      message.error(error.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

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
          placeholder="Service description"
        />
      ),
    },
    {
      title: "Billing Method",
      dataIndex: "billingMethod",
      key: "billingMethod",
      width: 120,
      render: (text, record) => (
        <Select
          value={text || "fixed_fee"}
          onChange={(value) => updateItem(record.key, "billingMethod", value)}
          style={{ width: "100%" }}>
          <Option value="fixed_fee">Fixed Fee</Option>
          <Option value="hourly">Hourly</Option>
          <Option value="item">Item</Option>
        </Select>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (text, record) => (
        <InputNumber
          value={text}
          min={1}
          onChange={(value) => updateItem(record.key, "quantity", value)}
          style={{ width: "70%" }}
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

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

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

      <Card title="Client & Matter Details" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
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
                loading={clientsLoading}
                onChange={(value) => setSelectedClient(value)}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="matter"
              label="Matter"
              tooltip="Link to an existing matter (optional)">
              <Select
                placeholder="Select matter (optional)"
                showSearch
                filterOption={filterOption}
                options={mattersOptions}
                allowClear
                loading={mattersLoading}
                onChange={(value) => setSelectedMatter(value)}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="title"
              label="Invoice Title"
              rules={[{ required: true }]}
              initialValue="Legal Services Invoice">
              <Input placeholder="e.g., Legal Consultation & Court Representation" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="billingDate"
              label="Invoice Date"
              rules={[{ required: true }]}
              initialValue={dayjs()}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true }]}
              initialValue={dayjs().add(30, "days")}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="currency"
              label="Currency"
              rules={[{ required: true }]}
              initialValue="NGN">
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
