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
  Tag,
  Badge,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addService,
  updateService,
  removeService,
  updateServiceUsage,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * ServicesManager Component
 * Manages retainer services with Nigerian billing model
 * Supports LPRO scales and unit-based tracking
 */
const ServicesManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();

  // Redux state
  const details = useSelector((state) => state.retainer.selectedDetails);
  const loading = useSelector((state) => state.retainer.actionLoading);

  const services = details?.servicesIncluded || [];

  // Nigerian service types
  const serviceTypes = [
    { value: "company-secretarial", label: "Company Secretarial" },
    { value: "litigation-advocacy", label: "Litigation & Advocacy" },
    { value: "perfection-of-title", label: "Perfection of Title" },
    { value: "regulatory-compliance", label: "Regulatory Compliance" },
    { value: "legal-opinion", label: "Legal Opinion" },
    { value: "drafting-review", label: "Drafting & Review" },
    { value: "cac-registration", label: "CAC Registration" },
    { value: "notarial-services", label: "Notarial Services" },
    { value: "arbitration-mediation", label: "Arbitration & Mediation" },
    { value: "other", label: "Other Services" },
  ];

  // Billing models
  const billingModels = [
    { value: "within-retainer", label: "Within Retainer", color: "blue" },
    { value: "fixed-fee", label: "Fixed Fee", color: "green" },
    { value: "lpro-scale", label: "LPRO Scale", color: "purple" },
    { value: "per-item", label: "Per Item", color: "orange" },
  ];

  // LPRO 2023 Scales
  const lproScales = [
    { value: "Scale 1", label: "Scale 1 (Simplest)" },
    { value: "Scale 2", label: "Scale 2" },
    { value: "Scale 3", label: "Scale 3" },
    { value: "Scale 4", label: "Scale 4" },
    { value: "Scale 5", label: "Scale 5 (Most Complex)" },
    { value: "N/A", label: "Not Applicable" },
  ];

  // Unit types
  const unitTypes = [
    { value: "matters", label: "Matters" },
    { value: "filings", label: "Filings" },
    { value: "documents", label: "Documents" },
    { value: "meetings", label: "Meetings" },
    { value: "court_appearances", label: "Court Appearances" },
    { value: "hours", label: "Hours" },
    { value: "sessions", label: "Sessions" },
  ];

  // Calculate statistics
  const calculateStats = () => {
    const totalServices = services.length;
    const totalLimit = services.reduce(
      (sum, s) => sum + (s.serviceLimit || 0),
      0,
    );
    const totalUsed = services.reduce((sum, s) => sum + (s.usageCount || 0), 0);
    const utilizationRate = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    const servicesAtCapacity = services.filter(
      (s) => s.usageCount >= s.serviceLimit,
    ).length;
    const servicesNearCapacity = services.filter(
      (s) =>
        s.serviceLimit > 0 &&
        s.usageCount / s.serviceLimit >= 0.8 &&
        s.usageCount < s.serviceLimit,
    ).length;

    return {
      totalServices,
      totalLimit,
      totalUsed,
      utilizationRate,
      servicesAtCapacity,
      servicesNearCapacity,
    };
  };

  const stats = calculateStats();

  // Handlers
  const handleAddService = async (values) => {
    try {
      await dispatch(addService({ matterId, data: values })).unwrap();
      message.success("Service added successfully");
      setShowModal(false);
      form.resetFields();
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

  const handleUpdateUsage = async (serviceId, usageCount) => {
    try {
      await dispatch(
        updateServiceUsage({
          matterId,
          serviceId,
          data: { usageCount },
        }),
      ).unwrap();
      message.success("Usage updated successfully");
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to update usage");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Service Type",
      dataIndex: "serviceType",
      key: "serviceType",
      width: 180,
      render: (text) => {
        const service = serviceTypes.find((s) => s.value === text);
        return (
          <Text strong className="text-gray-800">
            {service?.label || text}
          </Text>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text className="text-gray-600">{text || "N/A"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Billing Model",
      dataIndex: "billingModel",
      key: "billingModel",
      width: 140,
      render: (model) => {
        const billing = billingModels.find((b) => b.value === model);
        return (
          <Tag color={billing?.color || "default"}>
            {billing?.label || model}
          </Tag>
        );
      },
    },
    {
      title: "LPRO Scale",
      dataIndex: "lproScale",
      key: "lproScale",
      width: 120,
      render: (scale) => (
        <Tag color={scale === "N/A" ? "default" : "purple"}>{scale}</Tag>
      ),
    },
    {
      title: "Limit",
      dataIndex: "serviceLimit",
      key: "serviceLimit",
      width: 100,
      align: "center",
      render: (limit, record) => (
        <Space direction="vertical" size={0} className="w-full">
          <Text strong className="text-blue-600">
            {limit || 0}
          </Text>
          <Text type="secondary" className="text-xs">
            {record.unitDescription || "units"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Used",
      dataIndex: "usageCount",
      key: "usageCount",
      width: 120,
      align: "center",
      render: (count, record) => (
        <Tooltip title="Click to edit usage">
          <InputNumber
            min={0}
            max={record.serviceLimit || 999}
            value={count || 0}
            size="small"
            onChange={(value) => handleUpdateUsage(record._id, value)}
            style={{ width: 80 }}
            className={
              count >= record.serviceLimit
                ? "border-red-400"
                : count / record.serviceLimit >= 0.8
                  ? "border-yellow-400"
                  : ""
            }
          />
        </Tooltip>
      ),
    },
    {
      title: "Remaining",
      key: "remaining",
      width: 100,
      align: "center",
      render: (_, record) => {
        const limit = record.serviceLimit || 0;
        const used = record.usageCount || 0;
        const remaining = limit - used;
        const status =
          remaining <= 0
            ? "error"
            : remaining / limit <= 0.2
              ? "warning"
              : "success";

        return (
          <Badge
            status={status}
            text={
              <Text
                strong
                type={
                  remaining <= 0
                    ? "danger"
                    : remaining / limit <= 0.2
                      ? "warning"
                      : "success"
                }>
                {remaining}
              </Text>
            }
          />
        );
      },
    },
    {
      title: "Utilization",
      key: "utilization",
      width: 150,
      render: (_, record) => {
        const limit = record.serviceLimit || 0;
        const used = record.usageCount || 0;
        const rate = limit > 0 ? (used / limit) * 100 : 0;
        const status =
          rate >= 100 ? "exception" : rate >= 80 ? "active" : "normal";

        return (
          <div className="w-full">
            <Progress
              percent={Math.min(rate, 100)}
              size="small"
              status={status}
              showInfo={false}
            />
            <Text type="secondary" className="text-xs mt-1 block">
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
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit service">
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
          </Tooltip>
          <Popconfirm
            title="Delete this service?"
            description="This will permanently remove this service from the retainer."
            onConfirm={() => handleDeleteService(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}>
            <Tooltip title="Delete service">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="services-manager">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Services"
              value={stats.totalServices}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Units"
              value={stats.totalLimit}
              suffix="units"
              prefix={<ClockCircleOutlined className="text-green-500" />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Units Used"
              value={stats.totalUsed}
              suffix={`/ ${stats.totalLimit}`}
              valueStyle={{
                color:
                  stats.utilizationRate >= 80
                    ? "#cf1322"
                    : stats.utilizationRate >= 60
                      ? "#d46b08"
                      : "#389e0d",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Utilization Rate"
              value={stats.utilizationRate.toFixed(1)}
              suffix="%"
              prefix={
                stats.utilizationRate >= 80 ? (
                  <WarningOutlined className="text-red-500" />
                ) : (
                  <CheckCircleOutlined className="text-green-500" />
                )
              }
              valueStyle={{
                color:
                  stats.utilizationRate >= 100
                    ? "#cf1322"
                    : stats.utilizationRate >= 80
                      ? "#faad14"
                      : "#389e0d",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {stats.servicesAtCapacity > 0 && (
        <div className="mb-4">
          <Badge
            status="error"
            text={
              <Text type="danger">
                {stats.servicesAtCapacity} service(s) at full capacity
              </Text>
            }
          />
        </div>
      )}
      {stats.servicesNearCapacity > 0 && (
        <div className="mb-4">
          <Badge
            status="warning"
            text={
              <Text type="warning">
                {stats.servicesNearCapacity} service(s) near capacity (80%+)
              </Text>
            }
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">
          <FileTextOutlined className="mr-2" />
          Services Included
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingService(null);
            form.resetFields();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700">
          Add Service
        </Button>
      </div>

      {/* Services Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={services}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} service(s)`,
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No services added yet">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowModal(true)}>
                  Add First Service
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Service Form Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {editingService ? "Edit Service" : "Add Service"}
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingService(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={700}
        okText={editingService ? "Update Service" : "Add Service"}
        cancelText="Cancel">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingService) {
              handleUpdateService(editingService._id, values);
            } else {
              handleAddService(values);
            }
          }}
          initialValues={{
            billingModel: "within-retainer",
            lproScale: "N/A",
            unitDescription: "matters",
            serviceLimit: 1,
            usageCount: 0,
          }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[
                  { required: true, message: "Please select service type" },
                ]}>
                <Select
                  placeholder="Select service type"
                  showSearch
                  optionFilterProp="children">
                  {serviceTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billingModel"
                label="Billing Model"
                rules={[
                  { required: true, message: "Please select billing model" },
                ]}>
                <Select placeholder="Select billing model">
                  {billingModels.map((model) => (
                    <Option key={model.value} value={model.value}>
                      <Tag color={model.color}>{model.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Service Description"
            rules={[{ required: true, message: "Please enter description" }]}>
            <TextArea
              rows={3}
              placeholder="Describe the service in detail..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="serviceLimit"
                label="Service Limit"
                rules={[
                  { required: true, message: "Required" },
                  { type: "number", min: 1, message: "Must be at least 1" },
                ]}>
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="10"
                  addonAfter="units"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unitDescription"
                label="Unit Type"
                rules={[{ required: true, message: "Required" }]}>
                <Select placeholder="Select unit type">
                  {unitTypes.map((unit) => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="usageCount"
                label="Current Usage"
                rules={[
                  { type: "number", min: 0, message: "Cannot be negative" },
                ]}>
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="0"
                  addonAfter="used"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lproScale"
                label="LPRO Scale (2023)"
                rules={[
                  { required: true, message: "Please select LPRO scale" },
                ]}>
                <Select placeholder="Select LPRO scale">
                  {lproScales.map((scale) => (
                    <Option key={scale.value} value={scale.value}>
                      {scale.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lproReference" label="LPRO Reference (Optional)">
                <Input placeholder="e.g., Item 12(a) - Sale of Land" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicesManager;
