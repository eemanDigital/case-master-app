import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Select,
  message,
  Tooltip,
  Popconfirm,
  Progress,
  Badge,
  Row,
  Col,
  Statistic,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  addPayment,
  updatePayment,
  removePayment,
} from "../../redux/features/property/propertySlice";
import {
  PAYMENT_STATUS,
  DATE_FORMAT,
  formatCurrency,
  isOverdue,
  getDaysUntil,
} from "../../utils/propertyConstants";
import dayjs from "dayjs";

const { Option } = Select;

const PaymentScheduleManager = ({ matterId, paymentSchedule = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = paymentSchedule.length;
    const paid = paymentSchedule.filter((p) => p.status === "paid").length;
    const pending = paymentSchedule.filter(
      (p) => p.status === "pending",
    ).length;
    const overdue = paymentSchedule.filter(
      (p) => p.status === "pending" && isOverdue(p.dueDate),
    ).length;
    const waived = paymentSchedule.filter((p) => p.status === "waived").length;
    const totalAmount = paymentSchedule.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    const paidAmount = paymentSchedule
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = paymentSchedule
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const completionRate = total > 0 ? (paid / total) * 100 : 0;

    return {
      total,
      paid,
      pending,
      overdue,
      waived,
      totalAmount,
      paidAmount,
      pendingAmount,
      completionRate,
    };
  }, [paymentSchedule]);

  // Sort payments by due date
  const sortedPayments = useMemo(() => {
    return [...paymentSchedule].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [paymentSchedule]);

  // Open modal for adding/editing
  const showModal = (payment = null) => {
    setEditingPayment(payment);
    if (payment) {
      form.setFieldsValue({
        ...payment,
        dueDate: payment.dueDate ? dayjs(payment.dueDate) : null,
        paidDate: payment.paidDate ? dayjs(payment.paidDate) : null,
      });
    } else {
      form.resetFields();
      // Auto-calculate installment number
      const nextInstallment = paymentSchedule.length + 1;
      form.setFieldValue("installmentNumber", nextInstallment);
      form.setFieldValue("status", "pending");
    }
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        paidDate: values.paidDate ? values.paidDate.toISOString() : null,
      };

      if (editingPayment) {
        await dispatch(
          updatePayment({
            matterId,
            installmentId: editingPayment._id || editingPayment.id,
            data: formattedValues,
          }),
        );
      } else {
        await dispatch(addPayment({ matterId, data: formattedValues }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingPayment(null);
      message.success(
        editingPayment
          ? "Payment updated successfully"
          : "Payment added successfully",
      );
    } catch (error) {
      message.error("Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (installmentId) => {
    try {
      await dispatch(removePayment({ matterId, installmentId }));
      message.success("Payment removed successfully");
    } catch (error) {
      message.error("Failed to remove payment");
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async (payment) => {
    try {
      await dispatch(
        updatePayment({
          matterId,
          installmentId: payment._id || payment.id,
          data: {
            ...payment,
            status: "paid",
            paidDate: new Date().toISOString(),
          },
        }),
      );
      message.success("Payment marked as paid");
    } catch (error) {
      message.error("Failed to update payment");
    }
  };

  // Get status icon and color
  const getStatusConfig = (status, dueDate) => {
    const isOverdueItem = status === "pending" && isOverdue(dueDate);

    if (isOverdueItem) {
      return {
        icon: <ExclamationCircleOutlined />,
        color: "error",
        text: "Overdue",
      };
    }

    switch (status) {
      case "paid":
        return {
          icon: <CheckCircleOutlined />,
          color: "success",
          text: "Paid",
        };
      case "pending":
        return {
          icon: <ClockCircleOutlined />,
          color: "processing",
          text: "Pending",
        };
      case "waived":
        return {
          icon: <CheckCircleOutlined />,
          color: "default",
          text: "Waived",
        };
      default:
        return { icon: null, color: "default", text: status };
    }
  };

  // Columns
  const columns = [
    {
      title: "Installment",
      dataIndex: "installmentNumber",
      key: "installmentNumber",
      width: 100,
      render: (number) => (
        <div className="text-center">
          <div className="font-bold text-lg">#{number}</div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount) => (
        <div className="font-semibold text-lg">
          {formatCurrency(amount, "NGN")}
        </div>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      render: (date, record) => {
        if (!date) return "-";

        const isOverdueItem = isOverdue(date) && record.status === "pending";
        const daysUntil = getDaysUntil(date);

        return (
          <div>
            <div className="flex items-center">
              <CalendarOutlined className="mr-2 text-gray-400" />
              <span>{dayjs(date).format(DATE_FORMAT)}</span>
            </div>
            {!isOverdueItem && daysUntil > 0 && daysUntil <= 30 && (
              <div className="text-xs text-orange-500">
                {daysUntil} days left
              </div>
            )}
            {isOverdueItem && (
              <div className="text-xs text-red-500">Overdue</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Paid Date",
      dataIndex: "paidDate",
      key: "paidDate",
      width: 150,
      render: (date) => (date ? dayjs(date).format(DATE_FORMAT) : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        const config = getStatusConfig(status, record.dueDate);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => {
        const isPending = record.status === "pending";
        const isOverdueItem = isPending && isOverdue(record.dueDate);

        return (
          <Space>
            {isPending && (
              <Tooltip title="Mark as Paid">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleMarkAsPaid(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => showModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Remove this payment?"
              description="Are you sure you want to remove this payment installment?"
              onConfirm={() => handleDelete(record._id || record.id)}
              okText="Yes"
              cancelText="No">
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {/* Statistics Row */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={stats.total}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#722ed1" }}
              formatter={(value) => formatCurrency(value, "NGN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Paid"
              value={stats.paid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Progress
              percent={stats.completionRate}
              size="small"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
            {stats.overdue > 0 && (
              <div className="text-xs text-red-500">
                {formatCurrency(stats.pendingAmount, "NGN")} pending
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Payment Summary</h3>
            <div className="text-gray-600">
              {stats.paid} of {stats.total} payments completed (
              {stats.completionRate.toFixed(1)}%)
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <Space>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-xl font-bold">
                  {formatCurrency(stats.totalAmount, "NGN")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Pending Amount</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(stats.pendingAmount, "NGN")}
                </div>
              </div>
            </Space>
          </div>
        </div>

        <Progress
          percent={stats.completionRate}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          className="mt-4"
        />
      </Card>

      {/* Main Card */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <DollarOutlined className="mr-2" />
              Payment Schedule ({paymentSchedule.length})
              {stats.overdue > 0 && (
                <Badge count={stats.overdue} className="ml-2" />
              )}
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}>
              Add Payment
            </Button>
          </div>
        }>
        {paymentSchedule.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <div className="mb-2">No payment schedule added yet</div>
                <div className="text-gray-500 text-sm mb-4">
                  Add payment installments to track financial obligations
                </div>
                <Button type="primary" onClick={() => showModal()}>
                  Add First Payment
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={sortedPayments}
            rowKey={(record) => record._id || record.id}
            pagination={paymentSchedule.length > 10 ? { pageSize: 10 } : false}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPayment ? "Edit Payment" : "Add Payment Installment"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        centered>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="installmentNumber"
            label="Installment Number"
            rules={[
              { required: true, message: "Please enter installment number" },
            ]}>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="e.g., 1, 2, 3..."
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/,/g, "")}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: "Please select due date" }]}>
            <DatePicker
              style={{ width: "100%" }}
              format={DATE_FORMAT}
              placeholder="Select due date"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}>
            <Select placeholder="Select status">
              {PAYMENT_STATUS.map((status) => (
                <Option key={status.value} value={status.value}>
                  <Tag color={status.color}>{status.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="paidDate" label="Paid Date">
            <DatePicker
              style={{ width: "100%" }}
              format={DATE_FORMAT}
              placeholder="Select paid date"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingPayment ? "Update Payment" : "Add Payment"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PaymentScheduleManager;
