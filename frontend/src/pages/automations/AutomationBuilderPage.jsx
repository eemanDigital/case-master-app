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
  Divider,
  Empty,
  Tooltip,
  Statistic,
  Alert,
} from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  MailOutlined,
  BellOutlined,
  CalendarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
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

const { Title, Text } = Typography;

const TRIGGERS = [
  { value: "deadline.approaching_7days", label: "Deadline in 7 Days", icon: <CalendarOutlined />, desc: "When a deadline is due in 7 days" },
  { value: "deadline.approaching_24hours", label: "Deadline in 24 Hours", icon: <CalendarOutlined />, desc: "When a deadline is due in 24 hours" },
  { value: "deadline.missed", label: "Deadline Missed", icon: <WarningOutlined />, desc: "When a deadline has passed" },
  { value: "compliance.filing_due", label: "Compliance Filing Due", icon: <CalendarOutlined />, desc: "When annual return filing is due" },
  { value: "compliance.overdue", label: "Compliance Overdue", icon: <WarningOutlined />, desc: "When compliance is overdue" },
  { value: "matter.created", label: "New Matter Created", icon: <PlusOutlined />, desc: "When a new matter is created" },
  { value: "manual", label: "Manual Trigger", icon: <PlayCircleOutlined />, desc: "Run manually when you choose" },
];

const ACTIONS = [
  { value: "send_email", label: "Send Email", icon: <MailOutlined />, desc: "Send an email notification" },
  { value: "send_in_app_notification", label: "Send Notification", icon: <BellOutlined />, desc: "Send an in-app notification" },
  { value: "create_task", label: "Create Task", icon: <CheckCircleOutlined />, desc: "Create a task for someone" },
];

const AutomationBuilderPage = () => {
  const dispatch = useDispatch();
  const automations = useSelector(selectAutomations);
  const recipes = useSelector(selectRecipes);
  const stats = useSelector(selectAutomationStats);
  const loading = useSelector(selectAutomationLoading);
  const actionLoading = useSelector(selectAutomationActionLoading);
  const executing = useSelector(selectAutomationExecuting);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [form] = Form.useForm();
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [selectedActions, setSelectedActions] = useState([]);
  const [emailConfig, setEmailConfig] = useState({ recipientType: "custom", customEmail: "", subject: "", body: "" });
  const [notificationConfig, setNotificationConfig] = useState({ title: "", message: "" });
  const [submitting, setSubmitting] = useState(false);


  console.log(automations)

  useEffect(() => {
    dispatch(fetchAutomations());
    dispatch(fetchRecipes());
  }, [dispatch]);

  const openCreateModal = () => {
    setEditingAutomation(null);
    form.resetFields();
    setSelectedTrigger(null);
    setSelectedActions([]);
    setEmailConfig({ recipientType: "client", customEmail: "", subject: "", body: "" });
    setNotificationConfig({ title: "", message: "" });
    setModalVisible(true);
  };

  const openEditModal = (automation) => {
    setEditingAutomation(automation);
    form.setFieldsValue({
      name: automation.name,
      description: automation.description,
    });
    setSelectedTrigger(automation.trigger?.event || "manual");
    
    const actions = automation.actions || [];
    const mappedActions = actions.map(a => {
      if (a.type === "send_notification") return "send_in_app_notification";
      return a.type;
    });
    setSelectedActions(mappedActions);
    
    const emailAction = actions.find(a => a.type === "send_email");
    if (emailAction?.config) {
      setEmailConfig({
        recipientType: emailAction.config.emailTo || "client",
        customEmail: emailAction.config.customEmail || "",
        subject: emailAction.config.emailSubject || "",
        body: emailAction.config.emailBody || "",
      });
    }
    
    const notifAction = actions.find(a => a.type === "send_in_app_notification");
    if (notifAction?.config) {
      setNotificationConfig({
        title: notifAction.config.notificationTitle || "",
        message: notifAction.config.notificationMessage || "",
      });
    }
    
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const actions = [];
      let actionIndex = 0;
      
      if (selectedActions.includes("send_email")) {
        actions.push({
          order: actionIndex++,
          type: "send_email",
          config: {
            emailTo: emailConfig.recipientType,
            customEmail: emailConfig.recipientType === "custom" ? emailConfig.customEmail : "",
            emailSubject: emailConfig.subject,
            emailBody: emailConfig.body,
          },
        });
      }
      
      if (selectedActions.includes("send_in_app_notification")) {
        actions.push({
          order: actionIndex++,
          type: "send_in_app_notification",
          config: {
            notifyUsers: [],
            notificationTitle: notificationConfig.title,
            notificationMessage: notificationConfig.message,
          },
        });
      }

      if (selectedActions.includes("create_task")) {
        actions.push({
          order: actionIndex++,
          type: "create_task",
          config: {},
        });
      }

      const automationData = {
        name: values.name,
        description: values.description,
        trigger: { event: selectedTrigger },
        actions,
      };

      if (editingAutomation) {
        await dispatch(updateAutomation({ id: editingAutomation._id, data: automationData })).unwrap();
        message.success("Automation updated");
      } else {
        await dispatch(createAutomation(automationData)).unwrap();
        message.success("Automation created");
      }

      setModalVisible(false);
      dispatch(fetchAutomations());
    } catch (err) {
      message.error(err?.message || "Failed to save automation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (automation) => {
    try {
      await dispatch(toggleAutomation(automation._id)).unwrap();
      message.success(automation.isActive ? "Automation paused" : "Automation activated");
      dispatch(fetchAutomations());
    } catch {
      message.error("Failed to toggle automation");
    }
  };

  const handleExecute = async (automation) => {
    try {
      await dispatch(executeAutomation({ id: automation._id })).unwrap();
      message.success("Automation executed");
    } catch (err) {
      message.error(err?.message || "Execution failed");
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
          dispatch(fetchAutomations());
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const handleInstallRecipe = async (recipe) => {
    try {
      await dispatch(createAutomation({
        name: recipe.name,
        description: recipe.description,
        trigger: recipe.trigger,
        actions: recipe.actions,
      })).unwrap();
      message.success("Recipe installed! Review and activate it.");
      dispatch(fetchAutomations());
      dispatch(fetchRecipes());
    } catch {
      message.error("Failed to install recipe");
    }
  };

  const columns = [
    {
      title: "Automation",
      key: "name",
      render: (_, r) => (
        <div>
          <Text strong>{r.name}</Text>
          {r.description && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text></div>}
        </div>
      ),
    },
    {
      title: "Trigger",
      key: "trigger",
      width: 180,
      render: (_, r) => {
        const t = TRIGGERS.find(x => x.value === r.trigger?.event);
        return <Tag icon={t?.icon}>{t?.label || r.trigger?.event}</Tag>;
      },
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, r) => (
        <Tag color={r.isActive ? "green" : "default"}>
          {r.isActive ? "Active" : "Paused"}
        </Tag>
      ),
    },
    {
      title: "Runs",
      key: "executions",
      width: 80,
      render: (_, r) => r.executionCount || 0,
    },
    {
      title: "Last Run",
      key: "lastRun",
      width: 120,
      render: (_, r) => r.lastExecutedAt ? dayjs(r.lastExecutedAt).format("DD MMM") : "Never",
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, r) => (
        <Space size="small">
          <Switch checked={r.isActive} onChange={() => handleToggle(r)} size="small" />
          <Tooltip title="Run Now">
            <Button size="small" type="text" icon={<PlayCircleOutlined />} onClick={() => handleExecute(r)} loading={executing} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Automations</Title>
          <Text type="secondary">Automate repetitive tasks - send emails, notifications, create tasks</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Create Automation
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card>
            <Statistic title="Total Automations" value={stats?.total || automations.length} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic title="Active" value={stats?.active || 0} valueStyle={{ color: "#10b981" }} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic title="Total Runs" value={stats?.totalExecutions || 0} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {recipes.length > 0 && (
        <Card title="Quick Start Templates" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {recipes.map(recipe => (
              <Col key={recipe.key || recipe._id} xs={24} sm={12} md={8}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text strong>{recipe.name}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{recipe.description}</Text>
                    <div>
                      <Tag>{TRIGGERS.find(t => t.value === recipe.trigger?.event)?.label}</Tag>
                    </div>
                    <Button 
                      type={recipe.isInstalled ? "default" : "primary"} 
                      icon={<RocketOutlined />} 
                      onClick={() => handleInstallRecipe(recipe)}
                      disabled={recipe.isInstalled}
                      block>
                      {recipe.isInstalled ? "Installed" : "Use Template"}
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="Your Automations">
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : automations.length === 0 ? (
          <Empty description="No automations yet">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Create Your First Automation
            </Button>
          </Empty>
        ) : (
          <Table dataSource={automations} columns={columns} rowKey="_id" pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Modal
        title={editingAutomation ? "Edit Automation" : "Create Automation"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingAutomation ? "Save Changes" : "Create"}
        confirmLoading={submitting}
        width={600}
        destroyOnClose>
        <Alert
          type="info"
          icon={<InfoCircleOutlined />}
          message="How Automations Work"
          description="Choose a trigger (what starts it), then select actions (what happens). The system will automatically run it when conditions are met."
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Automation Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Deadline Reminder" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="What does this automation do?" />
          </Form.Item>

          <Divider>Trigger (When it runs)</Divider>
          
          <Select
            placeholder="Select a trigger..."
            value={selectedTrigger}
            onChange={setSelectedTrigger}
            style={{ width: "100%" }}
            options={TRIGGERS.map(t => ({
              value: t.value,
              label: (
                <Space>
                  {t.icon}
                  <span>{t.label}</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>- {t.desc}</Text>
                </Space>
              ),
            }))}
          />

          <Divider>Actions (What happens)</Divider>

          <Text type="secondary" style={{ marginBottom: 8, display: "block" }}>Select actions to perform:</Text>
          
          <Space wrap style={{ marginBottom: 16 }}>
            {ACTIONS.map(action => (
              <Tag
                key={action.value}
                icon={action.icon}
                color={selectedActions.includes(action.value) ? "blue" : "default"}
                onClick={() => {
                  if (selectedActions.includes(action.value)) {
                    setSelectedActions(selectedActions.filter(a => a !== action.value));
                  } else {
                    setSelectedActions([...selectedActions, action.value]);
                  }
                }}
                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13 }}>
                {action.label}
              </Tag>
            ))}
          </Space>

          {selectedActions.includes("send_email") && (
            <Card title="Email Settings" size="small" style={{ marginBottom: 16 }}>
              <Form.Item label="Send Email To">
                <Select
                  value={emailConfig.recipientType}
                  onChange={val => setEmailConfig({ ...emailConfig, recipientType: val })}
                  options={[
                    { value: "client", label: "Client" },
                    { value: "assigned_lawyer", label: "Assigned Lawyer" },
                    { value: "supervisor", label: "Supervisor" },
                    { value: "custom", label: "Custom Email" },
                  ]}
                />
              </Form.Item>
              {emailConfig.recipientType === "custom" && (
                <Form.Item label="Email Address">
                  <Input 
                    placeholder="e.g., admin@lawfirm.com" 
                    value={emailConfig.customEmail}
                    onChange={e => setEmailConfig({ ...emailConfig, customEmail: e.target.value })}
                  />
                </Form.Item>
              )}
              <Form.Item label="Email Subject">
                <Input 
                  placeholder="e.g., Deadline Reminder: {{matter.title}}" 
                  value={emailConfig.subject}
                  onChange={e => setEmailConfig({ ...emailConfig, subject: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Email Body">
                <Input.TextArea 
                  rows={4}
                  placeholder="e.g., Dear {{lawyer.name}}, The deadline for {{matter.title}} is approaching on {{deadline.dueDate}}."
                  value={emailConfig.body}
                  onChange={e => setEmailConfig({ ...emailConfig, body: e.target.value })}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Use {"{{variable}}"} syntax for dynamic values like {"{{lawyer.name}}"}, {"{{matter.title}}"}, {"{{deadline.dueDate}}"}
              </Text>
            </Card>
          )}

          {selectedActions.includes("send_in_app_notification") && (
            <Card title="Notification Settings" size="small" style={{ marginBottom: 16 }}>
              <Form.Item label="Notification Title">
                <Input 
                  placeholder="e.g., Deadline Alert"
                  value={notificationConfig.title}
                  onChange={e => setNotificationConfig({ ...notificationConfig, title: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Notification Message">
                <Input.TextArea 
                  rows={2}
                  placeholder="e.g., {{matter.title}} is due on {{deadline.dueDate}}"
                  value={notificationConfig.message}
                  onChange={e => setNotificationConfig({ ...notificationConfig, message: e.target.value })}
                />
              </Form.Item>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AutomationBuilderPage;
