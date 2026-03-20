import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  message,
  Spin,
  Empty,
  Grid,
  Tooltip,
  Dropdown,
  Space,
  Typography,
  Badge,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SyncOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
  completeDeadline,
  extendDeadline,
  fetchDeadlineStats,
  selectDeadlines,
  selectDeadlineStats,
  selectDeadlineLoading,
  selectDeadlineActionLoading,
  selectDeadlineFilters,
  setFilters,
  clearFilters,
} from "../../redux/features/deadlines/deadlineSlice";
import { selectAllMatters } from "../../redux/features/matter/matterSlice";

dayjs.extend(relativeTime);

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text } = Typography;

const PRIORITY_COLORS = {
  low: { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  medium: { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  high: { color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  urgent: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
};

const STATUS_COLORS = {
  pending: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  completed: { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  overdue: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  extended: { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
};

const CATEGORY_OPTIONS = [
  { value: "court_filing", label: "Court Filing" },
  { value: "deadline_response", label: "Deadline Response" },
  { value: "compliance", label: "Compliance" },
  { value: "contract", label: "Contract" },
  { value: "regulatory", label: "Regulatory" },
  { value: "other", label: "Other" },
];

const CreateDeadlineModal = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const matters = useSelector(selectAllMatters);
  const [form] = useState({
    title: "",
    description: "",
    dueDate: null,
    matterId: "",
    priority: "medium",
    category: "other",
    assignedTo: "",
    reminders: [{ type: "email", daysBefore: 3 }],
    escalationLevels: [{ level: 1, hoursBeforeDeadline: 24, notifyRoles: ["associate"] }],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: null,
    matterId: "",
    priority: "medium",
    category: "other",
    reminders: [{ type: "email", daysBefore: 3 }],
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.dueDate) {
      message.error("Please fill in required fields");
      return;
    }
    try {
      await dispatch(createDeadline(formData)).unwrap();
      message.success("Deadline created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err || "Failed to create deadline");
    }
  };

  return (
    <Modal
      title="Create Deadline"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Create Deadline"
      confirmLoading={loading}
      width={600}
      styles={{ body: { padding: "20px" } }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Title *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., File Motion for Summary Judgment"
          />
        </div>
        <div>
          <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Description</label>
          <Input.TextArea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Additional details about this deadline..."
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Due Date *</label>
            <DatePicker
              showTime
              value={formData.dueDate}
              onChange={(date) => setFormData({ ...formData, dueDate: date })}
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Matter</label>
            <Select
              value={formData.matterId}
              onChange={(val) => setFormData({ ...formData, matterId: val })}
              placeholder="Link to matter (optional)"
              style={{ width: "100%" }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={matters?.map((m) => ({ value: m._id, label: m.matterNumber || m.title })) || []}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Priority</label>
            <Select
              value={formData.priority}
              onChange={(val) => setFormData({ ...formData, priority: val })}
              style={{ width: "100%" }}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Category</label>
            <Select
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
              style={{ width: "100%" }}
              options={CATEGORY_OPTIONS}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const DeadlineCard = ({ deadline, onEdit, onDelete, onComplete, onExtend, screens }) => {
  const priorityCfg = PRIORITY_COLORS[deadline.priority] || PRIORITY_COLORS.medium;
  const statusCfg = STATUS_COLORS[deadline.status] || STATUS_COLORS.pending;
  const isOverdue = dayjs(deadline.dueDate).isBefore(dayjs()) && deadline.status !== "completed";
  const timeLeft = dayjs(deadline.dueDate).fromNow();

  const menuItems = [
    { key: "edit", label: "Edit Deadline", icon: <EditOutlined />, onClick: () => onEdit(deadline) },
    { key: "extend", label: "Request Extension", icon: <ClockCircleOutlined />, onClick: () => onExtend(deadline) },
    { key: "complete", label: "Mark Complete", icon: <CheckCircleOutlined />, onClick: () => onComplete(deadline) },
    { type: "divider" },
    { key: "delete", label: "Delete", icon: <DeleteOutlined />, danger: true, onClick: () => onDelete(deadline) },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag style={{ borderRadius: 6, border: `1px solid ${priorityCfg.border}`, background: priorityCfg.bg, color: priorityCfg.color, fontWeight: 600 }}>
            {deadline.priority?.toUpperCase()}
          </Tag>
          <Tag style={{ borderRadius: 6, border: `1px solid ${statusCfg.border}`, background: statusCfg.bg, color: statusCfg.color, fontWeight: 600 }}>
            {isOverdue ? "OVERDUE" : deadline.status?.toUpperCase()}
          </Tag>
        </div>
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </div>

      <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{deadline.title}</h4>

      {deadline.description && (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
          {deadline.description.length > 80 ? deadline.description.slice(0, 80) + "..." : deadline.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <CalendarOutlined style={{ color: isOverdue ? "#ef4444" : "#94a3b8", fontSize: 12 }} />
        <Text style={{ fontSize: 12, color: isOverdue ? "#ef4444" : "#64748b", fontWeight: isOverdue ? 700 : 500 }}>
          {dayjs(deadline.dueDate).format("DD MMM YYYY, HH:mm")}
        </Text>
        {deadline.status !== "completed" && (
          <Text style={{ fontSize: 11, color: isOverdue ? "#ef4444" : "#94a3b8" }}>
            ({timeLeft})
          </Text>
        )}
      </div>

      {deadline.matterId && (
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          Matter: <span style={{ fontFamily: "monospace" }}>{deadline.matterId?.matterNumber || "N/A"}</span>
        </div>
      )}
    </div>
  );
};

const DeadlineManager = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const deadlines = useSelector(selectDeadlines);
  const stats = useSelector(selectDeadlineStats);
  const loading = useSelector(selectDeadlineLoading);
  const actionLoading = useSelector(selectDeadlineActionLoading);
  const filters = useSelector(selectDeadlineFilters);

  const [createVisible, setCreateVisible] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(null);

  useEffect(() => {
    dispatch(fetchDeadlines());
    dispatch(fetchDeadlineStats());
  }, [dispatch]);

  const groupedDeadlines = {
    overdue: deadlines.filter((d) => dayjs(d.dueDate).isBefore(dayjs()) && d.status !== "completed"),
    upcoming: deadlines.filter((d) => dayjs(d.dueDate).isAfter(dayjs()) && dayjs(d.dueDate).isBefore(dayjs().add(7, "day")) && d.status !== "completed"),
    completed: deadlines.filter((d) => d.status === "completed"),
    later: deadlines.filter((d) => dayjs(d.dueDate).isAfter(dayjs().add(7, "day")) && d.status !== "completed"),
  };

  const handleDelete = (deadline) => {
    Modal.confirm({
      title: "Delete Deadline",
      content: `Are you sure you want to delete "${deadline.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteDeadline(deadline._id)).unwrap();
          message.success("Deadline deleted");
        } catch {
          message.error("Failed to delete deadline");
        }
      },
    });
  };

  const handleComplete = async (deadline) => {
    try {
      await dispatch(completeDeadline({ id: deadline._id, data: {} })).unwrap();
      message.success("Deadline marked as complete");
    } catch {
      message.error("Failed to complete deadline");
    }
  };

  const renderColumn = (title, items, color) => (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: `${color}15`, borderRadius: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{title}</span>
        <Badge count={items.length} style={{ backgroundColor: color, fontSize: 10 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>No deadlines</div>
        ) : (
          items.map((d) => (
            <DeadlineCard
              key={d._id}
              deadline={d}
              onEdit={setSelectedDeadline}
              onDelete={handleDelete}
              onComplete={handleComplete}
              onExtend={setSelectedDeadline}
              screens={screens}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ padding: screens.xs ? 12 : screens.md ? 20 : 28, minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: screens.xs ? 20 : 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Deadline Manager</h1>
            <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 4 }}>Track and manage all your legal deadlines</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)} style={{ borderRadius: 8, fontWeight: 600 }}>
            New Deadline
          </Button>
        </div>

        {stats && (
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px", padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}><AlertOutlined /></div>
              <div><div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{stats.overdue || 0}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Overdue</div></div>
            </div>
            <div style={{ flex: "1 1 140px", padding: 14, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f59e0b22", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}><WarningOutlined /></div>
              <div><div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{stats.upcoming || 0}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>This Week</div></div>
            </div>
            <div style={{ flex: "1 1 140px", padding: 14, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#10b98122", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}><CheckCircleOutlined /></div>
              <div><div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{stats.completed || 0}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Completed</div></div>
            </div>
            <div style={{ flex: "1 1 140px", padding: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#3b82f622", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}><TrophyOutlined /></div>
              <div><div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{stats.total || 0}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Total</div></div>
            </div>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, padding: "0 0 16px", borderBottom: "1px solid #f1f5f9" }}>
            <Search placeholder="Search deadlines..." allowClear onSearch={(v) => dispatch(setFilters({ search: v }))} style={{ width: screens.xs ? "100%" : 260 }} />
            <Select placeholder="Priority" allowClear style={{ width: 130 }} onChange={(v) => dispatch(setFilters({ priority: v }))} options={[
              { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
            ]} />
            <Select placeholder="Status" allowClear style={{ width: 130 }} onChange={(v) => dispatch(setFilters({ status: v }))} options={[
              { value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }, { value: "overdue", label: "Overdue" },
            ]} />
            <Button icon={<SyncOutlined />} onClick={() => { dispatch(fetchDeadlines()); dispatch(fetchDeadlineStats()); }}>Refresh</Button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spin size="large" /></div>
          ) : deadlines.length === 0 ? (
            <Empty description="No deadlines found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
              {renderColumn("Overdue", groupedDeadlines.overdue, "#ef4444")}
              {renderColumn("This Week", groupedDeadlines.upcoming, "#f59e0b")}
              {renderColumn("Completed", groupedDeadlines.completed, "#10b981")}
              {renderColumn("Later", groupedDeadlines.later, "#3b82f6")}
            </div>
          )}
        </div>
      </div>

      <CreateDeadlineModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={() => { dispatch(fetchDeadlines()); dispatch(fetchDeadlineStats()); }}
        loading={actionLoading}
      />
    </>
  );
};

export default DeadlineManager;
