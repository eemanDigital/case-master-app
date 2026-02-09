import React, { useState, useCallback } from "react";
import { Card, Table, Button, Space, Modal, Form, Input, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addParty,
  updateParty,
  deleteParty,
} from "../../redux/features/general/generalSlice";

const PartiesManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  const selectedDetails = useSelector((state) => state.general.selectedDetails);
  const actionLoading = useSelector((state) => state.general.actionLoading);

  // ✅ Extract generalDetail from nested structure
  const generalDetail = selectedDetails?.generalDetail || selectedDetails;
  const parties = generalDetail?.partiesInvolved || [];

  const handleAdd = useCallback(() => {
    setEditingParty(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback(
    (party) => {
      setEditingParty(party);
      form.setFieldsValue({
        name: party.name,
        role: party.role,
        contact: party.contact,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (partyId) => {
      Modal.confirm({
        title: "Delete Party",
        content: "Are you sure you want to remove this party?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(deleteParty({ matterId, partyId })).unwrap();
            message.success("Party deleted successfully");
          } catch (error) {
            message.error(error || "Failed to delete party");
          }
        },
      });
    },
    [dispatch, matterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        if (editingParty) {
          await dispatch(
            updateParty({
              matterId,
              partyId: editingParty._id || editingParty.id,
              data: values,
            }),
          ).unwrap();
          message.success("Party updated successfully");
        } else {
          await dispatch(addParty({ matterId, data: values })).unwrap();
          message.success("Party added successfully");
        }
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to save party");
      }
    },
    [dispatch, matterId, editingParty, form],
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "35%",
      render: (name) => (
        <Space>
          <UserOutlined />
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: "30%",
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      width: "25%",
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
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
            onClick={() => handleDelete(record._id || record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Parties Involved"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Party
          </Button>
        }>
        <Table
          columns={columns}
          dataSource={parties}
          rowKey={(record) => record._id || record.id}
          loading={actionLoading}
          pagination={false}
          locale={{ emptyText: "No parties added yet" }}
        />
      </Card>

      <Modal
        title={editingParty ? "Edit Party" : "Add Party"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter the party name" },
            ]}>
            <Input placeholder="e.g., John Doe, ABC Company" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please enter the role" }]}>
            <Input placeholder="e.g., Vendor, Purchaser, Witness" />
          </Form.Item>

          <Form.Item name="contact" label="Contact Information">
            <Input placeholder="Phone or email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PartiesManager;
