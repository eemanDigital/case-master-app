import { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  Divider,
  Empty,
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
  LinkOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
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
import useMattersSelectOptions from "../../hooks/useMattersSelectOptions";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { Title, Text } = Typography;

const ENTITY_TYPES = [
  { value: "ltd", label: "Limited Liability Company (Ltd)" },
  { value: "plc", label: "Public Limited Company (Plc)" },
  { value: "gty", label: "Incorporated Trustees (Gty)" },
  { value: "partnership", label: "Partnership" },
  { value: "business_name", label: "Business Name (BN)" },
];

const LivePenaltyCounter = ({ entity }) => {
  const [penalty, setPenalty] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!entity?.nextDueDate || entity.complianceStatus === "compliant") {
      setPenalty(0);
      return;
    }

    const calculatePenalty = () => {
      const daysSinceDue = dayjs().diff(dayjs(entity.nextDueDate), "day");
      if (daysSinceDue <= 0) {
        setPenalty(0);
        setTimeLeft(`${Math.abs(daysSinceDue)} days remaining`);
        return;
      }
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
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 8,
        padding: "8px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}>
      <WarningOutlined style={{ color: "#ef4444" }} />
      <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
        Live Penalty:{" "}
        <span style={{ fontFamily: "monospace" }}>
          ₦{penalty.toLocaleString()}
        </span>
      </span>
      <span style={{ fontSize: 11, color: "#f87171" }}>({timeLeft})</span>
    </div>
  );
};

LivePenaltyCounter.propTypes = {
  entity: PropTypes.shape({
    nextDueDate: PropTypes.string,
    complianceStatus: PropTypes.string,
    penaltyPerDay: PropTypes.number,
    maxPenalty: PropTypes.number,
  }),
};

const CreateEntityModal = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
        nextDueDate: values.nextDueDate?.toISOString(),
        incorporationDate: values.incorporationDate?.toISOString(),
        linkedMatterId: values.linkedMatterId || undefined,
      };

      await dispatch(createEntity(entityData)).unwrap();
      message.success("Entity added successfully");
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
          <SafetyCertificateOutlined style={{ color: "#10b981" }} />
          <span>Add Compliance Entity</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Add Entity"
      confirmLoading={submitting || loading}
      width={650}
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
              name="entityType"
              label="Entity Type"
              rules={[{ required: true, message: "Please select type" }]}>
              <Select placeholder="Select type" options={ENTITY_TYPES} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="cacRegistrationNumber"
              label="CAC Reg. Number"
              rules={[{ required: true, message: "Please enter CAC number" }]}>
              <Input placeholder="e.g., RC 123456 or BN 123456" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="incorporationDate"
              label="Incorporation Date"
              rules={[{ required: true, message: "Please select date" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

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

        <Divider style={{ margin: "16px 0" }} />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nextDueDate"
              label="Annual Return Due Date"
              rules={[{ required: true, message: "Please select due date" }]}
              extra={
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <InfoCircleOutlined /> Usually 30th June every year for CAC filings
                </Text>
              }>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="penaltyPerDay"
              label="Penalty/Day (₦)"
              initialValue={5000}
              extra={
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Default: ₦5,000/day (CAC regulation)
                </Text>
              }>
              <Input type="number" placeholder="5000" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Registered Address">
          <Input.TextArea rows={2} placeholder="Entity's registered office address" />
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
      </Form>
    </Modal>
  );
};

const MarkPaidModal = ({ visible, onClose, onSuccess, entity, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSuccess({ amount: values.amount, notes: values.notes });
      form.resetFields();
      onClose();
    } catch (err) {
      message.error("Failed to mark as paid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Mark Penalty as Paid"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Confirm Payment"
      confirmLoading={submitting || loading}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="amount"
          label="Amount Paid (₦)"
          rules={[{ required: true, message: "Please enter amount" }]}>
          <Input type="number" placeholder="Enter amount" />
        </Form.Item>
        <Form.Item name="notes" label="Payment Notes">
          <Input.TextArea rows={2} placeholder="Payment reference or notes" />
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
  const [markPaidVisible, setMarkPaidVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    setTableLoading(true);
    try {
      await Promise.all([dispatch(fetchDashboard()), dispatch(fetchEntities())]);
    } catch (error) {
      message.error("Failed to load compliance data");
    } finally {
      setTableLoading(false);
    }
  };

  const handleMarkPaid = async (data) => {
    try {
      await dispatch(markPaid({ id: selectedEntity._id, data })).unwrap();
      message.success("Penalty marked as paid");
      setSelectedEntity(null);
      loadData();
    } catch (err) {
      message.error(err || "Failed to mark as paid");
    }
  };

  const handleDelete = (entity) => {
    Modal.confirm({
      title: "Delete Entity",
      content: (
        <span>
          Are you sure you want to remove <strong>{entity.entityName}</strong> from
          tracking? This action cannot be undone.
        </span>
      ),
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteEntity(entity._id)).unwrap();
          message.success("Entity removed");
          loadData();
        } catch {
          message.error("Failed to delete entity");
        }
      },
    });
  };

  const openMarkPaid = (entity) => {
    setSelectedEntity(entity);
    setMarkPaidVisible(true);
  };

  const columns = [
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
              {r.cacRegistrationNumber}
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
      title: "Status",
      dataIndex: "complianceStatus",
      key: "complianceStatus",
      render: (v) => {
        const colors = {
          compliant: "green",
          pending: "orange",
          overdue: "red",
        };
        return <Tag color={colors[v] || "default"}>{v?.toUpperCase() || "N/A"}</Tag>;
      },
    },
    {
      title: "Due Date",
      dataIndex: "nextDueDate",
      key: "nextDueDate",
      sorter: (a, b) => dayjs(a.nextDueDate).unix() - dayjs(b.nextDueDate).unix(),
      render: (d) =>
        d ? (
          <Space direction="vertical" size={0}>
            <Text>{dayjs(d).format("DD MMM YYYY")}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(d).fromNow()}
            </Text>
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Last Filed",
      dataIndex: "lastAnnualReturnDate",
      key: "lastAnnualReturnDate",
      render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : <Text type="secondary">Never filed</Text>),
    },
    {
      title: "Penalty Exposure",
      key: "penalty",
      render: (_, r) => <LivePenaltyCounter entity={r} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => openMarkPaid(r)}
            icon={<DollarOutlined />}>
            Mark Paid
          </Button>
          <Button
            size="small"
            type="text"
            danger
            onClick={() => handleDelete(r)}
            icon={<WarningOutlined />}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const stats = dashboard?.stats || {};
  const isOverdue = stats.overdue > 0;

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
              CAC Compliance Tracker
            </Title>
            <Text type="secondary">Monitor annual returns and regulatory compliance for your entities</Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined spin={loading} />} onClick={loadData} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
              Add Entity
            </Button>
          </Space>
        </div>

        {isOverdue && (
          <Alert
            message={
              <Space>
                <WarningOutlined />
                <span>Overdue Compliance Detected</span>
              </Space>
            }
            description={`You have ${stats.overdue} entity(ies) with overdue annual returns. Penalties are accruing at ₦5,000/day.`}
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
            action={
              <Button size="small" type="primary" danger onClick={() => setCreateVisible(true)}>
                Add Entity
              </Button>
            }
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Total Entities</Text>}
                value={stats.total || 0}
                prefix={<SafetyCertificateOutlined style={{ color: "#3b82f6" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Compliant</Text>}
                value={stats.compliant || 0}
                valueStyle={{ color: "#10b981" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Pending</Text>}
                value={stats.pending || 0}
                valueStyle={{ color: "#f59e0b" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Overdue</Text>}
                value={stats.overdue || 0}
                valueStyle={{ color: "#ef4444" }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card bordered={false} style={{ borderRadius: 12 }} title="Tracked Entities">
          {tableLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : entities.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical">
                  <Text type="secondary">No compliance entities tracked yet</Text>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
                    Add Your First Entity
                  </Button>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              dataSource={entities}
              columns={columns}
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

      {selectedEntity && (
        <MarkPaidModal
          visible={markPaidVisible}
          onClose={() => {
            setMarkPaidVisible(false);
            setSelectedEntity(null);
          }}
          onSuccess={handleMarkPaid}
          entity={selectedEntity}
          loading={actionLoading}
        />
      )}
    </>
  );
};

export default ComplianceTrackerPage;
