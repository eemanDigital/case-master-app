import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  InputNumber,
  Space,
  Popconfirm,
  Modal,
  Form,
  Typography,
  Progress,
  Tooltip,
  Row,
  Col,
  Statistic,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addService,
  updateService,
  removeService,
  // updateServiceHours,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const ServicesManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();

  // Using your existing selectors from slice
  const details = useSelector((state) => state.retainer.selectedDetails);
  const loading = useSelector((state) => state.retainer.actionLoading);

  const services = details?.servicesIncluded || [];

  // Calculate totals
  const totalAllocated = services.reduce(
    (sum, s) => sum + (s.hoursAllocated || 0),
    0,
  );
  const totalUsed = services.reduce((sum, s) => sum + (s.hoursUsed || 0), 0);
  const utilizationRate =
    totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

  // Handle service operations
  const handleAddService = async (values) => {
    try {
      await dispatch(addService({ matterId, data: values })).unwrap();
      message.success("Service added successfully");
      setShowModal(false);
      form.resetFields();
      // Refresh details
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to add service");
    }
  };

  const handleUpdateService = async (serviceId, values) => {
    try {
      await dispatch(
        updateService({ matterId, serviceId, data: values }),
      ).unwrap();
      message.success("Service updated successfully");
      setShowModal(false);
      setEditingService(null);
      form.resetFields();
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to update service");
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await dispatch(removeService({ matterId, serviceId })).unwrap();
      message.success("Service removed successfully");
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to remove service");
    }
  };

  // const handleUpdateHours = async (serviceId, hoursUsed) => {
  //   try {
  //     await dispatch(
  //       updateServiceHours({
  //         matterId,
  //         serviceId,
  //         data: { hoursUsed },
  //       }),
  //     ).unwrap();
  //     message.success("Hours updated successfully");
  //     dispatch(fetchRetainerDetails(matterId));
  //   } catch (error) {
  //     message.error(error.message || "Failed to update hours");
  //   }
  // };

  // Service type options
  const serviceTypes = [
    "Legal Consultation",
    "Contract Review",
    "Document Drafting",
    "Compliance Review",
    "Legal Research",
    "Meeting Attendance",
    "Dispute Resolution",
    "Regulatory Filing",
    "Transaction Support",
    "Other",
  ];

  // Table columns
  const columns = [
    {
      title: "Service Type",
      dataIndex: "serviceType",
      key: "serviceType",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Allocated Hours",
      dataIndex: "hoursAllocated",
      key: "hoursAllocated",
      width: 120,
      align: "center",
      render: (text) => <Text strong>{text || 0}</Text>,
    },
    {
      title: "Used Hours",
      dataIndex: "hoursUsed",
      key: "hoursUsed",
      width: 120,
      align: "center",
      render: (text, record) => (
        <Tooltip title="Click to edit hours">
          <InputNumber
            min={0}
            value={text || 0}
            size="small"
            // onChange={(value) => handleUpdateHours(record._id, value)}
            style={{ width: 80 }}
          />
        </Tooltip>
      ),
    },
    {
      title: "Remaining",
      key: "remaining",
      width: 120,
      align: "center",
      render: (_, record) => {
        const allocated = record.hoursAllocated || 0;
        const used = record.hoursUsed || 0;
        const remaining = allocated - used;
        return (
          <Text
            type={
              remaining < 0 ? "danger" : remaining === 0 ? "warning" : "success"
            }>
            {remaining}
          </Text>
        );
      },
    },
    {
      title: "Utilization",
      key: "utilization",
      width: 150,
      render: (_, record) => {
        const allocated = record.hoursAllocated || 0;
        const used = record.hoursUsed || 0;
        const rate = allocated > 0 ? (used / allocated) * 100 : 0;

        return (
          <div>
            <Progress
              percent={Math.min(rate, 100)}
              size="small"
              status={
                rate > 100 ? "exception" : rate > 80 ? "active" : "normal"
              }
              showInfo={false}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {rate.toFixed(1)}%
            </Text>
          </div>
        );
      },
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
            size="small"
            onClick={() => {
              setEditingService(record);
              form.setFieldsValue(record);
              setShowModal(true);
            }}
          />
          <Popconfirm
            title="Delete this service?"
            description="Are you sure you want to delete this service?"
            onConfirm={() => handleDeleteService(record._id)}
            okText="Yes"
            cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Stats Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Services"
              value={services.length}
              prefix={<PlusOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Allocated Hours"
              value={totalAllocated}
              suffix="hrs"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Used Hours" value={totalUsed} suffix="hrs" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Utilization Rate"
              value={utilizationRate.toFixed(1)}
              suffix="%"
              valueStyle={{
                color:
                  utilizationRate > 100
                    ? "#cf1322"
                    : utilizationRate > 80
                      ? "#d46b08"
                      : "#389e0d",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}>
        <Title level={4} style={{ margin: 0 }}>
          Services Included
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingService(null);
            form.resetFields();
            setShowModal(true);
          }}>
          Add Service
        </Button>
      </div>

      {/* Services Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} services`,
          }}
          size="middle"
        />
      </Card>

      {/* Service Form Modal */}
      <Modal
        title={editingService ? "Edit Service" : "Add Service"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingService(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingService) {
              handleUpdateService(editingService._id, values);
            } else {
              handleAddService(values);
            }
          }}>
          <Form.Item
            name="serviceType"
            label="Service Type"
            rules={[{ required: true, message: "Please select service type" }]}>
            <Select
              placeholder="Select service type"
              showSearch
              optionFilterProp="children">
              {serviceTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}>
            <Input.TextArea
              rows={3}
              placeholder="Describe the service in detail..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hoursAllocated"
                label="Hours Allocated"
                rules={[
                  { required: true, message: "Please enter allocated hours" },
                  { type: "number", min: 0, message: "Hours must be positive" },
                ]}>
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hoursUsed"
                label="Hours Used"
                initialValue={0}
                rules={[
                  { type: "number", min: 0, message: "Hours must be positive" },
                ]}>
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicesManager;
