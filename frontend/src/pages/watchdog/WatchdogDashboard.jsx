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
  Tooltip,
  Switch,
  Timeline,
  Tabs,
  DatePicker,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
  BellOutlined,
  RobotOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  FileDoneOutlined,
  EyeOutlined,
  SendOutlined,
  DollarOutlined,
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
  acknowledgeAlert,
  updateActionItem,
  updateClientOutreach,
  sendClientCommunication,
  updateRevenueOpportunity,
  updateMonitoredEntity,
  selectMonitoredEntities,
  selectWatchdogAlerts,
  selectWatchdogDashboard,
  selectWatchdogLoading,
  selectWatchdogActionLoading,
  selectWatchdogChecking,
} from "../../redux/features/watchdog/watchdogSlice";
import useMattersSelectOptions from "../../hooks/useMattersSelectOptions";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const ENTITY_TYPES = [
  { value: "ltd", label: "Limited Liability Company (Ltd)" },
  { value: "plc", label: "Public Limited Company (Plc)" },
  { value: "business_name", label: "Business Name (BN)" },
  { value: "incorporated_trustees", label: "Incorporated Trustees" },
];

const CHECK_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// ✅ FIXED: status config uses actual CAC portal status values
// backend stores cacPortalStatus.portalStatus as "ACTIVE", "INACTIVE" etc
const STATUS_CONFIG = {
  ACTIVE: {
    color: "green",
    icon: <CheckCircleOutlined />,
    label: "Active",
  },
  INACTIVE: {
    color: "red",
    icon: <ExclamationCircleOutlined />,
    label: "Inactive",
  },
  "STRUCK-OFF": {
    color: "red",
    icon: <ExclamationCircleOutlined />,
    label: "Struck Off",
  },
  "WOUND-UP": {
    color: "volcano",
    icon: <ExclamationCircleOutlined />,
    label: "Wound Up",
  },
  DISSOLVED: {
    color: "default",
    icon: <ExclamationCircleOutlined />,
    label: "Dissolved",
  },
  REGISTERED: {
    color: "green",
    icon: <CheckCircleOutlined />,
    label: "Registered",
  },
  UNKNOWN: {
    color: "default",
    icon: <RobotOutlined />,
    label: "Unknown",
  },
};

// ─── Create Entity Modal ──────────────────────────────────────────────────────
const CreateEntityModal = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState(null);

  const {
    mattersOptions,
    loading: mattersLoading,
    fetchMatters,
  } = useMattersSelectOptions({ status: "active", limit: 100 });

  const {
    data: clientOptions,
    loading: clientsLoading,
    refresh: refreshClients,
  } = useUserSelectOptions({ type: "client" });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const entityData = {
        registrationNumber: values.registrationNumber,
        entityType: values.entityType,
        linkedMatterId:
          values.linkedMatterId?.value || values.linkedMatterId || undefined,
        clientId: values.clientId?.value || values.clientId || undefined,
      };

      // Only send entityName if provided
      if (values.entityName && values.entityName.trim()) {
        entityData.entityName = values.entityName.trim();
      }

      await dispatch(addMonitoredEntity(entityData)).unwrap();
      message.success("Entity added to monitoring - name auto-filled from CAC");
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
              extra={<Text type="secondary" style={{ fontSize: 11 }}>Optional - will be auto-filled from CAC if not provided</Text>}>
              <Input placeholder="e.g., ABC Holdings Ltd (optional)" />
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
            <Form.Item
              name="checkFrequency"
              label="Check Frequency"
              initialValue="monthly">
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
            options={mattersOptions?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
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

        <Form.Item
          name="clientId"
          label={
            <Space>
              <FileDoneOutlined style={{ color: "#059669" }} />
              <span>Client (Optional)</span>
            </Space>
          }
          extra="Link this entity to a client for notifications">
          <Select
            showSearch
            placeholder="Search and select a client..."
            options={clientOptions?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            loading={clientsLoading}
            onSearch={() => refreshClients()}
            onFocus={() => refreshClients()}
            filterOption={false}
            notFoundContent={clientsLoading ? "Loading..." : "No clients found"}
            allowClear
            labelInValue
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
                Matter linked successfully
              </Text>
            </Space>
          </div>
        )}

        <Alert
          type="info"
          icon={<InfoCircleOutlined />}
          message="How it works"
          description="We check the CAC portal for status changes and alert you immediately when changes are detected."
          style={{ marginTop: 16 }}
          showIcon
        />
      </Form>
    </Modal>
  );
};

// ─── Entity Details Modal ─────────────────────────────────────────────────────
const EntityDetailsModal = ({ visible, entity, onClose }) => {
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectWatchdogActionLoading);
  const [activeTab, setActiveTab] = useState("details");
  const [revenueForm] = Form.useForm();
  const [emailDraft, setEmailDraft] = useState("");
  const [outreachNotes, setOutreachNotes] = useState("");
  const [outreachSaving, setOutreachSaving] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const {
    data: clientOptions,
    loading: clientsLoading,
    refresh: refreshClients,
  } = useUserSelectOptions({ type: "client" });

  useEffect(() => {
    if (entity && visible) {
      revenueForm.setFieldsValue({
        serviceType: entity.revenueOpportunityDetails?.serviceType,
        leadScore: entity.revenueOpportunityDetails?.leadScore,
        estimatedFee: entity.revenueOpportunityDetails?.estimatedFee,
        governmentFee: entity.revenueOpportunityDetails?.governmentFee,
        totalQuote: entity.revenueOpportunityDetails?.totalQuote,
        quoteStatus: entity.revenueOpportunityDetails?.quoteStatus,
        expectedCloseDate: entity.revenueOpportunityDetails?.expectedCloseDate
          ? dayjs(entity.revenueOpportunityDetails.expectedCloseDate)
          : undefined,
      });
      setEmailDraft(
        entity.clientOutreach?.communicationTemplates?.emailDraft || "",
      );
      setOutreachNotes(entity.clientOutreach?.outreachNotes || "");
    }
  }, [entity, visible]);

  if (!entity) return null;

  console.log(entity.actionItems);

  const actionItems = entity.actionItems || [];
  const clientOutreach = entity.clientOutreach || {};
  const currentClientId = entity.clientId?._id || entity.clientId;

  const priorityColors = {
    urgent: "red",
    high: "orange",
    medium: "blue",
    low: "green",
  };

  const statusColors = {
    pending: "default",
    in_progress: "processing",
    completed: "success",
    cancelled: "default",
  };

  const handleLinkClient = async (clientId) => {
    try {
      await dispatch(
        updateMonitoredEntity({
          entityId: entity._id,
          data: { clientId },
        }),
      ).unwrap();
      message.success("Client linked successfully");
    } catch {
      message.error("Failed to link client");
    }
  };

  const handleCompleteAction = async (actionItem) => {
    try {
      await dispatch(
        updateActionItem({
          entityId: entity._id,
          actionItemId: actionItem._id,
          data: { status: "completed" },
        }),
      ).unwrap();
      message.success("Action marked as complete");
    } catch {
      message.error("Failed to update action");
    }
  };

  // ✅ FIXED: save outreach on button click, not on every keystroke
  const handleSaveOutreach = async () => {
    setOutreachSaving(true);
    try {
      await dispatch(
        updateClientOutreach({
          entityId: entity._id,
          data: {
            outreachNotes,
            emailDraft,
          },
        }),
      ).unwrap();
      message.success("Outreach details saved");
    } catch {
      message.error("Failed to save outreach details");
    } finally {
      setOutreachSaving(false);
    }
  };

  const handleOutreachMethodChange = async (value) => {
    try {
      await dispatch(
        updateClientOutreach({
          entityId: entity._id,
          data: { outreachMethod: value },
        }),
      ).unwrap();
    } catch {
      message.error("Failed to update outreach method");
    }
  };

  const handleAcknowledgedChange = async (value) => {
    try {
      await dispatch(
        updateClientOutreach({
          entityId: entity._id,
          data: { clientAcknowledged: value },
        }),
      ).unwrap();
    } catch {
      message.error("Failed to update acknowledgement");
    }
  };

  const handleSendEmail = async () => {
    setEmailLoading(true);
    try {
      await dispatch(
        sendClientCommunication({
          entityId: entity._id,
          data: { channel: "email", templateType: "email" },
        }),
      ).unwrap();
      message.success("Email sent to client successfully");
    } catch (err) {
      message.error(
        typeof err === "string" ? err : err?.message || "Failed to send email",
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdateRevenue = async (values) => {
    try {
      const formattedValues = {
        ...values,
        expectedCloseDate: values.expectedCloseDate?.toISOString(),
      };
      await dispatch(
        updateRevenueOpportunity({
          entityId: entity._id,
          data: formattedValues,
        }),
      ).unwrap();
      message.success("Revenue opportunity saved!");
      revenueForm.resetFields();
      onClose();
    } catch {
      message.error("Failed to update revenue details");
    }
  };

  const tabItems = [
    {
      key: "details",
      label: (
        <span>
          <FileDoneOutlined /> Details
        </span>
      ),
      children: (
        <div>
          <Card title="Entity Information" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Entity Name">
                {entity.entityName}
              </Descriptions.Item>
              <Descriptions.Item label="RC/BN Number">
                {entity.rcNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Entity Type">
                {ENTITY_TYPES.find((t) => t.value === entity.entityType)
                  ?.label || entity.entityType}
              </Descriptions.Item>
              <Descriptions.Item label="CAC Status">
                <Tag
                  color={
                    STATUS_CONFIG[entity.cacPortalStatus?.portalStatus]?.color
                  }>
                  {entity.cacPortalStatus?.portalStatus || "Unknown"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title="Client Information"
            size="small"
            style={{ marginTop: 16 }}>
            <Form.Item label="Link Client">
              <Select
                showSearch
                placeholder="Search and select a client..."
                options={clientOptions?.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                loading={clientsLoading}
                onSearch={() => refreshClients()}
                onFocus={() => refreshClients()}
                filterOption={false}
                notFoundContent={
                  clientsLoading ? "Loading..." : "No clients found"
                }
                allowClear
                value={currentClientId}
                onChange={handleLinkClient}
              />
            </Form.Item>
            {currentClientId && (
              <div style={{ marginTop: 8 }}>
                <Tag icon={<CheckCircleOutlined />} color="green">
                  Linked: {entity.clientId?.firstName}{" "}
                  {entity.clientId?.lastName}
                </Tag>
              </div>
            )}
            {!currentClientId && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Linking a client enables email notifications and outreach
                tracking
              </Text>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: "actionItems",
      label: (
        <span>
          <CheckCircleOutlined /> Action Items ({actionItems.length})
        </span>
      ),
      children: (
        <div>
          {actionItems.length === 0 ? (
            <Empty
              description="No action items yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Timeline
              items={actionItems.map((item) => ({
                color:
                  item.status === "completed"
                    ? "green"
                    : item.priority === "urgent"
                      ? "red"
                      : "blue",
                children: (
                  <Card size="small" style={{ marginBottom: 8 }} key={item._id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}>
                      <div style={{ flex: 1 }}>
                        <Text strong>{item.title}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag
                            color={priorityColors[item.priority] || "default"}>
                            {item.priority}
                          </Tag>
                          <Tag color={statusColors[item.status] || "default"}>
                            {item.status?.replace(/_/g, " ")}
                          </Tag>
                        </div>
                        {item.description && (
                          <div style={{ marginTop: 6 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.description}
                            </Text>
                          </div>
                        )}
                        {item.dueDate && (
                          <div style={{ marginTop: 4 }}>
                            <Text
                              type={
                                dayjs(item.dueDate).isBefore(dayjs())
                                  ? "danger"
                                  : "secondary"
                              }
                              style={{ fontSize: 11 }}>
                              Due: {dayjs(item.dueDate).format("DD MMM YYYY")}
                              {dayjs(item.dueDate).isBefore(dayjs()) &&
                                item.status !== "completed" &&
                                " (Overdue)"}
                            </Text>
                          </div>
                        )}
                      </div>
                      {item.status !== "completed" && (
                        <Button
                          size="small"
                          type="primary"
                          loading={actionLoading}
                          onClick={() => handleCompleteAction(item)}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </Card>
                ),
              }))}
            />
          )}
        </div>
      ),
    },

    {
      key: "outreach",
      label: (
        <span>
          <FileDoneOutlined /> Client Outreach
        </span>
      ),
      children: (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Outreach Method">
                <Select
                  // ✅ Read from entity not local state
                  defaultValue={clientOutreach.outreachMethod || "none"}
                  onChange={handleOutreachMethodChange}
                  options={[
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Phone Call" },
                    { value: "meeting", label: "Meeting" },
                    { value: "letter", label: "Letter" },
                    { value: "sms", label: "SMS" },
                    { value: "none", label: "Not Contacted" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Client Acknowledged">
                <Switch
                  defaultChecked={clientOutreach.clientAcknowledged || false}
                  onChange={handleAcknowledgedChange}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes">
            {/* ✅ FIXED: use local state, save on button click not onChange */}
            <Input.TextArea
              rows={3}
              value={outreachNotes}
              onChange={(e) => setOutreachNotes(e.target.value)}
              placeholder="Notes about client communication..."
            />
          </Form.Item>

          <Divider />

          <Title level={5}>Email Draft</Title>
          <Form.Item>
            <Input.TextArea
              rows={5}
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Draft email to send to client..."
            />
          </Form.Item>

          {/* ✅ FIXED: save button for all text fields */}
          <Space style={{ marginBottom: 16 }}>
            <Button onClick={handleSaveOutreach} loading={outreachSaving}>
              Save Draft
            </Button>
          </Space>

          <Divider />

          <Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendEmail}
              loading={emailLoading}
              disabled={!currentClientId}>
              Send Email to Client
            </Button>
            {!currentClientId && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Link a client to this entity to enable email sending
              </Text>
            )}
          </Space>

          {clientOutreach.outreachDate && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last outreach:{" "}
                {dayjs(clientOutreach.outreachDate).format("DD MMM YYYY HH:mm")}
              </Text>
            </div>
          )}
        </div>
      ),
    },

    {
      key: "revenue",
      label: (
        <span>
          <DollarOutlined /> Revenue Opportunity
        </span>
      ),
      children: (
        <div>
          {/* ✅ FIXED: no initialValues — use setFieldsValue in useEffect instead */}
          <Form
            form={revenueForm}
            layout="vertical"
            onFinish={handleUpdateRevenue}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Service Type" name="serviceType">
                  <Select
                    placeholder="Select service type"
                    options={[
                      {
                        value: "status_restoration",
                        label: "Status Restoration",
                      },
                      {
                        value: "annual_return_filing",
                        label: "Annual Return Filing",
                      },
                      {
                        value: "compliance_filing",
                        label: "Compliance Filing",
                      },
                      { value: "name_change", label: "Name Change" },
                      { value: "amendment", label: "Amendment" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Lead Score" name="leadScore">
                  <Select
                    placeholder="Select lead score"
                    options={[
                      { value: "hot", label: "🔥 Hot" },
                      { value: "warm", label: "🌡️ Warm" },
                      { value: "cold", label: "❄️ Cold" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Professional Fee (₦)" name="estimatedFee">
                  <Input type="number" prefix="₦" min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Government Fee (₦)" name="governmentFee">
                  <Input type="number" prefix="₦" min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Total Quote (₦)" name="totalQuote">
                  <Input type="number" prefix="₦" min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Quote Status" name="quoteStatus">
                  <Select
                    placeholder="Select status"
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "sent", label: "Sent to Client" },
                      { value: "approved", label: "Approved ✅" },
                      { value: "rejected", label: "Rejected ❌" },
                      { value: "expired", label: "Expired" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Expected Close Date" name="expectedCloseDate">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  icon={<CheckCircleOutlined />}>
                  Save Quote
                </Button>
              </Col>
              <Col>
                <Button
                  icon={<SendOutlined />}
                  onClick={handleSendEmail}
                  loading={emailLoading}
                  disabled={!currentClientId}
                  style={{
                    backgroundColor: "#059669",
                    borderColor: "#059669",
                    color: "white",
                  }}>
                  Send Email with Quote
                </Button>
              </Col>
            </Row>
            {!currentClientId && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                Link a client first to send email
              </Text>
            )}
          </Form>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      title={
        <Space wrap>
          <RobotOutlined style={{ color: "#3b82f6" }} />
          <Text strong style={{ fontSize: 15 }}>
            {entity.entityName}
          </Text>
          <Tag style={{ fontFamily: "monospace" }}>{entity.rcNumber}</Tag>
          <Tag
            color={
              STATUS_CONFIG[entity.cacPortalStatus?.portalStatus]?.color ||
              "default"
            }>
            {entity.cacPortalStatus?.portalStatus || "UNKNOWN"}
          </Tag>
        </Space>
      }>
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="How to Handle Inactive Entities"
        description={
          <div>
            <p style={{ margin: "4px 0" }}>
              <strong>When an entity becomes INACTIVE:</strong>
            </p>
            <ol style={{ margin: "4px 0", paddingLeft: 20 }}>
              <li>
                View and complete the <strong>Action Items</strong> (tasks
                created for you)
              </li>
              <li>
                Contact the client via <strong>Client Outreach</strong> tab
                (email, phone, etc.)
              </li>
              <li>
                Create a <strong>Revenue Opportunity</strong> quote for status
                restoration services
              </li>
            </ol>
            <p style={{ margin: "4px 0", color: "#666" }}>
              Tip: Link a client to enable email notifications and outreach
              tracking.
            </p>
          </div>
        }
        style={{ marginBottom: 16 }}
      />
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const WatchdogDashboard = () => {
  const dispatch = useDispatch();
  const entities = useSelector(selectMonitoredEntities);
  const alerts = useSelector(selectWatchdogAlerts);
  const dashboard = useSelector(selectWatchdogDashboard);
  const loading = useSelector(selectWatchdogLoading);
  const actionLoading = useSelector(selectWatchdogActionLoading);
  const checkingId = useSelector(selectWatchdogChecking);

  const [createVisible, setCreateVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);

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
      const result = await dispatch(checkEntityStatus(entity._id)).unwrap();
      const data = result?.data || result;
      if (data?.statusChanged) {
        message.warning(
          `Status changed: ${data.previousStatus} → ${data.currentStatus}`,
        );
      } else {
        message.success(
          `Status check complete — ${data?.currentStatus || "no change"}`,
        );
      }
    } catch {
      message.error("Status check failed. Please try again.");
    }
  };

  const handleRemoveEntity = (entity) => {
    Modal.confirm({
      title: "Remove from Monitoring",
      content: (
        <span>
          Stop monitoring <strong>{entity.entityName}</strong>? You can re-add
          it anytime.
        </span>
      ),
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(removeMonitoredEntity(entity._id)).unwrap();
          message.success("Entity removed from monitoring");
        } catch {
          message.error("Failed to remove entity");
        }
      },
    });
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await dispatch(acknowledgeAlert(alertId)).unwrap();
      message.success("Alert acknowledged");
    } catch {
      message.error("Failed to acknowledge alert");
    }
  };

  const handleViewDetails = (entity) => {
    setSelectedEntity(entity);
    setDetailsVisible(true);
  };

  // ── Entity Table Columns ────────────────────────────────────────────────────
  const entityColumns = [
    {
      title: "Entity",
      key: "entityName",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {r.entityName}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {ENTITY_TYPES.find((t) => t.value === r.entityType)?.label ||
                r.entityType}{" "}
              {/* ✅ FIXED: rcNumber not registrationNumber */}•{" "}
              <span style={{ fontFamily: "monospace" }}>
                {r.rcNumber || r.bnNumber || "—"}
              </span>
            </Text>
          </div>
          {r.linkedMatterId && (
            <Tag
              icon={<LinkOutlined />}
              style={{
                marginTop: 4,
                borderRadius: 4,
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                color: "#0369a1",
                fontSize: 11,
              }}>
              Matter Linked
            </Tag>
          )}
          {/* ✅ Show requiresAttention flag */}
          {r.cacPortalStatus?.requiresAttention && (
            <Tag
              color="red"
              icon={<WarningOutlined />}
              style={{ marginTop: 4, fontSize: 11 }}>
              Requires Attention
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "CAC Status",
      key: "portalStatus",
      // ✅ FIXED: read from cacPortalStatus.portalStatus
      render: (_, r) => {
        const status = r.cacPortalStatus?.portalStatus || "UNKNOWN";
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
        return (
          <Space direction="vertical" size={0}>
            <Tag icon={config.icon} color={config.color}>
              {config.label}
            </Tag>
            {r.cacPortalStatus?.previousPortalStatus &&
              r.cacPortalStatus.previousPortalStatus !==
                r.cacPortalStatus.portalStatus && (
                <Text type="secondary" style={{ fontSize: 10 }}>
                  was: {r.cacPortalStatus.previousPortalStatus}
                </Text>
              )}
          </Space>
        );
      },
    },
    {
      title: "Last Checked",
      key: "lastChecked",
      // ✅ FIXED: read from cacPortalStatus.lastChecked
      render: (_, r) => {
        const lastChecked = r.cacPortalStatus?.lastChecked;
        return lastChecked ? (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>
              {dayjs(lastChecked).format("DD MMM HH:mm")}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(lastChecked).fromNow()}
            </Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Never checked
          </Text>
        );
      },
    },
    {
      title: "Client",
      key: "client",
      render: (_, r) =>
        r.clientId ? (
          <Text style={{ fontSize: 13 }}>
            {r.clientId.firstName} {r.clientId.lastName}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="View details & manage">
            <Button
              size="small"
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(r)}>
              Details
            </Button>
          </Tooltip>
          <Tooltip title="Run status check now">
            <Button
              size="small"
              icon={<SyncOutlined spin={checkingId === r._id} />}
              onClick={() => handleCheckStatus(r)}
              loading={checkingId === r._id}
              disabled={checkingId !== null && checkingId !== r._id}>
              Check
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ── Alert Table Columns ─────────────────────────────────────────────────────
  const alertColumns = [
    {
      title: "Entity",
      key: "entity",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {r.entityName}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.rcNumber || ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Previous",
      key: "previous",
      render: (_, r) => {
        const status = r.cacPortalStatus?.previousPortalStatus || "Unknown";
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "Current",
      key: "current",
      render: (_, r) => {
        const status = r.cacPortalStatus?.portalStatus || "Unknown";
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Changed",
      dataIndex: ["cacPortalStatus", "statusChangedAt"],
      key: "changedAt",
      render: (d) =>
        d ? (
          <Text style={{ fontSize: 12 }}>
            {dayjs(d).format("DD MMM YYYY HH:mm")}
          </Text>
        ) : (
          "—"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          ghost
          onClick={() => handleAcknowledgeAlert(r._id)}>
          Acknowledge
        </Button>
      ),
    },
  ];

  // ── Stats from dashboard (getWatchdogStats response) ──────────────────────
  const totalMonitored = dashboard?.totalMonitored || entities.length || 0;
  const activeCount =
    dashboard?.statusDistribution?.ACTIVE ||
    dashboard?.statusDistribution?.active ||
    0;
  const inactiveCount =
    (dashboard?.statusDistribution?.INACTIVE || 0) +
    (dashboard?.statusDistribution?.["STRUCK-OFF"] || 0) +
    (dashboard?.statusDistribution?.["WOUND-UP"] || 0);
  const alertCount = dashboard?.alertsRequiringAttention || alerts.length || 0;

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
        {/* ── Header ─────────────────────────────────────────────────────── */}
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
            <Title
              level={3}
              style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
              CAC Status Watchdog
            </Title>
            <Text type="secondary">
              Automated CAC portal monitoring — status changes detected
              instantly
            </Text>
          </div>
          <Space wrap>
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={loadData}
              loading={tableLoading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateVisible(true)}>
              Add to Monitor
            </Button>
          </Space>
        </div>

        {/* ── Alerts Banner ───────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <Alert
            message={
              <Space>
                <WarningOutlined />
                <strong>
                  {alerts.length} entity status change
                  {alerts.length > 1 ? "s" : ""} require your attention
                </strong>
              </Space>
            }
            description="Review the alerts below and acknowledge once actioned."
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
          />
        )}

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              <Statistic
                title={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Monitored Entities
                  </Text>
                }
                value={totalMonitored}
                prefix={
                  <RobotOutlined style={{ color: "#3b82f6", fontSize: 18 }} />
                }
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              <Statistic
                title={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Active
                  </Text>
                }
                value={activeCount}
                valueStyle={{ color: "#10b981" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              <Statistic
                title={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Inactive / Struck Off
                  </Text>
                }
                value={inactiveCount}
                valueStyle={{
                  color: inactiveCount > 0 ? "#ef4444" : "#10b981",
                }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              <Statistic
                title={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Requiring Attention
                  </Text>
                }
                value={alertCount}
                valueStyle={{ color: alertCount > 0 ? "#f59e0b" : "#10b981" }}
                prefix={
                  <Badge dot={alertCount > 0}>
                    <BellOutlined />
                  </Badge>
                }
              />
            </Card>
          </Col>
        </Row>

        {/* ── Alerts Table ─────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <Card
            bordered={false}
            style={{ borderRadius: 12, marginBottom: 16 }}
            title={
              <Space>
                <WarningOutlined style={{ color: "#ef4444" }} />
                <span style={{ fontWeight: 700 }}>Status Change Alerts</span>
                <Badge
                  count={alerts.length}
                  style={{ backgroundColor: "#ef4444" }}
                />
              </Space>
            }>
            <Table
              dataSource={alerts}
              columns={alertColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
            />
          </Card>
        )}

        {/* ── Monitored Entities Table ─────────────────────────────────────── */}
        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
          title={
            <Space>
              <RobotOutlined style={{ color: "#3b82f6" }} />
              <span style={{ fontWeight: 700 }}>Monitored Entities</span>
              <Tag color="blue">{entities.length}</Tag>
            </Space>
          }>
          {tableLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : entities.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical" align="center">
                  <Text type="secondary">No entities being monitored yet</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Add an entity to start tracking its CAC status
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
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `${total} entities monitored`,
              }}
              scroll={{ x: "max-content" }}
              size="middle"
              rowClassName={(r) =>
                r.cacPortalStatus?.requiresAttention
                  ? "ant-table-row-danger"
                  : ""
              }
            />
          )}
        </Card>
      </div>

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      <CreateEntityModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={loadData}
        loading={actionLoading}
      />

      {/* ── Entity Details Modal ─────────────────────────────────────────── */}
      <EntityDetailsModal
        visible={detailsVisible}
        entity={selectedEntity}
        onClose={() => {
          setDetailsVisible(false);
          loadData();
        }}
      />

      {/* ── Row highlight style ───────────────────────────────────────────── */}
      <style>{`
        .ant-table-row-danger td {
          background: #fff5f5 !important;
        }
        .ant-table-row-danger:hover td {
          background: #fee2e2 !important;
        }
      `}</style>
    </>
  );
};

export default WatchdogDashboard;
