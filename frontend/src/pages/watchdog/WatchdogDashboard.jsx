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
} from "@ant-design/icons";
import dayjs from "dayjs";
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

const { Title, Text } = Typography;

const WatchdogDashboard = () => {
  const dispatch = useDispatch();
  const entities = useSelector(selectMonitoredEntities);
  const alerts = useSelector(selectWatchdogAlerts);
  const dashboard = useSelector(selectWatchdogDashboard);
  const loading = useSelector(selectWatchdogLoading);
  const actionLoading = useSelector(selectWatchdogActionLoading);
  const checking = useSelector(selectWatchdogChecking);

  const [createVisible, setCreateVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchMonitoredEntities());
    dispatch(fetchAlerts());
  }, [dispatch]);

  const handleAddEntity = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(addMonitoredEntity(values)).unwrap();
      message.success("Entity added to monitoring");
      form.resetFields();
      setCreateVisible(false);
      dispatch(fetchMonitoredEntities());
    } catch (err) {
      message.error(err || "Failed to add entity");
    }
  };

  const handleCheckStatus = async (entity) => {
    try {
      await dispatch(checkEntityStatus(entity._id)).unwrap();
      message.success(`Status check completed for ${entity.entityName}`);
      dispatch(fetchMonitoredEntities());
    } catch (err) {
      message.error("Status check failed");
    }
  };

  const handleRemoveEntity = (entity) => {
    Modal.confirm({
      title: "Remove from Monitoring",
      content: `Stop monitoring ${entity.entityName}?`,
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(removeMonitoredEntity(entity._id)).unwrap();
          message.success("Entity removed");
          dispatch(fetchMonitoredEntities());
        } catch {
          message.error("Failed to remove entity");
        }
      },
    });
  };

  const entityColumns = [
    { title: "Entity", dataIndex: "entityName", key: "entityName", render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v}</div><Text type="secondary" style={{ fontSize: 11 }}>{r.registrationNumber}</Text></div> },
    { title: "Last Check", dataIndex: "lastChecked", key: "lastChecked", render: (d) => d ? dayjs(d).format("DD MMM HH:mm") : "Never" },
    { title: "Status", dataIndex: "currentStatus", key: "currentStatus", render: (v) => <Tag color={v === "active" ? "green" : v === "inactive" ? "red" : "orange"}>{v?.toUpperCase()}</Tag> },
    { title: "Alerts", dataIndex: "alertCount", key: "alertCount", render: (v) => v > 0 ? <Badge count={v} style={{ backgroundColor: "#ef4444" }} /> : "—" },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<SyncOutlined spin={checking} />} onClick={() => handleCheckStatus(r)} loading={checking}>Check</Button>
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveEntity(r)} />
        </Space>
      ),
    },
  ];

  const alertColumns = [
    { title: "Type", dataIndex: "type", key: "type", render: (v) => <Tag color={v === "status_change" ? "red" : "orange"}>{v?.replace("_", " ").toUpperCase()}</Tag> },
    { title: "Entity", dataIndex: "entityName", key: "entityName", render: (v) => <Text strong>{v}</Text> },
    { title: "Message", dataIndex: "message", key: "message" },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", render: (d) => dayjs(d).format("DD MMM HH:mm") },
    { title: "Actions", key: "actions", render: (_, r) => <Button size="small" type="link" onClick={() => dispatch(dismissAlert(r._id))}>Dismiss</Button> },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>CAC Status Watchdog</Title>
            <Text type="secondary">Automated CAC portal monitoring for your entities</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { dispatch(fetchDashboard()); dispatch(fetchMonitoredEntities()); dispatch(fetchAlerts()); }}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>Add to Monitor</Button>
          </Space>
        </div>

        {alerts.length > 0 && (
          <Alert
            message="Active Alerts"
            description={`${alerts.length} alert(s) require your attention`}
            type="warning"
            icon={<BellOutlined />}
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
            action={<Button size="small" onClick={() => dispatch(dismissAllAlerts())}>Dismiss All</Button>}
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Monitored Entities" value={dashboard?.stats?.monitored || 0} prefix={<RobotOutlined style={{ color: "#3b82f6" }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Active" value={dashboard?.stats?.active || 0} valueStyle={{ color: "#10b981" }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Inactive" value={dashboard?.stats?.inactive || 0} valueStyle={{ color: "#ef4444" }} prefix={<WarningOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Active Alerts" value={alerts.length} valueStyle={{ color: "#f59e0b" }} prefix={<BellOutlined />} />
            </Card>
          </Col>
        </Row>

        {alerts.length > 0 && (
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} title="Recent Alerts">
            <Table dataSource={alerts.slice(0, 5)} columns={alertColumns} rowKey="_id" pagination={false} size="small" />
          </Card>
        )}

        <Card bordered={false} style={{ borderRadius: 12 }} title="Monitored Entities">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table dataSource={entities} columns={entityColumns} rowKey="_id" pagination={{ pageSize: 10 }} />
          )}
        </Card>
      </div>

      <Modal title="Add Entity to Monitor" open={createVisible} onOk={handleAddEntity} onCancel={() => { setCreateVisible(false); form.resetFields(); }} confirmLoading={actionLoading} width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="entityName" label="Entity Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., ABC Holdings Ltd" />
          </Form.Item>
          <Form.Item name="registrationNumber" label="CAC Registration Number" rules={[{ required: true }]}>
            <Input placeholder="e.g., RC 123456 or BN 123456" />
          </Form.Item>
          <Form.Item name="entityType" label="Entity Type" rules={[{ required: true }]}>
            <Select options={[
              { value: "ltd", label: "Limited Liability Company" },
              { value: "plc", label: "Public Limited Company" },
              { value: "business_name", label: "Business Name" },
            ]} placeholder="Select type" />
          </Form.Item>
          <Form.Item name="checkFrequency" label="Check Frequency" initialValue="daily">
            <Select options={[
              { value: "hourly", label: "Every Hour" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default WatchdogDashboard;
