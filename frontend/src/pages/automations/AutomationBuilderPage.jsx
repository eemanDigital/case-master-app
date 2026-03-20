import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
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
  Switch,
  Collapse,
  Divider,
  Empty,
  Tooltip,
  Steps,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  MailOutlined,
  BellOutlined,
  ApiOutlined,
  RobotOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import {
  fetchAutomations,
  fetchRecipes,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  executeAutomation,
  selectAutomations,
  selectRecipes,
  selectAutomationStats,
  selectAutomationLoading,
  selectAutomationActionLoading,
  selectAutomationExecuting,
} from "../../redux/features/automation/automationSlice";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

const TRIGGER_OPTIONS = [
  { value: "deadline_created", label: "Deadline Created", icon: "📅" },
  { value: "deadline_approaching", label: "Deadline Approaching", icon: "⏰" },
  { value: "compliance_due", label: "Compliance Due", icon: "📋" },
  { value: "compliance_overdue", label: "Compliance Overdue", icon: "⚠️" },
  { value: "matter_created", label: "Matter Created", icon: "📁" },
  { value: "task_completed", label: "Task Completed", icon: "✅" },
  { value: "document_generated", label: "Document Generated", icon: "📄" },
  { value: "manual", label: "Manual Trigger", icon: "🎯" },
];

const ACTION_OPTIONS = [
  { value: "send_email", label: "Send Email", icon: "📧", color: "#3b82f6" },
  { value: "send_sms", label: "Send SMS", icon: "📱", color: "#10b981" },
  { value: "create_task", label: "Create Task", icon: "📝", color: "#f59e0b" },
  { value: "create_deadline", label: "Create Deadline", icon: "⏱️", color: "#8b5cf6" },
  { value: "update_status", label: "Update Status", icon: "🔄", color: "#06b6d4" },
  { value: "send_notification", label: "Send Notification", icon: "🔔", color: "#ec4899" },
  { value: "webhook", label: "Call Webhook", icon: "🔗", color: "#6366f1" },
];

const RecipeCard = ({ recipe, onApply }) => (
  <Card
    size="small"
    hoverable
    style={{ borderRadius: 12, height: "100%" }}
    actions={[
      <Button key="apply" type="primary" icon={<RocketOutlined />} onClick={() => onApply(recipe)}>
        Use Recipe
      </Button>,
    ]}>
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <RobotOutlined style={{ fontSize: 18, color: "#3b82f6" }} />
        <Text strong style={{ fontSize: 14 }}>{recipe.name}</Text>
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>{recipe.description}</Text>
      <Divider style={{ margin: "8px 0" }} />
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>TRIGGER</Text>
        <div>
          <Tag>{TRIGGER_OPTIONS.find(t => t.value === recipe.trigger)?.label || recipe.trigger}</Tag>
        </div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>ACTIONS</Text>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {recipe.actions?.map((a, i) => (
            <Tag key={i}>{ACTION_OPTIONS.find(ac => ac.value === a.type)?.label || a.type}</Tag>
          ))}
        </div>
      </div>
    </Space>
  </Card>
);

const CreateAutomationModal = ({ visible, onClose, onSuccess, loading, initialData }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [trigger, setTrigger] = useState(initialData?.trigger || "deadline_approaching");
  const [conditions, setConditions] = useState(initialData?.conditions || []);
  const [actions, setActions] = useState(initialData?.actions || [{ type: "send_email", config: {} }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
      });
      setTrigger(initialData.trigger || "deadline_approaching");
      setConditions(initialData.conditions || []);
      setActions(initialData.actions || [{ type: "send_email", config: {} }]);
      setStep(0);
    }
  }, [visible, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const automationData = {
        ...values,
        trigger,
        conditions,
        actions,
      };

      if (initialData?._id) {
        await dispatch(updateAutomation({ id: initialData._id, data: automationData })).unwrap();
        message.success("Automation updated");
      } else {
        await dispatch(createAutomation(automationData)).unwrap();
        message.success("Automation created");
      }

      form.resetFields();
      setStep(0);
      setTrigger("deadline_approaching");
      setConditions([]);
      setActions([{ type: "send_email", config: {} }]);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.message || err || "Failed to save automation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setStep(0);
    setTrigger("deadline_approaching");
    setConditions([]);
    setActions([{ type: "send_email", config: {} }]);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: "#f59e0b" }} />
          <span>{initialData?._id ? "Edit Automation" : "Create Automation"}</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={step < 2 ? "Next" : initialData?._id ? "Save Changes" : "Create"}
      confirmLoading={submitting || loading}
      width={700}
      destroyOnClose>
      <Steps current={step} size="small" style={{ marginBottom: 24 }}>
        <Step title="Basic Info" />
        <Step title="Trigger" />
        <Step title="Actions" />
      </Steps>

      <Form form={form} layout="vertical">
        {step === 0 && (
          <>
            <Form.Item
              name="name"
              label="Automation Name"
              rules={[{ required: true, message: "Please enter a name" }]}
              initialValue={initialData?.name}>
              <Input placeholder="e.g., Deadline Reminder Email" size="large" />
            </Form.Item>
            <Form.Item name="description" label="Description" initialValue={initialData?.description}>
              <Input.TextArea rows={2} placeholder="What does this automation do?" />
            </Form.Item>
          </>
        )}

        {step === 1 && (
          <>
            <Form.Item label="Trigger Event">
              <Select
                value={trigger}
                onChange={setTrigger}
                options={TRIGGER_OPTIONS.map((t) => ({
                  value: t.value,
                  label: (
                    <Space>
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </Space>
                  ),
                }))}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Collapse style={{ marginTop: 16 }}>
              <Panel header="Conditions (optional)" key="conditions">
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  Add conditions to control when this automation runs
                </Paragraph>
                {conditions.map((c, i) => (
                  <Row key={i} gutter={8} style={{ marginBottom: 8 }}>
                    <Col flex="1">
                      <Input
                        placeholder="Field (e.g., priority)"
                        value={c.field}
                        onChange={(e) => {
                          const nc = [...conditions];
                          nc[i].field = e.target.value;
                          setConditions(nc);
                        }}
                      />
                    </Col>
                    <Col>
                      <Select
                        value={c.operator}
                        onChange={(v) => {
                          const nc = [...conditions];
                          nc[i].operator = v;
                          setConditions(nc);
                        }}
                        style={{ width: 100 }}
                        options={[
                          { value: "equals", label: "equals" },
                          { value: "contains", label: "contains" },
                          { value: "greater", label: ">" },
                          { value: "less", label: "<" },
                        ]}
                      />
                    </Col>
                    <Col flex="1">
                      <Input
                        placeholder="Value"
                        value={c.value}
                        onChange={(e) => {
                          const nc = [...conditions];
                          nc[i].value = e.target.value;
                          setConditions(nc);
                        }}
                      />
                    </Col>
                    <Col>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setConditions(conditions.filter((_, j) => j !== i))}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => setConditions([...conditions, { field: "", operator: "", value: "" }])}
                  block>
                  + Add Condition
                </Button>
              </Panel>
            </Collapse>
          </>
        )}

        {step === 2 && (
          <>
            <Form.Item label="Actions">
              <Paragraph type="secondary" style={{ fontSize: 12 }}>
                Define what happens when the trigger fires
              </Paragraph>
              {actions.map((a, i) => {
                const actionConfig = ACTION_OPTIONS.find((ac) => ac.value === a.type);
                return (
                  <Card
                    key={i}
                    size="small"
                    style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${actionConfig?.color || "#e5e7eb"}30` }}>
                    <Row gutter={12} align="middle">
                      <Col>
                        <Tag style={{ fontSize: 16, padding: "4px 8px" }}>{actionConfig?.icon}</Tag>
                      </Col>
                      <Col flex="1">
                        <Select
                          value={a.type}
                          onChange={(v) => {
                            const na = [...actions];
                            na[i].type = v;
                            setActions(na);
                          }}
                          options={ACTION_OPTIONS.map((opt) => ({
                            value: opt.value,
                            label: (
                              <Space>
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </Space>
                            ),
                          }))}
                          style={{ width: "100%" }}
                        />
                      </Col>
                      <Col>
                        <Input
                          placeholder='Config (e.g., {"template": "reminder"})'
                          value={typeof a.config === "string" ? a.config : JSON.stringify(a.config || {})}
                          onChange={(e) => {
                            try {
                              const na = [...actions];
                              na[i].config = JSON.parse(e.target.value || "{}");
                              setActions(na);
                            } catch {
                              const na = [...actions];
                              na[i].config = e.target.value;
                              setActions(na);
                            }
                          }}
                          style={{ width: 200 }}
                        />
                      </Col>
                      <Col>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setActions(actions.filter((_, j) => j !== i))}
                          disabled={actions.length === 1}
                        />
                      </Col>
                    </Row>
                  </Card>
                );
              })}
              <Button
                type="dashed"
                onClick={() => setActions([...actions, { type: "send_email", config: {} }])}
                block
                icon={<PlusOutlined />}>
                + Add Action
              </Button>
            </Form.Item>
          </>
        )}
      </Form>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
        <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        {step < 2 && (
          <Button type="primary" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        )}
      </div>
    </Modal>
  );
};

const AutomationBuilderPage = () => {
  const dispatch = useDispatch();
  const automations = useSelector(selectAutomations);
  const recipes = useSelector(selectRecipes);
  const stats = useSelector(selectAutomationStats);
  const loading = useSelector(selectAutomationLoading);
  const actionLoading = useSelector(selectAutomationActionLoading);
  const executing = useSelector(selectAutomationExecuting);

  const [createVisible, setCreateVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    setTableLoading(true);
    try {
      await Promise.all([dispatch(fetchAutomations()), dispatch(fetchRecipes())]);
    } catch (error) {
      message.error("Failed to load automations");
    } finally {
      setTableLoading(false);
    }
  };

  const handleToggle = async (automation) => {
    try {
      await dispatch(toggleAutomation(automation._id)).unwrap();
      message.success(`Automation ${automation.isActive ? "paused" : "activated"}`);
      loadData();
    } catch {
      message.error("Failed to toggle automation");
    }
  };

  const handleExecute = async (automation) => {
    try {
      await dispatch(executeAutomation({ id: automation._id })).unwrap();
      message.success("Automation executed successfully");
    } catch {
      message.error("Execution failed");
    }
  };

  const handleDelete = (automation) => {
    Modal.confirm({
      title: "Delete Automation",
      content: (
        <span>
          Are you sure you want to delete <strong>{automation.name}</strong>? This action cannot be undone.
        </span>
      ),
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteAutomation(automation._id)).unwrap();
          message.success("Automation deleted");
          loadData();
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const handleEdit = (automation) => {
    setEditData(automation);
    setCreateVisible(true);
  };

  const handleApplyRecipe = (recipe) => {
    setEditData({ ...recipe, _id: null });
    setCreateVisible(true);
  };

  const automationColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (v, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{v}</Text>
          {r.description && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trigger",
      dataIndex: "trigger",
      key: "trigger",
      render: (v) => {
        const trigger = TRIGGER_OPTIONS.find((t) => t.value === v);
        return (
          <Tag icon={<span>{trigger?.icon}</span>} style={{ borderRadius: 6 }}>
            {trigger?.label || v}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (a) => (
        <Space size={4} wrap>
          {a?.slice(0, 2).map((ac, i) => {
            const action = ACTION_OPTIONS.find((opt) => opt.value === ac.type);
            return (
              <Tag key={i} icon={<span>{action?.icon}</span>} style={{ borderRadius: 4 }}>
                {action?.label || ac.type}
              </Tag>
            );
          })}
          {a?.length > 2 && <Tag>+{a.length - 2} more</Tag>}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (v) => (
        <Tag color={v ? "green" : "default"} icon={v ? <CheckCircleOutlined /> : <PauseCircleOutlined />}>
          {v ? "Active" : "Paused"}
        </Tag>
      ),
    },
    {
      title: "Executions",
      dataIndex: "executionCount",
      key: "executionCount",
      render: (v) => v || 0,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, r) => (
        <Space size="small">
          <Switch checked={r.isActive} onChange={() => handleToggle(r)} size="small" />
          <Tooltip title="Run Now">
            <Button
              size="small"
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecute(r)}
              loading={executing}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

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
              Automation Builder
            </Title>
            <Text type="secondary">No-code workflow automation for your firm</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditData(null); setCreateVisible(true); }}>
            Create Automation
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Total Automations</Text>}
                value={stats?.total || automations.length}
                prefix={<ThunderboltOutlined style={{ color: "#3b82f6" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Active</Text>}
                value={stats?.active || 0}
                valueStyle={{ color: "#10b981" }}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title={<Text type="secondary">Executions Today</Text>}
                value={stats?.today || 0}
                valueStyle={{ color: "#f59e0b" }}
                prefix={<SettingOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {recipes.length > 0 && (
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} title="Quick Start Recipes">
            <Row gutter={[16, 16]}>
              {recipes.map((recipe) => (
                <Col key={recipe.id || recipe._id} xs={24} sm={12} md={8}>
                  <RecipeCard recipe={recipe} onApply={handleApplyRecipe} />
                </Col>
              ))}
            </Row>
          </Card>
        )}

        <Card bordered={false} style={{ borderRadius: 12 }} title="Your Automations">
          {tableLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : automations.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical">
                  <Text type="secondary">No automations created yet</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Create your first automation or use a quick start recipe above
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditData(null); setCreateVisible(true); }}
                    style={{ marginTop: 8 }}>
                    Create Your First Automation
                  </Button>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              dataSource={automations}
              columns={automationColumns}
              rowKey="_id"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} automations` }}
              scroll={{ x: "max-content" }}
              size="middle"
            />
          )}
        </Card>
      </div>

      <CreateAutomationModal
        visible={createVisible}
        onClose={() => { setCreateVisible(false); setEditData(null); }}
        onSuccess={loadData}
        loading={actionLoading}
        initialData={editData}
      />
    </>
  );
};

export default AutomationBuilderPage;
