import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  message,
  Spin,
  Empty,
  Grid,
  Tooltip,
  Dropdown,
  Space,
  Typography,
  Badge,
  Card,
  Divider,
} from "antd";
import {
  PlusOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  MoreOutlined,
  DeleteOutlined,
  SyncOutlined,
  TrophyOutlined,
  FileTextOutlined,
  LinkOutlined,
  UserOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchDeadlines,
  createDeadline,
  deleteDeadline,
  completeDeadline,
  fetchDeadlineStats,
  selectDeadlines,
  selectDeadlineStats,
  selectDeadlineLoading,
  selectDeadlineActionLoading,
  selectDeadlineFilters,
  selectDeadlinePagination,
  setFilters,
} from "../../redux/features/deadlines/deadlineSlice";
import useMattersSelectOptions from "../../hooks/useMattersSelectOptions";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

dayjs.extend(relativeTime);

const { useBreakpoint } = Grid;

const { Search } = Input;
const { Text } = Typography;

const PRIORITY_CONFIG = {
  low: { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", label: "Low" },
  normal: {
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    label: "Normal",
  },
  high: { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", label: "High" },
  critical: {
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
    label: "Critical",
  },
};

const STATUS_CONFIG = {
  pending: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  "in-progress": { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  completed: { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  missed: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  extended: { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  cancelled: { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

const CATEGORY_OPTIONS = [
  { value: "court-date", label: "Court Date" },
  { value: "filing-deadline", label: "Filing Deadline" },
  { value: "cac-renewal", label: "CAC Renewal" },
  { value: "annual-returns", label: "Annual Returns" },
  { value: "client-meeting", label: "Client Meeting" },
  { value: "payment-due", label: "Payment Due" },
  { value: "document-submission", label: "Document Submission" },
  { value: "contract-expiry", label: "Contract Expiry" },
  { value: "limitation-period", label: "Limitation Period" },
  { value: "custom", label: "Custom" },
];

const CreateDeadlineModal = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState(null);

  const {
    mattersOptions,
    loading: mattersLoading,
    fetchMatters,
  } = useMattersSelectOptions({
    status: "active",
    limit: 100,
  });

  const {
    data: staffOptions,
    loading: staffLoading,
    count,
  } = useUserSelectOptions({
    type: "staff",
    includeInactive: false,
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const deadlineData = {
        ...values,
        dueDate: values.dueDate?.toISOString(),
        linkedEntityType: values.linkedMatterId ? "matter" : "custom",
        linkedEntityId: values.linkedMatterId || undefined,
      };

      await dispatch(createDeadline(deadlineData)).unwrap();
      message.success("Deadline created successfully");
      form.resetFields();
      setSelectedMatter(null);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.message || err || "Failed to create deadline");
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarOutlined style={{ color: "#3b82f6" }} />
          <span>Create New Deadline</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Create Deadline"
      confirmLoading={submitting || loading}
      width={700}
      destroyOnClose
      styles={{ body: { padding: "24px 24px 12px" } }}>
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{
          priority: "normal",
          category: "custom",
          isRecurring: false,
        }}>
        <Form.Item
          name="title"
          label="Deadline Title"
          rules={[
            { required: true, message: "Please enter a deadline title" },
            { max: 300, message: "Title cannot exceed 300 characters" },
          ]}>
          <Input
            placeholder="e.g., File Motion for Summary Judgment"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 2000, message: "Description cannot exceed 2000 characters" },
          ]}>
          <Input.TextArea
            rows={2}
            placeholder="Additional details about this deadline..."
          />
        </Form.Item>

        <Form.Item
          name="linkedMatterId"
          label={
            <Space>
              <LinkOutlined style={{ color: "#3b82f6" }} />
              <span>Link to Matter (Optional)</span>
            </Space>
          }
          tooltip="Associate this deadline with a specific matter">
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
            size="large"
            labelInValue
            optionLabelProp="label"
            onChange={(value) => setSelectedMatter(value?.value || null)}
          />
        </Form.Item>

        {selectedMatter && (
          <div
            style={{
              padding: "12px 16px",
              background: "#eff6ff",
              borderRadius: 8,
              marginBottom: 16,
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

        <Divider style={{ margin: "16px 0" }} />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: "Please select a due date" }]}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
              size="large"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select a category" }]}>
            <Select
              placeholder="Select category"
              size="large"
              options={CATEGORY_OPTIONS}
            />
          </Form.Item>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Item
            name="assignedTo"
            label={
              <Space>
                <UserOutlined style={{ color: "#3b82f6" }} />
                <span>Assign To</span>
              </Space>
            }
            rules={[{ required: true, message: "Please select an assignee" }]}>
            <Select
              showSearch
              placeholder="Select staff member..."
              options={staffOptions}
              loading={staffLoading}
              filterOption={(input, option) =>
                (option.label || "").toLowerCase().includes(input.toLowerCase())
              }
              size="large"
              notFoundContent={staffLoading ? "Loading..." : "No staff found"}
            />
          </Form.Item>

          <Form.Item name="priority" label="Priority">
            <Select
              size="large"
              options={Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({
                value: k,
                label: v.label,
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="tags" label="Tags">
          <Select
            mode="tags"
            placeholder="Add tags (press enter to create)"
            style={{ width: "100%" }}
            tokenSeparators={[","]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const DeadlineCard = ({ deadline, onEdit, onDelete, onComplete, onExtend }) => {
  const priorityCfg =
    PRIORITY_CONFIG[deadline.priority] || PRIORITY_CONFIG.normal;
  const statusCfg = STATUS_CONFIG[deadline.status] || STATUS_CONFIG.pending;
  const isOverdue =
    deadline.isOverdue ||
    (dayjs(deadline.dueDate).isBefore(dayjs()) &&
      deadline.status !== "completed");
  const timeLeft = dayjs(deadline.dueDate).fromNow();

  const menuItems = [
    {
      key: "view",
      label: "View Details",
      icon: <FileTextOutlined />,
      onClick: () => onEdit(deadline),
    },
    {
      key: "extend",
      label: "Request Extension",
      icon: <ClockCircleOutlined />,
      onClick: () => onExtend(deadline),
    },
    {
      key: "complete",
      label: "Mark Complete",
      icon: <CheckCircleOutlined />,
      onClick: () => onComplete(deadline),
      disabled: deadline.status === "completed",
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(deadline),
    },
  ];

  return (
    <Card
      size="small"
      hoverable
      style={{
        borderRadius: 12,
        border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
      }}
      styles={{ body: { padding: 16 } }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}>
        <Space size={6} wrap>
          <Tag
            style={{
              margin: 0,
              borderRadius: 6,
              border: `1px solid ${priorityCfg.border}`,
              background: priorityCfg.bg,
              color: priorityCfg.color,
              fontWeight: 600,
              fontSize: 11,
            }}>
            {priorityCfg.label}
          </Tag>
          <Tag
            style={{
              margin: 0,
              borderRadius: 6,
              border: `1px solid ${statusCfg.border}`,
              background: statusCfg.bg,
              color: statusCfg.color,
              fontWeight: 600,
              fontSize: 11,
            }}>
            {isOverdue
              ? "OVERDUE"
              : deadline.status?.replace("-", " ").toUpperCase()}
          </Tag>
        </Space>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={["click"]}
          placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </div>

      <Text
        strong
        style={{
          display: "block",
          fontSize: 14,
          color: "#1e293b",
          marginBottom: 8,
          lineHeight: 1.4,
        }}>
        {deadline.title}
      </Text>

      {deadline.description && (
        <Text
          type="secondary"
          style={{
            display: "block",
            fontSize: 13,
            marginBottom: 12,
            lineHeight: 1.5,
          }}
          ellipsis={{ rows: 2 }}>
          {deadline.description}
        </Text>
      )}

      {deadline.linkedMatterId && (
        <Tooltip title="Linked Matter">
          <Tag
            icon={<LinkOutlined />}
            style={{
              marginBottom: 8,
              borderRadius: 6,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              color: "#0369a1",
            }}>
            Matter Linked
          </Tag>
        </Tooltip>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: "auto",
          paddingTop: 12,
          borderTop: "1px solid #f1f5f9",
        }}>
        <CalendarOutlined
          style={{ color: isOverdue ? "#ef4444" : "#94a3b8", fontSize: 12 }}
        />
        <Text
          style={{
            fontSize: 12,
            color: isOverdue ? "#ef4444" : "#64748b",
            fontWeight: isOverdue ? 600 : 500,
          }}>
          {dayjs(deadline.dueDate).format("DD MMM YYYY, HH:mm")}
        </Text>
        {deadline.status !== "completed" && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({timeLeft})
          </Text>
        )}
      </div>

      {deadline.assignedTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
          }}>
          <UserOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {deadline.assignedTo?.firstName} {deadline.assignedTo?.lastName}
          </Text>
        </div>
      )}

      {deadline.tags?.length > 0 && (
        <div
          style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {deadline.tags.slice(0, 3).map((tag, idx) => (
            <Tag key={idx} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
              {tag}
            </Tag>
          ))}
          {deadline.tags.length > 3 && (
            <Tag style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
              +{deadline.tags.length - 3}
            </Tag>
          )}
        </div>
      )}
    </Card>
  );
};

const ColumnHeader = ({ title, count, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
      padding: "10px 14px",
      background: `${color}12`,
      borderRadius: 10,
      border: `1px solid ${color}30`,
    }}>
    <div
      style={{ width: 10, height: 10, borderRadius: "50%", background: color }}
    />
    <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", flex: 1 }}>
      {title}
    </span>
    <Badge
      count={count}
      style={{ backgroundColor: color, fontSize: 10, fontWeight: 700 }}
    />
  </div>
);

const StatCard = ({ title, value, color, bg, border, icon }) => (
  <Card
    size="small"
    style={{
      borderRadius: 12,
      border: `1px solid ${border}`,
      background: bg,
      flex: "1 1 140px",
    }}
    styles={{ body: { padding: "14px 16px" } }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: 18,
        }}>
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#1e293b",
            lineHeight: 1.2,
          }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          {title}
        </div>
      </div>
    </div>
  </Card>
);

const DeadlineManager = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const deadlines = useSelector(selectDeadlines);
  const stats = useSelector(selectDeadlineStats);
  const loading = useSelector(selectDeadlineLoading);
  const actionLoading = useSelector(selectDeadlineActionLoading);
  const filters = useSelector(selectDeadlineFilters);
  const pagination = useSelector(selectDeadlinePagination);

  const [createVisible, setCreateVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadData();
  }, [dispatch, filters]);

  const loadData = useCallback(() => {
    dispatch(fetchDeadlines({ ...filters, page: pagination.page, limit: 20 }));
    dispatch(fetchDeadlineStats());
  }, [dispatch, filters, pagination.page]);

  const handleSearch = (value) => {
    setSearchValue(value);
    dispatch(setFilters({ search: value || undefined }));
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value || undefined }));
  };

  const handleDelete = (deadline) => {
    Modal.confirm({
      title: "Delete Deadline",
      content: `Are you sure you want to delete "${deadline.title}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      okButtonProps: { style: { borderRadius: 8 } },
      cancelButtonProps: { style: { borderRadius: 8 } },
      onOk: async () => {
        try {
          await dispatch(deleteDeadline(deadline._id)).unwrap();
          message.success("Deadline deleted successfully");
          loadData();
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
      loadData();
    } catch {
      message.error("Failed to complete deadline");
    }
  };

  const groupedDeadlines = {
    overdue: deadlines.filter(
      (d) =>
        d.isOverdue ||
        (dayjs(d.dueDate).isBefore(dayjs()) && d.status !== "completed"),
    ),
    thisWeek: deadlines.filter((d) => {
      const due = dayjs(d.dueDate);
      return (
        due.isAfter(dayjs()) &&
        due.isBefore(dayjs().add(7, "day")) &&
        d.status !== "completed"
      );
    }),
    completed: deadlines.filter((d) => d.status === "completed"),
    later: deadlines.filter((d) => {
      const due = dayjs(d.dueDate);
      return due.isAfter(dayjs().add(7, "day")) && d.status !== "completed";
    }),
  };

  const renderColumn = (title, items, color) => (
    <div style={{ flex: "1 1 280px", minWidth: 280 }}>
      <ColumnHeader title={title} count={items.length} color={color} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: "calc(100vh - 340px)",
          overflowY: "auto",
          paddingRight: 4,
        }}>
        {items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              color: "#94a3b8",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px dashed #e2e8f0",
            }}>
            No {title.toLowerCase()}
          </div>
        ) : (
          items.map((d) => (
            <DeadlineCard
              key={d._id}
              deadline={d}
              onEdit={() => {}}
              onDelete={handleDelete}
              onComplete={handleComplete}
              onExtend={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ant-card-hoverable:hover { transform: translateY(-2px); }
      `}</style>
      <div
        style={{
          padding: screens.xs ? 16 : screens.md ? 20 : 28,
          minHeight: "100vh",
          background: "#f8fafc",
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
            <h1
              style={{
                fontSize: screens.xs ? 22 : 28,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}>
              Deadline Manager
            </h1>
            <Text type="secondary" style={{ fontSize: 14, marginTop: 4 }}>
              Track and manage all your legal deadlines with automated reminders
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
            size="large"
            style={{ borderRadius: 10, fontWeight: 600 }}>
            New Deadline
          </Button>
        </div>

        {stats && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 24,
              flexWrap: "wrap",
            }}>
            <StatCard
              title="Overdue"
              value={stats.overdueCount || 0}
              color="#ef4444"
              bg="#fef2f2"
              border="#fecaca"
              icon={<AlertOutlined />}
            />
            <StatCard
              title="This Week"
              value={stats.thisWeekCount || 0}
              color="#f59e0b"
              bg="#fffbeb"
              border="#fde68a"
              icon={<WarningOutlined />}
            />
            <StatCard
              title="Completed"
              value={stats.completedThisMonth || 0}
              color="#10b981"
              bg="#ecfdf5"
              border="#a7f3d0"
              icon={<CheckCircleOutlined />}
            />
            <StatCard
              title="Total"
              value={stats.total || 0}
              color="#3b82f6"
              bg="#eff6ff"
              border="#bfdbfe"
              icon={<TrophyOutlined />}
            />
          </div>
        )}

        <Card
          size="small"
          style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          styles={{ body: { padding: screens.xs ? 12 : 20 } }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
              alignItems: "center",
            }}>
            <Search
              placeholder="Search deadlines..."
              allowClear
              value={searchValue}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch("")}
              style={{ width: screens.xs ? "100%" : 280 }}
              size="middle"
            />
            <Select
              placeholder="Priority"
              allowClear
              style={{ width: 140 }}
              size="middle"
              onChange={(v) => handleFilterChange("priority", v)}
              options={Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({
                value: k,
                label: v.label,
              }))}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              size="middle"
              onChange={(v) => handleFilterChange("status", v)}
              options={Object.entries(STATUS_CONFIG).map(([k]) => ({
                value: k,
                label: k
                  .replace("-", " ")
                  .replace(/^\w/, (c) => c.toUpperCase()),
              }))}
            />
            <Select
              placeholder="Category"
              allowClear
              style={{ width: 160 }}
              size="middle"
              onChange={(v) => handleFilterChange("category", v)}
              options={CATEGORY_OPTIONS}
            />
            <div style={{ flex: 1 }} />
            <Button
              icon={<SyncOutlined spin={loading} />}
              onClick={loadData}
              size="middle">
              Refresh
            </Button>
          </div>

          {loading && deadlines.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 60,
              }}>
              <Spin size="large" />
            </div>
          ) : deadlines.length === 0 ? (
            <Empty
              description={
                <span style={{ color: "#64748b" }}>
                  {searchValue || Object.values(filters).some(Boolean)
                    ? "No deadlines match your filters"
                    : "No deadlines yet. Create your first deadline!"}
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 8,
              }}>
              {renderColumn("Overdue", groupedDeadlines.overdue, "#ef4444")}
              {renderColumn("This Week", groupedDeadlines.thisWeek, "#f59e0b")}
              {renderColumn("Completed", groupedDeadlines.completed, "#10b981")}
              {renderColumn("Later", groupedDeadlines.later, "#3b82f6")}
            </div>
          )}
        </Card>
      </div>

      <CreateDeadlineModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={loadData}
        loading={actionLoading}
      />
    </>
  );
};

export default DeadlineManager;
