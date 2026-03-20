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
  Dropdown,
  Badge,
  Collapse,
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

const TRIGGER_LABELS = {
  deadline_created: "Deadline Created",
  deadline_approaching: "Deadline Approaching",
  compliance_due: "Compliance Due",
  compliance_overdue: "Compliance Overdue",
  matter_created: "Matter Created",
  task_completed: "Task Completed",
  document_generated: "Document Generated",
  manual: "Manual Trigger",
};

const ACTION_LABELS = {
  send_email: "Send Email",
  send_sms: "Send SMS",
  create_task: "Create Task",
  create_deadline: "Create Deadline",
  update_status: "Update Status",
  send_notification: "Send Notification",
  webhook: "Call Webhook",
};

const CreateAutomationDrawer = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [trigger, setTrigger] = useState("deadline_approaching");
  const [conditions, setConditions] = useState([{ field: "", operator: "", value: "" }]);
  const [actions, setActions] = useState([{ type: "send_email", config: {} }]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(createAutomation({ ...values, trigger, conditions, actions })).unwrap();
      message.success("Automation created");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err || "Failed to create automation");
    }
  };

  return (
    <Modal title="Create Automation" open={visible} onOk={handleSubmit} onCancel={onClose} confirmLoading={loading} width={700} styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Automation Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., Deadline Reminder Email" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="What does this automation do?" />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Text strong>Trigger</Text>
          <Select value={trigger} onChange={setTrigger} style={{ width: "100%", marginTop: 4 }} options={Object.entries(TRIGGER_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
        </div>

        <Collapse style={{ marginBottom: 16 }}>
          <Panel header="Conditions (optional)" key="conditions">
            {conditions.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Input placeholder="Field" value={c.field} onChange={(e) => { const nc = [...conditions]; nc[i].field = e.target.value; setConditions(nc); }} style={{ flex: 1 }} />
                <Select placeholder="Op" value={c.operator} onChange={(v) => { const nc = [...conditions]; nc[i].operator = v; setConditions(nc); }} style={{ width: 100 }} options={[{ value: "equals", label: "=" }, { value: "contains", label: "contains" }, { value: "greater", label: ">" }]} />
                <Input placeholder="Value" value={c.value} onChange={(e) => { const nc = [...conditions]; nc[i].value = e.target.value; setConditions(nc); }} style={{ flex: 1 }} />
                <Button type="text" danger onClick={() => setConditions(conditions.filter((_, j) => j !== i))}>X</Button>
              </div>
            ))}
            <Button type="dashed" onClick={() => setConditions([...conditions, { field: "", operator: "", value: "" }])} block>+ Add Condition</Button>
          </Panel>
        </Collapse>

        <div>
          <Text strong>Actions</Text>
          {actions.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginTop: 8, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <Select value={a.type} onChange={(v) => { const na = [...actions]; na[i].type = v; setActions(na); }} style={{ width: 180 }} options={Object.entries(ACTION_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
              <Input placeholder="Config (JSON)" onChange={(e) => { const na = [...actions]; na[i].config = e.target.value; setActions(na); }} style={{ flex: 1 }} />
              <Button type="text" danger onClick={() => setActions(actions.filter((_, j) => j !== i))}>X</Button>
            </div>
          ))}
          <Button type="dashed" onClick={() => setActions([...actions, { type: "send_email", config: {} }])} block style={{ marginTop: 8 }}>+ Add Action</Button>
        </div>
      </Form>
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

  useEffect(() => {
    dispatch(fetchAutomations());
    dispatch(fetchRecipes());
  }, [dispatch]);

  const handleToggle = async (automation) => {
    try {
      await dispatch(toggleAutomation(automation._id)).unwrap();
      message.success(`Automation ${automation.isActive ? "paused" : "activated"}`);
    } catch {
      message.error("Failed to toggle automation");
    }
  };

  const handleExecute = async (automation) => {
    try {
      await dispatch(executeAutomation({ id: automation._id })).unwrap();
      message.success("Automation executed");
    } catch {
      message.error("Execution failed");
    }
  };

  const handleDelete = (automation) => {
    Modal.confirm({
      title: "Delete Automation",
      content: `Delete "${automation.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteAutomation(automation._id)).unwrap();
          message.success("Automation deleted");
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const automationColumns = [
    { title: "Name", dataIndex: "name", key: "name", render: (v, r) => <div><Text strong>{v}</Text>{r.description && <div><Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text></div>}</div> },
    { title: "Trigger", dataIndex: "trigger", key: "trigger", render: (v) => <Tag color="blue">{TRIGGER_LABELS[v] || v}</Tag> },
    { title: "Actions", dataIndex: "actions", key: "actions", render: (a) => a?.map((ac) => ACTION_LABELS[ac.type] || ac.type).join(", ") || "—" },
    { title: "Status", dataIndex: "isActive", key: "isActive", render: (v) => <Tag color={v ? "green" : "default"}>{v ? "Active" : "Paused"}</Tag> },
    { title: "Executions", dataIndex: "executionCount", key: "executionCount", render: (v) => v || 0 },
    { title: "Actions", key: "actions", render: (_, r) => (
      <Space>
        <Switch checked={r.isActive} onChange={() => handleToggle(r)} size="small" />
        <Button size="small" type="link" icon={<PlayCircleOutlined />} onClick={() => handleExecute(r)} loading={executing}>Run</Button>
        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)} />
      </Space>
    )},
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Automation Builder</Title>
            <Text type="secondary">No-code workflow automation for your firm</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>Create Automation</Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Total Automations" value={stats?.total || automations.length} prefix={<ThunderboltOutlined style={{ color: "#3b82f6" }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Active" value={stats?.active || 0} valueStyle={{ color: "#10b981" }} prefix={<PlayCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Executions Today" value={stats?.today || 0} valueStyle={{ color: "#f59e0b" }} prefix={<SettingOutlined />} />
            </Card>
          </Col>
        </Row>

        {recipes.length > 0 && (
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} title="Quick Start Recipes">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {recipes.map((recipe) => (
                <div key={recipe.id} style={{ padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, cursor: "pointer" }}>
                  <Text strong>{recipe.name}</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>{recipe.description}</Text></div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card bordered={false} style={{ borderRadius: 12 }} title="Your Automations">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table dataSource={automations} columns={automationColumns} rowKey="_id" pagination={{ pageSize: 10 }} />
          )}
        </Card>
      </div>

      <CreateAutomationDrawer
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={() => dispatch(fetchAutomations())}
        loading={actionLoading}
      />
    </>
  );
};

export default AutomationBuilderPage;
