// components/advisory/DeliverablesPanel.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addDeliverable,
  updateDeliverable,
  deleteDeliverable,
  selectCurrentAdvisoryDetail,
} from "../../redux/features/advisory/advisorySlice";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;

const DeliverablesPanel = ({ advisoryId }) => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [form] = Form.useForm();

  // Get deliverables from Redux store - from current advisory detail
  const advisory = useSelector(selectCurrentAdvisoryDetail);
  const deliverables = advisory?.deliverables || [];

  // Debug: Log advisoryId to verify it's being received
  useEffect(() => {
    console.log("DeliverablesPanel received advisoryId:", advisoryId);
  }, [advisoryId]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: deliverables.length,
      delivered: deliverables.filter(
        (d) => d.status === "delivered" || d.status === "approved",
      ).length,
      inProgress: deliverables.filter((d) => d.status === "in-progress").length,
      pending: deliverables.filter((d) => d.status === "pending").length,
    }),
    [deliverables],
  );

  const handleSave = useCallback(
    async (values) => {
      try {
        const data = {
          ...values,
          dueDate: values.dueDate?.toISOString(),
          deliveryDate: values.deliveryDate?.toISOString(),
        };

        if (editingDeliverable) {
          await dispatch(
            updateDeliverable({
              matterId: advisoryId,
              deliverableId: editingDeliverable._id,
              data,
            }),
          ).unwrap();
          message.success("Deliverable updated successfully");
        } else {
          await dispatch(
            addDeliverable({
              matterId: advisoryId,
              data,
            }),
          ).unwrap();
          message.success("Deliverable added successfully");
        }

        setModalVisible(false);
        setEditingDeliverable(null);
        form.resetFields();
      } catch (error) {
        message.error(
          editingDeliverable
            ? "Failed to update deliverable"
            : "Failed to add deliverable",
        );
        console.error("Failed to save deliverable:", error);
      }
    },
    [dispatch, advisoryId, editingDeliverable, form],
  );

  const handleEdit = useCallback(
    (deliverable) => {
      setEditingDeliverable(deliverable);
      form.setFieldsValue({
        ...deliverable,
        dueDate: deliverable.dueDate ? dayjs(deliverable.dueDate) : null,
        deliveryDate: deliverable.deliveryDate
          ? dayjs(deliverable.deliveryDate)
          : null,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (deliverableId) => {
      try {
        await dispatch(
          deleteDeliverable({
            matterId: advisoryId,
            deliverableId,
          }),
        ).unwrap();
        message.success("Deliverable deleted successfully");
      } catch (error) {
        message.error("Failed to delete deliverable");
        console.error("Failed to delete deliverable:", error);
      }
    },
    [dispatch, advisoryId],
  );

  const handleView = useCallback((deliverable) => {
    Modal.info({
      title: deliverable.title,
      content: (
        <div className="space-y-3">
          <p>
            <strong>Type:</strong> {deliverable.type}
          </p>
          <p>
            <strong>Status:</strong> {deliverable.status}
          </p>
          {deliverable.dueDate && (
            <p>
              <strong>Due Date:</strong>{" "}
              {dayjs(deliverable.dueDate).format("DD MMM YYYY")}
            </p>
          )}
          {deliverable.deliveryDate && (
            <p>
              <strong>Delivery Date:</strong>{" "}
              {dayjs(deliverable.deliveryDate).format("DD MMM YYYY")}
            </p>
          )}
          {deliverable.description && (
            <p>
              <strong>Description:</strong> {deliverable.description}
            </p>
          )}
        </div>
      ),
      width: 600,
    });
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (text, record) => (
          <div>
            <Text strong className="text-gray-900">
              {text}
            </Text>
            {record.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {record.description}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (type) => {
          const typeColors = {
            "legal-opinion": "blue",
            memo: "cyan",
            report: "purple",
            presentation: "orange",
            other: "default",
          };
          return (
            <Tag color={typeColors[type] || "default"}>
              {type?.replace("-", " ") || "Other"}
            </Tag>
          );
        },
      },
      {
        title: "Due Date",
        dataIndex: "dueDate",
        key: "dueDate",
        render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "-"),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const statusConfig = {
            pending: {
              color: "default",
              text: "Pending",
              cls: "bg-gray-100 text-gray-800",
            },
            "in-progress": {
              color: "processing",
              text: "In Progress",
              cls: "bg-blue-100 text-blue-800",
            },
            delivered: {
              color: "success",
              text: "Delivered",
              cls: "bg-green-100 text-green-800",
            },
            approved: {
              color: "green",
              text: "Approved",
              cls: "bg-green-100 text-green-800",
            },
          };
          const config = statusConfig[status] || {
            text: status,
            cls: "bg-gray-100 text-gray-800",
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.cls}`}>
              {config.text}
            </span>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              className="text-blue-600 hover:text-blue-800"
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="text-amber-600 hover:text-amber-800"
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
            />
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete, handleView],
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </Card>
        <Card size="small" className="border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
            <div className="text-xs text-gray-600">Delivered</div>
          </div>
        </Card>
        <Card size="small" className="border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
        </Card>
        <Card size="small" className="border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </Card>
      </div>

      {/* Main Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <CheckSquareOutlined className="text-blue-600" />
            <span className="font-medium">Deliverables</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingDeliverable(null);
              form.resetFields();
              setModalVisible(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 border-blue-600">
            Add Deliverable
          </Button>
        }
        className="border-gray-200 shadow-sm">
        <Table
          columns={columns}
          dataSource={deliverables}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          className="[&_.ant-table-thead_.ant-table-cell]:bg-gray-50 [&_.ant-table-thead_.ant-table-cell]:font-medium"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckSquareOutlined className="text-blue-600" />
            <span className="font-medium">
              {editingDeliverable ? "Edit Deliverable" : "Add Deliverable"}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingDeliverable(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
        centered>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ status: "pending" }}
          className="mt-4">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter title" }]}>
            <Input
              placeholder="Enter deliverable title"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Please select type" }]}>
            <Select placeholder="Select type" className="rounded-lg">
              <Option value="legal-opinion">Legal Opinion</Option>
              <Option value="memo">Memo</Option>
              <Option value="report">Report</Option>
              <Option value="presentation">Presentation</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Description (optional)"
              className="rounded-lg"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker style={{ width: "100%" }} className="rounded-lg" />
            </Form.Item>

            <Form.Item name="status" label="Status">
              <Select className="rounded-lg">
                <Option value="pending">Pending</Option>
                <Option value="in-progress">In Progress</Option>
                <Option value="delivered">Delivered</Option>
                <Option value="approved">Approved</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="mb-0 mt-6">
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingDeliverable(null);
                  form.resetFields();
                }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-600 hover:bg-blue-700 border-blue-600">
                {editingDeliverable ? "Update Deliverable" : "Add Deliverable"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(DeliverablesPanel);
