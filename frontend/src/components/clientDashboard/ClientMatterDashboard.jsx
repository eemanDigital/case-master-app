import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Tabs,
  Badge,
  Statistic,
  Space,
  Button,
  Tag,
  List,
  Typography,
  Empty,
  Spin,
  Modal,
  Descriptions,
  Avatar,
  Divider,
  Input,
  Timeline,
  message,
  Alert,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  SafetyOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  FolderOpenOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import axios from "axios";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const { Text, Title, Paragraph } = Typography;

const MatterStatusTag = ({ status }) => {
  const statusConfig = {
    active: { color: "success", text: "Active" },
    pending: { color: "warning", text: "Pending" },
    "on-hold": { color: "default", text: "On Hold" },
    completed: { color: "processing", text: "Completed" },
    closed: { color: "default", text: "Closed" },
    settled: { color: "purple", text: "Settled" },
    won: { color: "success", text: "Won" },
    lost: { color: "error", text: "Lost" },
  };
  const config = statusConfig[status] || { color: "default", text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const PriorityTag = ({ priority }) => {
  const config = {
    low: { color: "default", text: "Low" },
    medium: { color: "processing", text: "Medium" },
    high: { color: "warning", text: "High" },
    urgent: { color: "error", text: "Urgent" },
  };
  const p = config[priority] || config.medium;
  return <Tag color={p.color}>{p.text} Priority</Tag>;
};

const MatterTypeIcon = ({ type }) => {
  const icons = {
    litigation: <SafetyOutlined />,
    corporate: <FolderOpenOutlined />,
    property: <HomeOutlined />,
    advisory: <TeamOutlined />,
    retainer: <SyncOutlined />,
    general: <FileTextOutlined />,
  };
  return icons[type] || <FileTextOutlined />;
};

const getMatterTypeStyles = (type) => {
  const styles = {
    litigation: {
      bg: "bg-blue-50",
      text: "text-blue-500",
      border: "border-l-blue-500",
      gradient: "from-blue-500 to-blue-600",
    },
    corporate: {
      bg: "bg-amber-50",
      text: "text-amber-500",
      border: "border-l-amber-500",
      gradient: "from-amber-500 to-amber-600",
    },
    property: {
      bg: "bg-green-50",
      text: "text-green-500",
      border: "border-l-green-500",
      gradient: "from-green-500 to-green-600",
    },
    advisory: {
      bg: "bg-purple-50",
      text: "text-purple-500",
      border: "border-l-purple-500",
      gradient: "from-purple-500 to-purple-600",
    },
    retainer: {
      bg: "bg-emerald-50",
      text: "text-emerald-500",
      border: "border-l-emerald-500",
      gradient: "from-emerald-500 to-emerald-600",
    },
    general: {
      bg: "bg-gray-50",
      text: "text-gray-500",
      border: "border-l-gray-500",
      gradient: "from-gray-500 to-gray-600",
    },
  };
  return styles[type] || styles.general;
};

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
  onClick,
  gradient,
}) => (
  <Card
    className={`stat-card h-full transition-all duration-300 ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
    onClick={onClick}
    hoverable={!!onClick}>
    {gradient ? (
      <div
        className={`bg-gradient-to-br ${gradient} p-4 rounded-xl relative overflow-hidden`}>
        <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/80 text-sm font-medium">{title}</div>
            <div className="text-white text-2xl font-bold">{value}</div>
            <div className="text-white/70 text-xs mt-1">{subtitle}</div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white text-xl">
            {icon}
          </div>
        </div>
      </div>
    ) : (
      <>
        <Statistic
          title={title}
          value={value}
          prefix={icon}
          valueStyle={{ color, fontSize: "28px", fontWeight: 600 }}
        />
        <p className="text-xs text-gray-500 mt-2 mb-0">{subtitle}</p>
      </>
    )}
  </Card>
);

const MatterCard = ({ matter, onClick }) => {
  const typeStyles = getMatterTypeStyles(matter.matterType);
  const priorityColor =
    matter.priority === "urgent"
      ? "#ef4444"
      : matter.priority === "high"
        ? "#f97316"
        : "#3b82f6";

  return (
    <Card
      hoverable
      className="matter-card shadow-sm hover:shadow-md transition-all duration-300 mb-4 border-l-4"
      style={{ borderLeftColor: priorityColor }}
      onClick={() => onClick(matter)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeStyles.bg}`}>
            <span className={typeStyles.text}>
              <MatterTypeIcon type={matter.matterType} />
            </span>
          </div>
          <div>
            <Text strong className="block">
              {matter.matterNumber}
            </Text>
            <Text type="secondary" className="text-xs">
              {matter.matterType?.toUpperCase()}
            </Text>
          </div>
        </div>
        <Space direction="vertical" size={0}>
          <MatterStatusTag status={matter.status} />
          <PriorityTag priority={matter.priority} />
        </Space>
      </div>

      <Title level={5} className="mb-2 mt-0">
        {matter.title}
      </Title>

      <Paragraph ellipsis={2} className="text-gray-500 mb-3 text-sm">
        {matter.description}
      </Paragraph>

      <div className="flex justify-between items-center text-xs text-gray-400">
        <Space>
          <CalendarOutlined />
          <span>Opened {dayjs(matter.dateOpened).format("MMM DD, YYYY")}</span>
        </Space>
        {matter.accountOfficer?.length > 0 && (
          <Space>
            <Avatar size="small" src={matter.accountOfficer[0]?.photo}>
              {matter.accountOfficer[0]?.firstName?.[0]}
            </Avatar>
            <span>
              {matter.accountOfficer[0]?.firstName}{" "}
              {matter.accountOfficer[0]?.lastName}
            </span>
          </Space>
        )}
      </div>
    </Card>
  );
};

const ClientMatterDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const clientId = user?.data?._id;

  const [loading, setLoading] = useState(true);
  const [matters, setMatters] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [matterDetailsVisible, setMatterDetailsVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailsVisible, setTaskDetailsVisible] = useState(false);
  const [taskResponse, setTaskResponse] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const fetchData = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      const [mattersRes, invoicesRes, tasksRes] = await Promise.all([
        axios.get(`/api/v1/matters?client=${clientId}&limit=50`),
        axios.get(`/api/v1/invoices?clientId=${clientId}&limit=20`),
        axios.get(`/api/v1/tasks?limit=50`),
      ]);

      console.log("=== CLIENT DASHBOARD DATA ===");
      console.log("Matters:", mattersRes?.data?.data?.length || 0);
      console.log("Invoices:", invoicesRes?.data?.data || 0);
      console.log("Tasks:", tasksRes?.data?.data?.length || 0);
      console.log("Tasks full response:", tasksRes?.data);

      setMatters(mattersRes?.data?.data || mattersRes?.data || []);
      setInvoices(invoicesRes?.data?.data || invoicesRes?.data || []);
      setTasks(tasksRes?.data?.data || tasksRes?.data || []);
    } catch (error) {
      console.error("Error fetching client data:", error);
      setMatters([]);
      setInvoices([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processedData = useMemo(() => {
    const activeMatters = matters?.filter((m) =>
      ["active", "pending"].includes(m.status),
    );
    const completedMatters = matters.filter((m) =>
      ["completed", "closed", "settled"].includes(m.status),
    );

    const pendingInvoices = invoices.filter((i) =>
      ["sent", "partially_paid", "overdue"].includes(i.status),
    );
    const paidInvoices = invoices.filter((i) => i.status === "paid");
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");

    const totalDue = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.balance || 0),
      0,
    );
    const totalPaid = invoices.reduce(
      (sum, inv) => sum + (inv.amountPaid || 0),
      0,
    );
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), "day"),
    );

    return {
      activeMatters,
      completedMatters,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalDue,
      totalPaid,
      pendingTasks,
      overdueTasks,
    };
  }, [matters, invoices, tasks]);

  const handleMatterClick = (matter) => {
    setSelectedMatter(matter);
    setMatterDetailsVisible(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskDetailsVisible(true);
    setTaskResponse("");
  };

  const handleTaskResponseSubmit = async () => {
    if (!taskResponse.trim()) return;

    setSubmittingResponse(true);
    try {
      await axios.post(`/api/v1/tasks/${selectedTask._id}/responses`, {
        comment: taskResponse,
        status: "in-progress",
      });
      message.success("Response submitted successfully");
      setTaskDetailsVisible(false);
      fetchData();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to submit response",
      );
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleViewAllMatters = () => setActiveTab("matters");
  const handleViewInvoices = () => setActiveTab("billing");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="client-dashboard min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Dashboard Header */}
      <div className="dashboard-header mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <HomeOutlined className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 m-0">
                  Client Portal
                </h1>
                <p className="text-gray-600 m-0 text-sm">
                  Welcome back,{" "}
                  <span className="font-semibold text-blue-600">
                    {user?.data?.firstName}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <Space size="middle" className="flex-wrap">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
              <Text type="secondary" className="block text-xs">
                Active Matters
              </Text>
              <Text strong className="text-lg text-blue-600">
                {processedData.activeMatters.length}
              </Text>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
              <Text type="secondary" className="block text-xs">
                Pending Invoices
              </Text>
              <Text strong className="text-lg text-orange-500">
                {processedData.pendingInvoices.length}
              </Text>
            </div>
            {processedData.overdueInvoices.length > 0 && (
              <div className="bg-red-50 px-4 py-2 rounded-lg shadow-sm border border-red-100">
                <Text type="secondary" className="block text-xs">
                  Overdue
                </Text>
                <Text strong className="text-lg text-red-600">
                  {processedData.overdueInvoices.length}
                </Text>
              </div>
            )}
          </Space>
        </div>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Matters"
            value={processedData.activeMatters.length}
            icon={<FolderOpenOutlined />}
            gradient="from-blue-500 to-blue-600"
            subtitle="Ongoing legal matters"
            onClick={handleViewAllMatters}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Tasks"
            value={processedData.pendingTasks.length}
            icon={<CheckCircleOutlined />}
            gradient={
              processedData.overdueTasks.length > 0
                ? "from-red-500 to-red-600"
                : "from-green-500 to-green-600"
            }
            subtitle={
              processedData.overdueTasks.length > 0
                ? `${processedData.overdueTasks.length} overdue`
                : "Action required"
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Amount Due"
            value={`₦${processedData.totalDue.toLocaleString()}`}
            icon={<DollarOutlined />}
            gradient="from-amber-500 to-amber-600"
            subtitle={`${processedData.pendingInvoices.length} pending invoices`}
            onClick={handleViewInvoices}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Completed"
            value={processedData.completedMatters.length}
            icon={<TrophyOutlined />}
            gradient="from-purple-500 to-purple-600"
            subtitle="Matters closed"
          />
        </Col>
      </Row>

      {/* Overdue Alert */}
      {processedData.overdueInvoices.length > 0 && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <div>
                <Text strong>Payment Overdue</Text>
                <br />
                <Text>
                  You have {processedData.overdueInvoices.length} overdue
                  invoice(s) totaling ₦
                  {processedData.overdueInvoices
                    .reduce((s, i) => s + i.balance, 0)
                    .toLocaleString()}
                </Text>
              </div>
              <Button type="primary" danger onClick={handleViewInvoices}>
                View Invoices
              </Button>
            </div>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-6 rounded-lg"
        />
      )}

      {/* Main Content */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        className="dashboard-tabs"
        items={[
          {
            key: "overview",
            label: (
              <span className="flex items-center gap-2">
                <TrophyOutlined />
                <span>Overview</span>
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">
                          Your Active Matters
                        </span>
                        <Badge
                          count={processedData.activeMatters.length}
                          color="blue"
                        />
                      </div>
                    }
                    className="shadow-md h-full"
                    extra={
                      processedData.activeMatters.length > 3 && (
                        <Button type="link" onClick={handleViewAllMatters}>
                          View All <RightOutlined />
                        </Button>
                      )
                    }>
                    {processedData.activeMatters.length > 0 ? (
                      <div className="max-h-[500px] overflow-y-auto pr-2">
                        {processedData.activeMatters
                          .slice(0, 5)
                          .map((matter) => (
                            <MatterCard
                              key={matter._id}
                              matter={matter}
                              onClick={handleMatterClick}
                            />
                          ))}
                      </div>
                    ) : (
                      <Empty
                        description="No active matters"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <div className="space-y-4">
                    <Card
                      title={
                        <div className="flex items-center justify-between">
                          <span>Pending Invoices</span>
                          <Badge
                            count={processedData.pendingInvoices.length}
                            color="orange"
                          />
                        </div>
                      }
                      className="shadow-md"
                      extra={
                        <Button type="link" onClick={handleViewInvoices}>
                          View All
                        </Button>
                      }>
                      {processedData.pendingInvoices.length > 0 ? (
                        <List
                          dataSource={processedData.pendingInvoices.slice(0, 4)}
                          renderItem={(invoice) => (
                            <List.Item className="py-3">
                              <List.Item.Meta
                                avatar={
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${invoice.status === "overdue" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"}`}>
                                    <DollarOutlined />
                                  </div>
                                }
                                title={invoice.invoiceNumber}
                                description={
                                  <Space direction="vertical" size={0}>
                                    <Text type="secondary">
                                      {invoice.title}
                                    </Text>
                                    <Text strong>
                                      ₦{invoice.balance?.toLocaleString()} due
                                    </Text>
                                  </Space>
                                }
                              />
                              <Tag
                                color={
                                  invoice.status === "overdue"
                                    ? "red"
                                    : "orange"
                                }>
                                {invoice.status === "overdue"
                                  ? "Overdue"
                                  : "Pending"}
                              </Tag>
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty
                          description="No pending invoices"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </Card>

                    <Card
                      title={
                        <div className="flex items-center justify-between">
                          <span>Your Tasks</span>
                          <Badge
                            count={processedData.pendingTasks.length}
                            color="green"
                          />
                        </div>
                      }
                      className="shadow-md">
                      {processedData.pendingTasks.length > 0 ? (
                        <List
                          dataSource={processedData.pendingTasks.slice(0, 4)}
                          renderItem={(task) => (
                            <List.Item className="py-3">
                              <List.Item.Meta
                                avatar={
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), "day") ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                                    <CheckCircleOutlined />
                                  </div>
                                }
                                title={task.title}
                                description={
                                  <Space direction="vertical" size={0}>
                                    <Text type="secondary">
                                      {task.priority} priority
                                    </Text>
                                    {task.dueDate && (
                                      <Text
                                        type={
                                          dayjs(task.dueDate).isBefore(
                                            dayjs(),
                                            "day",
                                          )
                                            ? "danger"
                                            : "secondary"
                                        }>
                                        Due{" "}
                                        {dayjs(task.dueDate).format("MMM DD")}
                                      </Text>
                                    )}
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty
                          description="No pending tasks"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </Card>
                  </div>
                </Col>
              </Row>
            ),
          },
          {
            key: "matters",
            label: (
              <span className="flex items-center gap-2">
                <FolderOpenOutlined />
                <span>Matters</span>
              </span>
            ),
            children: (
              <Card className="shadow-md">
                <Row gutter={[16, 16]}>
                  {matters.length > 0 ? (
                    matters.map((matter) => (
                      <Col xs={24} sm={12} lg={8} key={matter._id}>
                        <MatterCard
                          matter={matter}
                          onClick={handleMatterClick}
                        />
                      </Col>
                    ))
                  ) : (
                    <Col span={24}>
                      <Empty
                        description="No matters found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
            ),
          },
          {
            key: "billing",
            label: (
              <span className="flex items-center gap-2">
                <DollarOutlined />
                <span>Billing</span>
              </span>
            ),
            children: (
              <Card className="shadow-md">
                <Row gutter={16} className="mb-6">
                  <Col span={6}>
                    <Statistic
                      title="Total Due"
                      value={processedData.totalDue}
                      prefix="₦"
                      valueStyle={{ color: "#fa8c16" }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Total Paid"
                      value={processedData.totalPaid}
                      prefix="₦"
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Pending"
                      value={processedData.pendingInvoices.length}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Overdue"
                      value={processedData.overdueInvoices.length}
                      valueStyle={{ color: "#ff4d4f" }}
                    />
                  </Col>
                </Row>

                <List
                  dataSource={invoices}
                  renderItem={(invoice) => (
                    <Card size="small" className="mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong className="text-lg">
                            {invoice.invoiceNumber}
                          </Text>
                          <br />
                          <Text type="secondary">{invoice.title}</Text>
                          <br />
                          <Text type="secondary">
                            Due: {dayjs(invoice.dueDate).format("MMM DD, YYYY")}
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text strong className="text-lg">
                            ₦{invoice.total?.toLocaleString()}
                          </Text>
                          <br />
                          <Text>
                            Balance: ₦{invoice.balance?.toLocaleString()}
                          </Text>
                          <br />
                          <MatterStatusTag status={invoice.status} />
                        </div>
                      </div>
                    </Card>
                  )}
                />
              </Card>
            ),
          },
          {
            key: "tasks",
            label: (
              <span className="flex items-center gap-2">
                <CheckCircleOutlined />
                <span>Tasks</span>
              </span>
            ),
            children: (
              <Card className="shadow-md">
                <List
                  dataSource={tasks}
                  renderItem={(task) => (
                    <Card
                      size="small"
                      className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTaskClick(task)}
                      hoverable>
                      <div className="flex justify-between items-start">
                        <div>
                          <Text strong className="text-lg">
                            {task.title}
                          </Text>
                          <br />
                          <Text type="secondary">
                            {task.description?.substring(0, 100)}
                          </Text>
                          <br />
                          <Space className="mt-2">
                            <Tag
                              color={
                                task.priority === "high"
                                  ? "red"
                                  : task.priority === "medium"
                                    ? "orange"
                                    : "default"
                              }>
                              {task.priority}
                            </Tag>
                            {task.dueDate && (
                              <Text
                                type={
                                  dayjs(task.dueDate).isBefore(dayjs(), "day")
                                    ? "danger"
                                    : "secondary"
                                }>
                                Due:{" "}
                                {dayjs(task.dueDate).format("MMM DD, YYYY")}
                              </Text>
                            )}
                          </Space>
                        </div>
                        <Tag
                          color={
                            task.status === "completed" ? "green" : "blue"
                          }>
                          {task.status}
                        </Tag>
                      </div>
                    </Card>
                  )}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Task Response Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            <span>{selectedTask?.title}</span>
          </Space>
        }
        open={taskDetailsVisible}
        onCancel={() => setTaskDetailsVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setTaskDetailsVisible(false)}>
            Close
          </Button>,
          selectedTask?.status !== "completed" && (
            <Button
              key="respond"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleTaskResponseSubmit}
              loading={submittingResponse}>
              Submit Response
            </Button>
          ),
        ].filter(Boolean)}>
        {selectedTask && (
          <div>
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="Status">
                <Tag
                  color={
                    selectedTask.status === "completed" ? "green" : "blue"
                  }>
                  {selectedTask.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag
                  color={
                    selectedTask.priority === "high"
                      ? "red"
                      : selectedTask.priority === "medium"
                        ? "orange"
                        : "default"
                  }>
                  {selectedTask.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {selectedTask.dueDate
                  ? dayjs(selectedTask.dueDate).format("MMM DD, YYYY")
                  : "Not set"}
              </Descriptions.Item>
              <Descriptions.Item label="Date Created">
                {selectedTask.dateCreated
                  ? dayjs(selectedTask.dateCreated).format("MMM DD, YYYY")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedTask.description || "No description"}
              </Descriptions.Item>
            </Descriptions>

            {selectedTask.status !== "completed" && (
              <div className="mt-4">
                <Text strong className="block mb-2">
                  Your Response
                </Text>
                <Input.TextArea
                  rows={4}
                  placeholder="Enter your response or comment..."
                  value={taskResponse}
                  onChange={(e) => setTaskResponse(e.target.value)}
                  maxLength={1000}
                  showCount
                />
                <Text type="secondary" className="text-xs mt-1 block">
                  Submit your response to let us know the progress or ask
                  questions.
                </Text>
              </div>
            )}

            {selectedTask.responses?.length > 0 && (
              <div className="mt-4">
                <Text strong className="block mb-2">
                  Previous Responses
                </Text>
                <Timeline
                  items={selectedTask.responses.map((response) => ({
                    color: response.status === "completed" ? "green" : "blue",
                    children: (
                      <div>
                        <Text>{response.comment}</Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          {dayjs(response.submittedAt).format(
                            "MMM DD, YYYY HH:mm",
                          )}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Matter Details Modal */}
      <Modal
        title={
          <Space>
            <MatterTypeIcon type={selectedMatter?.matterType} />
            <span>{selectedMatter?.matterNumber}</span>
          </Space>
        }
        open={matterDetailsVisible}
        onCancel={() => setMatterDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMatterDetailsVisible(false)}>
            Close
          </Button>,
          <Button key="contact" type="primary" icon={<MailOutlined />}>
            Contact Legal Team
          </Button>,
        ]}
        width={700}>
        {selectedMatter && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Title" span={2}>
                {selectedMatter.title}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag>{selectedMatter.matterType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {selectedMatter.category}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <MatterStatusTag status={selectedMatter.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <PriorityTag priority={selectedMatter.priority} />
              </Descriptions.Item>
              <Descriptions.Item label="Date Opened">
                {dayjs(selectedMatter.dateOpened).format("MMM DD, YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Closure">
                {selectedMatter.expectedClosureDate
                  ? dayjs(selectedMatter.expectedClosureDate).format(
                      "MMM DD, YYYY",
                    )
                  : "Not set"}
              </Descriptions.Item>
              <Descriptions.Item label="Nature" span={2}>
                {selectedMatter.natureOfMatter}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedMatter.description}
              </Descriptions.Item>
            </Descriptions>

            {selectedMatter.accountOfficer?.length > 0 && (
              <Card size="small" className="mt-4">
                <Text strong>Your Legal Team</Text>
                <Divider className="my-2" />
                {selectedMatter.accountOfficer.map((officer) => (
                  <div
                    key={officer._id}
                    className="flex items-center gap-3 mb-2">
                    <Avatar src={officer.photo}>
                      {officer.firstName?.[0]}
                    </Avatar>
                    <div>
                      <Text strong>
                        {officer.firstName} {officer.lastName}
                      </Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {officer.email}
                      </Text>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Support Card */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <TeamOutlined className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 m-0">Need Assistance?</h3>
              <p className="text-gray-600 m-0 text-sm">
                Your legal team is ready to help
              </p>
            </div>
          </div>
          <Space>
            <Button icon={<MailOutlined />}>Email Us</Button>
            <Button icon={<PhoneOutlined />}>Call</Button>
            <Button type="primary" icon={<SendOutlined />}>
              Send Message
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ClientMatterDashboard;
