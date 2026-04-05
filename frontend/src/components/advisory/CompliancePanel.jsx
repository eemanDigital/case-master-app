import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Form,
  Select,
  DatePicker,
  Modal,
  Input,
  message,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  selectCurrentAdvisoryDetail,
  selectComplianceChecklist,
  updateAdvisoryDetails,
} from "../../redux/features/advisory/advisorySlice";

const { Option } = Select;
const { TextArea } = Input;

const COMPLIANCE_STATUS_OPTIONS = [
  { value: "compliant", label: "Compliant" },
  { value: "non-compliant", label: "Non-Compliant" },
  { value: "partially-compliant", label: "Partially Compliant" },
  { value: "not-applicable", label: "Not Applicable" },
];

const CompliancePanel = ({ advisoryId }) => {
  const dispatch = useDispatch();
  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const advisory = useSelector(selectCurrentAdvisoryDetail);
  const complianceChecklist = useSelector(selectComplianceChecklist) || [];

  const stats = useMemo(() => ({
    total: complianceChecklist.length,
    compliant: complianceChecklist.filter((item) => item.status === "compliant").length,
    nonCompliant: complianceChecklist.filter((item) => item.status === "non-compliant").length,
    partiallyCompliant: complianceChecklist.filter((item) => item.status === "partially-compliant").length,
    notApplicable: complianceChecklist.filter((item) => item.status === "not-applicable").length,
  }), [complianceChecklist]);

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      const updatedChecklist = complianceChecklist.map((item) =>
        item._id === itemId ? { ...item, status: newStatus } : item
      );
      
      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { complianceChecklist: updatedChecklist },
      })).unwrap();
      
      message.success("Compliance status updated");
    } catch (error) {
      message.error("Failed to update compliance status");
    }
  };

  const handleSave = async (values) => {
    try {
      let updatedChecklist;
      
      if (editingItem) {
        updatedChecklist = complianceChecklist.map((item) =>
          item._id === editingItem._id
            ? {
                ...item,
                requirement: values.requirement,
                status: values.status,
                dueDate: values.dueDate?.toISOString() || item.dueDate,
                notes: values.notes || "",
              }
            : item
        );
      } else {
        const newItem = {
          _id: `temp_${Date.now()}`,
          requirement: values.requirement,
          status: values.status || "compliant",
          dueDate: values.dueDate?.toISOString() || null,
          notes: values.notes || "",
        };
        updatedChecklist = [...complianceChecklist, newItem];
      }

      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { complianceChecklist: updatedChecklist },
      })).unwrap();

      setModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      message.success(editingItem ? "Compliance item updated" : "Compliance item added");
    } catch (error) {
      message.error("Failed to save compliance item");
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const updatedChecklist = complianceChecklist.filter((item) => item._id !== itemId);
      
      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { complianceChecklist: updatedChecklist },
      })).unwrap();
      
      message.success("Compliance item deleted");
    } catch (error) {
      message.error("Failed to delete compliance item");
    }
  };

  const columns = [
    {
      title: "Requirement",
      dataIndex: "requirement",
      key: "requirement",
      width: "30%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 200,
      render: (status, record) => {
        const statusConfig = {
          compliant: {
            color: "success",
            icon: <CheckCircleOutlined />,
            text: "Compliant",
          },
          "non-compliant": {
            color: "error",
            icon: <CloseCircleOutlined />,
            text: "Non-Compliant",
          },
          "partially-compliant": {
            color: "warning",
            icon: <CheckCircleOutlined />,
            text: "Partially Compliant",
          },
          "not-applicable": {
            color: "default",
            icon: null,
            text: "N/A",
          },
        };

        const config = statusConfig[status] || {
          color: "default",
          text: status || "Unknown",
        };

        return (
          <Select
            value={status}
            onChange={(value) => handleStatusUpdate(record._id, value)}
            style={{ width: 180 }}
            bordered={false}>
            {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                <Tag color={statusConfig[opt.value]?.color || "default"}>
                  {statusConfig[opt.value]?.icon}
                  {opt.label}
                </Tag>
              </Option>
            ))}
          </Select>
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
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes) => notes || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingItem(record);
              form.setFieldsValue({
                ...record,
                dueDate: record.dueDate ? dayjs(record.dueDate) : null,
              });
              setModalVisible(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}>
        <Card size="small">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, color: "#52c41a" }}>
              {stats.compliant}
            </div>
            <div>Compliant</div>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, color: "#ff4d4f" }}>
              {stats.nonCompliant}
            </div>
            <div>Non-Compliant</div>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, color: "#faad14" }}>
              {stats.partiallyCompliant}
            </div>
            <div>Partially Compliant</div>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{stats.total}</div>
            <div>Total Requirements</div>
          </div>
        </Card>
      </div>

      <Card
        title="Compliance Checklist"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              form.resetFields();
              setModalVisible(true);
            }}>
            Add Requirement
          </Button>
        }>
        {complianceChecklist.length > 0 ? (
          <Table
            columns={columns}
            dataSource={complianceChecklist}
            rowKey="_id"
            pagination={false}
          />
        ) : (
          <Empty description="No compliance requirements added yet" />
        )}
      </Card>

      <Modal
        title={editingItem ? "Edit Compliance Item" : "Add Compliance Item"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="requirement"
            label="Requirement"
            rules={[{ required: true, message: "Please enter requirement" }]}>
            <Input placeholder="Enter compliance requirement" />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="compliant">
            <Select>
              {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingItem(null);
                  form.resetFields();
                }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompliancePanel;
