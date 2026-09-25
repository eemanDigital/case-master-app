import {
  Button,
  Space,
  Dropdown,
  Avatar,
  Tag,
  Card,
  Input,
  Tooltip,
  Badge,
  Typography,
  Skeleton,
  Empty,
  Table,
} from "antd";
import {
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// The list kit intentionally uses plain function-composition props rather than
// per-component propTypes; every consumer is a page in the same app.
/* eslint-disable react/prop-types, react-refresh/only-export-components */

const { Text } = Typography;

/**
 * Shared matter-list UI kit.
 *
 * Every matter list page (all matters, litigation, corporate, property,
 * retainer, general, advisory) renders through these primitives so the whole
 * module feels like one product.
 *
 * Conventions:
 *  - Page background: slate-50
 *  - Pages start with a white MatterPageHeader bar (title chip + count badge)
 *  - Data section: MatterStatCards -> MatterToolbar -> MatterTableCard
 *  - The primary way to open details is clicking the matter title (link); the
 *    actions column is a single kebab menu (no "hunt for the eye icon").
 */

// ─── Page header ─────────────────────────────────────────────────────────────

export const MatterPageHeader = ({
  icon,
  iconClassName = "bg-indigo-50 text-indigo-600",
  title,
  subtitle,
  count,
  countColor = "#4f46e5",
  countBg = "#e0e7ff",
  actions,
  extra,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-20">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClassName}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Text
                strong
                className="!text-lg sm:!text-xl !text-slate-800 truncate leading-tight">
                {title}
              </Text>
              {typeof count === "number" && (
                <Badge
                  count={count}
                  showZero
                  style={{ backgroundColor: countBg, color: countColor, boxShadow: "none", fontWeight: 600 }}
                />
              )}
            </div>
            {subtitle && (
              <Text type="secondary" className="!text-xs sm:!text-sm block">
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {actions}
          {extra}
        </div>
      </div>
    </div>
  );
};

// ─── Stat cards ──────────────────────────────────────────────────────────────

export const MatterStatCards = ({ stats = [], loading = false, cols = 4 }) => {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }[cols];

  if (loading) {
    return (
      <div className={`grid ${colClass || "sm:grid-cols-2 lg:grid-cols-4"} gap-3 sm:gap-4`}>
        {Array.from({ length: cols }).map((_, i) => (
          <Card key={i} bordered={false} className="rounded-xl shadow-sm">
            <Skeleton active paragraph={false} title={{ width: "70%" }} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${colClass || "sm:grid-cols-2 lg:grid-cols-4"} gap-3 sm:gap-4`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        const chip =
          stat.chip ||
          (stat.color
            ? { bg: `${stat.color}18`, text: stat.color }
            : { bg: "#eef2ff", text: "#6366f1" });
        return (
          <Card
            key={stat.label}
            bordered={false}
            onClick={stat.onClick}
            className={`rounded-xl shadow-sm ${stat.onClick ? "cursor-pointer hover:shadow-md" : ""} transition-shadow`}
            styles={{ body: { padding: "16px 18px" } }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Text
                  type="secondary"
                  className="!text-[11px] font-medium uppercase tracking-wider block truncate">
                  {stat.label}
                </Text>
                <div className="text-xl sm:text-2xl font-bold mt-1 text-slate-800 truncate">
                  {stat.value}
                </div>
                {stat.description && (
                  <Text type="secondary" className="!text-xs block truncate">
                    {stat.description}
                  </Text>
                )}
              </div>
              {Icon && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: chip.bg, color: chip.text }}>
                  <Icon />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ─── Toolbar ─────────────────────────────────────────────────────────────────

export const MatterToolbar = ({
  searchPlaceholder = "Search matters, clients…",
  onSearch,
  searchValue,
  setSearchValue,
  filterButtonLabel = "Filters",
  onToggleFilters,
  filtersOpen,
  showClear,
  onClear,
  enableBulkArea,
  bulkArea,
  extra,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => setSearchValue?.(e.target.value)}
          onPressEnter={(e) => onSearch?.(e.target.value)}
          allowClear
          className="max-w-xs"
          size="middle"
        />
        <Button
          icon={<FilterOutlined />}
          onClick={onToggleFilters}
          type={filtersOpen ? "primary" : "default"}
          ghost={filtersOpen}
          size="middle">
          {filterButtonLabel}
        </Button>
        {showClear && onClear && (
          <Button
            size="middle"
            icon={<ClearOutlined />}
            onClick={onClear}
            className="text-slate-500 text-xs">
            Clear all
          </Button>
        )}
        {extra}
        <div className="flex-1" />
        {enableBulkArea && bulkArea}
      </div>
    </div>
  );
};

// ─── Table card ──────────────────────────────────────────────────────────────

export const MatterTableCard = ({
  columns,
  dataSource,
  rowKey = "_id",
  loading = false,
  pagination,
  onChange,
  onRowClick,
  rowSelection,
  scrollX = 1100,
  emptyTitle = "No matters found",
  emptyDescription = "Create your first matter to get started",
  createLabel = "New Matter",
  onCreate,
  clearLabel = "Clear Filters",
  onClear,
  size = "middle",
  extra,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {extra}
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        onChange={onChange}
        pagination={pagination}
        rowSelection={rowSelection}
        scroll={{ x: scrollX }}
        size={size}
        onRow={(record) => ({
          onClick: (e) => {
            if (e.target.closest("button, a, .ant-dropdown-trigger, .ant-checkbox-wrapper")) return;
            onRowClick?.(record);
          },
          className: "cursor-pointer hover:bg-slate-50 transition-colors",
        })}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="py-6">
                  <p className="text-slate-500 font-medium mb-1">{emptyTitle}</p>
                  <p className="text-slate-400 text-sm mb-4">{emptyDescription}</p>
                  <Space>
                    {onClear && (
                      <Button size="small" onClick={onClear}>
                        {clearLabel}
                      </Button>
                    )}
                    {onCreate && (
                      <Button type="primary" size="small" onClick={onCreate}>
                        {createLabel}
                      </Button>
                    )}
                  </Space>
                </div>
              }
            />
          ),
        }}
      />
    </div>
  );
};

// ─── Row actions (kebab menu) ────────────────────────────────────────────────

export const MatterRowActions = ({
  items = [],
  menuItems,
  disabled = false,
}) => {
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      disabled={disabled}
      menu={{ items: menuItems || items }}>
      <Button type="text" size="small" icon={<MoreOutlined />} className="text-slate-400 hover:text-slate-700" />
    </Dropdown>
  );
};

// Convenience menu builder: view/edit/delete with sensible defaults
export const buildRowMenu = ({ record, onView, onEdit, onDelete, extraItems = [], setup }) => {
  const items = [
    {
      key: "view",
      label: "View Details",
      icon: <EyeOutlined />,
      onClick: () => onView?.(record),
    },
  ];
  if (setup) {
    items.push({
      key: "setup",
      label: setup.label,
      icon: setup.icon,
      onClick: () => setup.onClick(record),
    });
  }
  if (onEdit) {
    items.push({
      key: "edit",
      label: "Edit Matter",
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    });
  }
  if (extraItems.length > 0) {
    items.push({ type: "divider" });
    items.push(...extraItems);
  }
  if (onDelete) {
    items.push({ type: "divider" });
    items.push({
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(record),
    });
  }
  return items;
};

// ─── Cell primitives ─────────────────────────────────────────────────────────

export const MatterNumberTag = ({ value, onClick }) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 font-mono text-xs whitespace-nowrap ${
        onClick ? "cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200" : ""
      }`}>
      {value || "—"}
    </span>
  );
};

export const ClientCell = ({ client, email }) => {
  if (!client) return <Text type="secondary">—</Text>;
  const initials = `${client.firstName?.[0] ?? ""}${client.lastName?.[0] ?? ""}`.toUpperCase();
  const name = client.companyName || `${client.firstName || ""} ${client.lastName || ""}`.trim();
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar
        size={30}
        src={client.photo}
        className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold">
        {initials || <UserOutlined />}
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
        {(email ?? client.email) && (
          <div className="text-xs text-slate-400 truncate">{email ?? client.email}</div>
        )}
      </div>
    </div>
  );
};

export const OfficersCell = ({ officers = [], size = 26 }) => {
  if (!officers?.length) return <Text type="secondary">—</Text>;
  return (
    <Avatar.Group
      maxCount={2}
      size={size}
      maxStyle={{ background: "#e0e7ff", color: "#4f46e5", fontSize: 11 }}>
      {officers.map((o) => (
        <Tooltip key={o._id || o.id || o} title={o.firstName ? `${o.firstName} ${o.lastName}` : "Account officer"} placement="top">
          <Avatar
            size={size}
            src={o.photo || undefined}
            className="bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer">
            {!o.photo && o.firstName ? `${o.firstName[0]}${o.lastName?.[0] || ""}` : <UserOutlined />}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
};

export const StatusPill = ({ status, map }) => {
  const cfg = map?.[status] || {
    color: "default",
    label: status ? titleCase(status) : "—",
  };
  return (
    <Tag color={cfg.color} className="rounded-full capitalize m-0">
      {cfg.label ?? status}
    </Tag>
  );
};

export const PriorityPill = ({ priority }) => {
  const colors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
    urgent: "#dc2626",
  };
  const bg = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
    urgent: "bg-red-100 text-red-700",
  };
  if (!priority) return <Text type="secondary">—</Text>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: colors[priority] || "#94a3b8" }} />
      <span className={`text-xs font-medium capitalize ${bg[priority] || "text-slate-500"}`}>{priority}</span>
    </span>
  );
};

export const MoneyText = ({ amount, currency = "NGN", formatter, strong = true }) => {
  if (amount === null || amount === undefined) return <Text type="secondary">—</Text>;
  const value =
    typeof formatter === "function"
      ? formatter(amount, currency)
      : Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 2 });
  return (
    <span className={`${strong ? "font-semibold" : ""} text-slate-700 whitespace-nowrap`}>
      {value}
    </span>
  );
};

export const DateCell = ({ date, format = "DD MMM YYYY", empty = "—", suffix }) => {
  if (!date) return <Text type="secondary">{empty}</Text>;
  return (
    <div className="whitespace-nowrap">
      <span className="text-sm text-slate-700">{dayjs(date).format(format)}</span>
      {suffix && <div className="text-xs text-slate-400">{suffix}</div>}
    </div>
  );
};

export const DetailPill = ({ ready, readyLabel = "Setup", pendingLabel = "Pending" }) => {
  return ready ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 whitespace-nowrap">
      <CheckCircleOutlined className="text-[10px]" /> {readyLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
      <ExclamationCircleOutlined className="text-[10px]" /> {pendingLabel}
    </span>
  );
};

const titleCase = (v) =>
  String(v || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());