import React, { useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Progress,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addDeliverable,
  updateDeliverable,
  deleteDeliverable,
} from "../../redux/features/general/generalSlice";
import { DELIVERABLE_STATUSES } from "../../utils/generalConstants";

const { Option } = Select;
const { TextArea } = Input;

const DeliverablesManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);

  const selectedDetails = useSelector((state) => state.general.selectedDetails);
  const generalDetail = selectedDetails?.generalDetail || selectedDetails;
  const actionLoading = useSelector((state) => state.general.actionLoading);

  const deliverables = generalDetail?.expectedDeliverables || [];

  const handleAdd = useCallback(() => {
    setEditingDeliverable(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback(
    (deliverable) => {
      setEditingDeliverable(deliverable);
      form.setFieldsValue({
        deliverable: deliverable.deliverable,
        dueDate: deliverable.dueDate ? dayjs(deliverable.dueDate) : null,
        deliveryDate: deliverable.deliveryDate
          ? dayjs(deliverable.deliveryDate)
          : null,
        status: deliverable.status,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (deliverableId) => {
      Modal.confirm({
        title: "Delete Deliverable",
        content: "Are you sure you want to delete this deliverable?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(
              deleteDeliverable({ matterId, deliverableId }),
            ).unwrap();
            message.success("Deliverable deleted successfully");
          } catch (error) {
            message.error(error || "Failed to delete deliverable");
          }
        },
      });
    },
    [dispatch, matterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const data = {
          deliverable: values.deliverable,
          dueDate: values.dueDate?.toISOString(),
          deliveryDate: values.deliveryDate?.toISOString(),
          status: values.status,
        };

        if (editingDeliverable) {
          await dispatch(
            updateDeliverable({
              matterId,
              deliverableId: editingDeliverable._id,
              data,
            }),
          ).unwrap();
          message.success("Deliverable updated successfully");
        } else {
          await dispatch(addDeliverable({ matterId, data })).unwrap();
          message.success("Deliverable added successfully");
        }
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to save deliverable");
      }
    },
    [dispatch, matterId, editingDeliverable, form],
  );

  const columns = [
    {
      title: "Deliverable",
      dataIndex: "deliverable",
      key: "deliverable",
      width: "35%",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: "15%",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Delivery Date",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      width: "15%",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "20%",
      render: (status, record) => {
        const statusConfig = DELIVERABLE_STATUSES.find(
          (s) => s.value === status,
        );
        const isOverdue =
          status === "pending" &&
          record.dueDate &&
          dayjs(record.dueDate).isBefore(dayjs());
        return (
          <Space direction="vertical" size={0}>
            <Tag color={isOverdue ? "red" : statusConfig?.color || "default"}>
              {isOverdue ? "OVERDUE" : statusConfig?.label || status}
            </Tag>
            {isOverdue && (
              <small style={{ color: "#ff4d4f" }}>
                Due {dayjs(record.dueDate).fromNow()}
              </small>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  const summary = {
    total: deliverables.length,
    pending: deliverables.filter((d) => d.status === "pending").length,
    inProgress: deliverables.filter((d) => d.status === "in-progress").length,
    delivered: deliverables.filter((d) => d.status === "delivered").length,
    approved: deliverables.filter((d) => d.status === "approved").length,
    overdue: deliverables.filter(
      (d) =>
        d.status === "pending" &&
        d.dueDate &&
        dayjs(d.dueDate).isBefore(dayjs()),
    ).length,
  };

  const completionRate =
    summary.total > 0
      ? (
          ((summary.delivered + summary.approved) / summary.total) *
          100
        ).toFixed(0)
      : 0;

  return (
    <div>
      <Card
        title="Expected Deliverables"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Deliverable
          </Button>
        }
        style={{ marginBottom: 16 }}>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", marginBottom: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <span>Completion Progress</span>
              <span style={{ float: "right", fontWeight: "bold" }}>
                {completionRate}%
              </span>
            </div>
            <Progress
              percent={completionRate}
              status={summary.overdue > 0 ? "exception" : "active"}
              strokeColor={summary.overdue > 0 ? "#ff4d4f" : "#52c41a"}
            />
          </div>

          <Space size="large" wrap>
            <span>
              Total: <strong>{summary.total}</strong>
            </span>
            <span>
              Pending: <Tag color="orange">{summary.pending}</Tag>
            </span>
            <span>
              In Progress: <Tag color="blue">{summary.inProgress}</Tag>
            </span>
            <span>
              Delivered: <Tag color="cyan">{summary.delivered}</Tag>
            </span>
            <span>
              Approved: <Tag color="green">{summary.approved}</Tag>
            </span>
            {summary.overdue > 0 && (
              <span>
                Overdue: <Tag color="red">{summary.overdue}</Tag>
              </span>
            )}
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={deliverables}
          rowKey={(record) => record._id}
          loading={actionLoading}
          pagination={false}
          locale={{ emptyText: "No deliverables added yet" }}
        />
      </Card>

      <Modal
        title={editingDeliverable ? "Edit Deliverable" : "Add Deliverable"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="deliverable"
            label="Deliverable"
            rules={[
              { required: true, message: "Please enter the deliverable" },
            ]}>
            <TextArea rows={3} placeholder="Describe the deliverable..." />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: "Please select due date" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="deliveryDate" label="Delivery Date (if delivered)">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
            initialValue="pending">
            <Select>
              {DELIVERABLE_STATUSES.map((s) => (
                <Option key={s.value} value={s.value}>
                  {s.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeliverablesManager;
