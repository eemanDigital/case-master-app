import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { formatDate } from "../../utils/formatters";
import StatusTag from "../common/StatusTag";
import {
  addCourtOrder,
  updateCourtOrder,
  deleteCourtOrder,
  // selectActionLoading,
} from "../../redux/features/litigation/litigationService";
import {
  COMPLIANCE_STATUS,
  DATE_FORMAT,
} from "../../utils/litigationConstants";

const { TextArea } = Input;
const { Option } = Select;

const CourtOrdersList = ({ matterId, courtOrders = [] }) => {
  const dispatch = useDispatch();
  // const loading = useSelector(selectActionLoading);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form] = Form.useForm();

  const handleAddOrder = () => {
    setEditingOrder(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    form.setFieldsValue({
      ...order,
      orderDate: dayjs(order.orderDate),
    });
    setIsModalVisible(true);
  };

  const handleDeleteOrder = (orderId) => {
    Modal.confirm({
      title: "Delete Court Order",
      content: "Are you sure you want to delete this court order?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await dispatch(deleteCourtOrder({ matterId, orderId }));
      },
    });
  };

  const handleSubmit = async (values) => {
    const orderData = {
      ...values,
      orderDate: values.orderDate.toISOString(),
    };

    try {
      if (editingOrder) {
        await dispatch(
          updateCourtOrder({
            matterId,
            orderId: editingOrder._id,
            orderData,
          }),
        ).unwrap();
      } else {
        await dispatch(addCourtOrder({ matterId, orderData })).unwrap();
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Court order operation error:", error);
    }
  };

  const columns = [
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 120,
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: "Order Type",
      dataIndex: "orderType",
      key: "orderType",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Compliance Status",
      dataIndex: "complianceStatus",
      key: "complianceStatus",
      width: 150,
      render: (status) => (
        <StatusTag status={status} configArray={COMPLIANCE_STATUS} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditOrder(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteOrder(record._id)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Court Orders ({courtOrders.length})
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddOrder}
              size="small">
              Add Court Order
            </Button>
          </div>
        }
        className="mb-6">
        <Table
          columns={columns}
          dataSource={courtOrders}
          rowKey="_id"
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title={editingOrder ? "Edit Court Order" : "Add Court Order"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="orderDate"
            label="Order Date"
            rules={[{ required: true, message: "Order date is required" }]}>
            <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} />
          </Form.Item>

          <Form.Item name="orderType" label="Order Type">
            <Input placeholder="e.g., Interim Injunction, Stay of Execution" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 2000, message: "Description too long" }]}>
            <TextArea
              rows={4}
              placeholder="Describe the court order"
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            name="complianceStatus"
            label="Compliance Status"
            initialValue="pending">
            <Select>
              {COMPLIANCE_STATUS.map((status) => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              {/* <Button type="primary" htmlType="submit" loading={loading}> */}
              <Button type="primary" htmlType="submit">
                {editingOrder ? "Update" : "Add"} Order
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CourtOrdersList;
