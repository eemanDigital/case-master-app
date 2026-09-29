import { memo, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Avatar, Button, Card, Checkbox, Dropdown, Tooltip } from "antd";
import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  BulbOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HomeOutlined,
  LockOutlined,
  MinusOutlined,
  MoreOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

// Maps mirror the backend enums in backend/models/matterModel.js.
// matterType: litigation | corporate | advisory | retainer | property | general
// priority:   low | medium | high | urgent
// status:     active | pending | on-hold | completed | closed | archived
//             | settled | withdrawn | won | lost
const MATTER_TYPES = {
  litigation: { label: "Litigation", Icon: FileTextOutlined },
  corporate: { label: "Corporate", Icon: BankOutlined },
  advisory: { label: "Advisory", Icon: BulbOutlined },
  retainer: { label: "Retainer", Icon: SafetyCertificateOutlined },
  property: { label: "Property", Icon: HomeOutlined },
  general: { label: "General", Icon: AppstoreOutlined },
};

const PRIORITIES = {
  urgent: { label: "Urgent", Icon: ExclamationCircleOutlined, color: "#dc2626" },
  high: { label: "High", Icon: ArrowUpOutlined, color: "#ea580c" },
  medium: { label: "Medium", Icon: MinusOutlined, color: "#64748b" },
  low: { label: "Low", Icon: ArrowDownOutlined, color: "#94a3b8" },
};

const STATUSES = {
  active: { label: "Active", color: "#0f766e" },
  pending: { label: "Pending", color: "#b45309" },
  "on-hold": { label: "On Hold", color: "#6d28d9" },
  completed: { label: "Completed", color: "#1d4ed8" },
  closed: { label: "Closed", color: "#475569" },
  archived: { label: "Archived", color: "#64748b" },
  settled: { label: "Settled", color: "#15803d" },
  withdrawn: { label: "Withdrawn", color: "#be185d" },
  won: { label: "Won", color: "#15803d" },
  lost: { label: "Lost", color: "#b91c1c" },
};

// Statuses that are finished should not show an alarming red aging bar.
const CLOSED_STATUSES = new Set([
  "completed",
  "closed",
  "archived",
  "settled",
  "withdrawn",
  "won",
  "lost",
]);

const FALLBACK_TYPE = MATTER_TYPES.general;
const FALLBACK_PRIORITY = PRIORITIES.medium;

const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

// Compact money keeps the figure on one line: ₦2.5M instead of ₦2,500,000.00
const formatCompactMoney = (value, currency = "NGN") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const abs = Math.abs(amount);
  const unit = [{ limit: 1e9, suffix: "B" }, { limit: 1e6, suffix: "M" }, { limit: 1e3, suffix: "K" }]
    .find((u) => abs >= u.limit);
  if (!unit) {
    return `${symbol}${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  }
  const scaled = amount / unit.limit;
  const digits = Math.abs(scaled) < 10 ? 1 : 0;
  return `${symbol}${scaled.toLocaleString("en-NG", { maximumFractionDigits: digits })}${unit.suffix}`;
};

const titleCase = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Any click landing on one of these should not navigate the card.
const INTERACTIVE_SELECTOR =
  "button, a, input, label, .ant-checkbox-wrapper, .ant-dropdown-trigger, [contenteditable='true']";

// Fixed-width small caps label — the visual grammar of a printed docket.
const FieldLabel = ({ children }) => (
  <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 leading-none">
    {children}
  </span>
);

FieldLabel.propTypes = { children: PropTypes.node };

// Label over value. min-w-0 is what actually stops the value wrapping.
const Field = ({ label, value, valueClassName = "text-slate-700", title, align = "left" }) => (
  <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`} title={title}>
    <FieldLabel>{label}</FieldLabel>
    <div className={`text-xs font-medium mt-1 truncate ${valueClassName}`}>{value}</div>
  </div>
);

Field.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  valueClassName: PropTypes.string,
  title: PropTypes.string,
  align: PropTypes.oneOf(["left", "right"]),
};

const MatterCard = memo(
  ({
    matter,
    onView,
    onEdit,
    onDelete,
    onAssign,
    onSelect,
    selected = false,
    className = "",
    compact = false,
  }) => {
    const navigate = useNavigate();
    const rootRef = useRef(null);

    const typeConfig = MATTER_TYPES[matter.matterType] || FALLBACK_TYPE;
    const priorityConfig = PRIORITIES[matter.priority] || FALLBACK_PRIORITY;
    const statusConfig = STATUSES[matter.status] || {
      label: titleCase(matter.status) || "Unknown",
      color: "#475569",
    };
    const TypeIcon = typeConfig.Icon;
    const PriorityIcon = priorityConfig.Icon;

    const client = matter.client || null;
    const officers = Array.isArray(matter.accountOfficer) ? matter.accountOfficer : [];

    const clientName = useMemo(() => {
      if (!client) return null;
      return (
        client.companyName ||
        client.clientDetails?.company ||
        `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
        null
      );
    }, [client]);

    const clientInitials = useMemo(() => {
      if (!client) return null;
      return `${client.firstName?.[0] || ""}${client.lastName?.[0] || ""}`.toUpperCase() || null;
    }, [client]);

    const money = useMemo(
      () => formatCompactMoney(matter.estimatedValue, matter.currency || "NGN"),
      [matter.estimatedValue, matter.currency],
    );

    // Compare at day granularity so a matter due today reads 0, not -1.
    const daysToClose = useMemo(() => {
      if (!matter.expectedClosureDate) return null;
      const due = dayjs(matter.expectedClosureDate);
      if (!due.isValid()) return null;
      return due.startOf("day").diff(dayjs().startOf("day"), "day");
    }, [matter.expectedClosureDate]);

    // The aging spine: how much of the opened -> expected-closure window has
    // elapsed. Null means there is no target date, so the spine reads as solid.
    const aging = useMemo(() => {
      const opened = matter.dateOpened ? dayjs(matter.dateOpened) : null;
      if (!opened?.isValid()) return null;
      const target = matter.expectedClosureDate ? dayjs(matter.expectedClosureDate) : null;
      if (!target?.isValid()) return null;
      const span = target.startOf("day").diff(opened.startOf("day"), "day");
      if (span <= 0) return 100;
      const elapsed = dayjs().startOf("day").diff(opened.startOf("day"), "day");
      return Math.min(100, Math.max(3, Math.round((elapsed / span) * 100)));
    }, [matter.dateOpened, matter.expectedClosureDate]);

    const spineColor = useMemo(() => {
      if (CLOSED_STATUSES.has(matter.status)) return "#cbd5e1";
      if (daysToClose !== null && daysToClose < 0) return "#dc2626";
      if (daysToClose !== null && daysToClose <= 7) return "#d97706";
      return statusConfig.color;
    }, [matter.status, daysToClose, statusConfig.color]);

    const due = useMemo(() => {
      if (daysToClose === null) return null;
      const date = dayjs(matter.expectedClosureDate).format("D MMM");
      if (daysToClose < 0) {
        return { value: date, hint: `${Math.abs(daysToClose)}d overdue`, color: "text-red-600" };
      }
      if (daysToClose === 0) {
        return { value: date, hint: "due today", color: "text-red-600" };
      }
      if (daysToClose <= 7) {
        return { value: date, hint: `in ${daysToClose}d`, color: "text-amber-600" };
      }
      return { value: date, hint: `in ${daysToClose}d`, color: "text-slate-700" };
    }, [daysToClose, matter.expectedClosureDate]);

    const openDetail = useCallback(() => {
      if (onView?.(matter)) return;
      navigate(`/dashboard/matters/${matter._id}`);
    }, [matter, onView, navigate]);

    const openEdit = useCallback(() => {
      if (onEdit?.(matter)) return;
      navigate(`/dashboard/matters/${matter._id}/edit`);
    }, [matter, onEdit, navigate]);

    const menuItems = useMemo(
      () => [
        { key: "view", label: "View Details", icon: <EyeOutlined />, onClick: openDetail },
        { key: "edit", label: "Edit Matter", icon: <EditOutlined />, onClick: openEdit },
        { type: "divider" },
        {
          key: "assign-officer",
          label: "Assign Account Officer",
          icon: <TeamOutlined />,
          onClick: () => onAssign?.(matter),
        },
        {
          key: "delete",
          label: "Delete Matter",
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onDelete?.(matter),
        },
      ],
      [matter, onAssign, onDelete, openDetail, openEdit],
    );

    const handleCardClick = useCallback(
      (event) => {
        const hit = event.target.closest?.(INTERACTIVE_SELECTOR);
        if (hit && hit !== rootRef.current) return;
        openDetail();
      },
      [openDetail],
    );

    const handleCardKeyDown = useCallback(
      (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openDetail();
      },
      [openDetail],
    );

    const handleSelect = useCallback(
      (event) => {
        event.stopPropagation();
        onSelect?.(matter._id);
      },
      [matter._id, onSelect],
    );

    const openedLabel = matter.dateOpened ? dayjs(matter.dateOpened).format("D MMM YYYY") : "—";

    return (
      <Card
        ref={rootRef}
        role="button"
        tabIndex={0}
        aria-label={`${matter.title || "Matter"} ${matter.matterNumber || ""}`.trim()}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        bordered={false}
        styles={{ body: { padding: 0, height: "100%" } }}
        className={`group matter-card relative overflow-hidden h-full cursor-pointer
          bg-white border border-slate-200 rounded-[10px]
          transition-colors duration-150
          hover:border-slate-300 hover:bg-slate-50/70
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1
          ${selected ? "!border-indigo-400 !bg-indigo-50/50" : ""}
          ${className}`}>
        {/* Aging spine — elapsed share of the opened → expected closure window */}
        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-slate-100" />
        <span
          aria-hidden
          className={`absolute left-0 top-0 w-[3px] ${
            aging === null ? "h-full" : "transition-[height] duration-300"
          }`}
          style={{
            backgroundColor: spineColor,
            ...(aging === null ? null : { height: `${aging}%` }),
          }}
        />

        <div className="h-full flex flex-col pl-5 pr-3.5 py-3.5">
          {/* File tab */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <Checkbox
                checked={selected}
                onChange={handleSelect}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Select ${matter.title || "matter"}`}
                className={`!mr-0 shrink-0 transition-opacity
                  ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
              />
              <span
                className="font-mono text-[10px] font-medium tracking-[0.1em] text-slate-500 truncate"
                title={matter.matterNumber}>
                {matter.matterNumber || "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {typeConfig.label}
              </span>
              <TypeIcon className="text-[11px] text-slate-400" />
            </div>
          </div>

          {/* Stamp row — a filled label, not another outline pill */}
          <div className="flex items-center gap-2 mt-3 flex-nowrap overflow-hidden">
            <span
              className="inline-flex items-center h-[18px] px-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white rounded-[3px] shrink-0"
              style={{ backgroundColor: statusConfig.color }}>
              {statusConfig.label}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0"
              style={{ color: priorityConfig.color }}>
              <PriorityIcon className="text-[9px]" />
              {priorityConfig.label}
            </span>
            {matter.isConfidential && (
              <Tooltip title="Confidential matter">
                <LockOutlined className="text-[10px] text-amber-600 shrink-0" />
              </Tooltip>
            )}

            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Actions for ${matter.title || "matter"}`}
                className="!w-6 !h-6 !min-w-0 ml-auto shrink-0 text-slate-300 hover:!text-slate-700"
              />
            </Dropdown>
          </div>

          {/* Title carries the card */}
          <h3
            className="mt-2 text-[15px] font-semibold leading-[1.35] text-slate-900 line-clamp-2 break-words"
            title={matter.title}>
            {matter.title || "Untitled matter"}
          </h3>

          {matter.natureOfMatter && !compact && (
            <p className="mt-1 text-[11px] text-slate-400 truncate" title={titleCase(matter.natureOfMatter)}>
              {titleCase(matter.natureOfMatter)}
            </p>
          )}

          {/* Client and value sit on the baseline of the card */}
          <div className="mt-auto pt-3 flex items-center gap-2">
            {clientName ? (
              <>
                <Avatar
                  size={22}
                  src={client?.photo || undefined}
                  className="shrink-0 bg-slate-200 text-slate-600 text-[10px] font-bold">
                  {clientInitials || <UserOutlined />}
                </Avatar>
                <span
                  className="text-xs text-slate-600 truncate min-w-0 flex-1"
                  title={clientName}>
                  {clientName}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-300 truncate min-w-0 flex-1">No client</span>
            )}
            {money && (
              <span
                className="text-xs font-semibold text-slate-900 tabular-nums shrink-0"
                title={`Estimated value ${money}`}>
                {money}
              </span>
            )}
          </div>

          {/* Docket fields */}
          {!compact && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-[auto_auto_1fr] gap-x-4 items-end">
              {due ? (
                <Field
                  label="Due"
                  value={due.value}
                  valueClassName={due.color}
                  title={`Expected closure ${dayjs(matter.expectedClosureDate).format("D MMMM YYYY")} — ${due.hint}`}
                />
              ) : (
                <Field label="Due" value="—" valueClassName="text-slate-300" />
              )}

              <Field label="Opened" value={openedLabel} title={`Opened ${openedLabel}`} />

              <div className="min-w-0 flex justify-end">
                {officers.length > 0 ? (
                  <div className="text-right">
                    <FieldLabel>Team</FieldLabel>
                    <Avatar.Group
                      maxCount={3}
                      size={20}
                      className="mt-0.5 justify-end"
                      maxStyle={{ backgroundColor: "#e2e8f0", color: "#475569", fontSize: 9 }}>
                      {officers.map((officer, index) => (
                        <Tooltip
                          key={officer?._id || index}
                          title={
                            officer?.firstName
                              ? `${officer.firstName} ${officer.lastName || ""}`.trim()
                              : "Account officer"
                          }>
                          <Avatar
                            size={20}
                            src={officer?.photo || undefined}
                            className="bg-slate-200 text-slate-600 text-[9px] font-semibold cursor-pointer">
                            {officer?.firstName
                              ? `${officer.firstName[0]}${officer.lastName?.[0] || ""}`
                              : <UserOutlined />}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                  </div>
                ) : (
                  <div className="text-right">
                    <FieldLabel>Team</FieldLabel>
                    <div className="text-xs text-slate-300 mt-1">Unassigned</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  },
);

MatterCard.displayName = "MatterCard";

const personShape = PropTypes.shape({
  _id: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  photo: PropTypes.string,
  companyName: PropTypes.string,
  clientDetails: PropTypes.shape({ company: PropTypes.string }),
});

MatterCard.propTypes = {
  matter: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    matterNumber: PropTypes.string,
    title: PropTypes.string,
    matterType: PropTypes.oneOf(Object.keys(MATTER_TYPES)),
    status: PropTypes.oneOf(Object.keys(STATUSES)),
    priority: PropTypes.oneOf(Object.keys(PRIORITIES)),
    natureOfMatter: PropTypes.string,
    dateOpened: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    expectedClosureDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    estimatedValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    isConfidential: PropTypes.bool,
    client: personShape,
    accountOfficer: PropTypes.arrayOf(personShape),
  }).isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onAssign: PropTypes.func,
  onDelete: PropTypes.func,
  onSelect: PropTypes.func,
  selected: PropTypes.bool,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

export default MatterCard;
