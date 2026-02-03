import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";
import {
  addParty,
  updateParty,
  removeParty,
} from "../../redux/features/corporate/corporateSlice";
import { ENTITY_TYPES } from "../../utils/corporateConstants";

const { Option } = Select;

const PartiesManager = ({ matterId, parties = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [loading, setLoading] = useState(false);

  // Open modal for adding/editing
  const showModal = (party = null) => {
    setEditingParty(party);
    if (party) {
      form.setFieldsValue(party);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingParty) {
        await dispatch(
          updateParty({
            matterId,
            partyId: editingParty._id || editingParty.id,
            data: values,
          }),
        );
      } else {
        await dispatch(addParty({ matterId, data: values }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingParty(null);
    } catch (error) {
      message.error("Failed to save party");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (partyId) => {
    try {
      await dispatch(removeParty({ matterId, partyId }));
      message.success("Party removed successfully");
    } catch (error) {
      message.error("Failed to remove party");
    }
  };

  // Columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center">
          {record.entityType === "individual" ? (
            <UserOutlined className="mr-2 text-gray-400" />
          ) : (
            <BankOutlined className="mr-2 text-gray-400" />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Entity Type",
      dataIndex: "entityType",
      key: "entityType",
      render: (type) => {
        const typeConfig = ENTITY_TYPES.find((t) => t.value === type);
        return (
          <Tag
            color={
              type === "company"
                ? "blue"
                : type === "individual"
                  ? "green"
                  : type === "government"
                    ? "red"
                    : "default"
            }>
            {typeConfig?.icon} {typeConfig?.label || type}
          </Tag>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) =>
        role ? (
          <Tag color="purple">{role}</Tag>
        ) : (
          <span className="text-gray-400">Not specified</span>
        ),
    },
    {
      title: "Registration No.",
      dataIndex: "registrationNumber",
      key: "registrationNumber",
      render: (number) => number || "-",
    },
    {
      title: "Jurisdiction",
      dataIndex: "jurisdiction",
      key: "jurisdiction",
      render: (jurisdiction) => jurisdiction || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Remove this party?"
            description="Are you sure you want to remove this party?"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="Yes"
            cancelText="No">
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <TeamOutlined className="mr-2" />
              Parties Involved ({parties.length})
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}>
              Add Party
            </Button>
          </div>
        }>
        <Table
          columns={columns}
          dataSource={parties}
          rowKey={(record) => record._id || record.id}
          pagination={parties.length > 10 ? { pageSize: 10 } : false}
          locale={{ emptyText: "No parties added yet" }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingParty ? "Edit Party" : "Add New Party"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Party Name"
            rules={[{ required: true, message: "Please enter party name" }]}>
            <Input placeholder="Enter party name" />
          </Form.Item>

          <Form.Item
            name="entityType"
            label="Entity Type"
            rules={[{ required: true, message: "Please select entity type" }]}>
            <Select placeholder="Select entity type">
              {ENTITY_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="role" label="Role in Transaction">
            <Select placeholder="Select role">
              <Option value="Buyer">Buyer</Option>
              <Option value="Seller">Seller</Option>
              <Option value="Shareholder">Shareholder</Option>
              <Option value="Investor">Investor</Option>
              <Option value="Lender">Lender</Option>
              <Option value="Borrower">Borrower</Option>
              <Option value="Joint Venture Partner">
                Joint Venture Partner
              </Option>
              <Option value="Target Company">Target Company</Option>
              <Option value="Acquiring Company">Acquiring Company</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="registrationNumber"
            label="Registration Number (if applicable)">
            <Input placeholder="e.g., RC123456, BN123456" />
          </Form.Item>

          <Form.Item name="jurisdiction" label="Jurisdiction">
            <Input placeholder="e.g., Nigeria, Lagos, Foreign" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingParty ? "Update Party" : "Add Party"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PartiesManager;
