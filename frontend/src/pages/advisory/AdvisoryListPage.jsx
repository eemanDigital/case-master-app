import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Avatar,
  Tooltip,
  Dropdown,
  Badge,
  Typography,
  Row,
  Col,
  Card,
  Empty,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EllipsisOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  fetchAllAdvisoryMatters,
  bulkUpdateAdvisoryMatters,
  deleteAdvisoryDetails,
  selectAdvisoryMatters,
  selectAdvisoryPagination,
  selectAdvisoryFilters,
  selectAdvisoryLoading,
  selectAdvisoryError,
  setFilters,
  resetFilters,
} from "../../redux/features/advisory/advisorySlice";

import {
  ADVISORY_LOADING_KEYS,
  ADVISORY_TYPE_LABELS,
  ADVISORY_STATUS,
  ADVISORY_STATUS_OPTIONS,
  ADVISORY_TYPE_OPTIONS,
} from "../../utils/advisoryConstants";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ─── Colour maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    color: "processing",
    icon: <SyncOutlined spin />,
    label: "Active",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  pending: {
    color: "warning",
    icon: <ClockCircleOutlined />,
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  closed: {
    color: "default",
    icon: <CloseCircleOutlined />,
    label: "Closed",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  completed: {
    color: "success",
    icon: <CheckCircleOutlined />,
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  cancelled: {
    color: "error",
    icon: <ExclamationCircleOutlined />,
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const PRIORITY_CONFIG = {
  high: {
    color: "#ef4444",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  medium: {
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  low: {
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
};

const ADVISORY_TYPE_COLORS = {
  legal_opinion: "#6366f1",
  regulatory_compliance: "#0ea5e9",
  due_diligence: "#8b5cf6",
  contract_review: "#ec4899",
  policy_development: "#14b8a6",
  legal_research: "#f97316",
  risk_assessment: "#ef4444",
  litigation_risk_analysis: "#dc2626",
  regulatory_strategy: "#7c3aed",
  transaction_advisory: "#0891b2",
  other: "#6b7280",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-medium capitalize ${cfg.text}`}>
        {priority}
      </span>
    </span>
  );
};

const AdvisoryTypePill = ({ type }) => {
  const label = ADVISORY_TYPE_LABELS[type] || type || "N/A";
  const color = ADVISORY_TYPE_COLORS[type] || "#6b7280";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}>
      {label}
    </span>
  );
};

const ClientCell = ({ client }) => {
  if (!client) return <Text type="secondary">—</Text>;
  const initials =
    `${client.firstName?.[0] ?? ""}${client.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar
        size={28}
        className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold">
        {initials || <UserOutlined />}
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">
          {client.firstName} {client.lastName}
        </div>
        <div className="text-xs text-slate-400 truncate">{client.email}</div>
      </div>
    </div>
  );
};

const OfficersCell = ({ officers = [] }) => {
  if (!officers.length) return <Text type="secondary">—</Text>;
  return (
    <Avatar.Group
      maxCount={2}
      size={26}
      maxStyle={{ background: "#e0e7ff", color: "#4f46e5", fontSize: 11 }}>
      {officers.map((o) => (
        <Tooltip
          key={o._id}
          title={`${o.firstName} ${o.lastName}`}
          placement="top">
          <Avatar
            size={26}
            src={o.photo || undefined}
            className="bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer">
            {!o.photo && `${o.firstName?.[0]}${o.lastName?.[0]}`}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
};

const DetailSetupTag = ({ advisoryDetail }) => {
  if (advisoryDetail) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-600 border border-emerald-200">
        <CheckCircleOutlined className="text-[10px]" /> Setup
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600 border border-amber-200">
      <ExclamationCircleOutlined className="text-[10px]" /> Pending
    </span>
  );
};

const SummaryCard = ({ icon, label, value, colorClass }) => (
  <Card
    bordered={false}
    className="rounded-xl shadow-sm hover:shadow-md transition-shadow"
    bodyStyle={{ padding: "16px 20px" }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      </div>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10`}
        style={{ background: "rgba(0,0,0,0.04)" }}>
        <span className={`text-lg ${colorClass}`}>{icon}</span>
      </div>
    </div>
  </Card>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdvisoryListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const matters = useSelector(selectAdvisoryMatters);
  const pagination = useSelector(selectAdvisoryPagination);
  const filters = useSelector(selectAdvisoryFilters);
  const isLoading = useSelector(
    selectAdvisoryLoading(ADVISORY_LOADING_KEYS.FETCH_ALL),
  );
  const fetchError = useSelector(
    selectAdvisoryError(ADVISORY_LOADING_KEYS.FETCH_ALL),
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // ── Derived summary stats ─────────────────────────────────────────────────
  const summaryStats = React.useMemo(() => {
    const total = pagination.total ?? 0;
    const active = matters.filter(
      (m) => m.status === ADVISORY_STATUS.ACTIVE,
    ).length;
    const pending = matters.filter(
      (m) => m.status === ADVISORY_STATUS.PENDING,
    ).length;
    const completed = matters.filter(
      (m) => m.status === ADVISORY_STATUS.COMPLETED,
    ).length;
    const noDetail = matters.filter((m) => !m.advisoryDetail).length;
    return { total, active, pending, completed, noDetail };
  }, [matters, pagination]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const doFetch = useCallback(
    (overrides = {}) => {
      dispatch(fetchAllAdvisoryMatters({ ...filters, ...overrides }));
    },
    [dispatch, filters],
  );

  useEffect(() => {
    doFetch();
  }, []);

  useEffect(() => {
    if (fetchError) message.error(fetchError);
  }, [fetchError]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearchText(val);
    clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        dispatch(setFilters({ search: val, page: 1 }));
        doFetch({ search: val, page: 1 });
      }, 350),
    );
  };

  const handleCreateAdvisory = (matterId) => {
    return navigate(`/dashboard/matters/advisory/${matterId}/create`);
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value, page: 1 }));
    doFetch({ [key]: value, page: 1 });
  };

  const handleTableChange = (pag, _, sorter) => {
    const newFilters = {
      page: pag.current,
      limit: pag.pageSize,
      sort: sorter.order
        ? `${sorter.order === "descend" ? "-" : ""}${sorter.field}`
        : filters.sort,
    };
    dispatch(setFilters(newFilters));
    doFetch(newFilters);
  };

  const handleReset = () => {
    setSearchText("");
    dispatch(resetFilters());
    doFetch({
      page: 1,
      search: "",
      status: "",
      advisoryType: "",
      industry: "",
    });
  };

  const handleBulkStatusChange = async (status) => {
    if (!selectedRowKeys.length) return;
    await dispatch(
      bulkUpdateAdvisoryMatters({
        matterIds: selectedRowKeys,
        updates: { status },
      }),
    );
    message.success(
      `${selectedRowKeys.length} matter(s) updated to "${status}"`,
    );
    setSelectedRowKeys([]);
    doFetch();
  };

  const handleDelete = async (matterId) => {
    await dispatch(deleteAdvisoryDetails(matterId));
    message.success("Advisory deleted");
    doFetch();
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Matter",
      dataIndex: "title",
      key: "title",
      sorter: true,
      width: 320,
      render: (title, record) => (
        <div className="py-0.5">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
              {record.matterNumber}
            </span>
            {record.isConfidential && (
              <Tooltip title="Confidential">
                <span className="text-xs text-amber-500">🔒</span>
              </Tooltip>
            )}
          </div>
          <button
            onClick={() => navigate(`/advisory/${record._id}`)}
            className="text-left text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {title}
          </button>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {record.natureOfMatter}
          </p>
        </div>
      ),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 180,
      render: (client) => <ClientCell client={client} />,
    },
    {
      title: "Advisory Type",
      dataIndex: ["advisoryDetail", "advisoryType"],
      key: "advisoryType",
      width: 180,
      render: (type, record) => (
        <div className="flex flex-col gap-1">
          {type ? (
            <AdvisoryTypePill type={type} />
          ) : (
            <AdvisoryTypePill
              type={record.natureOfMatter?.toLowerCase().replace(/\s+/g, "_")}
            />
          )}
          <DetailSetupTag advisoryDetail={record.advisoryDetail} />
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      sorter: true,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      sorter: true,
      render: (priority) => <PriorityDot priority={priority} />,
    },
    {
      title: "Officers",
      dataIndex: "accountOfficer",
      key: "accountOfficer",
      width: 110,
      render: (officers) => <OfficersCell officers={officers} />,
    },
    {
      title: "Dates",
      key: "dates",
      width: 155,
      render: (_, record) => (
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarOutlined className="text-slate-400" />
            Opened: {dayjs(record.dateOpened).format("DD MMM YYYY")}
          </span>
          {record.expectedClosureDate && (
            <span className="flex items-center gap-1">
              <ClockCircleOutlined
                className={
                  dayjs(record.expectedClosureDate).isBefore(dayjs()) &&
                  record.status !== "completed" &&
                  record.status !== "closed"
                    ? "text-red-400"
                    : "text-slate-400"
                }
              />
              Due: {dayjs(record.expectedClosureDate).format("DD MMM YYYY")}
            </span>
          )}
          <span className="text-slate-400 text-[11px]">
            {dayjs(record.lastActivityDate).fromNow()}
          </span>
        </div>
      ),
    },
    {
      title: "Value",
      dataIndex: "estimatedValue",
      key: "estimatedValue",
      width: 130,
      sorter: true,
      align: "right",
      render: (val, record) =>
        val ? (
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-700">
              {record.currency} {Number(val).toLocaleString("en-NG")}
            </div>
            <div className="text-xs text-slate-400 capitalize">
              {record.billingType}
            </div>
          </div>
        ) : (
          <Text type="secondary" className="text-right block">
            —
          </Text>
        ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 52,
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "create",
                icon: <PlusOutlined />,
                label: "Add New Advisory",
                onClick: () => handleCreateAdvisory(record._id), // assuming record._id is the matterId
              },
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "View Details",
                onClick: () =>
                  navigate(`/dashboard/matters/advisory/${record._id}/details`),
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit Matter",
                onClick: () => navigate(`/advisory/${record._id}/edit`),
              },
              !record.advisoryDetail && {
                key: "setup",
                icon: <FileTextOutlined />,
                label: "Setup Advisory",
                onClick: () => navigate(`/advisory/${record._id}?tab=setup`),
              },
              { type: "divider" },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => handleDelete(record._id),
              },
            ].filter(Boolean),
          }}
          placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined />}
            className="text-slate-400 hover:text-slate-600"
          />
        </Dropdown>
      ),
    },
  ];

  // ── Tags filter indicator ─────────────────────────────────────────────────
  const activeFilterCount = [
    filters.status,
    filters.advisoryType,
    filters.industry,
    filters.search,
  ].filter(Boolean).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FolderOpenOutlined className="text-indigo-500 text-lg" />
              <Title
                level={4}
                className="!mb-0 !text-slate-800 font-semibold tracking-tight">
                Advisory Matters
              </Title>
              <Badge
                count={pagination.total ?? 0}
                showZero
                className="ml-1"
                style={{
                  background: "#e0e7ff",
                  color: "#4f46e5",
                  boxShadow: "none",
                  fontWeight: 600,
                }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage legal opinions, regulatory compliance and advisory work
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => doFetch()}
                loading={isLoading}
                className="text-slate-500"
              />
            </Tooltip>
            <Button
              icon={<DownloadOutlined />}
              className="hidden sm:inline-flex text-slate-500">
              Export
            </Button>
            {/* <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                navigate("/dashboard/matters/advisory/matterid/create")
              }
              className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 font-medium">
              New Advisory
            </Button> */}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Summary cards ─────────────────────────────────────── */}
        <Row gutter={[12, 12]}>
          {[
            {
              label: "Total Matters",
              value: summaryStats.total,
              icon: <FolderOpenOutlined />,
              colorClass: "text-indigo-600",
            },
            {
              label: "Active",
              value: summaryStats.active,
              icon: <SyncOutlined />,
              colorClass: "text-blue-600",
            },
            {
              label: "Pending",
              value: summaryStats.pending,
              icon: <ClockCircleOutlined />,
              colorClass: "text-amber-600",
            },
            {
              label: "Completed",
              value: summaryStats.completed,
              icon: <CheckCircleOutlined />,
              colorClass: "text-emerald-600",
            },
            {
              label: "Needs Setup",
              value: summaryStats.noDetail,
              icon: <ExclamationCircleOutlined />,
              colorClass: "text-orange-500",
            },
          ].map((s) => (
            <Col key={s.label} xs={12} sm={8} md={6} lg={4} xl={4}>
              <SummaryCard {...s} />
            </Col>
          ))}
        </Row>

        {/* ── Search + filter bar ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search matters, clients, tags…"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              className="max-w-xs"
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters((v) => !v)}
              type={showFilters ? "primary" : "default"}
              ghost={showFilters}
              className={
                showFilters
                  ? "border-indigo-400 text-indigo-600"
                  : "text-slate-500"
              }>
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                size="small"
                icon={<ClearOutlined />}
                onClick={handleReset}
                className="text-slate-500 text-xs">
                Clear all
              </Button>
            )}
            <div className="flex-1" />
            {/* Bulk action bar */}
            {selectedRowKeys.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 animate-pulse">
                <span className="text-xs font-semibold text-indigo-700">
                  {selectedRowKeys.length} selected
                </span>
                <Select
                  size="small"
                  placeholder="Bulk status…"
                  style={{ width: 150 }}
                  onChange={handleBulkStatusChange}
                  options={ADVISORY_STATUS_OPTIONS}
                />
                <Button
                  size="small"
                  onClick={() => setSelectedRowKeys([])}
                  className="text-xs text-slate-500">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* ── Expanded filter row ──────────────────────────────── */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-3 flex-wrap">
              <Select
                placeholder="Status"
                allowClear
                style={{ minWidth: 140 }}
                value={filters.status || undefined}
                onChange={(v) => handleFilterChange("status", v ?? "")}
                options={ADVISORY_STATUS_OPTIONS}
              />
              <Select
                placeholder="Advisory Type"
                allowClear
                style={{ minWidth: 200 }}
                value={filters.advisoryType || undefined}
                onChange={(v) => handleFilterChange("advisoryType", v ?? "")}
                options={ADVISORY_TYPE_OPTIONS}
              />
              <Select
                placeholder="Priority"
                allowClear
                style={{ minWidth: 130 }}
                onChange={(v) => handleFilterChange("priority", v ?? "")}>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
              <Select
                placeholder="Billing Type"
                allowClear
                style={{ minWidth: 140 }}
                onChange={(v) => handleFilterChange("billingType", v ?? "")}>
                <Option value="fixed">Fixed</Option>
                <Option value="hourly">Hourly</Option>
                <Option value="retainer">Retainer</Option>
              </Select>
              <Select
                placeholder="Detail Setup"
                allowClear
                style={{ minWidth: 160 }}
                onChange={(v) => handleFilterChange("hasDetail", v ?? "")}>
                <Option value="true">Detail Set Up</Option>
                <Option value="false">Pending Setup</Option>
              </Select>
            </div>
          )}
        </div>

        {/* ── Table ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table
            rowKey="_id"
            dataSource={matters}
            columns={columns}
            loading={isLoading}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              columnWidth: 44,
            }}
            onChange={handleTableChange}
            pagination={{
              current: pagination.currentPage ?? pagination.page ?? 1,
              pageSize: pagination.limit ?? 50,
              total: pagination.total ?? 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} matters`,
              pageSizeOptions: ["20", "50", "100"],
              className: "px-4 py-3",
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="py-6">
                      <p className="text-slate-500 font-medium mb-1">
                        No advisory matters found
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        {activeFilterCount > 0
                          ? "Try adjusting your filters"
                          : "Create your first advisory matter to get started"}
                      </p>
                      {activeFilterCount > 0 ? (
                        <Button size="small" onClick={handleReset}>
                          Clear Filters
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => navigate("/advisory/create")}
                          className="bg-indigo-600 border-indigo-600">
                          New Advisory
                        </Button>
                      )}
                    </div>
                  }
                />
              ),
            }}
            rowClassName={(record) =>
              `hover:bg-slate-50 transition-colors cursor-pointer ${
                record.isConfidential ? "border-l-2 border-l-amber-400" : ""
              }`
            }
            onRow={(record) => ({
              onDoubleClick: () =>
                navigate(`dashboard/matters/advisory/${record._id}`),
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvisoryListPage;
