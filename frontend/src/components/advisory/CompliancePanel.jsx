// components/advisory/panels/CompliancePanel.jsx
import React, { useState } from "react";
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
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
// import { updateComplianceItem } from "../../redux/features/advisory/advisorySlice";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const CompliancePanel = ({ advisoryId }) => {
  const dispatch = useDispatch();
  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data
  const complianceChecklist = [
    {
      _id: "1",
      requirement: "Submit annual compliance report",
      status: "compliant",
      notes: "Submitted on time",
      dueDate: "2024-12-31",
      completedDate: "2024-11-15",
    },
    {
      _id: "2",
      requirement: "Obtain regulatory approval",
      status: "non-compliant",
      notes: "Pending review",
      dueDate: "2024-12-01",
      completedDate: null,
    },
  ];

  // const handleStatusUpdate = async (itemId, newStatus) => {
  //   try {
  //     await dispatch(
  //       updateComplianceItem({
  //         advisoryId,
  //         itemId,
  //         data: { status: newStatus },
  //       }),
  //     );
  //   } catch (error) {
  //     console.error("Failed to update compliance item:", error);
  //   }
  // };

  // const handleSave = async (values) => {
  //   try {
  //     if (editingItem) {
  //       await dispatch(
  //         updateComplianceItem({
  //           advisoryId,
  //           itemId: editingItem._id,
  //           data: {
  //             ...values,
  //             dueDate: values.dueDate?.toISOString(),
  //           },
  //         }),
  //       );
  //     }
  //     setModalVisible(false);
  //     setEditingItem(null);
  //     form.resetFields();
  //   } catch (error) {
  //     console.error("Failed to save:", error);
  //   }
  // };

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
          text: status,
        };

        return (
          <Select
            value={status}
            onChange={(value) => handleStatusUpdate(record._id, value)}
            style={{ width: 180 }}
            bordered={false}>
            <Option value="compliant">
              <Tag color="success">Compliant</Tag>
            </Option>
            <Option value="non-compliant">
              <Tag color="error">Non-Compliant</Tag>
            </Option>
            <Option value="partially-compliant">
              <Tag color="warning">Partially Compliant</Tag>
            </Option>
            <Option value="not-applicable">
              <Tag>Not Applicable</Tag>
            </Option>
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
      render: (_, record) => (
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
      ),
    },
  ];

  const stats = {
    total: complianceChecklist.length,
    compliant: complianceChecklist.filter((item) => item.status === "compliant")
      .length,
    nonCompliant: complianceChecklist.filter(
      (item) => item.status === "non-compliant",
    ).length,
    partiallyCompliant: complianceChecklist.filter(
      (item) => item.status === "partially-compliant",
    ).length,
  };

  return (
    <div>
      {/* Compliance Stats */}
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
        <Table
          columns={columns}
          dataSource={complianceChecklist}
          rowKey="_id"
          pagination={false}
        />
      </Card>

      {/* Edit Modal */}
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
        {/* <Form form={form} layout="vertical" onFinish={handleSave}> */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="requirement"
            label="Requirement"
            rules={[{ required: true, message: "Please enter requirement" }]}>
            <Input placeholder="Enter compliance requirement" />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="compliant">
            <Select>
              <Option value="compliant">Compliant</Option>
              <Option value="non-compliant">Non-Compliant</Option>
              <Option value="partially-compliant">Partially Compliant</Option>
              <Option value="not-applicable">Not Applicable</Option>
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
