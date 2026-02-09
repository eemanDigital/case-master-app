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
  Select,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addRequirement,
  updateRequirement,
  deleteRequirement,
} from "../../redux/features/general/generalSlice";

import { REQUIREMENT_STATUSES } from "../../utils/generalConstants";

const { Option } = Select;
const { TextArea } = Input;

const RequirementsManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  const selectedDetails = useSelector((state) => state.general.selectedDetails);

  const actionLoading = useSelector((state) => state.general.actionLoading);

  // ✅ Extract generalDetail from nested structure
  const generalDetail = selectedDetails?.generalDetail || selectedDetails;
  const requirements = generalDetail?.specificRequirements || [];

  const handleAdd = useCallback(() => {
    setEditingRequirement(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback(
    (requirement) => {
      setEditingRequirement(requirement);
      form.setFieldsValue({
        requirement: requirement.requirement,
        status: requirement.status,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (requirementId) => {
      Modal.confirm({
        title: "Delete Requirement",
        content: "Are you sure you want to delete this requirement?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(
              deleteRequirement({ matterId, requirementId }),
            ).unwrap();
            message.success("Requirement deleted successfully");
          } catch (error) {
            message.error(error || "Failed to delete requirement");
          }
        },
      });
    },
    [dispatch, matterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        if (editingRequirement) {
          await dispatch(
            updateRequirement({
              matterId,
              requirementId: editingRequirement._id,
              data: values,
            }),
          ).unwrap();
          message.success("Requirement updated successfully");
        } else {
          await dispatch(addRequirement({ matterId, data: values })).unwrap();
          message.success("Requirement added successfully");
        }
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to save requirement");
      }
    },
    [dispatch, matterId, editingRequirement, form],
  );

  const columns = [
    {
      title: "Requirement",
      dataIndex: "requirement",
      key: "requirement",
      width: "60%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "25%",
      render: (status) => {
        const statusConfig = REQUIREMENT_STATUSES.find(
          (s) => s.value === status,
        );
        return (
          <Tag color={statusConfig?.color || "default"}>
            {statusConfig?.label || status}
          </Tag>
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
    total: requirements.length,
    pending: requirements.filter((r) => r.status === "pending").length,
    met: requirements.filter((r) => r.status === "met").length,
    notApplicable: requirements.filter((r) => r.status === "not-applicable")
      .length,
  };

  return (
    <div>
      <Card
        title="Specific Requirements"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Requirement
          </Button>
        }
        style={{ marginBottom: 16 }}>
        <Space size="large" style={{ marginBottom: 16 }}>
          <span>
            Total: <strong>{summary.total}</strong>
          </span>
          <span>
            Pending: <Tag color="orange">{summary.pending}</Tag>
          </span>
          <span>
            Met: <Tag color="green">{summary.met}</Tag>
          </span>
          <span>
            N/A: <Tag color="default">{summary.notApplicable}</Tag>
          </span>
        </Space>

        <Table
          columns={columns}
          dataSource={requirements}
          rowKey={(record) => record._id || record.id}
          loading={actionLoading}
          pagination={false}
          locale={{ emptyText: "No requirements added yet" }}
        />
      </Card>

      <Modal
        title={editingRequirement ? "Edit Requirement" : "Add Requirement"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="requirement"
            label="Requirement"
            rules={[
              { required: true, message: "Please enter the requirement" },
            ]}>
            <TextArea rows={3} placeholder="Describe the requirement..." />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
            initialValue="pending">
            <Select>
              {REQUIREMENT_STATUSES.map((s) => (
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

export default RequirementsManager;
