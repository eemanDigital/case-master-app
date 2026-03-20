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
  DatePicker,
  Typography,
  Space,
  Spin,
  message,
  Tooltip,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  fetchDashboard,
  markPaid,
  selectComplianceEntities,
  selectComplianceDashboard,
  selectComplianceLoading,
  selectComplianceActionLoading,
} from "../../redux/features/compliance/complianceSlice";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LivePenaltyCounter = ({ entity }) => {
  const [penalty, setPenalty] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!entity?.lastPenaltyCalculation || entity.complianceStatus === "compliant") {
      setPenalty(0);
      return;
    }

    const calculatePenalty = () => {
      const daysSinceDue = dayjs().diff(dayjs(entity.nextDueDate), "day");
      if (daysSinceDue <= 0) { setPenalty(0); setTimeLeft(`${Math.abs(daysSinceDue)} days remaining`); return; }
      const penaltyPerDay = entity.penaltyPerDay || 5000;
      const maxPenalty = entity.maxPenalty || 500000;
      const calculated = Math.min(daysSinceDue * penaltyPerDay, maxPenalty);
      setPenalty(calculated);
      const months = Math.floor(daysSinceDue / 30);
      const days = daysSinceDue % 30;
      setTimeLeft(`${months > 0 ? `${months}mo ` : ""}${days}d overdue`);
    };

    calculatePenalty();
    const interval = setInterval(calculatePenalty, 60000);
    return () => clearInterval(interval);
  }, [entity]);

  if (!penalty || entity.complianceStatus === "compliant") return null;

  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <WarningOutlined style={{ color: "#ef4444" }} />
      <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
        Live Penalty: <span style={{ fontFamily: "monospace" }}>₦{penalty.toLocaleString()}</span>
      </span>
      <span style={{ fontSize: 11, color: "#f87171" }}>({timeLeft})</span>
    </div>
  );
};

const CreateEntityModal = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(createEntity(values)).unwrap();
      message.success("Entity added successfully");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err || "Failed to add entity");
    }
  };

  return (
    <Modal title="Add Compliance Entity" open={visible} onOk={handleSubmit} onCancel={onClose} confirmLoading={loading} width={600}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="entityName" label="Entity Name" rules={[{ required: true }]}>
              <Input placeholder="e.g., ABC Holdings Ltd" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="entityType" label="Entity Type" rules={[{ required: true }]}>
              <Select placeholder="Select type" options={[
                { value: "ltd", label: "Limited Liability Company" },
                { value: "plc", label: "Public Limited Company" },
                { value: "gty", label: "Incorporated Trustees" },
                { value: "partnership", label: "Partnership" },
                { value: "business_name", label: "Business Name" },
              ]} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="cacRegistrationNumber" label="CAC Reg. Number" rules={[{ required: true }]}>
              <Input placeholder="e.g., RC 123456" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="incorporationDate" label="Incorporation Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="nextDueDate" label="Annual Return Due Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="penaltyPerDay" label="Penalty/Day (₦)">
              <Input type="number" placeholder="5000" defaultValue="5000" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="address" label="Registered Address">
          <Input.TextArea rows={2} placeholder="Entity's registered office address" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ComplianceTrackerPage = () => {
  const dispatch = useDispatch();
  const entities = useSelector(selectComplianceEntities);
  const dashboard = useSelector(selectComplianceDashboard);
  const loading = useSelector(selectComplianceLoading);
  const actionLoading = useSelector(selectComplianceActionLoading);

  const [createVisible, setCreateVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchEntities());
  }, [dispatch]);

  const columns = [
    { title: "Entity", dataIndex: "entityName", key: "entityName", render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v}</div><Text type="secondary" style={{ fontSize: 11 }}>{r.entityType} • {r.cacRegistrationNumber}</Text></div> },
    { title: "Status", dataIndex: "complianceStatus", key: "complianceStatus", render: (v) => <Tag color={v === "compliant" ? "green" : v === "pending" ? "orange" : "red"}>{v?.toUpperCase()}</Tag> },
    { title: "Due Date", dataIndex: "nextDueDate", key: "nextDueDate", render: (d) => d ? dayjs(d).format("DD MMM YYYY") : "—" },
    { title: "Last Filed", dataIndex: "lastAnnualReturnDate", key: "lastAnnualReturnDate", render: (d) => d ? dayjs(d).format("DD MMM YYYY") : "Never" },
    { title: "Penalty", key: "penalty", render: (_, r) => <LivePenaltyCounter entity={r} /> },
    { title: "Actions", key: "actions", render: (_, r) => (
      <Space>
        <Button size="small" type="link" onClick={() => dispatch(markPaid({ id: r._id, data: { amount: r.currentPenalty || 0 } }))}>Mark Paid</Button>
        <Button size="small" type="link" danger onClick={() => { Modal.confirm({ title: "Delete Entity", content: "Are you sure?", onOk: () => dispatch(deleteEntity(r._id)) }); }}>Delete</Button>
      </Space>
    )},
  ];

  const isOverdue = dashboard?.stats?.overdue > 0;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>CAC Compliance Tracker</Title>
            <Text type="secondary">Monitor annual returns and regulatory compliance</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { dispatch(fetchDashboard()); dispatch(fetchEntities()); }}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>Add Entity</Button>
          </Space>
        </div>

        {isOverdue && (
          <Alert
            message="Overdue Compliance"
            description={`You have ${dashboard?.stats?.overdue} entity(ies) with overdue annual returns. Penalties are accruing daily.`}
            type="error"
            icon={<WarningOutlined />}
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
            action={<Button size="small" danger>View Details</Button>}
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Total Entities" value={dashboard?.stats?.total || 0} prefix={<SafetyCertificateOutlined style={{ color: "#3b82f6" }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Compliant" value={dashboard?.stats?.compliant || 0} valueStyle={{ color: "#10b981" }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Pending" value={dashboard?.stats?.pending || 0} valueStyle={{ color: "#f59e0b" }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Overdue" value={dashboard?.stats?.overdue || 0} valueStyle={{ color: "#ef4444" }} prefix={<WarningOutlined />} />
            </Card>
          </Col>
        </Row>

        <Card bordered={false} style={{ borderRadius: 12 }} title="Tracked Entities">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table dataSource={entities} columns={columns} rowKey="_id" pagination={{ pageSize: 10 }} />
          )}
        </Card>
      </div>

      <CreateEntityModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={() => { dispatch(fetchDashboard()); dispatch(fetchEntities()); }}
        loading={actionLoading}
      />
    </>
  );
};

export default ComplianceTrackerPage;
