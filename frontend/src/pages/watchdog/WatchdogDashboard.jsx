import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Space,
  Spin,
  message,
  Alert,
  Badge,
  Divider,
  Empty,
  Timeline,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
  DeleteOutlined,
  BellOutlined,
  RobotOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchDashboard,
  fetchMonitoredEntities,
  fetchAlerts,
  addMonitoredEntity,
  removeMonitoredEntity,
  checkEntityStatus,
  dismissAlert,
  dismissAllAlerts,
  selectMonitoredEntities,
  selectWatchdogAlerts,
  selectWatchdogDashboard,
  selectWatchdogLoading,
  selectWatchdogActionLoading,
  selectWatchdogChecking,
} from "../../redux/features/watchdog/watchdogSlice";
import useMattersSelectOptions from "../../hooks/useMattersSelectOptions";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const ENTITY_TYPES = [
  { value: "ltd", label: "Limited Liability Company (Ltd)" },
  { value: "plc", label: "Public Limited Company (Plc)" },
  { value: "business_name", label: "Business Name (BN)" },
  { value: "incorporated_trustees", label: "Incorporated Trustees" },
];

const CHECK_FREQUENCIES = [
  { value: "hourly", label: "Every Hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const STATUS_CONFIG = {
  active: { color: "green", icon: <CheckCircleOutlined />, label: "Active" },
  inactive: { color: "red", icon: <ExclamationCircleOutlined />, label: "Inactive" },
  pending: { color: "orange", icon: <WarningOutlined />, label: "Pending" },
  unknown: { color: "default", icon: <RobotOutlined />, label: "Unknown" },
};

const CreateEntityModal = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState(null);

  const { mattersOptions, loading: mattersLoading, fetchMatters } = useMattersSelectOptions({
    status: "active",
    limit: 100,
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const entityData = {
        ...values,
        linkedMatterId: values.linkedMatterId || undefined,
      };

      await dispatch(addMonitoredEntity(entityData)).unwrap();
      message.success("Entity added to monitoring");
      form.resetFields();
      setSelectedMatter(null);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.message || err || "Failed to add entity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedMatter(null);
    onClose();
  };

  const matterOptions = mattersOptions.map((opt) => ({
    value: opt.value,
    label: opt.label,
    subtitle: opt.subtitle,
  }));

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: "#3b82f6" }} />
          <span>Add Entity to Monitor</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Add to Monitor"
      confirmLoading={submitting || loading}
      width={550}
      destroyOnClose>
      <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="entityName"
              label="Entity Name"
              rules={[{ required: true, message: "Please enter entity name" }]}>
              <Input placeholder="e.g., ABC Holdings Ltd" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="registrationNumber"
              label="CAC Registration Number"
              rules={[{ required: true, message: "Please enter CAC number" }]}
              extra={
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Format: RC 123456 or BN 123456
                </Text>
              }>
              <Input placeholder="e.g., RC 123456" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="entityType"
              label="Entity Type"
              rules={[{ required: true, message: "Please select type" }]}>
              <Select placeholder="Select type" options={ENTITY_TYPES} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="checkFrequency" label="Check Frequency" initialValue="daily">
              <Select options={CHECK_FREQUENCIES} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Form.Item
          name="linkedMatterId"
          label={
            <Space>
              <LinkOutlined style={{ color: "#3b82f6" }} />
              <span>Link to Matter (Optional)</span>
            </Space>
          }>
          <Select
            showSearch
            placeholder="Search and select a matter..."
            options={matterOptions}
            loading={mattersLoading}
            onSearch={fetchMatters}
            onFocus={() => fetchMatters("")}
            filterOption={false}
            notFoundContent={mattersLoading ? "Loading..." : "No matters found"}
            allowClear
            labelInValue
            onChange={(value) => setSelectedMatter(value?.value || null)}
          />
        </Form.Item>

        {selectedMatter && (
          <div
            style={{
              padding: "12px 16px",
              background: "#eff6ff",
              borderRadius: 8,
              marginTop: 8,
              border: "1px solid #bfdbfe",
            }}>
            <Space>
              <FileDoneOutlined style={{ color: "#3b82f6" }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Linked to matter: {selectedMatter.label || selectedMatter}
              </Text>
            </Space>
          </div>
        )}

        <Alert
          type="info"
          icon={<InfoCircleOutlined />}
          message="How it works"
          description="We'll automatically check the CAC portal for status changes on this entity and alert you when changes are detected."
          style={{ marginTop: 16 }}
        />
      </Form>
    </Modal>
  );
};

const WatchdogDashboard = () => {
  const dispatch = useDispatch();
  const entities = useSelector(selectMonitoredEntities);
  const alerts = useSelector(selectWatchdogAlerts);
  const dashboard = useSelector(selectWatchdogDashboard);
  const loading = useSelector(selectWatchdogLoading);
  const actionLoading = useSelector(selectWatchdogActionLoading);
  const checking = useSelector(selectWatchdogChecking);

  const [createVisible, setCreateVisible] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    setTableLoading(true);
    try {
      await Promise.all([
        dispatch(fetchDashboard()),
        dispatch(fetchMonitoredEntities()),
        dispatch(fetchAlerts()),
      ]);
    } catch (error) {
      message.error("Failed to load watchdog data");
    } finally {
      setTableLoading(false);
    }
  };

  const handleCheckStatus = async (entity) => {
    try {
      await dispatch(checkEntityStatus(entity._id)).unwrap();
      message.success(`Status check completed for ${entity.entityName}`);
      loadData();
    } catch (err) {
      message.error("Status check failed. Please try again.");
    }
  };

  const handleRemoveEntity = (entity) => {
    Modal.confirm({
      title: "Remove from Monitoring",
      content: (
        <span>
          Stop monitoring <strong>{entity.entityName}</strong>? You can re-add it anytime.
        </span>
      ),
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(removeMonitoredEntity(entity._id)).unwrap();
          message.success("Entity removed from monitoring");
          loadData();
        } catch {
          message.error("Failed to remove entity");
        }
      },
    });
  };

  const entityColumns = [
    {
      title: "Entity",
      dataIndex: "entityName",
      key: "entityName",
      render: (v, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{v}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {ENTITY_TYPES.find((t) => t.value === r.entityType)?.label || r.entityType} •{" "}
              {r.registrationNumber}
            </Text>
          </div>
          {r.linkedMatterId && (
            <Tag icon={<LinkOutlined />} style={{ marginTop: 4, borderRadius: 4, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1" }}>
              Matter Linked
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Last Check",
      dataIndex: "lastChecked",
      key: "lastChecked",
      sorter: (a, b) => dayjs(a.lastChecked).unix() - dayjs(b.lastChecked).unix(),
      render: (d) =>
        d ? (
          <Space direction="vertical" size={0}>
            <Text>{dayjs(d).format("DD MMM HH:mm")}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(d).fromNow()}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Never</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "currentStatus",
      key: "currentStatus",
      render: (v) => {
        const config = STATUS_CONFIG[v] || STATUS_CONFIG.unknown;
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Alerts",
      dataIndex: "alertCount",
      key: "alertCount",
      render: (v) =>
        v > 0 ? (
          <Badge count={v} style={{ backgroundColor: "#ef4444" }} />
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            icon={<SyncOutlined spin={checking && r._id === entities[0]?._id} />}
            onClick={() => handleCheckStatus(r)}>
            Check
          </Button>
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveEntity(r)}
          />
        </Space>
      ),
    },
  ];

  const alertColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (v) => {
        const colors = {
          status_change: "red",
          check_failed: "orange",
          reminder: "blue",
        };
        return <Tag color={colors[v] || "default"}>{v?.replace(/_/g, " ").toUpperCase()}</Tag>;
      },
    },
    {
      title: "Entity",
      dataIndex: "entityName",
      key: "entityName",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => dayjs(d).format("DD MMM HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, r) => (
        <Button size="small" type="link" onClick={() => dispatch(dismissAlert(r._id))}>
          Dismiss
        </Button>
      ),
    },
  ];

  const stats = dashboard?.stats || {};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>
      <div
        style={{
          padding: 24,
          background: "#f1f5f9",
          minHeight: "100vh",
          fontFamily: "'DM Sans', sans-serif",
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              CAC Status Watchdog
            </Title>
            <Text type="secondary">Automated CAC portal monitoring for your entities</Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined spin={loading} />} onClick={loadData} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
              Add to Monitor
            </Button>
          </Space>
        </div>

        {alerts.length > 0 && (
          <Alert
            message={
              <Space>
                <BellOutlined />
                <span>Active Alerts</span>
              </Space>
            }
            description={`${alerts.length} alert(s) require your attention. Click to view details.`}
            type="warning"
            icon={<BellOutlined />}
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
            action={
              <Button size="small" onClick={() => dispatch(dismissAllAlerts())}>
                Dismiss All
              </Button>
            }
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Monitored Entities</Text>}
                value={stats.monitored || 0}
                prefix={<RobotOutlined style={{ color: "#3b82f6" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Active</Text>}
                value={stats.active || 0}
                valueStyle={{ color: "#10b981" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Inactive</Text>}
                value={stats.inactive || 0}
                valueStyle={{ color: "#ef4444" }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Active Alerts</Text>}
                value={alerts.length}
                valueStyle={{ color: "#f59e0b" }}
                prefix={<BellOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {alerts.length > 0 && (
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} title="Recent Alerts">
            <Table
              dataSource={alerts.slice(0, 5)}
              columns={alertColumns}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        )}

        <Card bordered={false} style={{ borderRadius: 12 }} title="Monitored Entities">
          {tableLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : entities.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical">
                  <Text type="secondary">No entities being monitored yet</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Add entities to start monitoring their CAC status
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateVisible(true)}
                    style={{ marginTop: 8 }}>
                    Add Your First Entity
                  </Button>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              dataSource={entities}
              columns={entityColumns}
              rowKey="_id"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} entities` }}
              scroll={{ x: "max-content" }}
              size="middle"
            />
          )}
        </Card>
      </div>

      <CreateEntityModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={loadData}
        loading={actionLoading}
      />
    </>
  );
};

export default WatchdogDashboard;
